'use strict';

const chai = require('chai');
const decache = require('decache');

let Fetcher = require('../jsoncache');

const should = chai.should();

const testJsonUrl = 'https://api.myjson.com/bins/bn2qa';

describe('JSON Fetch Cache', () => {
  let cache;
  beforeEach(() => {
    // eslint-disable-next-line global-require
    Fetcher = require('../jsoncache');
    cache = new Fetcher(testJsonUrl);
  });

  afterEach(() => {
    cache.stop();
    cache = undefined;
    decache(Fetcher);
  });

  describe('cache', () => {
    it('should fetch', async () => {
      const result = await cache.getDataJson();
      should.exist(result);
      result.key.should.equal('value');
      cache.stop();
    });
  });
});
