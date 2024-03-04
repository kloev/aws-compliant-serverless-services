import {
    App, Stack,
    aws_apigateway as apigw,
    aws_wafv2 as waf
} from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CompliantApigateway, CompliantApiStage } from '../lib/index';
import { Deployment, EndpointType, Method } from 'aws-cdk-lib/aws-apigateway';
import { join } from 'path';

/**
 * API Gateway Endpoint Type Check
 */
test('Test API Endpoint Type EDGE', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.EDGE],
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
        endpointTypes: [apigw.EndpointType.REGIONAL]
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
        endpointTypes: [apigw.EndpointType.PRIVATE]
    });
    api.root.addMethod('ANY');

    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: { Types: [apigw.EndpointType.PRIVATE] },
    });
});

/**
 * API Gateway Cache Enabled and Encrypted
 */
test('API Gateway Cache Enabled and Encrypted', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.EDGE],
        deployOptions: {
            cachingEnabled: true,
            cacheDataEncrypted: true,
            cacheClusterEnabled: true,
        },
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
        endpointTypes: [apigw.EndpointType.EDGE],
        deployOptions: {
            stageName: 'prod',
        },
        // deployOptions: {
        //     stageName: 'v1',
        //     description: 'V1 Deployment',
        //     /**
        //      * Enable tracing and logging in JSON format for the API.
        //      */
        //     tracingEnabled: true,
        //     accessLogDestination: new LogGroupLogDestination(new LogGroup(this, 'AccessLog', {
        //         retention: RetentionDays.ONE_MONTH,
        //         removalPolicy: RemovalPolicy.DESTROY,
        //     })),
        //     accessLogFormat: AccessLogFormat.custom(JSON.stringify({
        //         requestTime: AccessLogField.contextRequestTime(),
        //         requestTimeEpoch: AccessLogField.contextRequestTimeEpoch(),
        //         requestId: AccessLogField.contextRequestId(),
        //         extendedRequestId: AccessLogField.contextExtendedRequestId(),
        //         sourceIp: AccessLogField.contextIdentitySourceIp(),
        //         method: AccessLogField.contextHttpMethod(),
        //         resourcePath: AccessLogField.contextResourcePath(),
        //         traceId: AccessLogField.contextXrayTraceId(),
        //     })),
        //     /**
        //      * Execution logs.
        //      * Only required for debugging.
        //      * Creates an additional log group that we cannot control.
        //      */
        //     loggingLevel: MethodLoggingLevel.OFF,
        //     /**
        //      * Enable Details Metrics. Additional costs incurred
        //      * Creates metrics at the method level.
        //      */
        //     metricsEnabled: false,
        // },
    });
    api.root.addMethod('ANY');
    const cfnWebACLAssociation = new waf.CfnWebACLAssociation(stack, 'TestWebACLAssociation', {
        resourceArn: api.deploymentStage.stageArn,// stage.stageArn,
        webAclArn: cfnWebACL.attrArn,
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: "prod",
        DeploymentId: {
            Ref: "MyTestConstructDeploymentC8A0B8DD05103d0c4f6f1a4b9430be4703659ee0"
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
