'use strict';

const request = require('request');
const striptags = require('striptags');
const sentiment = require('sentiment');
const rousseau = require('rousseau');

const errorCodes = require('../lib/ErrorCodes');
const commonStarts = require('../lib/CommonStarts');

const AnalysisMethods = function() {
  /**
   * Perform analysis of URL.
   * @param  {Object} req Express request.
   * @param  {Object} res Response.
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
   * @param  {Object}   rbody   Readability parser results.
   * @return {Object}   data    Results of analysis.
   */
  function analyzeContent(rbody) {
    const body = JSON.parse(rbody);
    const text = striptags(body.content).replace(/(\r\n|\n|\r)/gm, " ");
    // Thanks to: https://stackoverflow.com/questions/7653942/find-names-with-regular-expression
    const namesRegEx = /([A-Z][a-z]*)[\s-]([A-Z][a-z]*)/g;
    console.log(text);
    let data = {
      title: body.title,
      sentiment: calculateSentiment(text),
      names: removeCommon(text).match(namesRegEx),
      warnings: proofRead(text)
    };
    data.names = data.names.reduce(function(countMap, word) {
      countMap[word] = ++countMap[word] || 1; return countMap;
    }, {});

    // Analyse spelling!!
    return data;
  }

  /**
   * Removes the commonly capitalized starts to English sentences.
   * @param  {string} text Document body text.
   * @return {string} text Result of removing common sentence beginnings.
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
   * Calculate a percentage sentiment rating.
   * From 0 (very negative) to 100 (very positive).
   * @param  {string} text  Input body text to be analyzed.
   * @return {number}          Text positivity percentage.
   */
  function calculateSentiment(text) {
    const result = sentiment(text);
    const potential = result.words.length * 10;
    const actual = result.score + (5 * result.words.length);
    const percentageSentiment = (actual / potential) * 100;
    return percentageSentiment.toFixed(2);
  }

  /**
   * Analyze the text for grammatical properties that may affect reliability.
   * @param  {string} text  Body to analyze.
   * @return {Array}        Warnings generated.
   */
  function proofRead(text) {
    var warnings = [];
    var descriptions = [];
    rousseau(text, {
      checks: {
        'passive': false,
        'simplicity': true,
        'so': false,
        'abverbs': true,
        'readibility': false,
        'lexical-illusion': false,
        'weasel': true,
        'sentence:start': false,
        'sentence:end': false,
        'sentence:uppercase': false
      }
    }, (err, results) => {
      if (err) {
        console.log(err);
      }
      results.forEach(suggestion => {
        warnings.push(suggestion.type);
      });
      warnings = warnings.reduce(function(countMap, word) {
        countMap[word] = ++countMap[word] || 1; return countMap;
      }, {});
    });
    if (warnings.simplicity > 1) {
      descriptions.push('This text could be overcomplicating its writing.' +
        ` ${warnings.simplicity} sentence matched.`);
    }
    if (warnings.abverbs > 0) {
      descriptions.push('It looks like abverbs are being used to emphasize ' +
      `statements, such as 'very', or 'extremely'. Check those sources!` +
      `Counted ${warnings.abverbs} times.`);
    }
    if (warnings.weasel > 0) {
      descriptions.push('Weasel words, which can be used to imply meaning ' +
       `beyond the supporting evidence, were found ${warnings.weasel} times.`);
    }

    return descriptions;
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
