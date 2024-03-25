import {
    aws_dynamodb as dynamodb,
    aws_autoscaling as autoscaling,
    aws_backup as backup
} from 'aws-cdk-lib';
import { CompliantDynamodbProps } from '.';

/**
 * checks if throughput limit is defined
 * @param props : CompliantDynamodbProps
 * @returns boolean
 */
export function checkThroughoutLimit(props: CompliantDynamodbProps): boolean {
    if (props.disabledRules?.includes('DYNAMODB_THROUGHPUT_LIMIT_CHECK')) {
        return true;
    }
    // if billing mode is not provisioned, then throughput limit is not required
    if (!(props.billingMode == dynamodb.BillingMode.PROVISIONED)) {
        return true;
    }
    if (props.readCapacity && props.writeCapacity) {
        return true;
    }
    return false;
}
/**
 * checks if autoscaling is enabled
 * @param props : CompliantDynamodbProps
 * @param table : dynamodb.Table
 * @returns boolean
 */
export function checkAutoscalingEnabled(props: CompliantDynamodbProps, table: dynamodb.Table): boolean {
    if (props.disabledRules?.includes('DYNAMODB_AUTOSCALING_ENABLED')) {
        return true;
    }
    // if billing mode is not provisioned, then throughput limit is not required
    if (!(props.billingMode == dynamodb.BillingMode.PROVISIONED)) {
        return true;
    }
    if ('autoScaleReadCapacity' in table && 'autoScaleWriteCapacity' in table) {
        return true;
    }
    return false;

}