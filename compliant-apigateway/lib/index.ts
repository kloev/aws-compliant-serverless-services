import {
  aws_apigateway as apigw
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as serviceVal from './serviceValidation';
import * as serviceProps from './serviceProps';
import { CfnRestApi } from 'aws-cdk-lib/aws-apigateway';

export interface CompliantApiStageProps extends apigw.StageProps {
  /**
* AWS Config rules that I want to opt out
* @default - construct is compliant against all rules
*
* List of rules to opt out:
* 'API_GW_CACHE_ENABLED_AND_ENCRYPTED'
* 'API_GW_EXECUTION_LOGGING_ENABLED'
*/
  readonly disabledRules?: string[];
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
  readonly disabledRules?: string[];
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
          // checkWafAssociated
          // checkExecutionLoggingEnabled
          ...serviceVal.checkExecutionLoggingEnabled(props) ? [] : ["Execution logging is not enabled."],
        ]
      }
    })
  }
}

export class CompliantApigateway extends apigw.RestApi {

  constructor(scope: Construct, id: string, props: CompliantApigatewayProps) {
    super(scope, id, {
      ...props,
      deployOptions: serviceProps.getDeployOptionsv1(props),
    })
    this.node.addValidation({
      validate: () => {
        return [
          ...serviceVal.isEndpointTypeValid(((this?.node.defaultChild as CfnRestApi).endpointConfiguration as any), props) ? [] : ["Endpoint type is invalid."],
          ...serviceVal.checkDomainRequired(props) ? [] : ["Domain name is required and ExecuteApiEndpoint must be disabled."],
        ]
      }
    })
  }
}
