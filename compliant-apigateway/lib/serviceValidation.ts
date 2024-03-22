import {
  aws_apigateway as apigw
} from 'aws-cdk-lib';
import { CompliantApigatewayProps, CompliantApiStageProps } from '.';

//Compliant config rules
const API_GW_ENDPOINT_TYPE_CHECK = 'API_GW_ENDPOINT_TYPE_CHECK';
// const API_GW_ASSOCIATED_WITH_WAF = 'API_GW_ASSOCIATED_WITH_WAF';
const API_GW_EXECUTION_LOGGING_ENABLED = 'API_GW_EXECUTION_LOGGING_ENABLED';
const API_GW_DOMAIN_REQUIRED = 'API_GW_DOMAIN_REQUIRED';


const validEndpoints = [
  apigw.EndpointType.EDGE,
  apigw.EndpointType.PRIVATE,
  apigw.EndpointType.REGIONAL,
]
/**
 * checks if endpoint type is valid
 * API_GW_ENDPOINT_TYPE_CHECK
 * @param epc : EndpointConfiguration
 * @param props : CompliantApigatewayProps
 * @returns boolean
 *  
*/
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
 * TO--DO
 * API_GW_ASSOCIATED_WITH_WAF
 * @param stage 
 * @returns 
 */
// export function checkWafAssociated(stage: apigw.Stage, props: CompliantApiStageProps): boolean {
//   if (props.disabledRules?.includes(API_GW_ASSOCIATED_WITH_WAF)) { return true; }

//   //check if an api gateway stage is associated with a waf
//   // return true if associated with a waf

//   // return false if not associated with a waf
//   return false;
// }

/**
 * checks if logging is enabled
 * API_GW_EXECUTION_LOGGING_ENABLED
 * @param props : CompliantApiStageProps
 * @returns boolean
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
 * checks if domain is required and executeApiEndpoint is disabled
 * API_GW_DOMAIN_REQUIRED
 * @param props : CompliantApigatewayProps
 * @returns boolean
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