module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DB_URL: process.env.DB_URL || 'postgresql://peter_tardif@localhost/family-vault',
}