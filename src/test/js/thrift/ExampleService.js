//
// Autogenerated by Thrift Compiler (0.9.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//


//HELPER FUNCTIONS AND STRUCTURES

ExampleService_exampleServiceCall_args = function(args) {
  this.credentials = null;
  this.request = null;
  if (args) {
    if (args.credentials !== undefined) {
      this.credentials = args.credentials;
    }
    if (args.request !== undefined) {
      this.request = args.request;
    }
  }
};
ExampleService_exampleServiceCall_args.prototype = {};
ExampleService_exampleServiceCall_args.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.credentials = new ExampleAuthCredentials();
        this.credentials.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 2:
      if (ftype == Thrift.Type.STRUCT) {
        this.request = new ExampleServiceRequest();
        this.request.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ExampleService_exampleServiceCall_args.prototype.write = function(output) {
  output.writeStructBegin('ExampleService_exampleServiceCall_args');
  if (this.credentials !== null && this.credentials !== undefined) {
    output.writeFieldBegin('credentials', Thrift.Type.STRUCT, 1);
    this.credentials.write(output);
    output.writeFieldEnd();
  }
  if (this.request !== null && this.request !== undefined) {
    output.writeFieldBegin('request', Thrift.Type.STRUCT, 2);
    this.request.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ExampleService_exampleServiceCall_result = function(args) {
  this.success = null;
  this.se = null;
  if (args instanceof SecurityException) {
    this.se = args;
    return;
  }
  if (args) {
    if (args.success !== undefined) {
      this.success = args.success;
    }
    if (args.se !== undefined) {
      this.se = args.se;
    }
  }
};
ExampleService_exampleServiceCall_result.prototype = {};
ExampleService_exampleServiceCall_result.prototype.read = function(input) {
  input.readStructBegin();
  while (true)
  {
    var ret = input.readFieldBegin();
    var fname = ret.fname;
    var ftype = ret.ftype;
    var fid = ret.fid;
    if (ftype == Thrift.Type.STOP) {
      break;
    }
    switch (fid)
    {
      case 0:
      if (ftype == Thrift.Type.STRUCT) {
        this.success = new ExampleServiceResponse();
        this.success.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      case 1:
      if (ftype == Thrift.Type.STRUCT) {
        this.se = new SecurityException();
        this.se.read(input);
      } else {
        input.skip(ftype);
      }
      break;
      default:
        input.skip(ftype);
    }
    input.readFieldEnd();
  }
  input.readStructEnd();
  return;
};

ExampleService_exampleServiceCall_result.prototype.write = function(output) {
  output.writeStructBegin('ExampleService_exampleServiceCall_result');
  if (this.success !== null && this.success !== undefined) {
    output.writeFieldBegin('success', Thrift.Type.STRUCT, 0);
    this.success.write(output);
    output.writeFieldEnd();
  }
  if (this.se !== null && this.se !== undefined) {
    output.writeFieldBegin('se', Thrift.Type.STRUCT, 1);
    this.se.write(output);
    output.writeFieldEnd();
  }
  output.writeFieldStop();
  output.writeStructEnd();
  return;
};

ExampleServiceClient = function(input, output) {
    this.input = input;
    this.output = (!output) ? input : output;
    this.seqid = 0;
};
ExampleServiceClient.prototype = {};
ExampleServiceClient.prototype.exampleServiceCall = function(credentials, request) {
  this.send_exampleServiceCall(credentials, request);
  return this.recv_exampleServiceCall();
};

ExampleServiceClient.prototype.send_exampleServiceCall = function(credentials, request) {
  this.output.writeMessageBegin('exampleServiceCall', Thrift.MessageType.CALL, this.seqid);
  var args = new ExampleService_exampleServiceCall_args();
  args.credentials = credentials;
  args.request = request;
  args.write(this.output);
  this.output.writeMessageEnd();
  return this.output.getTransport().flush();
};

ExampleServiceClient.prototype.recv_exampleServiceCall = function() {
  var ret = this.input.readMessageBegin();
  var fname = ret.fname;
  var mtype = ret.mtype;
  var rseqid = ret.rseqid;
  if (mtype == Thrift.MessageType.EXCEPTION) {
    var x = new Thrift.TApplicationException();
    x.read(this.input);
    this.input.readMessageEnd();
    throw x;
  }
  var result = new ExampleService_exampleServiceCall_result();
  result.read(this.input);
  this.input.readMessageEnd();

  if (null !== result.se) {
    throw result.se;
  }
  if (null !== result.success) {
    return result.success;
  }
  throw 'exampleServiceCall failed: unknown result';
};