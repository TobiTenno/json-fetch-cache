'use strict';
const request = require('request-promise');

/**
 * Represents a JSON Cache
 */
class JSONCache {
  
  /**
   * Represents a JSONCache
   * @constructor
   * @param {string} _url URL for the location of the remote json
   * @param {number} maximumCacheTime The maximum amount of time that the cache should be allowed to be stale
   */
  constructor(url, maximumCacheTime) {
    
    /**
     * URL for the cache to fetch from
     * @type {string}
     * @private 
     */
    this._url              = url;
    
    /**
     * Maximum amount of time to cache data
     * @type {number}
     * @private 
     */
    this._maximumCacheTime = maximumCacheTime || 3000;
    
    /**
     * The data cache, a JSON formatted object
     * @type {json}
     * @private 
     */
    this._cache            = null;
    
    /**
     * Date corresponding to the last time the cache was refreshed
     * @type {Date}
     * @private 
     */
    this._lastRefresh      = null;
    
    /**
     * Whether or not the cache is currently refreshing, 
     *  determines whether or not the cache will be returned or delayed until refreshed
     * @type {boolean}
     * @private 
     */
    this._refreshing       = false;
    
    /**
     * An array of refresh functions to be performed
     * @type {Array<function>}
     * @private 
     */
    this._refreshQueue     = [];
  }
  
  /**
   * Whether or not the data has expired past the maximumCacheTime
   * @readonly
   * @type {boolean}
   * @private
   */
  get dataIsCurrent(){
    return this._cache && ((Date.now() - this._cache.creation) < this._maximumCacheTime);
  }
  
  /**
   * Refresh the cached data
   * @param {function} Function to push onto the refresh queue if there is currently a refresh in progress
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
   * @returns {Promise<json>}
   * @private
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

  /**
   * Process the next entry in the event queue
   * @returns {Promise<json>}
   * @private
   */
  processRefreshQueue (data) {
    return new Promise((resolve, reject) => {
      while (this._refreshQueue.length) {
        this._refreshQueue.shift()()
          .then((data) => resolve(data))
          .catch(console.error);
      }
    });
  }
  
  /**
   * Get the cached data
   * @returns {Promise<json>}
   */ 
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
