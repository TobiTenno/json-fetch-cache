'use strict';
const request = require('request-promise');

/**
 * Represents a JSON Cache
 */
class JSONCache {
  
  /**
   * @param {string} _url URL for the location of the remote json
   * @param {number} maximumCacheTime The maximum amount of time that the cache should be allowed to be stale
   */
  constructor(url, maximumCacheTime) {
    this._url              = url;
    this._maximumCacheTime = maximumCacheTime || 3000;
    this._cache            = null;
    this._lastRefresh      = null;
    this._refreshing       = false;
    this._refreshQueue     = [];
  }
  
  /**
   * Whether or not the data has expired past the maximumCacheTime
   * @readonly
   * @type {boolean}
   */
  get dataIsCurrent(){
    return this._cache && ((Date.now() - this._cache.creation) < this._maximumCacheTime);
  }
  
  /**
   * Refresh the cached data
   * @returns {Promise<string>} describing the status
   * @private 
   */
  refresh(funct) {
    const self = this;
    return new Promise((resolve, reject) => {
      self._refreshQueue.push(funct);
      if (!self._refreshing) {
        self._refreshing = true;
        self.retrieve()
          .then((data) => {
            self._cache = data;
            self._lastRefresh = Date.now();
            self._refreshing = false;
            self.processRefreshQueue(data);
            resolve(data);
          })
          .catch(console.error);
      }
    });
  }

  /**
   * Retrieve the most recent data from the specified url
   * 
   */
  retrieve() {
    return new Promise((resolve, reject) => {
      var self = this;
      request(self._url)
        .then(function (body) {
          var data;
          try {
            data = JSON.parse(body);
          }
          catch (e) {
            data = null;
            reject(e);
          }
          if (!data) {
            var error;
            error = new Error(`Invalid JSON from ${self._url}`);
            reject (error);
          }
          resolve(data);
        })
        .catch((error) => {
            console.error(error);
        }); 
    });
  }

  processRefreshQueue (data) {
    return new Promise((resolve, reject) => {
      while (this._refreshQueue.length) {
        this._refreshQueue.shift()()
          .then((data) => resolve(data))
          .catch(console.error);
      }
    });
  }
  
  getData() {
    const self = this;
    return new Promise((resolve, reject) => {
      if (self.dataIsCurrent !== null && self.dataIsCurrent) {
        console.log(self.dataIsCurrent);
        resolve(self._cache);
      } else {
        self.refresh()
          .then((data) => {
            resolve(data); 
            console.log(data)})
          .catch(console.err);
      }
    });
  }
}
module.exports = JSONCache;
