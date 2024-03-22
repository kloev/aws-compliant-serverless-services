import {
    aws_apigateway as apigw
} from 'aws-cdk-lib';
import { CompliantApiStageProps, CompliantApigatewayProps } from '.';

//Compliant config rules
// const API_GW_ASSOCIATED_WITH_WAF = 'API_GW_ASSOCIATED_WITH_WAF';
const API_GW_CACHE_ENABLED_AND_ENCRYPTED = 'API_GW_CACHE_ENABLED_AND_ENCRYPTED';
const API_GW_EXECUTION_LOGGING_ENABLED = 'API_GW_EXECUTION_LOGGING_ENABLED';

/**
 * checks if cache is enabled
 * @param props : CompliantApiStageProps
 * @returns boolean
 */
export function getCacheEnabled(props: CompliantApiStageProps) {
    if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED)) {
        return props.cachingEnabled;
    }
    return props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED);
};

/**
 * checks if cache encrypted
 * @param props : CompliantApiStageProps
 * @returns boolean
 */
export function getCacheEncrypted(props: CompliantApiStageProps) {
    if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED)) {
        return props.cacheDataEncrypted;
    }
    return !props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED);
};

/**
 * 
 * @param props 
 * @returns 
 */
// export function getLoggingLevel(props: CompliantApiStageProps) {
//     if (props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
//         return props.loggingLevel;
//     }
//     return apigw.MethodLoggingLevel.;
// };

// export function getDeployOptions(props: CompliantApigatewayProps) {
//     if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED) && props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
//         return props.deployOptions;
//     }
//     else if (props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
//         const updatedDeployOptions = {
//             cachingEnabled: true,
//             cacheDataEncrypted: true,
//             cacheClusterEnabled: true,
//         };
//         return updatedDeployOptions;
//     }
//     else if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED)) {
//         const updatedDeployOptions = {
//             loggingLevel: apigw.MethodLoggingLevel.INFO,
//         };
//         return updatedDeployOptions;
//     }

//     const updatedDeployOptions = {
//         // ...props.deployOptions,
//         cachingEnabled: true,
//         cacheDataEncrypted: true,
//         cacheClusterEnabled: true,
//         loggingLevel: apigw.MethodLoggingLevel.INFO,
//     };
//     return updatedDeployOptions;
//     // props.deployOptions?.cachingEnabled == true;
//         // deployOptions: {
//         //     stageName: 'v1',
//         //     description: 'V1 Deployment',
//         //     /**
//         //      * Enable tracing and logging in JSON format for the API.
//         //      */
//         //     tracingEnabled: true,
//         //     accessLogDestination: new LogGroupLogDestination(new LogGroup(this, 'AccessLog', {
//         //         retention: RetentionDays.ONE_MONTH,
//         //         removalPolicy: RemovalPolicy.DESTROY,
//         //     })),
//         //     accessLogFormat: AccessLogFormat.custom(JSON.stringify({
//         //         requestTime: AccessLogField.contextRequestTime(),
//         //         requestTimeEpoch: AccessLogField.contextRequestTimeEpoch(),
//         //         requestId: AccessLogField.contextRequestId(),
//         //         extendedRequestId: AccessLogField.contextExtendedRequestId(),
//         //         sourceIp: AccessLogField.contextIdentitySourceIp(),
//         //         method: AccessLogField.contextHttpMethod(),
//         //         resourcePath: AccessLogField.contextResourcePath(),
//         //         traceId: AccessLogField.contextXrayTraceId(),
//         //     })),
//         //     /**
//         //      * Execution logs.
//         //      * Only required for debugging.
//         //      * Creates an additional log group that we cannot control.
//         //      */
//         //     loggingLevel: MethodLoggingLevel.OFF,
//         //     /**
//         //      * Enable Details Metrics. Additional costs incurred
//         //      * Creates metrics at the method level.
//         //      */
//         //     metricsEnabled: false,
//         // },

// };

/**
 * checks if the deployment stage is compliant
 * @param props 
 * @returns 
 */
export function getDeployOptionsv1(props: CompliantApigatewayProps) {
    if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED) && props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
        return props.deployOptions;
    }
    else if (props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
        const updatedDeployOptions = {
            ...props.deployOptions,
            cachingEnabled: true,
            cacheDataEncrypted: true,
            cacheClusterEnabled: true,
        };
        return updatedDeployOptions;
    }
    else if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED)) {
        const updatedDeployOptions = {
            ...props.deployOptions,
            loggingLevel: apigw.MethodLoggingLevel.INFO,
        };
        return updatedDeployOptions;
    }

    const updatedDeployOptions = {
        ...props.deployOptions,
        cachingEnabled: true,
        cacheDataEncrypted: true,
        cacheClusterEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
    };
    return updatedDeployOptions;
};