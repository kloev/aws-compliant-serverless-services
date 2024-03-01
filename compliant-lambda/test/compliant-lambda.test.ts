import {
    App, Stack,
    aws_lambda as lambda,
    aws_ec2 as ec2,
    aws_iam as iam
} from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CompliantLambda } from '../lib/index';
import path = require('path');
import { Subnet } from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';

/**
 * Fully Compliant Test, rules activated
 */
test('Lambda is compliant', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
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
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: stack.resolve(testlambda.runtime.name),
        VpcConfig: {
            SecurityGroupIds: [{
                'Fn::GetAtt': [
                    'MySecurityGroupAC8D442C',
                    'GroupId'
                ]
            }],
            SubnetIds: [
                { "Ref": "MyVPCPrivateSubnet1Subnet641543F4" },
                { "Ref": "MyVPCPrivateSubnet2SubnetA420D3F0" }
            ]
        },
    });
});

/**
 * Non Compliant Test
 */
test('Lambda has invalid Runtime and no VPC', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const testlambda = new CompliantLambda(stack, 'MyTestConstruct', {
        runtime: lambda.Runtime.PYTHON_3_6,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(path.join(__dirname, './Lambda')),
        disabledRules: ['LAMBDA_FUNCTION_SETTINGS_CHECK', 'LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED', 'LAMBDA_VPC_MULTI_AZ_CHECK', 'LAMBDA_INSIDE_VPC']
    });
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
        Runtime: stack.resolve(testlambda.runtime.name),
        VpcConfig: Match.absent(),
    });
});

test('Lambda is not compliant, because rules are deactivated', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    //   // WHEN
    const testlambda = new CompliantLambda(stack, 'MyTestConstruct', {
        runtime: lambda.Runtime.PYTHON_3_6,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(path.join(__dirname, './Lambda')),
        disabledRules: [
            'LAMBDA_FUNCTION_SETTINGS_CHECK',
            'LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED',
            'LAMBDA_VPC_MULTI_AZ_CHECK',
            'LAMBDA_INSIDE_VPC']
    });
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
        Runtime: stack.resolve(testlambda.runtime.name),
        VpcConfig: Match.absent(),
    });
});

/**
 * Test for public access
 */
test('Lambda has public access', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    //   // WHEN
    const testlambda = new CompliantLambda(stack, 'MyTestConstruct', {
        runtime: lambda.Runtime.PYTHON_3_10,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, './Lambda')),
        disabledRules: ['LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED', 'LAMBDA_INSIDE_VPC', 'LAMBDA_VPC_MULTI_AZ_CHECK'],
    });
    // THEN
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.absent(),
        Role: {
            "Fn::GetAtt": [
                "MyTestConstructServiceRole85575326",
                "Arn"
            ]
        },
    });
});

test('Lambda has no public access', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    //   // WHEN
    const vpc = new ec2.Vpc(stack
        , 'MyVPC', {
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
        ], 
    });
    // THEN
    //expect no public access
    // expect(() => {
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
        Role: {
            "Fn::GetAtt": [
                "lambdaExecRole63FBAB22",
                "Arn"
            ]
        },
        VpcConfig: {
            SecurityGroupIds: [{
                "Fn::GetAtt": [
                    "MySecurityGroupAC8D442C",
                    "GroupId"
                ]
            }],
            SubnetIds: [
                { "Ref": "MyVPCPrivateSubnet1Subnet641543F4" },
                { "Ref": "MyVPCPrivateSubnet2SubnetA420D3F0" }
            ]
        }
    });
    // }).not.toThrow();
});