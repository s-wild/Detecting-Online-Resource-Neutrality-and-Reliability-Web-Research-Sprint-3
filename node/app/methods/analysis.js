'use strict';

const request = require('request');
const striptags = require('striptags');
const sentiment = require('sentiment');

const errorCodes = require('../lib/ErrorCodes');
const commonStarts = require('../lib/CommonStarts');

const AnalysisMethods = function() {
  /**
   * Perform analysis of URL.
   * @param  {object} req Express request.
   * @param  {object} res Response.
   */
  function analyzeURL(req, res) {
    console.log(req.body);
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
    const text = striptags(body.content).replace(/(\r\n|\n|\r)/gm, "");
    // Thanks to: https://stackoverflow.com/questions/7653942/find-names-with-regular-expression
    const namesRegEx = /([A-Z][a-z]*)[\s-]([A-Z][a-z]*)/g;
    let data = {
      title: body.title,
      sentiment: sentiment(text).score,
      names: removeCommon(text).match(namesRegEx)
    };
    return data;
  }

  /**
   * Removes the commonly capitalized starts to English sentences.
   * @param  {String} text Document body text.
   * @return {String} text Result of removing common sentence beginnings.
   */
  function removeCommon(text) {
    commonStarts.forEach(term => {
      var pattern = term;
      var re = new RegExp(pattern, "g");
      text = text.replace(re, '');
    });
    return text;
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
