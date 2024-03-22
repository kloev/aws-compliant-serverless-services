# Welcome to your CDK TypeScript Construct Library project

You should explore the contents of this project. It demonstrates a CDK Construct Library that includes a construct (`CompliantApigateway`)
which contains an AWS REST API and API Stage that are compliant agianst our rules. 

The construct defines an interface (`CompliantApigatewayProps`, `CompliantApiStageProps`) to configure a non-compliant version.

## Purpose 
The given construct aims to define an API Gateway that offers more data security by default. Therefore it has some of its properties predefined and validates some properties. 

## Use of an compliant API Gateway
This repo allows to use an compliant API Gateway and API Stage. It is compliant against the following rules:
- [API_GW_ENDPOINT_TYPE_CHECK] Only allowed Endpoints can be used: apigw.EndpointType.EDGE, apigw.EndpointType.PRIVATE, apigw.EndpointType.REGIONAL
- [API_GW_CACHE_ENABLED_AND_ENCRYPTED] Cache is enabled and encrypted by default
- [API_GW_EXECUTION_LOGGING_ENABLED] Logging must be configured
- [API_GW_DOMAIN_REQUIRED] The API Gateway must have a domain and the execution endpoint must be disabled
These rules must be deactivated to use an non-compliant API Gateway, otherwise your settings will be overwritten. 

## Sample

create a fully compliant API Gateway 

```typescript
    const certificate = acm.Certificate.fromCertificateArn(stack, 'MyCertificate', 'arn:aws:acm:us-east-1:123456789012:certificate/abcdefg-1234-5678-90ab-cdef12345678');
    const api = new CompliantApigateway(stack, 'MyCompliantRESTApi', {
        endpointTypes: [apigw.EndpointType.EDGE],
        disableExecuteApiEndpoint: true,
        domainName: {
            domainName: 'example.com',
            certificate: certificate,
            endpointType: apigw.EndpointType.EDGE,
            securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        }
    });
    api.root.addMethod('ANY');
```

Opt out of all rules (create a non compliant API Gateway)

```typescript
    const api = new CompliantApigateway(stack, 'MyNonCompliantRESTApi', {
         disabledRules: ['API_GW_DOMAIN_REQUIRED', 
            'API_GW_ENDPOINT_TYPE_CHECK'
            'API_GW_ENDPOINT_TYPE_CHECK'
            'API_GW_CACHE_ENABLED_AND_ENCRYPTED'
            'API_GW_EXECUTION_LOGGING_ENABLED'
            'API_GW_DOMAIN_REQUIRED'
        ],
    });
    api.root.addMethod('ANY');
```