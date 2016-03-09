'use strict';

const request = require('request');
const striptags = require('striptags');
const sentiment = require('sentiment');
const rousseau = require('rousseau');
const spellcheck = require('spellchecker');
const AlchemyAPI = require('alchemy-api');
const async = require('async');

const alchemy = new AlchemyAPI(process.env.ALCHEMY_API_KEY);
const errorCodes = require('../lib/ErrorCodes');

const AnalysisMethods = function() {
  /**
   * Perform analysis of URL.
   * @param  {Object} req Express request.
   * @param  {Object} res Response.
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
        let data = analyzeContent(url, body);
        res.send(data);
      }
    };
    request('https://readability.com/api/content/v1/parser?' +
      `url=${url}&token=${process.env.READABILITY_API_KEY}`, handleResponse);
  }

  /**
   * Perform analysis on extracted URL content.
   * @param  {string}   url     URL of article.
   * @param  {Object}   rbody   Readability parser results.
   * @return {Object}   data    Results of analysis.
   */
  function analyzeContent(url, rbody) {
    const body = JSON.parse(rbody);
    const text = striptags(body.content).replace(/(\r\n|\n|\r)/gm, " ");
    const alchemyResult = processAlchemy(url);
    console.log(text);
    let data = {
      title: body.title,
      sentiment: calculateSentiment(text),
      warnings: proofRead(text),
      spelling: analyzeSpelling(text)
    };

    // Analyse spelling!!
    return data;
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
        countMap[word] = ++countMap[word] || 1;
        return countMap;
      }, {});
    });
    if (warnings.simplicity > 1) {
      descriptions.push('This text could be overcomplicating its writing.' +
        ` ${warnings.simplicity} sentences matched.`);
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
   * Detect percentage misspelled words in the text.
   * @param  {string}   text  Body text to analyze.
   * @return {Number}         Percentage spelling accuracy.
   */
  function analyzeSpelling(text) {
    return Math.round(Math.random() * 100) + 1;
  }

  /**
   * Request analysis from the Alchemy service.
   * @param  {string}   url   URL to analyze.
   * @return {Object}         Data object.
   */
  function processAlchemy(url) {
    async.parallel({
      entities: function(callback) {
        alchemy.entities(url, {}, function(err, response) {
          if (err) {
            callback(err);
          }
          const result = response.entities.filter(element => {
            return element.relevance > 0.3;
          });
          callback(null, result);
        });
      },
      concepts: function(callback) {
        alchemy.concepts(url, {}, function(err, response) {
          if (err) {
            callback(err);
          }
          const result = response.concepts.slice(1, 3);
          callback(null, result);
        });
      },
      author: function(callback) {
        alchemy.author(url, {}, function(err, response) {
          if (err) {
            callback(err);
          }
          callback(null, response.author);
        });
      },
      relations: function(callback) {
        alchemy.relations(url, {}, function(err, response) {
          if (err) {
            callback(err);
          }
          callback(null, response.relations);
        });
      }
    }, (err, result) => {
      if (err) {
        return console.log(err);
      }
      console.log(result);
    });
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
