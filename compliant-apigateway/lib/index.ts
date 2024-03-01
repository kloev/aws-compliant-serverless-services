import {
  aws_apigateway as apigw
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as serviceVal from './serviceValidation';
import { CfnRestApi } from 'aws-cdk-lib/aws-apigateway';

export interface CompliantApiStageProps extends apigw.StageProps {
  // Define construct properties here
  /**
* AWS Config rules that I want to opt out
* @default - table is compliant against all rules
*
* List of rules to opt out:
* 'API_GW_ASSOCIATED_WITH_WAF'
* 'API_GW_CACHE_ENABLED_AND_ENCRYPTED'
* 'API_GW_EXECUTION_LOGGING_ENABLED'
*/
  readonly disabledRules?: string[];
}

export interface CompliantApigatewayProps extends apigw.RestApiProps {
  // Define construct properties here

  /**
 * AWS Config rules that I want to opt out
 * @default - table is compliant against all rules
 *
 * List of rules to opt out:
 * 'API_GW_ENDPOINT_TYPE_CHECK'
 */
  readonly disabledRules?: string[];
}
export class CompliantApiStage extends apigw.Stage {
  constructor(scope: Construct, id: string, props: apigw.StageProps) {
    super(scope, id, {
      ...props,
    });
    this.node.addValidation({
      validate: () => {
        return [
          // checkWafAssociated
          // checkCacheEnabledEncrytped
          // checkExecutionLoggingEnabled
        ]
      }
    })
  }
}

export class CompliantApigateway extends apigw.RestApi {

  constructor(scope: Construct, id: string, props: CompliantApigatewayProps) {
    super(scope, id, {
      ...props,
    })
    this.node.addValidation({
      validate: () => {
        return [
          // checkEndpointType
          ...serviceVal.isEndpointTypeValid(((this?.node.defaultChild as CfnRestApi).endpointConfiguration as any), props) ? [] : ["Endpoint type is invalid."]
        ]
      }
    })
  }
}
