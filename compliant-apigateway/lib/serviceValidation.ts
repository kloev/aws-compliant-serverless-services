import {
  aws_apigateway as apigw
} from 'aws-cdk-lib';
import { CompliantApigatewayProps, CompliantApiStageProps } from '.';

/**
* AWS Config rules that I want to opt out
* @default - table is compliant against all rules
*
* List of rules to opt out:
* 'API_GW_ASSOCIATED_WITH_WAF'
* 'API_GW_CACHE_ENABLED_AND_ENCRYPTED'
* 'API_GW_ENDPOINT_TYPE_CHECK'
* 'API_GW_EXECUTION_LOGGING_ENABLED'
*/


/**
 * checkEndpointType
 * API_GW_ENDPOINT_TYPE_CHECK
 */

const validEndpoints = [
  apigw.EndpointType.EDGE,
  apigw.EndpointType.PRIVATE,
  apigw.EndpointType.REGIONAL,
]
export function isEndpointTypeValid(epc: apigw.EndpointConfiguration, props: CompliantApigatewayProps): boolean {
  if (props.disabledRules?.includes('API_GW_ENDPOINT_TYPE_CHECK')) {
    return true;
  };
  for (const endpoint of epc.types) {
    if (!validEndpoints.includes(endpoint)) {
      return false;
    }
  }
  return true;
};

/**
 * checkWafAssociated
 * API_GW_ASSOCIATED_WITH_WAF
 * @param stage 
 * @returns 
 */
export function checkWafAssociated(stage: apigw.Stage, props: CompliantApiStageProps): boolean {
  if (props.disabledRules?.includes('API_GW_ASSOCIATED_WITH_WAF')) { return true; }

  //check if an api gateway stage is associated with a waf
  // return true if associated with a waf

  // return false if not associated with a waf
  return false;
}

/**
 * checkCacheEnabledEncrytped
 * API_GW_CACHE_ENABLED_AND_ENCRYPTED
 * @param stage 
 * @returns 
 */
export function checkCacheEnabledEncrytped(stage: apigw.Stage, props: CompliantApiStageProps): boolean {
  if (props.disabledRules?.includes('API_GW_CACHE_ENABLED_AND_ENCRYPTED')) { return true; }
  //check if cache is enabled and encrypted
  // return true if cache is enabled and encrypted
  // stage.cacheClusterEnabled = true;

  return false;
}

/**
 * checkExecutionLoggingEnabled
 * API_GW_EXECUTION_LOGGING_ENABLED
 * @param stage 
 * @returns 
 */
export function checkExecutionLoggingEnabled(stage: apigw.Stage, props: CompliantApiStageProps): boolean {
  if (props.disabledRules?.includes('API_GW_EXECUTION_LOGGING_ENABLED')) { return true; }
  return false;
}