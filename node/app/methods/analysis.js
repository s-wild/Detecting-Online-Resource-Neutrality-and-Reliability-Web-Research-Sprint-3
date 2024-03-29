/**
 * Perform multiple analysis stages on submitted URLs.
 * Returns a JSON object with results.
 */

'use strict';

// NPM Modules
const request = require('request');
const striptags = require('striptags');
const sentiment = require('sentiment');
const rousseau = require('rousseau');
const spellcheck = require('spellchecker');
const AlchemyAPI = require('alchemy-api');
const async = require('async');
const alchemy = new AlchemyAPI(process.env.ALCHEMY_API_KEY);

// Local Modules
const errorCodes = require('../lib/ErrorCodes');
const ReliabilityEngine = require('./reliability');
const reliability = new ReliabilityEngine();

const AnalysisMethods = function() {
  /**
   * Perform analysis of URL.
   * @param  {Object} req Express request.
   * @param  {Object} res Response.
   */
  function analyzeURL(req, res) {
    const url = req.body.url;
    console.log('Received request to process', url);
    const handleResponse = (error, response, body) => {
      if (error || response.statusCode !== 200) {
        res.status(errorCodes.server.code);
        res.send(errorCodes.server.message + ': ' + error ||
          response.statusCode);
        console.log('Error with Readability API Call:', error ||
          response.statusCode);
      }
      if (response.statusCode === 200) {
        console.log('Readability API success!');
        let dataPromise = analyzeContent(url, body);
        dataPromise.then(result => {
          console.log('Request processed! \n');
          res.send(result);
        }, error => {
          console.log(error);
          res.status(errorCodes.server.code);
          res.send(`${errorCodes.server.message}: ${error}`);
        });
      }
    };
    request('https://readability.com/api/content/v1/parser?' +
      `url=${url}&token=${process.env.READABILITY_API_KEY}`, handleResponse);
  }

  /**
   * Perform analysis on extracted URL content.
   * @param  {String}   url     URL of article.
   * @param  {Object}   rbody   Readability parser results.
   * @return {Object}   data    Results of analysis.
   */
  function analyzeContent(url, rbody) {
    console.log('Performing analysis...');
    const body = JSON.parse(rbody);
    const text = striptags(body.content).replace(/(\r\n|\n|\r)/gm, " ");
    const reliabilityPromise = processAlchemy(url)
      .then(reliability.processRating);
    return new Promise((resolve, reject) => {
      reliabilityPromise.then((res, rej) => {
        if (rej) {
          reject(rej);
        }
        let data = {
          title: body.title,
          sentiment: calculateSentiment(text),
          warnings: proofRead(text),
          spelling: analyzeSpelling(text),
          alchemy: res.alchemy,
          reliability: res.reliability
        };
        resolve(data);
      });
    });
  }

  /**
   * Calculate a percentage sentiment rating.
   * From 0 (very negative) to 100 (very positive).
   * @param  {String} text  Input body text to be analyzed.
   * @return {Number}          Text positivity percentage.
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
   * @param  {String} text  Body to analyze.
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
      warnings = warnings.reduce(function(cMap, word) {
        cMap[word] = ++cMap[word] || 1;
        return cMap;
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
   * @param  {String}   text  Body text to analyze.
   * @return {Number}         Percentage spelling accuracy.
   */
  function analyzeSpelling(text) {
    const tokens = text.split(' ');
    var totalTokens = 0;
    var correctTokens = 0;
    tokens.forEach(token => {
      token = token.split('.')[0];
      token = token.replace(/['`~!@#$%^&*()_|+=?;:\"',.<>\/]/gi, '');
      if (token.length > 0) {
        totalTokens++;
        if (!spellcheck.isMisspelled(token)) {
          correctTokens++;
        }
      }
    });
    return ((correctTokens / totalTokens) * 100).toFixed(2);
  }

  /**
   * Request analysis from the Alchemy service.
   * @param  {String}   url   URL to analyze.
   * @return {Promise}        Promise to fulfill on API completion.
   */
  function processAlchemy(url) {
    console.log('Requesting data from Alchemy API...');
    return new Promise((resolve, reject) => {
      async.parallel({
        entities: callback => {
          alchemy.entities(url, {}, (err, response) => {
            if (err) {
              callback(err);
            }
            const result = response.entities.filter(element => {
              return element.relevance > 0.3;
            });
            callback(null, result);
          });
        },
        concepts: callback => {
          alchemy.concepts(url, {}, (err, response) => {
            if (err) {
              callback(err);
            }
            const result = response.concepts.slice(1, 3);
            callback(null, result);
          });
        },
        author: callback => {
          alchemy.author(url, {}, (err, response) => {
            if (err) {
              callback(err);
            }
            callback(null, response.author);
          });
        },
        relations: callback => {
          alchemy.relations(url, {}, (err, response) => {
            if (err) {
              callback(err);
            }
            callback(null, response.relations);
          });
        },
        sentiment: callback => {
          alchemy.sentiment(url, {}, (err, response) => {
            if (err) {
              callback(err);
            }
            let data = response.docSentiment;
            let sentimentPercent;
            if (data.type === 'neutral') {
              sentimentPercent = 50;
            } else if (data.type === 'positive') {
              sentimentPercent = 50 + (data.score * 50);
            } else {
              sentimentPercent = 50 - (data.score * 50);
            }
            callback(null, sentimentPercent);
          });
        },
        emotion: callback => {
          request('http://gateway-a.watsonplatform.net/calls/url/URLGetEmotion' +
            `?apikey=${process.env.ALCHEMY_API_KEY}` +
            `&url=${encodeURI(url)}&outputMode=json`,
            (err, response, body) => {
              if (err || response.statusCode !== 200) {
                reject(console.log(err || response.statusCode));
              }
              var result = JSON.parse(body).docEmotions;
              var highestEmo;
              let highestVal = -Infinity;
              Object.keys(result).forEach(emotion => {
                if (result[emotion] > highestVal) {
                  highestEmo = emotion;
                  highestVal = result[emotion];
                }
              });
              callback(null, {
                highest: highestEmo,
                value: highestVal,
                all: result
              });
            });
        }
      }, (err, result) => {
        if (err) {
          reject(console.log(err));
        }
        result.domain = url.split('/')[2];
        resolve(result);
      });
    });
  }

  /**
   * Get results for an analyzed URL.
   * @param  {Object} req [description]
   * @param  {Object} res [description]
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
