import {
    aws_dynamodb as dynamodb,
    aws_autoscaling as autoscaling,
    aws_backup as backup
} from 'aws-cdk-lib';
import { CompliantDynamodbProps } from '.';

/**
 * AWS Config rules that I want to opt out
 * @default - table is compliant against all rules
 *
 * List of rules to opt out:
 *  'BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED',
    'DYNAMODB_IN_BACKUP_PLAN',
    'DYNAMODB_PITR_ENABLED',
    'DYNAMODB_AUTOSCALING_ENABLED',
    'DYNAMODB_THROUGHPUT_LIMIT_CHECK',
    'DYNAMODB_TABLE_ENCRYPTED_KMS',
    'DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED'
 */

/**
 * checks if throughput limit is defined
 * @param props 
 * @returns 
 */
export function checkThroughoutLimit(props: CompliantDynamodbProps): boolean {
    if(props.disabledRules?.includes('DYNAMODB_THROUGHPUT_LIMIT_CHECK')){
        return true;
    }
    if (props.billingMode == dynamodb.BillingMode.PROVISIONED) {
        if (props.readCapacity && props.writeCapacity) {
            return true;
        }
        return false;
    }
    return true;
}
/**
 * checks if autoscaling is enabled
 * @param props 
 * @returns 
 */
export function checkAutoscalingEnabled(props: CompliantDynamodbProps, table: dynamodb.Table): boolean {
    if(props.disabledRules?.includes('DYNAMODB_AUTOSCALING_ENABLED')){
        return true;
    }
    if (props.billingMode == dynamodb.BillingMode.PROVISIONED) {
        if ('autoScaleReadCapacity' in table && 'autoScaleWriteCapacity' in table) {
            return true;
        }
        return false;
    }
    return true;
}