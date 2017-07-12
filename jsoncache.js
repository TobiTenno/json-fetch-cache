'use strict';

const http = require('http');
const https = require('https');

const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '').split(',').map(code => parseInt(code.trim(), 10)));

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

class JSONCache {
  constructor(url, timeout, promiseLib = Promise, maxRetry = 30) {
    this.url = url;
    this.protocol = this.url.startsWith('https') ? https : http;

    this.timeout = timeout;
    this.maxRetry = maxRetry;
    this.retryCount = 0;
    this.currentData = null;
    this.lastUpdated = null;
    this.updating = null;
    this.Promise = promiseLib;

    this.updateInterval = setInterval(() => this.update(), this.timeout);
    this.update();
  }

  getData() {
    if (this.updating) {
      return this.updating;
    }
    return this.Promise.resolve(this.currentData);
  }

  getDataJson() {
    return this.getData().then((data) => {
      try {
        if (isJson(data)) {
          return JSON.parse(data);
        }
        return {};
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return {};
      }
    });
  }

  update() {
    this.updating = this.httpGet()
      .then((data) => {
        this.lastUpdated = Date.now();
        this.currentData = data;
        this.updating = null;
        return this.currentData;
      })
      .catch((err) => {
        this.updating = null;
        throw err;
      });
  }

  httpGet() {
    return new this.Promise((resolve) => {
      const request = this.protocol.get(this.url, (response) => {
        const body = [];

        if (response.statusCode < 200 || response.statusCode > 299) {
          if ((response.statusCode > 499 || retryCodes.indexOf(response.statusCode) > -1)
            && this.retryCount < 30) {
            this.retryCount += 1;
            // eslint-disable-next-line no-console
            setTimeout(() => this.httpGet().then(resolve).catch(console.error), 1000);
          } else {
            // eslint-disable-next-line no-console
            console.error(`${response.statusCode}: Failed to load ${this.url}`);
            resolve('[]');
          }
        } else {
          response.on('data', chunk => body.push(chunk));
          response.on('end', () => {
            this.retryCount = 0;
            resolve(body.join(''));
          });
        }
      });
      request.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error(`${err.statusCode}: ${this.url}`);
        resolve('[]');
      });
    });
  }
}
module.exports = JSONCache;
