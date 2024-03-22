# Welcome to your CDK TypeScript Construct Library project

You should explore the contents of this project. It demonstrates a CDK Construct Library that includes a construct (`CompliantLambda`)
which contains an AWS Lambda function that are compliant agianst our rules. 

The construct defines an interface (`CompliantLambdaProps`)  to configure a non-compliant version.

## Purpose 
The given construct aims to define an Lambda function that offers more data security by default. Therefore it has some of its properties predefined and validates some properties. 

## Use of an compliant Lambda function
This repo allows to use an compliant Lambda function. It is compliant against the following rules:
 - [LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED] checks if public access is disabled
 - [LAMBDA_FUNCTION_SETTINGS_CHECK] checks if a valid runtime is used
 - [LAMBDA_VPC_MULTI_AZ_CHECK] checks if the function is available in multi az
 - [LAMBDA_INSIDE_VPC] checks if the function is inside an vpc
These rules must be deactivated to use an non-compliant Lambda function, otherwise your settings will be overwritten. 

## Sample

create a fully compliant Lambda function

```typescript
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
    const testlambda = new CompliantLambda(stack, 'MyCompliantLambda', {
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
```

Opt out of all rules (create a non compliant Lambda function)

```typescript
 const testlambda = new CompliantLambda(stack, 'MyNonCompliantLambda', {
        runtime: lambda.Runtime.PYTHON_3_6,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromAsset(path.join(__dirname, './Lambda')),
        disabledRules: ['LAMBDA_FUNCTION_SETTINGS_CHECK', 
            'LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED', 
            'LAMBDA_VPC_MULTI_AZ_CHECK', 
            'LAMBDA_INSIDE_VPC'
        ]
    });
```