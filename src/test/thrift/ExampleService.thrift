struct ExampleServiceRequest {
 1: required i32 number
 2: required string str
}

struct ExampleAuthCredentials {
 1: required string username
 2: required string password
}

struct ExampleServiceResponse {
 1: required string responseMessage
}

exception SecurityException {
 1: required string message;
} 

service ExampleService {
 PracticePacks exampleServiceCall(
  1: ExampleAuthCredentials credentials,
  2: ExampleServiceRequest request)
  throws (1: SecurityException se)
}

