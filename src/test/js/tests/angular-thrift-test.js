'use strict';

describe('Service: angular-thrift ThriftService', function () {

  // instantiate service
  var updateSecurityCredentialsSpy;
  var onCannotAuthenticateSpy;
  var isSecurityExceptionSpy;
  var reAuthenticateSpy;
  var onConnectionErrorSpy;

  var thriftService, $httpBackend;

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

  var mockOutHttpErrorHandlerService = function ($provide) {
    var mockHttpErrorHandlerService = {
      onConnectionError: function (status, retryHandler, noRetryHandler) {
      }
    };

    onConnectionErrorSpy = spyOn(mockHttpErrorHandlerService, 'onConnectionError');

    var mockHttpErrorHandlerServiceCtor = function () {
      return mockHttpErrorHandlerService;
    };

    $provide.service('HttpErrorHandlerService', mockHttpErrorHandlerServiceCtor);
  };

  // mocking out "interface" module dependencies
  angular.module('auth', []);
  angular.module('ngThrift.http', []);

  beforeEach(module('ngThrift', function ($provide) {
    mockOutHttpErrorHandlerService($provide);

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

  var connectionErrorTest = function(httpStatus) {
    var callCount = 0;
    var actualStatus = null;

    onConnectionErrorSpy.andCallFake(function(status, retryCallback, noRetryCallback) {
      actualStatus = status;
      callCount++;
    });

    $httpBackend.resetExpectations();
    $httpBackend.expect('POST', 'thrift/test/url').respond(httpStatus, '');

    var client = thriftService.newClient('ExampleServiceClient', 'thrift/test/url');

    var actualPromise = client.makeThriftRequest('exampleServiceCall');

    actualPromise.then(function (value) {
      expect(value instanceof ExampleServiceResponse).toBe(true);
      expect(value.responseMessage).toBe('reauthenticated result message');
    }, function (errorReason) {
      expect("should not").toBe("get here");
    });

    $httpBackend.flush();

    expect(callCount).toBe(1);
    expect(actualStatus).toBe(httpStatus);
    expect(onConnectionErrorSpy).toHaveBeenCalled();
    expect(reAuthenticateSpy).not.toHaveBeenCalled();
    expect(isSecurityExceptionSpy).toHaveBeenCalled();
    expect(updateSecurityCredentialsSpy).not.toHaveBeenCalled();
    expect(onCannotAuthenticateSpy).not.toHaveBeenCalled();
  };

  it('should pass control to HttpErrorHanlderService, for a connection error http 500.', function () {
    connectionErrorTest(500);
  });

  it('should pass control to HttpErrorHanlderService, for a connection error http 599.', function () {
    connectionErrorTest(599);
  });

});
