/**
 * Calculate the reliability of a relationship extracted from text.
 * Attempts to check references of the same intent in cross-domain sources.
 */
'use strict';

const db = require('../lib/db');
const async = require('async');

const DEFAULT_RELIABILITY = 60;

const ReliabilityEngine = function() {
  /**
   * Calculate an average reliability rating over all relations in the text.
   * Based on the number of similiar relations made in different domains.
   * @param  {Array}  alchemy  Array of relations from Alchemy API.
   * @param  {String} domain     Domain of these relations.
   * @return {Number}            Averaged reliability index.
   */
  function processRating(alchemy) {
    console.log('Success. Performing reliability processing...');
    const relations = alchemy.relations;
    const domain = alchemy.domain;
    var promises = [];
    for (var i = 0; i < relations.length; i++) {
      promises.push(processRelation(relations[i], domain));
    }
    return new Promise((resolve, reject) => {
      if (relations < 1) {
        resolve({alchemy, reliability: 30});
      }
      Promise.all(promises).then(values => {
        var reliability = values.reduce((a, b) => {
          return a + b;
        }) / relations.length;
        resolve({
          alchemy,
          reliability
        });
      }, error => {
        console.log(error);
        reject(error);
      });
    });
  }

  /**
   * Calculate each relations reliability.
   * This does really silly things with async.
   * @param  {Object} r       Relation object.
   * @param  {String} domain  Domain of this relation.
   * @return {Number}         Reliability index.
   */
  function processRelation(r, domain) {
    return new Promise((resolve, reject) => {
      if (r.subject && r.action && r.object) {
        async.parallel([
          // First, find if we know this subject!
          callback => {
            db.cypher({
              query: 'MATCH (s:Subject {name: {subject}}) RETURN s',
              params: {
                subject: r.subject.text
              }
            }, (err, res) => {
              if (err) {
                callback(err);
              }
              if (res.length < 1) {
                addSubject(r, callback);
              } else {
                callback(null, true);
              }
            });
          },
          // At the same time, check if we know the object...
          callback => {
            db.cypher({
              query: 'MATCH (o:Object {name: {subject}}) RETURN o',
              params: {
                subject: r.object.text
              }
            }, (err, results) => {
              var result = results[0];
              if (err) {
                callback(err);
              }
              if (result) {
                callback(null, true);
              } else {
                addObject(r, callback);
              }
            });
          }],
          (err, results) => {
            if (err) {
              reject(err);
            }
            // Check if we know both things. If so, we might have a relation!
            if (results[0] && results[1]) {
              console.log('Sweet, those exist!');
              resolve(90);
            } else {
              // We were missing something. Ah well, let's define a relation.
              addRelation(r, domain);
              console.log('returning', DEFAULT_RELIABILITY);
              resolve(DEFAULT_RELIABILITY);
            }
          });
      } else {
        resolve(DEFAULT_RELIABILITY);
      }
    });
  }

  /**
   * [addSubject description]
   * @param {[type]}   r        [description]
   * @param {Function} callback [description]
   */
  function addSubject(r, callback) {
    db.cypher({
      query: 'MERGE (s:Subject {name: {subjectName}})',
      params: {
        subjectName: r.subject.text
      }
    }, err => {
      if (err) {
        callback(err);
      }
      callback(null, false);
    });
  }

  /**
   * Add object to DB.
   * @param {Object}   r        Relation.
   * @param {Function} callback For completion.
   */
  function addObject(r, callback) {
    db.cypher({
      query: 'MERGE (o:Object {name: {objectName}})',
      params: {
        objectName: r.object.text
      }
    }, err => {
      if (err) {
        callback(err);
      }
      callback(null, false);
    });
  }

  /**
   * Add a new relation to the database.
   * @param  {Object}   r         Relation to create.
   * @param  {String}   domain    Domain of this relation.
   * @param  {Function} callback  Run to signal process completed.
   */
  function addRelation(r, domain) {
    db.cypher({
      query: `MERGE (s:Subject {name:{subjectName}})
        MERGE (o:Object {name: {objectName}})
        CREATE UNIQUE (s)-[l:LINKED {
          action: {action},
          domain: {domain}
        }]->(o)`,
      params: {
        subjectName: r.subject.text,
        action: r.action.lemmatized,
        domain: domain,
        objectName: r.object.text
      }
    }, err => {
      if (err) {
        throw err;
      }
    });
  }

  /**
   * Check to see the actions between the two objects, if any.
   * If this is the only domain to report the action, return default.
   * If the connection is made already, return high reliability.
   * If no connection, create a new relationship.
   * @param  {Object} r      [description]
   * @param  {String} domain [description]
   * @return {Number}        [description]
   */
  function checkRelation(r, domain) {
    return 90;
  }

  return {
    processRating
  };
};

module.exports = ReliabilityEngine;
