/**
 * Certificates controller
 * Handles certificate submission and verification
 */

const db = require('../../config/db');

/**
 * Submit a certificate (Worker only)
 */
function submitCertificate(req, res, next) {
  try {
    const { imageUrl } = req.body;
    const workerId = req.user.id;

    // Validation
    if (!imageUrl) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'imageUrl is required'
      });
    }

    // Insert certificate
    const insertCertificate = db.prepare(`
      INSERT INTO worker_certificates (
        worker_id, image_url, status
      )
      VALUES (?, ?, 'PENDING')
    `);

    const result = insertCertificate.run(workerId, imageUrl);

    // Get created certificate
    const certificate = db.prepare('SELECT * FROM worker_certificates WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({
      id: certificate.id,
      workerId: certificate.worker_id,
      imageUrl: certificate.image_url,
      status: certificate.status
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get worker's certificate status
 */
function getCertificateStatus(req, res, next) {
  try {
    const workerId = req.user.id;

    const certificates = db.prepare(`
      SELECT * FROM worker_certificates
      WHERE worker_id = ?
      ORDER BY id DESC
    `).all(workerId);

    // Get worker profile to check verification status
    const workerProfile = db.prepare('SELECT is_verified FROM worker_profiles WHERE user_id = ?')
      .get(workerId);

    // Check if worker has at least one approved certificate
    const hasApprovedCert = certificates.some(cert => cert.status === 'APPROVED');

    // Return all certificates with their status
    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      workerId: cert.worker_id,
      imageUrl: cert.image_url,
      status: cert.status,
      reviewedBy: cert.reviewed_by,
      reviewedAt: cert.reviewed_at
    }));

    // isVerified is true if profile says so OR if there's an approved certificate
    const isVerified = (workerProfile && workerProfile.is_verified === 1) || hasApprovedCert;

    res.status(200).json({
      certificates: formattedCertificates,
      isVerified: isVerified
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pending certificates (Admin only)
 */
function getPendingCertificates(req, res, next) {
  try {
    const certificates = db.prepare(`
      SELECT 
        wc.*,
        u.phone as worker_phone,
        u.full_name as worker_full_name,
        wp.skill as worker_skill
      FROM worker_certificates wc
      JOIN users u ON wc.worker_id = u.id
      LEFT JOIN worker_profiles wp ON u.id = wp.user_id
      WHERE wc.status = 'PENDING'
      ORDER BY wc.id ASC
    `).all();

    const formattedCertificates = certificates.map(cert => ({
      id: cert.id,
      workerId: cert.worker_id,
      workerPhone: cert.worker_phone,
      workerFullName: cert.worker_full_name,
      workerSkill: cert.worker_skill,
      imageUrl: cert.image_url,
      status: cert.status
    }));

    res.status(200).json(formattedCertificates);
  } catch (error) {
    next(error);
  }
}

/**
 * Verify a certificate (Admin only)
 */
function verifyCertificate(req, res, next) {
  try {
    const { certificateId } = req.params;
    const { approved } = req.body;
    const adminId = req.user.id;

    // Get certificate
    const certificate = db.prepare('SELECT * FROM worker_certificates WHERE id = ?')
      .get(parseInt(certificateId));

    if (!certificate) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Certificate not found'
      });
    }

    // Business rule: Can only verify pending certificates
    if (certificate.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot verify certificate',
        message: 'Certificate is not in PENDING status'
      });
    }

    const now = Date.now();
    const newStatus = approved ? 'APPROVED' : 'REJECTED';

    // Update certificate and worker profile in transaction
    db.transaction(() => {
      // Update certificate
      db.prepare(`
        UPDATE worker_certificates
        SET status = ?,
            reviewed_by = ?,
            reviewed_at = ?
        WHERE id = ?
      `).run(newStatus, adminId, now, parseInt(certificateId));

      // If approved, update worker profile verification status
      if (approved) {
        // Update worker profile is_verified to true
        db.prepare(`
          UPDATE worker_profiles
          SET is_verified = 1
          WHERE user_id = ?
        `).run(certificate.worker_id);
      } else {
        // If rejected, set is_verified to false
        db.prepare(`
          UPDATE worker_profiles
          SET is_verified = 0
          WHERE user_id = ?
        `).run(certificate.worker_id);
      }
    })();

    // Get updated certificate
    const updatedCertificate = db.prepare('SELECT * FROM worker_certificates WHERE id = ?')
      .get(parseInt(certificateId));

    res.status(200).json({
      id: updatedCertificate.id,
      workerId: updatedCertificate.worker_id,
      imageUrl: updatedCertificate.image_url,
      status: updatedCertificate.status,
      reviewedBy: updatedCertificate.reviewed_by,
      reviewedAt: updatedCertificate.reviewed_at
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitCertificate,
  getCertificateStatus,
  getPendingCertificates,
  verifyCertificate
};

