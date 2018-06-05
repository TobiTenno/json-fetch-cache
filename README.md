# json-fetch-cache

A simple package for fetching JSON from a URL and caching it for a decided amount of time.

## [Documentation](https://tobitenno.github.io/json-fetch-cache)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d58ad0ff883b423aa8d6014931362032)](https://www.codacy.com/app/aliasfalse/json-fetch-cache?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=aliasfalse/json-fetch-cache&amp;utm_campaign=Badge_Grade) [![Greenkeeper badge](https://badges.greenkeeper.io/TobiTenno/json-fetch-cache.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Build Status](https://travis-ci.com/TobiTenno/json-fetch-cache.svg?branch=master)](https://travis-ci.com/TobiTenno/json-fetch-cache)

## Installation
```bash
$ npm i -S json-fetch-cache
```

## Usage
```js
var Cache = require("json-fetch-cache");

const pcCache = new Cache('http://content.warframe.com/dynamic/worldState.php', 10000);

pcCache.getData().then((data) => {
    console.log(data);
    process.exit(0);
})
.catch((error)=>{
    console.error(error);
})
```
