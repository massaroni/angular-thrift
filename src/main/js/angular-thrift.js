'use strict';

angular.module('ngThrift', ['auth', 'ngThrift.http'])
  .service('ThriftService', ['$http', '$q', '$log', 'AuthenticationService', 'HttpErrorHandlerService', function ($http, $q, $log, AuthenticationService, HttpErrorHandlerService) {
    if (!AuthenticationService) {
      throw 'Undefined AuthenticationService.';
    }

    var httpConfig = {transformResponse: [], transformRequest: [], timeout: 30000};

    var thriftService = {};

    var isConnectionError = function (httpStatus) {
      if (httpStatus === null || httpStatus === undefined) {
        return false;
      }

      if (typeof httpStatus === 'number') {
        return httpStatus < 200 || httpStatus > 301;
      }

      return false;
    };

    thriftService.newClient = function (className, url, httpErrorHandlerServiceOverride) {
      var thriftClient = {};

      var transport = new Thrift.Transport('');
      var protocol = new Thrift.Protocol(transport);
      var client = new window[className](protocol);

      var httpErrorHandler = !httpErrorHandlerServiceOverride ? HttpErrorHandlerService : httpErrorHandlerServiceOverride;

      thriftClient.makeThriftRequest = function (thriftMethodName) {
        var thriftSend = client['send_' + thriftMethodName];
        var thriftRecv = client['recv_' + thriftMethodName];

        // converts arguments to real array
        var args = Array.prototype.slice.call(arguments, 1, arguments.length);

        var deferred = $q.defer();

        var postResultHandlers = {onSuccess: null, onError: null};

        var run = function () {
          var postData = thriftSend.apply(client, args);
          httpConfig.tracker = thriftMethodName;
          var post = $http.post(url, postData, httpConfig);

          if (!post) {
            throw 'Can\'t get a new http post.';
          }

          post.success(postResultHandlers.onSuccess).error(postResultHandlers.onError);
        };

        var onPostError = function (data, status) {
          $log.debug('Thrift rpc error.');
          $log.debug(status);
          $log.debug(data);

          var reject = function (reason) {
            var error = new Error('Thrift service call failed for Url = ' + url + '. Status = ' + status + ' data = ' + data);
            var rejectionInfo = {data: data, status: status, error: error, reason: reason};
            deferred.reject(rejectionInfo);
          };

          if (AuthenticationService.isSecurityException(data)) {
            $log.info('SecurityException calling ' + className + '.' + thriftMethodName + '()\n' + data);
            AuthenticationService.reAuthenticate(function () {
              AuthenticationService.updateSecurityCredentials(args);
              run();
            }, function (reason) {
              AuthenticationService.onCannotAuthenticate();
              reject(reason);
            });
          } else if (isConnectionError(status)) {
            if (!httpErrorHandler) {
              reject();
            } else {
              // delegate control to the injected error handler
              httpErrorHandler.onConnectionError(status, function () {
                run();
              }, reject);
            }
          } else {
            reject();
          }
        };

        var onPostSuccess = function (data) {
          if (data === null || data === undefined) {
            throw 'Undefined thrift response json object.';
          }

          if (typeof data !== 'string') {
            throw 'Expected json string, but was "' + typeof data + '" = ' + data;
          }

          try {
            //transform the raw response data using thrift generated code
            client.output.transport.setRecvBuffer(data);
            var response = thriftRecv.call(client);
            deferred.resolve(response);
          } catch (ex) {
            onPostError(ex, {replyData : data});
          }
        };

        postResultHandlers.onError = onPostError;
        postResultHandlers.onSuccess = onPostSuccess;

        run();

        return deferred.promise;
      };

      return thriftClient;
    };

    return thriftService;
  }]);
