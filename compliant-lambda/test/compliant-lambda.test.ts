import {
    App, Stack,
    aws_lambda as lambda,
    aws_ec2 as ec2,
    aws_iam as iam
} from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CompliantLambda } from '../lib/index';
import path = require('path');

// example test. To run these tests, uncomment this file along with the
// example resource in lib/index.ts
test('Lambda has valid Runtime and VPC', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    //   // WHEN
    const vpc = new ec2.Vpc(stack, 'MyVPC', {
    });
    const lambdaExecRole = new iam.Role(stack, "lambdaExecRole", {
        roleName: "lambdaExecRole",
        description: "",
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
        ]
    });
    const testlambda = new CompliantLambda(stack, 'MyTestConstruct', {
        runtime: lambda.Runtime.PYTHON_3_10,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, './Lambda')),
        role: lambdaExecRole,
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [
            new ec2.SecurityGroup(stack, 'MySecurityGroup', {
                vpc,
                allowAllOutbound: true,
            }),
        ]
    });
    //   // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
        // Runtime: lambda.Runtime.PYTHON_3_10,
        Runtime: stack.resolve(testlambda.runtime.name)
    })
});

test('Lambda has invalid Runtime and no VPC', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    //   // WHEN
    const testlambda = new CompliantLambda(stack, 'MyTestConstruct', {
        runtime: lambda.Runtime.PYTHON_3_6,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(path.join(__dirname, './Lambda'))
    });
    //   // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: stack.resolve(testlambda.runtime.name)
    })
});