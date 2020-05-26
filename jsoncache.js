'use strict';

const EventEmitter = require('events');

const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '')
  .split(',').map(code => parseInt(code.trim(), 10)));

const defaultOpts = {
  parser: JSON.parse,
  promiseLib: Promise,
  logger: console,
  delayStart: false,
  opts: {},
  maxListeners: 10,
  useEmitter: false,
  maxRetry: 1,
  integrity: () => true,
};

class JSONCache extends EventEmitter {
  /**
   * Make a new cache
   * @param {string}    url                  url to fetch
   * @param {number}    [timeout=60000]      optional timeout
   * @param {Object}    options              Options object
   * @param {function}  options.parser       optional parser to parse data. defaults to JSON.parse
   * @param {Class}     options.promiseLib   optional promise library override
   * @param {Object}    options.logger       optional Logger
   * @param {boolean}   options.delayStart   whether or not to delay starting updating the cache
   *                                            until start is requested
   * @param {Object}    options.opts         options to pass to the parser
   * @param {number}    options.maxListeners maximum listeners
   *                                            (only applicable if leveraging emitter)
   * @param {boolean}   options.useEmitter   whether or not to use the optional node emitter
   * @param {number}    options.maxRetry     maximum number of attempts to retry getting data
   * @param {function}  options.integrity    optional function to check if the data is worth keeping
   */
  constructor(url, timeout, options) {
    super();

    // eslint-disable-next-line no-param-reassign
    options = {
      ...defaultOpts,
      ...options,
    };

    const {
      parser, promiseLib, logger, delayStart, opts, maxListeners, useEmitter, maxRetry, integrity,
    } = options;

    this.url = url;
    // eslint-disable-next-line global-require
    this.protocol = this.url.startsWith('https') ? require('https') : require('http');

    this.maxRetry = maxRetry;
    this.timeout = timeout || 60000;
    this.currentData = null;
    this.updating = null;
    this.Promise = promiseLib;
    this.parser = parser;
    this.hash = null;
    this.logger = logger;
    this.delayStart = delayStart;
    this.opts = opts;
    this.useEmitter = useEmitter;
    this.integrity = integrity;

    if (useEmitter) {
      this.setMaxListeners(maxListeners);
    }
    if (!delayStart) {
      this.startUpdating();
    }
  }

  getData() {
    if (this.delayStart && !this.currentData && !this.updating) {
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
      const parsed = this.parser(data, this.opts);
      if (!this.integrity(parsed)) return this.currentData;

      // data passed integrity check
      this.currentData = parsed;
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
        this.logger.debug(`beginning request to ${this.url}`);
        const body = [];

        if (response.statusCode < 200 || response.statusCode > 299) {
          if ((response.statusCode > 499 || retryCodes.includes(response.statusCode))
            && this.retryCount < this.maxRetry) {
            this.retryCount += 1;
            setTimeout(() => this.httpGet().then(resolve).catch(this.logger.error), 1000);
          } else {
            this.logger.error(`${response.statusCode}: Failed to load ${this.url}`);
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
        this.logger.error(`${err.statusCode}: ${this.url}`);
        resolve('[]');
      });
    });
  }

  startUpdating() {
    this.updateInterval = setInterval(() => this.update(), this.timeout);
    this.update();
  }

  stop() {
    clearInterval(this.updateInterval);
  }

  stopUpdating() {
    this.stop();
  }
}
module.exports = JSONCache;
