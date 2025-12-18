const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucketName } = require('../../config/s3');
const crypto = require('crypto');
const path = require('path');

/**
 * Upload a file to AWS S3
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - The URL of the uploaded file
 */
async function uploadToS3(file) {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
  const key = `jobs/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read', // Deprecated in some S3 configurations, better to use bucket policy
  });

  try {
    await s3Client.send(command);
    // Construct the public URL (assuming the bucket is configured for public access or using a CDN)
    return `https://${bucketName}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

module.exports = {
  uploadToS3,
};

