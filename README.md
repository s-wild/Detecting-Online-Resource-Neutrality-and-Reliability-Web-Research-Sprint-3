# WebRes Sprint 3
By: up637415, up656421, up663652

## Chrome Extension in extension/
This performs API requests against the Node.JS server


## Node.JS server in node/
Handles data requests against multiple API services and delivers results to extension.

#### Installation
Requires [Node v4+](https://nodejs.org/en/) and [Neo4J](http://neo4j.com/).

Use `npm install` from inside the node directory to bring in dependencies.

Copy the `.env-sample` file to a file named `.env` in the same directory, and add your own API keys and configuration.

#### Run

Start up Neo4j with `neo4j start`

`npm start` will launch the server, listening on port 3000 by default.

#### Linting
Uses Google's eslint configuration. Run `npm lint` to check.

Requires [eslint](http://eslint.org/), with google and xo packages.
```
  npm install -g eslint
  npm install -g eslint-config-google
  npm install -g eslint-config-xo
```

#### API keys
Required API keys to communicate with services:
* [Readability Parser API](https://www.readability.com/developers/api/parser)
* [AlchemyAPI](http://www.alchemyapi.com/api/register.html)
