'use strict';

describe('Service: angular-thrift ThriftService', function () {

  // instantiate service
  var updateSecurityCredentialsSpy;
  var onCannotAuthenticateSpy;
  var isSecurityExceptionSpy;
  var reAuthenticateSpy;

  var thriftService, $httpBackend;

  var serializeThriftResponse = function (rpcName, responseObject) {
    var transport = new Thrift.Transport('');
    var protocol = new Thrift.Protocol(transport);
    protocol.writeMessageBegin(rpcName, Thrift.MessageType.REPLY, 1);
    responseObject.write(protocol);
    protocol.writeMessageEnd();
    return transport.getSendBuffer();
  };

  beforeEach(module('ngThrift', function ($provide) {
    var mockAuthenticationService = {
      updateSecurityCredentials: function (argsArray) {},
      onCannotAuthenticate: function () {},
      isSecurityException: function (ex) { return ex instanceof SecurityException; },
      reAuthenticate: function (onSuccess, onFail) {
        onSuccess();
      }
    };

    updateSecurityCredentialsSpy = spyOn(mockAuthenticationService, 'updateSecurityCredentials');
    onCannotAuthenticateSpy = spyOn(mockAuthenticationService, 'onCannotAuthenticate');
    isSecurityExceptionSpy = spyOn(mockAuthenticationService, 'isSecurityException');
    reAuthenticateSpy = spyOn(mockAuthenticationService, 'reAuthenticate');

    var mockAuthenticationServiceCtor = function () {
      return mockAuthenticationService;
    };

    $provide.service('AuthenticationService', mockAuthenticationServiceCtor);
  }));

  beforeEach(inject(function (ThriftService, _$httpBackend_) {
    thriftService = ThriftService;
    $httpBackend = _$httpBackend_;
  }));

  it('should be available in the app context', function () {
    expect(!!thriftService).toBe(true);
  });

  it('should not reauthenticate without a security exception', function () {
    var response = new ExampleServiceResponse();
    response.responseMessage = "test response message";

    var rpcRetval = new ExampleService_exampleServiceCall_result();
    rpcRetval.success = response;

    var rpcRetvalJson = serializeThriftResponse('exampleServiceCall', rpcRetval);
    expect(typeof rpcRetvalJson).toBe('string');

    console.log(rpcRetvalJson);
    $httpBackend.when('POST', 'thrift/test/url').respond(rpcRetvalJson);

    var client = thriftService.newClient('ExampleServiceClient', 'thrift/test/url');

    var actualPromise = client.makeThriftRequest('exampleServiceCall');

    actualPromise.then(function() {
      expect(reAuthenticateSpy).not.toHaveBeenCalled();
    }, function() {
      expect("should not").toBe("get here");
    });

    $httpBackend.flush();
  });

});
