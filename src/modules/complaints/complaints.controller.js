/**
 * Complaints controller
 * Handles complaint filing and resolution
 */

const db = require('../../config/db');

/**
 * Helper function to get complaint with evidences
 */
async function getComplaintWithEvidences(complaintId) {
  const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [complaintId]);
  if (complaintResult.rows.length === 0) {
    return null;
  }
  const complaint = complaintResult.rows[0];

  const evidencesResult = await db.query(`
    SELECT * FROM complaint_evidences WHERE complaint_id = $1
  `, [complaintId]);

  return {
    id: complaint.id,
    jobId: complaint.job_id,
    createdBy: complaint.created_by,
    reason: complaint.reason,
    status: complaint.status,
    decision: complaint.decision,
    resolvedBy: complaint.resolved_by,
    resolvedAt: complaint.resolved_at,
    evidences: evidencesResult.rows.map(ev => ({
      id: ev.id,
      evidenceType: ev.evidence_type,
      evidenceUrl: ev.evidence_url
    }))
  };
}

/**
 * File a complaint
 */
async function fileComplaint(req, res, next) {
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
    const jobResult = await db.query('SELECT * FROM jobs WHERE id = $1', [parseInt(jobId)]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job not found'
      });
    }
    const job = jobResult.rows[0];

    // Business rule: User must be involved in the job (employer or accepted worker)
    if (job.employer_id !== createdBy && job.accepted_worker_id !== createdBy) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only file complaints for jobs you are involved in'
      });
    }

    const now = Date.now();

    // Create complaint and evidences in transaction
    const complaintId = await db.transaction(async (client) => {
      // Insert complaint
      const result = await client.query(`
        INSERT INTO complaints (
          job_id, created_by, reason, status
        )
        VALUES ($1, $2, $3, 'PENDING')
        RETURNING id
      `, [parseInt(jobId), createdBy, reason]);
      const complaintId = result.rows[0].id;

      // Insert evidences if provided
      if (evidences && Array.isArray(evidences) && evidences.length > 0) {
        for (const evidence of evidences) {
          if (evidence.type && evidence.url) {
            await client.query(`
              INSERT INTO complaint_evidences (
                complaint_id, evidence_type, evidence_url
              )
              VALUES ($1, $2, $3)
            `, [complaintId, evidence.type.toUpperCase(), evidence.url]);
          }
        }
      }

      return complaintId;
    });

    // Get created complaint with evidences
    const complaint = await getComplaintWithEvidences(complaintId);

    res.status(201).json(complaint);
  } catch (error) {
    next(error);
  }
}

/**
 * Get my complaints
 */
async function getMyComplaints(req, res, next) {
  try {
    const userId = req.user.id;

    const complaintsResult = await db.query(`
      SELECT * FROM complaints
      WHERE created_by = $1
      ORDER BY id DESC
    `, [userId]);

    const complaintsWithEvidences = await Promise.all(
      complaintsResult.rows.map(complaint => getComplaintWithEvidences(complaint.id))
    );

    res.status(200).json(complaintsWithEvidences);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pending complaints (Admin only)
 */
async function getPendingComplaints(req, res, next) {
  try {
    const complaintsResult = await db.query(`
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
    `);

    const complaintsWithEvidences = await Promise.all(
      complaintsResult.rows.map(async (complaint) => {
        const fullComplaint = await getComplaintWithEvidences(complaint.id);
        return {
          ...fullComplaint,
          creatorPhone: complaint.creator_phone,
          creatorFullName: complaint.creator_full_name,
          jobTitle: complaint.job_title
        };
      })
    );

    res.status(200).json(complaintsWithEvidences);
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve a complaint (Admin only)
 */
async function resolveComplaint(req, res, next) {
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
    const complaintResult = await db.query('SELECT * FROM complaints WHERE id = $1', [parseInt(complaintId)]);
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Complaint not found'
      });
    }
    const complaint = complaintResult.rows[0];

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
    await db.query(`
      UPDATE complaints
      SET status = 'RESOLVED',
          decision = $1,
          resolved_by = $2,
          resolved_at = $3
      WHERE id = $4
    `, [decisionUpper, adminId, now, parseInt(complaintId)]);

    // Get updated complaint
    const updatedComplaint = await getComplaintWithEvidences(parseInt(complaintId));

    res.status(200).json(updatedComplaint);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  fileComplaint,
  getMyComplaints,
  getPendingComplaints,
  resolveComplaint
};
