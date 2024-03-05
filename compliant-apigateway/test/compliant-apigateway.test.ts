import {
    App, Stack,
    aws_apigateway as apigw,
    aws_wafv2 as waf,
    aws_certificatemanager as acm,
} from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CompliantApigateway } from '../lib/index';

/**
 * Compliant API Gateway
 */
test('Compliant API Gateway', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const certificate = acm.Certificate.fromCertificateArn(stack, 'MyCertificate', 'arn:aws:acm:us-east-1:123456789012:certificate/abcdefg-1234-5678-90ab-cdef12345678');
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
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

    // const cfnWebACL = new waf.CfnWebACL(stack,
    //     'MyCDKWebAcl', {
    //     defaultAction: {
    //         allow: {}
    //     },
    //     scope: 'REGIONAL',
    //     visibilityConfig: {
    //         cloudWatchMetricsEnabled: true,
    //         metricName: 'MetricForWebACLCDK',
    //         sampledRequestsEnabled: true,
    //     },
    //     name: 'MyCDKWebAcl',
    //     rules: [{
    //         name: 'CRSRule',
    //         priority: 0,
    //         statement: {
    //             managedRuleGroupStatement: {
    //                 name: 'AWSManagedRulesCommonRuleSet',
    //                 vendorName: 'AWS'
    //             }
    //         },
    //         visibilityConfig: {
    //             cloudWatchMetricsEnabled: true,
    //             metricName: 'MetricForWebACLCDK-CRS',
    //             sampledRequestsEnabled: true,
    //         },
    //         overrideAction: {
    //             none: {}
    //         },
    //     }]
    // });

    // const cfnWebACLAssociation = new waf.CfnWebACLAssociation(stack, 'TestWebACLAssociation', {
    //     resourceArn: api.deploymentStage.stageArn,// stage.stageArn,
    //     webAclArn: cfnWebACL.attrArn,
    // });
    // THEN

    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: { Types: [apigw.EndpointType.EDGE] },
        DisableExecuteApiEndpoint: true,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                CacheDataEncrypted: true,
                CachingEnabled: true,
                LoggingLevel: "INFO",
            }
        ],
        CacheClusterEnabled: true,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: 'example.com',
        EndpointConfiguration: {
            Types: [apigw.EndpointType.EDGE]
        },
        SecurityPolicy: 'TLS_1_2',
    });
    // Template.fromStack(stack).hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
    //     ResourceArn: stack.resolve(api.deploymentStage.stageArn),
    //     WebACLArn: {
    //         "Fn::GetAtt": [
    //             "MyCDKWebAcl",
    //             "Arn"
    //         ]
    //     }
    // });
});

/**
 * API Gateway Domain Name Tests
 */
test('API Gateway Domain Name is not required', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        disabledRules: ['API_GW_DOMAIN_REQUIRED', 'API_GW_ENDPOINT_TYPE_CHECK'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        DisableExecuteApiEndpoint: Match.absent(),
    });
});

test('API Gateway Domain Name is required', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const certificate = acm.Certificate.fromCertificateArn(stack, 'MyCertificate', 'arn:aws:acm:us-east-1:123456789012:certificate/abcdefg-1234-5678-90ab-cdef12345678');
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        domainName: {
            domainName: 'example.com',
            certificate: certificate,
            endpointType: apigw.EndpointType.EDGE,
            securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        },
        disableExecuteApiEndpoint: true,
        disabledRules: ['API_GW_ENDPOINT_TYPE_CHECK'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        DisableExecuteApiEndpoint: true,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: 'example.com',
        EndpointConfiguration: {
            Types: [apigw.EndpointType.EDGE]
        },
        SecurityPolicy: 'TLS_1_2',
    });
});

/**
 * API Gateway Endpoint Type Check
 */
test('Test API Endpoint Type EDGE', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.EDGE],
        disabledRules: ['API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');

    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: { Types: [apigw.EndpointType.EDGE] },
    });
})

test('Test API Endpoint Type REGIONAL', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.REGIONAL],
        disabledRules: ['API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');

    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: { Types: [apigw.EndpointType.REGIONAL] },
    });
})

test('Test API Endpoint Type PRIVATE', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.PRIVATE],
        disabledRules: ['API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');

    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: { Types: [apigw.EndpointType.PRIVATE] },
    });
});

/**
 * API Gateway Execution Logging Enabled
 */
test('API Gateway Execution Logging Enabled per default', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            loggingLevel: apigw.MethodLoggingLevel.INFO,
        },
        disabledRules: ['API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                LoggingLevel: "INFO",
                CacheDataEncrypted: true,
                CachingEnabled: true,
            }
        ],
    });
});

test('API Gateway Execution Logging Enabled, loggingLevel defined ERROR, but construct gives INFO per default', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            loggingLevel: apigw.MethodLoggingLevel.ERROR,
        },
        disabledRules: ['API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                LoggingLevel: "INFO",
                CacheDataEncrypted: true,
                CachingEnabled: true,
            }
        ],
    });
});

test('API Gateway Execution Logging Enabled, loggingLevel defined ERROR, Rule disabled', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            loggingLevel: apigw.MethodLoggingLevel.ERROR,
        },
        disabledRules: ['API_GW_EXECUTION_LOGGING_ENABLED',
            'API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                LoggingLevel: "ERROR",
            }
        ],
    });
});

test('API Gateway Execution Logging Disabled, LoggingLevel not given, Rule disabled', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
        },
        disabledRules: ['API_GW_EXECUTION_LOGGING_ENABLED',
            'API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                LoggingLevel: Match.absent(),
            }
        ],
    });
});

/**
 * API Gateway Cache Enabled and Encrypted
 */
test('API Gateway Cache Enabled and Encrypted per default', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            cachingEnabled: true,
            cacheDataEncrypted: true,
            cacheClusterEnabled: true,
        },
        disabledRules: ['API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                CacheDataEncrypted: true,
                CachingEnabled: true,
            }
        ],
        CacheClusterEnabled: true,
    });
});

test('API Gateway Cache Enabled and Encrypted per default, cache disabled by user', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            cachingEnabled: false,
            cacheDataEncrypted: false,
            cacheClusterEnabled: false,
        },
        disabledRules: ['API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                CacheDataEncrypted: true,
                CachingEnabled: true,
            }
        ],
        CacheClusterEnabled: true,
    });
});

test('API Gateway Cache Disabled, cache disabled by user', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            cachingEnabled: false,
            cacheDataEncrypted: false,
            cacheClusterEnabled: false,
        },
        disabledRules: ['API_GW_CACHE_ENABLED_AND_ENCRYPTED',
            'API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                CacheDataEncrypted: false,
                CachingEnabled: false,
            }
        ],
        CacheClusterEnabled: false,
    });
});

test('API Gateway Cache Disabled, cache not given', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
        },
        disabledRules: ['API_GW_CACHE_ENABLED_AND_ENCRYPTED',
            'API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
            {
                HttpMethod: "*",
                ResourcePath: "/*",
                CacheDataEncrypted: Match.absent(),
                CachingEnabled: Match.absent(),
            }
        ],
        CacheClusterEnabled: Match.absent(),
    });
});

/**
 * API Gateway is associated with WAF
 */
test('API Gateway Stage is associated with WAF', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    //waf 
    const cfnWebACL = new waf.CfnWebACL(stack,
        'MyCDKWebAcl', {
        defaultAction: {
            allow: {}
        },
        scope: 'REGIONAL',
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'MetricForWebACLCDK',
            sampledRequestsEnabled: true,
        },
        name: 'MyCDKWebAcl',
        rules: [{
            name: 'CRSRule',
            priority: 0,
            statement: {
                managedRuleGroupStatement: {
                    name: 'AWSManagedRulesCommonRuleSet',
                    vendorName: 'AWS'
                }
            },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'MetricForWebACLCDK-CRS',
                sampledRequestsEnabled: true,
            },
            overrideAction: {
                none: {}
            },
        }]
    });
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        deployOptions: {
            stageName: 'prod',
        },
        disabledRules: ['API_GW_ENDPOINT_TYPE_CHECK', 'API_GW_DOMAIN_REQUIRED'],
    });
    api.root.addMethod('ANY');
    const cfnWebACLAssociation = new waf.CfnWebACLAssociation(stack, 'TestWebACLAssociation', {
        resourceArn: api.deploymentStage.stageArn,
        webAclArn: cfnWebACL.attrArn,
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: "prod",
        DeploymentId: {
            Ref: "MyTestConstructDeploymentC8A0B8DD6f1603e8fc3974c66dad7c7e50c6f56b"
        },
        RestApiId: {
            Ref: "MyTestConstruct5DDB28CF"
        },
    });
    template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: stack.resolve(api.deploymentStage.stageArn),
        WebACLArn: {
            "Fn::GetAtt": [
                "MyCDKWebAcl",
                "Arn"
            ]
        }
    });
});
