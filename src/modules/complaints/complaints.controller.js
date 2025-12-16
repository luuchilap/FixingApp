/**
 * Complaints controller
 * Handles complaint filing and resolution
 */

const db = require('../../config/db');

/**
 * File a complaint
 */
function fileComplaint(req, res, next) {
  try {
    const { jobId, reason, evidences } = req.body;
    const createdBy = req.user.id;

    // Validation
    if (!jobId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'jobId and reason are required'
      });
    }

    // Get job
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(parseInt(jobId));

    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }

    // Business rule: User must be involved in the job (employer or accepted worker)
    if (job.employer_id !== createdBy && job.accepted_worker_id !== createdBy) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only file complaints for jobs you are involved in'
      });
    }

    const now = Date.now();

    // Create complaint and evidences in transaction
    db.transaction(() => {
      // Insert complaint
      const insertComplaint = db.prepare(`
        INSERT INTO complaints (
          job_id, created_by, reason, status
        )
        VALUES (?, ?, ?, 'PENDING')
      `);

      const result = insertComplaint.run(parseInt(jobId), createdBy, reason);
      const complaintId = result.lastInsertRowid;

      // Insert evidences if provided
      if (evidences && Array.isArray(evidences) && evidences.length > 0) {
        const insertEvidence = db.prepare(`
          INSERT INTO complaint_evidences (
            complaint_id, evidence_type, evidence_url
          )
          VALUES (?, ?, ?)
        `);

        evidences.forEach(evidence => {
          if (evidence.type && evidence.url) {
            insertEvidence.run(
              complaintId,
              evidence.type.toUpperCase(),
              evidence.url
            );
          }
        });
      }

      return complaintId;
    })();

    // Get created complaint with evidences
    const complaint = getComplaintWithEvidences(
      db.prepare('SELECT id FROM complaints WHERE job_id = ? AND created_by = ?')
        .get(parseInt(jobId), createdBy).id
    );

    res.status(201).json(complaint);
  } catch (error) {
    next(error);
  }
}

/**
 * Get my complaints
 */
function getMyComplaints(req, res, next) {
  try {
    const userId = req.user.id;

    const complaints = db.prepare(`
      SELECT * FROM complaints
      WHERE created_by = ?
      ORDER BY id DESC
    `).all(userId);

    const complaintsWithEvidences = complaints.map(complaint =>
      getComplaintWithEvidences(complaint.id)
    );

    res.status(200).json(complaintsWithEvidences);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pending complaints (Admin only)
 */
function getPendingComplaints(req, res, next) {
  try {
    const complaints = db.prepare(`
      SELECT 
        c.*,
        u.phone as creator_phone,
        u.full_name as creator_full_name,
        j.title as job_title
      FROM complaints c
      JOIN users u ON c.created_by = u.id
      JOIN jobs j ON c.job_id = j.id
      WHERE c.status = 'PENDING'
      ORDER BY c.id ASC
    `).all();

    const complaintsWithEvidences = complaints.map(complaint => {
      const fullComplaint = getComplaintWithEvidences(complaint.id);
      return {
        ...fullComplaint,
        creatorPhone: complaint.creator_phone,
        creatorFullName: complaint.creator_full_name,
        jobTitle: complaint.job_title
      };
    });

    res.status(200).json(complaintsWithEvidences);
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve a complaint (Admin only)
 */
function resolveComplaint(req, res, next) {
  try {
    const { complaintId } = req.params;
    const { decision, resolutionNote } = req.body;
    const adminId = req.user.id;

    // Validation
    if (!decision || !['ACCEPT', 'REJECT'].includes(decision.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid decision',
        message: 'Decision must be either ACCEPT or REJECT'
      });
    }

    // Get complaint
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?')
      .get(parseInt(complaintId));

    if (!complaint) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Complaint not found'
      });
    }

    // Business rule: Can only resolve pending complaints
    if (complaint.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot resolve complaint',
        message: 'Complaint is not in PENDING status'
      });
    }

    const now = Date.now();
    const decisionUpper = decision.toUpperCase();

    // Update complaint status
    db.prepare(`
      UPDATE complaints
      SET status = 'RESOLVED',
          decision = ?,
          resolved_by = ?,
          resolved_at = ?
      WHERE id = ?
    `).run(decisionUpper, adminId, now, parseInt(complaintId));

    // Get updated complaint
    const updatedComplaint = getComplaintWithEvidences(parseInt(complaintId));

    res.status(200).json(updatedComplaint);
  } catch (error) {
    next(error);
  }
}

/**
 * Helper function to get complaint with evidences
 */
function getComplaintWithEvidences(complaintId) {
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?')
    .get(complaintId);

  if (!complaint) {
    return null;
  }

  const evidences = db.prepare(`
    SELECT * FROM complaint_evidences WHERE complaint_id = ?
  `).all(complaintId);

  return {
    id: complaint.id,
    jobId: complaint.job_id,
    createdBy: complaint.created_by,
    reason: complaint.reason,
    status: complaint.status,
    decision: complaint.decision,
    resolvedBy: complaint.resolved_by,
    resolvedAt: complaint.resolved_at,
    evidences: evidences.map(ev => ({
      id: ev.id,
      evidenceType: ev.evidence_type,
      evidenceUrl: ev.evidence_url
    }))
  };
}

module.exports = {
  fileComplaint,
  getMyComplaints,
  getPendingComplaints,
  resolveComplaint
};

