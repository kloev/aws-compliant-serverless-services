import {
    aws_apigateway as apigw
} from 'aws-cdk-lib';
import { CompliantApiStageProps, CompliantApigatewayProps } from '.';

//Compliant config rules
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
 * checks if the deployment stage is compliant
 * @param props 
 * @returns 
 */
export function getDeployOptions(props: CompliantApigatewayProps) {
    if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED) && props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
        return props.deployOptions;
    }
    if (props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
        const updatedDeployOptions: apigw.StageOptions = {
            ...props.deployOptions,
            cachingEnabled: true,
            cacheDataEncrypted: true,
            cacheClusterEnabled: true,
        };
        return updatedDeployOptions;
    }
    if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED)) {
        const updatedDeployOptions: apigw.StageOptions = {
            ...props.deployOptions,
            loggingLevel: apigw.MethodLoggingLevel.INFO,
        };
        return updatedDeployOptions;
    }

    const updatedDeployOptions: apigw.StageOptions = {
        ...props.deployOptions,
        cachingEnabled: true,
        cacheDataEncrypted: true,
        cacheClusterEnabled: true,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
    };
    return updatedDeployOptions;
};