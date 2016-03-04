'use strict';

const express = require('express');

const routes = require('./routes');
const AnalysisMethods = require('./methods/analysis');

const app = express();
const port = process.env.PORT || 3000;

const methods = {
  analysis: new AnalysisMethods()
};

/**
 * Start the Express server.
 */
function start() {
  routes.setup(app, methods);
  app.listen(port);
  console.log(`Express server listening on port ${port}
                in ${app.settings.env} mode.`);
}

start();
