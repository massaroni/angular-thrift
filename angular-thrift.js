(function (window, angular, Thrift,  undefined) {
  'use strict';

  angular.module('ngThrift', [])
    .service('ThriftService', ['$http', '$q', function ($http, $q) {
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
          var args = Array.prototype.slice.call(arguments, 3, arguments.length);

          var deferred = $q.defer;

          var postData = thriftSend.apply(client, args);
          var post = $http.post(url, postData);
          if (post != null) {
            post.success(function (data) {
              //transform the raw response data using thrift generated code
              try {
                client.output.transport.setRecvBuffer(data);
                var response = thriftRecv.call(client);
              } catch (ex) {
                throw 'Failed deserializing the thrift response: ' + ex;
              }
              deferred.resolve(response);
            }).
              error(function (data, status) {
                var msg = 'Thrift service call failed for Url = ' + url + '. Status = ' + status;
                deferred.reject(new Error(msg));
              });
          }

          return deferred.promise;
        };

        return thriftClient;
      };

      return thriftService;
    }]);

})(window, window.angular, window.Thrift);
