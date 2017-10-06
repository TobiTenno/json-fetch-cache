# json-fetch-cache

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d58ad0ff883b423aa8d6014931362032)](https://www.codacy.com/app/aliasfalse/json-fetch-cache?utm_source=github.com&utm_medium=referral&utm_content=aliasfalse/json-fetch-cache&utm_campaign=badger)

A simple package for fetching JSON from a URL and caching it for a decided amount of time.

## [Documentation](https://aliasfalse.github.io/json-fetch-cache)

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d58ad0ff883b423aa8d6014931362032)](https://www.codacy.com/app/aliasfalse/json-fetch-cache?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=aliasfalse/json-fetch-cache&amp;utm_campaign=Badge_Grade)

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
