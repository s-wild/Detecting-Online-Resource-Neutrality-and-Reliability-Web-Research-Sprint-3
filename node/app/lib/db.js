const neo4j = require('neo4j');
const db = new neo4j.GraphDatabase({
  url: process.env.NEO4J_URL,
  auth: {
    username: process.env.NEO4J_USER,
    password: process.env.NEO4J_PASS
  }
});

module.exports = db;
