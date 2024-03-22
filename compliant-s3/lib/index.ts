import {
  aws_s3 as s3,
  aws_events as events,
  aws_s3_notifications as s3n
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as serviceVal from './serviceValidation';
import * as serviceProps from './serviceProps';
import { CfnBucket } from 'aws-cdk-lib/aws-s3';

export interface CompliantS3Props extends s3.BucketProps {
  // Define construct properties here
  /**
 * AWS Config rules that I want to opt out
 * @default - table is compliant against all rules
 *
 * List of rules to opt out:
 * S3_BUCKET_ACL_PROHIBITED
 * S3_BUCKET_DEFAULT_LOCK_ENABLED
 * S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED
 * S3_BUCKET_LOGGING_ENABLED
 * S3_BUCKET_PUBLIC_READ_PROHIBITED
 * S3_BUCKET_PUBLIC_WRITE_PROHIBITED
 * S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
 * S3_BUCKET_SSL_REQUESTS_ONLY
 * S3_DEFAULT_ENCRYPTION_KMS
 * S3_EVENT_NOTIFICATIONS_ENABLED
 * S3_LIFECYCLE_POLICY_CHECK
 * S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN
 */
  readonly disabledRules?: string[];

  /**
* Use an existing BackupVault and import it by name
* @default - create a new BackupVault
*/
  readonly backupVaultName?: string;

  /**
   * Days until the backup is deleted from the vault
   * @default - 35 days
   */
  readonly deleteBackupAfterDays?: number;

  /**
* Time to start the backup
* @default - 9pm
*/
  readonly backupPlanStartTime?: events.Schedule;
}

export class CompliantS3 extends s3.Bucket {

  constructor(scope: Construct, id: string, props: CompliantS3Props) {
    super(scope, id, {
      ...props,
      objectLockEnabled: serviceProps.getDefaultLock(props),
      blockPublicAccess: serviceProps.getPublicAccess(props),
      accessControl: serviceProps.getAclProhibited(props),
      enforceSSL: serviceProps.getSslRequestsOnly(props),
    });
    serviceProps.createBackupPlan(this, props);
    this.node.addValidation({
      validate: () => {
        return [
          ...serviceVal.checkLifecyclePolicy(props) ? [] : ['lifecycle policy is not enabled'],
          ...serviceVal.checkEventNotifications(this, props) ? [] : ['event notifications are not enabled'],
          ...serviceVal.checkPublicReadProhibited(((this?.node.defaultChild as CfnBucket).publicAccessBlockConfiguration as any), props) ? [] : ['public read is prohibited'],
          ...serviceVal.checkPublicWriteProhibited(((this?.node.defaultChild as CfnBucket).publicAccessBlockConfiguration as any), props) ? [] : ['public write is prohibited'],
          ...serviceVal.checkServerSideEncryption(props) ? [] : ['Please use an KMS key (aws managed or customer owned)'],
          ...serviceVal.checkEncryptionCustomerKMS(props) ? [] : ['please use customer managed KMS key for encryption'],
          ...serviceVal.checkLoggingEnabled(((this?.node.defaultChild as CfnBucket).loggingConfiguration as any), props) ? [] : ['logging is not enabled'],
        ]
      }
    })
  }
}
