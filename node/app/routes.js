'use strict';

/**
 * Set up routes around the application.
 * @param  {[type]} app     [description]
 * @param  {[type]} methods [description]
 */
function setup(app, methods) {
  // API
  // Analysis
  app.post('/api', methods.analysis.analyzeURL);
  app.get('/api/:url', methods.analysis.getAnalyzedURL);
}

exports.setup = setup;
