module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DB_URL: process.env.DATABASE_URL || 'postgresql://peter_tardif@localhost/family-vault',
  TEST_DB_URL: process.env.TEST_DB_URL || 'postgresql://peter_tardif@localhost/family-vault-test',
  AWS_Access_Key_Id: process.env.AWSAccessKeyId,
  AWS_Secret_Key: process.env.AWSSecretKey,
  S3_BUCKET: process.env.S3_BUCKET
}