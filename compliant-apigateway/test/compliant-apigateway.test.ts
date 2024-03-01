import {
    App, Stack,
    aws_apigateway as apigw,
    aws_wafv2 as waf
} from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CompliantApigateway, CompliantApiStage } from '../lib/index';
import { EndpointType } from 'aws-cdk-lib/aws-apigateway';

test('Test API Endpoint Type EDGE', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.EDGE]
    });
    api.root.addMethod('ANY');

    expect(() => {
        Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
            EndpointConfiguration: { Types: [apigw.EndpointType.EDGE] },
        });
    }).not.toThrow();
})

test('Test API Endpoint Type REGIONAL', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.REGIONAL]
    });
    api.root.addMethod('ANY');

    expect(() => {
        Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
            EndpointConfiguration: { Types: [apigw.EndpointType.REGIONAL] },
        });
    }).not.toThrow();
})

test('Test API Endpoint Type PRIVATE', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    const api = new CompliantApigateway(stack, 'MyTestConstruct', {
        endpointTypes: [apigw.EndpointType.PRIVATE]
    });
    api.root.addMethod('ANY');

    expect(() => {
        Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::RestApi', {
            EndpointConfiguration: { Types: [apigw.EndpointType.PRIVATE] },
        });
    }).not.toThrow();
});


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
    const deployment = new apigw.Deployment(stack, 'Deployment', { api });
    const stage = new CompliantApiStage(stack, 'TestStage', {
        deployment: deployment,
        cacheClusterEnabled: true,
        cacheDataEncrypted: true
    });
    const cfnWebACLAssociation = new waf.CfnWebACLAssociation(stack, 'TestWebACLAssociation', {
        resourceArn: stage.stageArn,
        webAclArn: cfnWebACL.attrArn,
    });

    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::ApiGateway::Stage', {
        CacheClusterEnabled: true,
        CacheDataEncrypted: true,

    });
    Template.fromStack(stack).hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: {
            "Fn::GetAtt": [
                "TestStageprod5C9A6C0D",
                "Stage"
            ]
        },
        WebACLArn: {
            "Fn::GetAtt": [
                "MyCDKWebAcl",
                "Arn"
            ]
        }
    });
});
