/**
 * Certificates controller
 * Handles certificate submission and verification
 */

const db = require('../../config/db');

/**
 * Submit a certificate (Worker only)
 */
async function submitCertificate(req, res, next) {
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
    const result = await db.query(`
      INSERT INTO worker_certificates (
        worker_id, image_url, status
      )
      VALUES ($1, $2, 'PENDING')
      RETURNING *
    `, [workerId, imageUrl]);
    const certificate = result.rows[0];

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
async function getCertificateStatus(req, res, next) {
  try {
    const workerId = req.user.id;

    const certificatesResult = await db.query(`
      SELECT * FROM worker_certificates
      WHERE worker_id = $1
      ORDER BY id DESC
    `, [workerId]);

    // Get worker profile to check verification status
    const workerProfileResult = await db.query('SELECT is_verified FROM worker_profiles WHERE user_id = $1', [workerId]);
    const workerProfile = workerProfileResult.rows[0];

    // Check if worker has at least one approved certificate
    const hasApprovedCert = certificatesResult.rows.some(cert => cert.status === 'APPROVED');

    // Return all certificates with their status
    const formattedCertificates = certificatesResult.rows.map(cert => ({
      id: cert.id,
      workerId: cert.worker_id,
      imageUrl: cert.image_url,
      status: cert.status,
      reviewedBy: cert.reviewed_by,
      reviewedAt: cert.reviewed_at
    }));

    // isVerified is true if profile says so OR if there's an approved certificate
    const isVerified = (workerProfile && workerProfile.is_verified === true) || hasApprovedCert;

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
async function getPendingCertificates(req, res, next) {
  try {
    const certificatesResult = await db.query(`
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
    `);

    const formattedCertificates = certificatesResult.rows.map(cert => ({
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
async function verifyCertificate(req, res, next) {
  try {
    const { certificateId } = req.params;
    const { approved } = req.body;
    const adminId = req.user.id;

    // Get certificate
    const certificateResult = await db.query('SELECT * FROM worker_certificates WHERE id = $1', [parseInt(certificateId)]);
    if (certificateResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Certificate not found'
      });
    }
    const certificate = certificateResult.rows[0];

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
    await db.transaction(async (client) => {
      // Update certificate
      await client.query(`
        UPDATE worker_certificates
        SET status = $1,
            reviewed_by = $2,
            reviewed_at = $3
        WHERE id = $4
      `, [newStatus, adminId, now, parseInt(certificateId)]);

      // If approved, update worker profile verification status
      if (approved) {
        // Update worker profile is_verified to true
        await client.query(`
          UPDATE worker_profiles
          SET is_verified = TRUE
          WHERE user_id = $1
        `, [certificate.worker_id]);
      } else {
        // If rejected, set is_verified to false
        await client.query(`
          UPDATE worker_profiles
          SET is_verified = FALSE
          WHERE user_id = $1
        `, [certificate.worker_id]);
      }
    });

    // Get updated certificate
    const updatedCertificateResult = await db.query('SELECT * FROM worker_certificates WHERE id = $1', [parseInt(certificateId)]);
    const updatedCertificate = updatedCertificateResult.rows[0];

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
