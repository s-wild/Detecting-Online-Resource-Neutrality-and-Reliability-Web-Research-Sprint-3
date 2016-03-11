/**
 * Calculate the reliability of a relationship extracted from text.
 * Attempts to check references of the same intent in cross-domain sources.
 */
'use strict';

const db = require('../lib/db');

const ReliabilityEngine = function() {
  /**
   * Calculate an average reliability rating over all relations in the text.
   * Based on the number of similiar relations made in different domains.
   * @param  {Array} relations  Array of relations from Alchemy API.
   * @return {Number}           Averaged reliability index.
   */
  function processRating(relations) {
    var total = 0;
    for (var i = 0; i < relations.length; i++) {
      try {
        total += processSubject(relations[i]);
      } catch (err) {
        total += 50;
        console.log(err);
      }
    }
    return total / relations.length;
  }

  /**
   * Calculate each relations reliability.
   * @param  {Object} r   Relation object.
   * @return {Number}     Reliability index.
   */
  function processSubject(r) {
    if (r.subject && r.action && r.object) {
      // First, find if we know this subject!
      db.cypher({
        query: 'MATCH (n:Subject {name: {subject}}) RETURN n',
        params: {
          subject: r.subject.text
        }
      }, (err, res) => {
        if (err) {
          throw err;
        }
        if (res.length < 1) {
          // Create a new subject with relation!
          addSubject(r);
        } else {
          console.log(res);
        }
      });
    }
    return 50;
  }

  /**
   * Add a new subject to the database.
   * @param {Object} r  Relation to create.
   */
  function addSubject(r) {
    console.log('adding new subject');
  }

  return {
    processRating
  };
};

module.exports = ReliabilityEngine;
