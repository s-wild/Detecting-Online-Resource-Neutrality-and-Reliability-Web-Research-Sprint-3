'use strict';

/**
 * Set up routes around the application.
 * @param  {Object} app     Express app.
 * @param  {Object} methods Request handlers.
 */
function setup(app, methods) {
  // API
  // Analysis
  app.post('/api', methods.analysis.analyzeURL);
  app.get('/api/:url', methods.analysis.getAnalyzedURL);
}

exports.setup = setup;
