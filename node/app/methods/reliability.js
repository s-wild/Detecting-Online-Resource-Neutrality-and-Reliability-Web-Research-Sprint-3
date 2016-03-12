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
    async.series([
      callback => {
        db.cypher({
          query: `CREATE CONSTRAINT ON (s:Subject) ASSERT s.name IS UNIQUE`
        }, error => {
          callback(error ? error : null);
        });
      }, callback => {
        db.cypher({
          query: `CREATE CONSTRAINT ON (o:Object) ASSERT o.name IS UNIQUE`
        }, error => {
          callback(error ? error : null);
        });
      }
    ], error => {
      if (error) {
        throw new Error('Database could not be constrained! AAAAH!', error);
      }
    });
  }
  /**
   * Calculate an average reliability rating over all relations in the text.
   * Based on the number of similiar relations made in different domains.
   * @param  {Array}  alchemy    Array of relations from Alchemy API.
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
        // If we really thought that was reliabily, return max.
        reliability = reliability > 99 ? 99 : reliability;
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
            if (created[0] || created[1]) {
              // Was either thing new? It can't be related :-(
              addRelation(r, domain);
              resolve(DEFAULT_RELIABILITY);
            } else {
              // We know them both! Are they related, and says who?
              checkRelationship(r, domain, resolve);
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
          domain: [{domain}]
        }]->(o)`,
      params: {
        subjectName: r.subject.text,
        action: r.action.lemmatized,
        domain: domain,
        objectName: r.object.text
      }
    }, err => {
      if (err) {
        console.log(err);
      }
    });
  }

  /**
   * Check to see the actions between the two objects, if any.
   * If this is the only domain to report the action, return default.
   * If the connection is made already, return high reliability.
   * If no connection, create a new relationship.
   * @param  {Object} r           Data relation.
   * @param  {String} domain      Domain of relation.
   * @param  {String} resolve     Function to call when processed.
   */
  function checkRelationship(r, domain, resolve) {
    db.cypher({
      query: `MATCH (:Subject {name:{subjectName}})-
        [l:LINKED]->(:Object {name:{objectName}})
        RETURN l`,
      params: {
        subjectName: r.subject.text,
        objectName: r.object.text
      }
    }, (err, results) => {
      if (err) {
        throw new Error(err);
      }
      if (results) {
        processRelationships(results);
      } else {
        // They weren't related. Blast!
        addRelation(r, domain);
        resolve(DEFAULT_RELIABILITY);
      }
    });

    /**
     * Read the action and domain properties, and append if necessary.
     * @param  {Array} links    Relationships between the two objects.
     */
    function processRelationships(links) {
      let matched = false;
      // Go through each relationship, searching for this action.
      for (var i = 0; i < links.length; i++) {
        let link = links[i].l;
        if (link.properties.action === r.action.lemmatized) {
          // If the action is in this link:
          checkDomain(link);
          matched = true;
        }
      }
      // If the action was not in the array:
      if (!matched) {
        addRelation(r, domain);
        resolve(DEFAULT_RELIABILITY);
      }
    }

    /**
     * Check the domains to make this action connection.
     * @param  {Object} link    Relationship link with properties.
     */
    function checkDomain(link) {
      let domains = link.properties.domain;
      let index = domains.indexOf(domain);
      if (index > -1) {
        // This domain is in the list, no way! Is anything else?
        domains.splice(index, 1);
        // Is there anything else left? How many domains said so?
        resolve(domains.length * 80 + DEFAULT_RELIABILITY);
      } else {
        // This domain wasn't in the list,
        // resolve how many domains did and then add this one.
        db.cypher({
          query: `MATCH ()-[r:LINKED]->()
            WHERE id(r)={rId}
            SET r += {domain: r.domain + {domain}}
            RETURN r`,
          params: {
            rId: link._id,
            domain: domain
          }
        }, error => {
          if (error) {
            console.log('Domain checking error:', error);
          }
          resolve(domains.length * 80);
        });
      }
    }
  }

  // Initialize the database.
  init();

  // Methods to be available outside of this object.
  return {
    processRating
  };
};

module.exports = ReliabilityEngine;
