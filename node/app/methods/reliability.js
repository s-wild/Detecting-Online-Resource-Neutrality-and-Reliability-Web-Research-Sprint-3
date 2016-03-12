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
   * Establish database constraints.
   */
  function init() {
    db.cypher({
      query: `CREATE CONSTRAINT ON (s:Subject) ASSERT s.name IS UNIQUE`
    }, error => {
      if (error) {
        throw new Error('Database could not be initialized!', error);
      }
      db.cypher({
        query: `CREATE CONSTRAINT ON (o:Object) ASSERT o.name IS UNIQUE`
      }, error => {
        if (error) {
          throw new Error('Database could not be initialized!', error);
        }
      });
    });
  }
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
              query: `MERGE (s:Subject {name: {subject}})
                ON CREATE SET s.created = true
                ON MATCH SET s.created = false
                RETURN s`,
              params: {
                subject: r.subject.text
              }
            }, (err, results) => {
              if (err) {
                callback(err);
              }
              let result = results[0];
              callback(null, result.s.properties.created);
            });
          },
          // At the same time, check if we know the object...
          callback => {
            db.cypher({
              query: `MERGE (o:Object {name: {subject}})
                ON CREATE SET o.created = true
                ON MATCH SET o.created = false
                RETURN o`,
              params: {
                subject: r.object.text
              }
            }, (err, results) => {
              if (err) {
                callback(err);
              }
              let result = results[0];
              callback(null, result.o.properties.created);
            });
          }],
          (err, created) => {
            if (err) {
              reject(err);
            }
            // Was either thing new? It can't be related :-(
            if (created[0] || created[1]) {
              addRelation(r, domain);
              console.log('returning', DEFAULT_RELIABILITY);
              resolve(DEFAULT_RELIABILITY);
            } else {
              // We know them both! Are they related, and says who?
              console.log('Sweet, those exist!');
              resolve(90);
            }
          });
      } else {
        resolve(DEFAULT_RELIABILITY);
      }
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
      query: `MATCH (s:Subject {name:{subjectName}})
        MATCH (o:Object {name: {objectName}})
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

  init();

  return {
    processRating
  };
};

module.exports = ReliabilityEngine;
