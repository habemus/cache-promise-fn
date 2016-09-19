const Bluebird = require('bluebird');
const should = require('should');

const cachePromiseFn = require('../../lib');

function wait(ms, rejectAtEnd) {
  return new Bluebird((resolve, reject) => {
    if (rejectAtEnd instanceof Error) {
      setTimeout(reject.bind(null, rejectAtEnd), ms);
    } else {
      setTimeout(resolve, ms);
    }
  });
}

describe('cachePromiseFn(fn, cacheKey)', function () {

  function doSomething(arg1, arg2) {
    return wait(500);
  }

  it('should cache calls to the function and merge their responses', function () {

    var cacheOptions = {
      cacheKey: function getCacheKey(arg1, arg2) {

        arg1.should.equal(1);
        arg2.should.equal(2);

        return arg1 + arg2;
      },
    }

    var cachedDoSomething = cachePromiseFn(doSomething, cacheOptions);

    var call1 = cachedDoSomething(1, 2);
    var call2 = cachedDoSomething(1, 2);
    var call3 = cachedDoSomething(1, 2);

    call1.should.equal(call2);
    call2.should.equal(call3);

  });

  it('should expire the cached result once the promise is resolved', function () {
    var cacheOptions = {
      cacheKey: function getCacheKey(arg1, arg2) {

        arg1.should.equal(1);
        arg2.should.equal(2);

        return arg1 + arg2;
      },
    }

    var cachedDoSomething = cachePromiseFn(doSomething, cacheOptions);
    
    var call1 = cachedDoSomething(1, 2);
    var call2 = cachedDoSomething(1, 2);
    var call3 = cachedDoSomething(1, 2);

    call1.should.equal(call2);
    call2.should.equal(call3);

    return call1.then(() => {

      // first batch of calls were resolved, thus caching should
      // have been cleared
      var call4 = cachedDoSomething(1, 2);

      call4.should.not.equal(call1);

    });

  });

});
