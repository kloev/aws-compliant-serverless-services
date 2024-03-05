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

const API_GW_ENDPOINT_TYPE_CHECK = 'API_GW_ENDPOINT_TYPE_CHECK';
const API_GW_ASSOCIATED_WITH_WAF = 'API_GW_ASSOCIATED_WITH_WAF';
const API_GW_CACHE_ENABLED_AND_ENCRYPTED = 'API_GW_CACHE_ENABLED_AND_ENCRYPTED';
const API_GW_EXECUTION_LOGGING_ENABLED = 'API_GW_EXECUTION_LOGGING_ENABLED';
const API_GW_DOMAIN_REQUIRED = 'API_GW_DOMAIN_REQUIRED';

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
  if (props.disabledRules?.includes(API_GW_ENDPOINT_TYPE_CHECK)) {
    return true;
  };
  if (!epc) {
    throw new Error('EndpointConfiguration must have at least one endpoint type');
  }
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
  if (props.disabledRules?.includes(API_GW_ASSOCIATED_WITH_WAF)) { return true; }

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
  if (props.disabledRules?.includes(API_GW_CACHE_ENABLED_AND_ENCRYPTED)) { return true; }
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
export function checkExecutionLoggingEnabled(props: CompliantApiStageProps): boolean {
  if (props.disabledRules?.includes(API_GW_EXECUTION_LOGGING_ENABLED)) {
    return true;
  }
  if (props.loggingLevel === undefined) {
    throw new Error('loggingLevel must be defined');
  }
  //Checks if all methods in Amazon API Gateway stages have logging enabled. The rule is NON_COMPLIANT if logging is not enabled, or if loggingLevel is neither ERROR nor INFO.
  if (
    props.loggingLevel !== apigw.MethodLoggingLevel.ERROR
    && props.loggingLevel !== apigw.MethodLoggingLevel.INFO
    && props.loggingLevel !== apigw.MethodLoggingLevel.OFF) {
    return false;
  }
  return false;
}

/**
 * checkDomainRequired
 * API_GW_DOMAIN_REQUIRED
 * @param stage 
 * @returns 
 */
export function checkDomainRequired(props: CompliantApigatewayProps): boolean {
  if (props.disabledRules?.includes(API_GW_DOMAIN_REQUIRED)) { return true; }
  //check if domain is required
  // return true if domain is required
  if (props.domainName && props.disableExecuteApiEndpoint === true) {
    return true;
  }
  return false;
}