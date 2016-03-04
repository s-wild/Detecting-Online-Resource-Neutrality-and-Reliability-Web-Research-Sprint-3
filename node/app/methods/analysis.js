'use strict';

const request = require('request');

const errorCodes = require('../lib/ErrorCodes');

const AnalysisMethods = function() {
  /**
   * Perform analysis of URL.
   * @param  {object} req Express request.
   * @param  {object} res Response.
   */
  function analyzeURL(req, res) {
    const url = req.body.url;

    const handleResponse = (error, response, body) => {
      if (error || response.statusCode !== 200) {
        res.status(errorCodes.server.code);
        res.send(errorCodes.server.message + ': ' + error ||
                  response.statusCode);
        console.log('Error with Readability API Call:', error ||
                    response.statusCode);
      }
      if (response.statusCode === 200) {
        let data = analyzeContent(body);
        res.send(data);
      }
    };
    request('https://readability.com/api/content/v1/parser?' +
      `url=${url}&token=${process.env.READABILITY_API_KEY}`, handleResponse);
  }

  /**
   * Perform analysis on extracted URL content.
   * @param  {JSON}   rbody   Readability parser results.
   * @return {JSON}   data    Results of analysis.
   */
  function analyzeContent(rbody) {
    const body = JSON.parse(rbody);
    let data = {
      title: body.title,
      content: body.content
    };
    return data;
  }

  /**
   * Get results for an analyzed URL.
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
