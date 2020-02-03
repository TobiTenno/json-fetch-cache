# json-fetch-cache

A simple package for fetching JSON from a URL and caching it for a decided amount of time.

## [Documentation](http://matej.voboril.org/json-fetch-cache)

[![Build Status](https://travis-ci.com/TobiTenno/json-fetch-cache.svg?branch=master)](https://travis-ci.com/TobiTenno/json-fetch-cache)
[![npm version](https://badge.fury.io/js/json-fetch-cache.svg)](https://badge.fury.io/js/json-fetch-cache)

## Installation
```bash
$ npm i -S json-fetch-cache
```

## Usage
```js
const Cache = require('json-fetch-cache');

const pcCache = new Cache('http://content.warframe.com/dynamic/worldState.php', 10000);

pcCache.getData()
  .then((data) => {
    console.log(data);
    process.exit(0);
  })
  .catch((error)=>{
    console.error(error);
  });
```
