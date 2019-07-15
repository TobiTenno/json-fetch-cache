'use strict';

const EventEmitter = require('events');

const http = require('http');
const https = require('https');

const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '')
  .split(',').map(code => parseInt(code.trim(), 10)));

class JSONCache extends EventEmitter {
  constructor(url, timeout, {
    parser = JSON.parse, promiseLib = Promise, logger, delayStart = true,
    opts, maxListeners = 45, useEmitter = true, maxRetry = 30,
  }) {
    super();
    this.url = url;
    this.protocol = this.url.startsWith('https') ? https : http;

    this.maxRetry = maxRetry;
    this.timeout = timeout;
    this.currentData = null;
    this.updating = null;
    this.Promise = promiseLib;
    this.parser = parser;
    this.hash = null;
    this.logger = logger;
    this.delayStart = delayStart;
    this.opts = opts;
    this.useEmitter = useEmitter;
    if (useEmitter) {
      this.setMaxListeners(maxListeners);
    }
    if (!delayStart) {
      this.startUpdating();
    }
  }

  getData() {
    if (this.delayStart) {
      this.startUpdating();
    }
    if (this.updating) {
      return this.updating;
    }
    return this.Promise.resolve(this.currentData);
  }

  getDataJson() {
    return this.getData();
  }

  update() {
    this.updating = this.httpGet().then(async (data) => {
      this.currentData = this.parser(data, this.opts);
      if (this.useEmitter) {
        setTimeout(async () => this.emit('update', await this.currentData), 2000);
      }

      this.updating = null;
      return this.currentData;
    }).catch((err) => {
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

  stop() {
    clearInterval(this.updateInterval);
  }

  stopUpdating() {
    this.stop();
  }
}
module.exports = JSONCache;
