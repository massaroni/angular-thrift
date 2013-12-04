'use strict';

describe('Service: angular-thrift ThriftService', function () {

  // instantiate service
  var updateSecurityCredentialsSpy;
  var onCannotAuthenticateSpy;
  var isSecurityExceptionSpy;
  var reAuthenticateSpy;

  var thriftService, $httpBackend;

  angular.module('auth', []);

  var serializeThriftRpcResult = function (rpcName, responseObject, thriftMessageType) {
    var transport = new Thrift.Transport('');
    var protocol = new Thrift.Protocol(transport);
    protocol.writeMessageBegin(rpcName, thriftMessageType, 1);
    responseObject.write(protocol);
    protocol.writeMessageEnd();
    return transport.getSendBuffer();
  };

  var serializeThriftResponse = function (rpcName, responseObject) {
    return serializeThriftRpcResult(rpcName, responseObject, Thrift.MessageType.REPLY);
  };

  var serializeThriftRpcException = function (rpcName, responseObject) {
    return serializeThriftRpcResult(rpcName, responseObject, Thrift.MessageType.REPLY);
  };

  var stageRpcResult = function (responseMessage) {
    var response = new ExampleServiceResponse();
    response.responseMessage = responseMessage;

    var rpcRetval = new ExampleService_exampleServiceCall_result();
    rpcRetval.success = response;

    var rpcRetvalJson = serializeThriftResponse('exampleServiceCall', rpcRetval);
    expect(typeof rpcRetvalJson).toBe('string');

    $httpBackend.resetExpectations();
    $httpBackend.expect('POST', 'thrift/test/url').respond(rpcRetvalJson);
  };

  beforeEach(module('ngThrift', function ($provide) {
    var mockAuthenticationService = {
      updateSecurityCredentials: function (argsArray) {
      },
      onCannotAuthenticate: function () {
      },
      isSecurityException: function (ex) {
        return ex instanceof SecurityException;
      },
      reAuthenticate: function (onSuccess, onFail) {
        stageRpcResult("reauthenticated result message");
        onSuccess();
      }
    };

    updateSecurityCredentialsSpy = spyOn(mockAuthenticationService, 'updateSecurityCredentials').andCallThrough();
    onCannotAuthenticateSpy = spyOn(mockAuthenticationService, 'onCannotAuthenticate').andCallThrough();
    isSecurityExceptionSpy = spyOn(mockAuthenticationService, 'isSecurityException').andCallThrough();
    reAuthenticateSpy = spyOn(mockAuthenticationService, 'reAuthenticate').andCallThrough();

    var mockAuthenticationServiceCtor = function () {
      return mockAuthenticationService;
    };

    $provide.service('AuthenticationService', mockAuthenticationServiceCtor);
  }));

  beforeEach(inject(function (ThriftService, _$httpBackend_) {
    thriftService = ThriftService;
    $httpBackend = _$httpBackend_;
  }));

  var serializeThriftRpcResult = function (rpcName, responseObject, thriftMessageType) {
    var transport = new Thrift.Transport('');
    var protocol = new Thrift.Protocol(transport);
    protocol.writeMessageBegin(rpcName, thriftMessageType, 1);
    responseObject.write(protocol);
    protocol.writeMessageEnd();
    return transport.getSendBuffer();
  };

  var serializeThriftResponse = function (rpcName, responseObject) {
    return serializeThriftRpcResult(rpcName, responseObject, Thrift.MessageType.REPLY);
  };

  var serializeThriftRpcException = function (rpcName, responseObject) {
    return serializeThriftRpcResult(rpcName, responseObject, Thrift.MessageType.REPLY);
  };

  var stageRpcResult = function (responseMessage) {
    var response = new ExampleServiceResponse();
    response.responseMessage = responseMessage;

    var rpcRetval = new ExampleService_exampleServiceCall_result();
    rpcRetval.success = response;

    var rpcRetvalJson = serializeThriftResponse('exampleServiceCall', rpcRetval);
    expect(typeof rpcRetvalJson).toBe('string');

    $httpBackend.resetExpectations();
    $httpBackend.expect('POST', 'thrift/test/url').respond(rpcRetvalJson);
  };  

  it('should be available in the app context', function () {
    expect(!!thriftService).toBe(true);
  });

  it('should not reauthenticate without a security exception', function () {
    stageRpcResult('test response message');

    var client = thriftService.newClient('ExampleServiceClient', 'thrift/test/url');

    var actualPromise = client.makeThriftRequest('exampleServiceCall');

    actualPromise.then(function (resolved) {
      expect(resolved instanceof ExampleServiceResponse).toBe(true);
      expect(resolved.responseMessage).toBe('test response message');
    }, function () {
      expect("should not").toBe("get here");
    });

    $httpBackend.flush();
    expect(reAuthenticateSpy).not.toHaveBeenCalled();
  });

  it('should try to reauthenticate, when it gets a security exception', function () {
    var exception = new SecurityException();
    exception.message = "test exception message";

    var rpcRetval = new ExampleService_exampleServiceCall_result();
    rpcRetval.se = exception;

    var rpcRetvalJson = serializeThriftRpcException('exampleServiceCall', rpcRetval);
    expect(typeof rpcRetvalJson).toBe('string');

    $httpBackend.resetExpectations();
    $httpBackend.expect('POST', 'thrift/test/url').respond(rpcRetvalJson);

    var client = thriftService.newClient('ExampleServiceClient', 'thrift/test/url');

    var actualPromise = client.makeThriftRequest('exampleServiceCall');

    actualPromise.then(function (value) {
      expect(value instanceof ExampleServiceResponse).toBe(true);
      expect(value.responseMessage).toBe('reauthenticated result message');
    }, function (errorReason) {
      expect("should not").toBe("get here");
    });

    $httpBackend.flush();

    expect(reAuthenticateSpy).toHaveBeenCalled();
    expect(isSecurityExceptionSpy).toHaveBeenCalled();
    expect(updateSecurityCredentialsSpy).toHaveBeenCalled();
    expect(onCannotAuthenticateSpy).not.toHaveBeenCalled();
  });

});
