# json-fetch-cache

A simple package for fetching JSON from a URL and caching it for a decided amount of time.

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