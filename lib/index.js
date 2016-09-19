function _toArray(obj) {
  return Array.prototype.slice.call(obj, 0);
}

function cachePromiseFn(fn, options) {

  if (typeof fn !== 'function') {
    throw new TypeError('fn MUST be a function');
  }

  if (typeof options !== 'object') {
    throw new TypeError('options MUST be an object');
  }

  var cacheKey = options.cacheKey;

  if (typeof cacheKey !== 'function') {
    throw new TypeError('cacheKey MUST be a function');
  }

  /**
   * Array of calls to the fn
   * This array is where calls to the function are 
   * stored up to when their promises are resolved (or rejected).
   * 
   * @type {Array}
   */
  var fnCallStore = [];

  /**
   * Removes a call from the fnCallStore
   * 
   * @param  {String} callKey
   */
  function _removeCall(callKey) {
    var callIndex = fnCallStore.findIndex(function (call) {
      return call.key === callKey;
    });

    fnCallStore.splice(callIndex, 1);
  }

  /**
   * Stores the promise in the fnCallStore
   * 
   * @param {Array} callArgs
   */
  function _addCallPromise(callArgs, promise) {
    var callKey = cacheKey.apply(null, callArgs);

    promise
      .then(function (res) {
        _removeCall(callKey);

        return res;
      })
      .catch(function (err) {
        _removeCall(callKey);

        throw err;
      });

    fnCallStore.push({
      key: callKey,
      promise: promise
    });
  }

  /**
   * Retrieves the last call to the function with the same
   * callArgs
   * 
   * @param  {Array} callArgs Array of callArgs to be used to call the function
   * @return {Promise}
   */
  function _getCallPromise(callArgs) {
    var callKey = cacheKey.apply(null, callArgs);

    var call = fnCallStore.find(function (call) {
      return call.key === callKey;
    });

    if (call) {
      return call.promise;
    } else {
      return null;
    }
  }

  /**
   * The resulting merger function
   * 
   * @return {Promise}
   */
  var cachedFn = function () {
    var callArgs = _toArray(arguments);

    var promise = _getCallPromise(callArgs);

    if (!promise) {
      promise = fn.apply(null, callArgs);

      _addCallPromise(callArgs, promise);
    }

    return promise;
  };

  return cachedFn;
}

module.exports = cachePromiseFn;
