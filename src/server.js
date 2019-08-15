
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/api/*', (req, res) => {
  res.json({ok: true});
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

module.exports = {app};