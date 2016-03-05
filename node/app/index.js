'use strict';
require('dotenv').config(); // Get config from .env file - inc API keys.

const express = require('express');
const bodyParser = require('body-parser');

const routes = require('./routes');
const AnalysisMethods = require('./methods/analysis');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // parse application/json

const methods = {
  analysis: new AnalysisMethods()
};

/**
 * Start the Express server.
 */
function start() {
  routes.setup(app, methods);
  app.listen(port);
  console.log(`Listening on port ${port} in ${app.settings.env} mode.`);
}

start();
