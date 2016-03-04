# WebRes Sprint 3
By: up637415, up656421, up663652

### Chrome Extension in extension/
This performs API requests against the Node.JS server

### Node.JS server in node/
Handles data requests against multiple API services and delivers results to extension.

#### Installation
Requires Node 4+.

Use `npm install` from inside the node directory to bring in dependencies.

#### Linting
Uses Google's eslint configuration. Run `npm lint` to check.

Requires [eslint](http://eslint.org/), with google and xo packages.
```
  npm install -g eslint
  npm install -g eslint-config-google
  npm install -g eslint-config-xo
```

#### Config and API keys
Requires a API keys to communicate with services:
* (Readability Parser API)[https://www.readability.com/developers/api/parser]

These keys should be placed in a `.env` file in the node folder.
An example is provides as `.env-sample`.
