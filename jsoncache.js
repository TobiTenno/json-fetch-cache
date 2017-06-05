'use strict';

const http = require('http');
const https = require('https');

const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '').split(',').map(code => parseInt(code.trim(), 10)));

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
    return this.getData().then(data => JSON.parse(data));
  }

  update() {
    this.updating = this.httpGet().then((data) => {
      this.lastUpdated = Date.now();
      this.currentData = data;
      this.updating = null;
      return this.currentData;
    }).catch((err) => {
      this.updating = null;
      throw err;
    });
  }

  httpGet() {
    return new this.Promise((resolve, reject) => {
      const request = this.protocol.get(this.url, (response) => {
        const body = [];

        if (response.statusCode < 200 || response.statusCode > 299) {
          if ((response.statusCode > 499 || retryCodes.indexOf(response.statusCode) > -1)
            && this.retryCount < 30) {
            this.retryCount += 1;
            setTimeout(() => this.httpGet().then(resolve), 1000);
          } else {
            reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
          }
        } else {
          response.on('data', chunk => body.push(chunk));
          response.on('end', () => {
            this.retryCount = 0;
            resolve(body.join(''));
          });
        }
      });
      request.on('error', err => reject(`Error code: ${err.statusCode} on request on ${this.url}`));
    });
  }
}
module.exports = JSONCache;
