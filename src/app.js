require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV,S3_BUCKET } = require('./config');
const memoriesRouter = require('./memories/memories-router');
const familyMembersRouter = require('./family-members/family-members-router');
const AWS = require('aws-sdk');

const app = express();
const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());

app.get('/', (req,res) => {
  res.send('Hello, Ms. World!')
});

AWS.config.region = 'us-east-2';

app.get('/sign-s3', (req, res) => {
  const s3 = new AWS.S3();
  const { fileName, fileType } = req.query;
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.error(err);
    } else {
      res.json({
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      });
    }
  });
});

app.use('/api/family-members', familyMembersRouter);
app.use('/api/memories', memoriesRouter);

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = {error: { message: 'server error' } }
  } else {
    response = { message: error.message, error }
  }
  res.status(500).json(response);
});

module.exports =  app;