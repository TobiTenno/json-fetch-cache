'use strict';
var request = require('request');

class JSONCache {
  constructor(url, maximumCacheTime) {
    this.url = url;
    this.maximumCacheTime = maximumCacheTime;
    this.cache = null;
    this.lastRefresh = null;
    this.refreshing = false;
    this.refreshQueue = [];
  }
  dataIsCurrent() {
    return this.cache && Date.now() - this.cache.creation < this.maximumCacheTime
  }
  
  getData(callback) {
    if (this.dataIsCurrent()) {
      callback(null, this.cache);
    }
    else {
      this.refresh(callback);
    }
  }
  refresh(callback) {
    var self = this;
    this.refreshQueue.push(callback);
    if (!this.refreshing) {
      this.refreshing = true;
      this.retrieve(function (err, data) {
        if (!err) {
          self.cache = data;
          self.lastRefresh = Date.now();
        }
        self.refreshing = false;
        self.processRefreshQueue(err, data);
      });
    }
  }
  retrieve(callback) {
    var self = this;
    request.get(this.url, function (err, response, body) {
      if (err) {
        return callback(err);
      }
      if (response.statusCode !== 200) {
        var error
        error = new Error(`${this.url} returned HTTP status ${response.statusCode}`)
        return callback(error);
      }
      var data
      try {
        data = JSON.parse(body);
      }
      catch (e) {
        data = null;
      }
      if (!data) {
        var error
        error = new Error(`Invalid JSON from ${this.url}`);
        return callback(error);
      }
      callback(null, new WorldState(data, self.platform));
    });
  }
  processRefreshQueue (err, data) {
    while (this.refreshQueue.length) {
      this.refreshQueue.shift()(err, data);
    }
  }
}
module.exports = JSONCache;