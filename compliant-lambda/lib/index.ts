import {
  aws_lambda as lambda
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as serviceVal from './serviceValidation';

export interface CompliantLambdaProps extends lambda.FunctionProps {
  // Define construct properties here

  /**
 * AWS Config rules that I want to opt out
 * @default - table is compliant against all rules
 *
 * List of rules to opt out:
 * LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED
 * LAMBDA_FUNCTION_SETTINGS_CHECK
 * LAMBDA_VPC_MULTI_AZ_CHECK
 * LAMBDA_INSIDE_VPC
 */
  readonly disabledRules?: string[];
}

export class CompliantLambda extends lambda.Function {

  constructor(scope: Construct, id: string, props: CompliantLambdaProps) {
    super(scope, id, {
      ...props,

    })

    this.node.addValidation({
      validate: () => {
        return [
          ...serviceVal.isRuntimeValid(this.runtime) ? [] : [`Lambda runtime is invalid`],
          ...serviceVal.checkNoPublicAccess(props) ? [] : ['Please disable public access.'],
          ...serviceVal.checkVpcEnabled(props) ? [] : ['Vpc not enabled.']
        ]
      }
    })
  }
}