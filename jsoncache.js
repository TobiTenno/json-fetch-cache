'use strict';

const http = require('http');
const https = require('https');

class JSONCache {
  constructor(url, timeout, promiseLib = Promise, maxRetry) {
    this.url = url;
    this.protocol = this.url.startsWith('https') ? https : http;

    this.timeout = timeout;
    this.retryCount = maxRetry || 30;
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
        if (response.statusCode < 200 || response.statusCode > 299) {
          if (response.statusCode > 499 && this.retryCount < 30) {
            this.retryCount++;
            setTimeout(() => this.httpGet().then(resolve), 1000);
          } else {
            reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
          }
        }
        const body = [];
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => resolve(body.join('')));
      });
      request.on('error', err => reject(err));
    });
  }
}
module.exports = JSONCache;
