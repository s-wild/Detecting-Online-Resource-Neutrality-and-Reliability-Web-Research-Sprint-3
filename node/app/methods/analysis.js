'use strict';

const AnalysisMethods = function() {
  /**
   * Perform analysis of URL.
   * @param  {[type]} req [description]
   * @param  {[type]} res [description]
   */
  function analyzeURL(req, res) {
    console.log(req);
    res.send('ok');
  }

  /**
   * Get results for a previously analyzed URL.
   * @param  {[type]} req [description]
   * @param  {[type]} res [description]
   */
  function getAnalyzedURL(req, res) {
    console.log(req);
    res.send('ok');
  }

  return {
    analyzeURL,
    getAnalyzedURL
  };
};

module.exports = AnalysisMethods;
