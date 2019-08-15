const express = require('express');
const app = express();

const { PORT } = require('./config');


app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
