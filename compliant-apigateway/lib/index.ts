import {
  aws_apigateway as apigw
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as serviceVal from './serviceValidation';
import * as serviceProps from './serviceProps';
import { CfnRestApi, EndpointConfiguration } from 'aws-cdk-lib/aws-apigateway';

export type DisabledRuleGateway = 'API_GW_ENDPOINT_TYPE_CHECK' | 'API_GW_CACHE_ENABLED_AND_ENCRYPTED' | 'API_GW_EXECUTION_LOGGING_ENABLED' | 'API_GW_DOMAIN_REQUIRED';
export type DisabledRuleStage = 'API_GW_CACHE_ENABLED_AND_ENCRYPTED' | 'API_GW_EXECUTION_LOGGING_ENABLED';

export interface CompliantApiStageProps extends apigw.StageProps {
  /**
  * AWS Config rules that I want to opt out
  * @default - construct is compliant against all rules
  *
  * List of rules to opt out:
  * 'API_GW_CACHE_ENABLED_AND_ENCRYPTED'
  * 'API_GW_EXECUTION_LOGGING_ENABLED'
  */
  readonly disabledRules?: DisabledRuleStage[];
}

export interface CompliantApigatewayProps extends apigw.RestApiProps {
  /**
   * AWS Config rules that I want to opt out
   * @default - construct is compliant against all rules
   *
   * List of rules to opt out:
   * 'API_GW_ENDPOINT_TYPE_CHECK'
   * 'API_GW_CACHE_ENABLED_AND_ENCRYPTED'
   * 'API_GW_EXECUTION_LOGGING_ENABLED'
   * 'API_GW_DOMAIN_REQUIRED'
   */
  readonly disabledRules?: DisabledRuleGateway[];
}
export class CompliantApiStage extends apigw.Stage {
  constructor(scope: Construct, id: string, props: CompliantApiStageProps) {
    super(scope, id, {
      ...props,
      cachingEnabled: serviceProps.getCacheEnabled(props),
      cacheDataEncrypted: serviceProps.getCacheEncrypted(props),
    });
    this.node.addValidation({
      validate: () => {
        return [
          ...serviceVal.checkExecutionLoggingEnabled(props) ? [] : ["Execution logging must be enabled."],
        ]
      }
    })
  }
}

export class CompliantApigateway extends apigw.RestApi {

  constructor(scope: Construct, id: string, props: CompliantApigatewayProps) {
    super(scope, id, {
      ...props,
      deployOptions: serviceProps.getDeployOptions(props),
    })
    this.node.addValidation({
      validate: () => {
        return [
          ...serviceVal.isEndpointTypeValid(((this?.node.defaultChild as CfnRestApi).endpointConfiguration as EndpointConfiguration), props) ? [] : ["Endpoint type is invalid."],
          ...serviceVal.checkDomainRequired(props) ? [] : ["Domain name is required and ExecuteApiEndpoint must be disabled."],
        ]
      }
    })
  }
}
