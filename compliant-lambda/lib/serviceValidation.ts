import {
    aws_lambda as lambda,
} from 'aws-cdk-lib';
import {CompliantLambdaProps} from '.';

/**
 * Valid runtimes, does not contain custom runtimes
 * LAMBDA_FUNCTION_SETTINGS_CHECK
 */
const getNameFromRuntime = (runtime: lambda.Runtime): string => runtime.name
export const validRuntimes = [
    lambda.Runtime.NODEJS_16_X,
    lambda.Runtime.NODEJS_18_X,
    lambda.Runtime.NODEJS_LATEST,
    lambda.Runtime.PYTHON_3_8,
    lambda.Runtime.PYTHON_3_9,
    lambda.Runtime.PYTHON_3_10,
    lambda.Runtime.PYTHON_3_11,
    lambda.Runtime.JAVA_11,
    lambda.Runtime.JAVA_17,
    lambda.Runtime.NODEJS_16_X,
    lambda.Runtime.PYTHON_3_9,
    lambda.Runtime.RUBY_2_7,
    lambda.Runtime.RUBY_3_2,
    lambda.Runtime.DOTNET_6
]

export function isRuntimeValid(rt: lambda.Runtime, props: CompliantLambdaProps) :boolean {
    if (props.disabledRules?.includes('LAMBDA_FUNCTION_SETTINGS_CHECK')) {
        return true;
    };
    return (validRuntimes.includes(rt));
};

/**
 * Valid principal
 * LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED
 */
export function checkNoPublicAccess(props: CompliantLambdaProps): boolean {
    if (props.disabledRules?.includes('LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED')) {
        return true;
    };
    const principal =  props.role?.grantPrincipal
    // Prüfen, ob der Principal leer ist oder ein Wildcard (*) enthält
    if (!principal || typeof principal === 'string' && principal === "*" || Object.keys(principal).length === 0) {
        return false;
    }
    // Prüfen, ob es sich um ein AWS-Objekt handelt und der AWS-Prinzipal leer ist
    if (typeof principal === 'object' && 'AWS' in principal && principal['AWS'] === "") {
        return false;
    }
    return true;
}

/**
 * Vpc enabled
 * LAMBDA_INSIDE_VPC
 */
export function checkVpcEnabled(props: CompliantLambdaProps): boolean {
    if (props.disabledRules?.includes('LAMBDA_INSIDE_VPC')) {
        return true;
    };
    if (props.vpc && props.vpcSubnets) {
        return true
    };
    return false;
}

/**
 * Vpc has multi az
 * LAMBDA_VPC_MULTI_AZ_CHECK
 */
export function checkVpcMultiAz(props: CompliantLambdaProps): boolean {
    if (props.disabledRules?.includes('LAMBDA_VPC_MULTI_AZ_CHECK')) {
        return true;
    };
    if (props.vpc && (props.vpcSubnets?.subnetType ?? undefined === 'PRIVATE_WITH_EGRESS')) {
        return true;
    }
    return false;
}