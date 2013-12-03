'use strict';

angular.module('ngThrift', [])
  .service('ThriftService', ['$http', '$q', '$log', 'AuthenticationService', function ($http, $q, $log, AuthenticationService) {
    var thriftService = {};

    thriftService.newClient = function (className, url) {
      var thriftClient = {};

      var transport = new Thrift.Transport('');
      var protocol = new Thrift.Protocol(transport);
      var client = new window[className](protocol);

      thriftClient.makeThriftRequest = function (thriftMethodName) {
        var thriftSend = client['send_' + thriftMethodName];
        var thriftRecv = client['recv_' + thriftMethodName];

        // converts arguments to real array
        var args = Array.prototype.slice.call(arguments, 1, arguments.length);

        var deferred = $q.defer();

        var onPostError = function (data, status) {
          var msg = 'Thrift service call failed for Url = ' + url + '. Status = ' + status;
          deferred.reject(new Error(msg));
        };

        // second try post, when authentication fails the first time.
        var onReauthSuccess = function () {
          AuthenticationService.updateSecurityCredentials(args);
          var postData = thriftSend.apply(client, args);
          var post = $http.post(url, postData);
          post.success(function (data) {
            var response;

            try {
              client.output.transport.setRecvBuffer(data);
              response = thriftRecv.call(client);
            } catch (ex) {
              $log.error('Failed on second try: ' + className + '.' + thriftMethodName);
              $log.error(ex);
              deferred.reject(ex);
              return;
            }

            deferred.resolve(response);
          }).error(onPostError);
        };

        var onReauthFail = function () {
          AuthenticationService.onCannotAuthenticate();
        };

        var postData = thriftSend.apply(client, args);
        //var post = $http.post(url, postData);
        var post = $http({method: 'POST', url: url, postData : postData, transformResponse : []});

        if (post == null) {
          throw "Can't get a new http post.";
        }

        post.success(function (data) {
          if (data === null || data === undefined) {
            throw "Undefined thrift response json object.";
          }

          if (typeof data !== 'string') {
            throw "Expected json string, but was '" + typeof data + "' = " + data;
          }

          //transform the raw response data using thrift generated code
          try {
            client.output.transport.setRecvBuffer(data);
            var response = thriftRecv.call(client);
          } catch (ex) {
            if (AuthenticationService.isSecurityException(ex)) {
              $log.info('SecurityException calling ' + className + '.' + thriftMethodName + '()\n' + ex);
              AuthenticationService.reAuthenticate(onReauthSuccess, onReauthFail);
              return;
            }

            throw ex;
          }
          deferred.resolve(response);
        }).error(onPostError);

        return deferred.promise;
      };

      return thriftClient;
    };

    return thriftService;
  }]);
