'use strict';

const http = require('http');
const https = require('https');

class JSONCache {
  constructor(url, timeout) {
    this.url = url;
    this.protocol = this.url.startsWith('https') ? https : http;

    this.timeout = timeout;
    this.currentData = null;
    this.lastUpdated = null;
    this.updating = null;

    this.updateInterval = setInterval(() => this.update(), this.timeout);
    this.update();
  }

  getData() {
    if (this.updating) {
      return this.updating;
    }
    return Promise.resolve(this.currentData);
  }

  getDataJson() {
     if (this.updating) {
       return this.updating.then(data => JSON.parse(data));
     }
     return Promise.resolve(JSON.parse(this.currentData));
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
    return new Promise((resolve, reject) => {
      const request = protocol.get(this.url, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error(`Failed to load page, status code: ${response.statusCode}`));
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
