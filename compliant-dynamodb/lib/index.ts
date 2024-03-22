import {
  aws_dynamodb as dynamodb,
  aws_backup as backup,
  aws_events as events
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as serviceProps from './serviceProps';
import * as serviceVal from './serviceValidation';

export interface CompliantDynamodbProps extends dynamodb.TableProps {
  // Define construct properties here
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
      'DYNAMODB_BILLING_MODE'
   */
  readonly disabledRules?: string[];

  /**
   * Time to start the backup
   * @default - 9pm
   */
  readonly backupPlanStartTime?: events.Schedule;
}

export class CompliantDynamodbTable extends dynamodb.Table {
  // Define construct contents here
  readonly backupPlan!: backup.BackupPlan;
  readonly backupVault!: backup.BackupVault;
  constructor(scope: Construct, id: string, props: CompliantDynamodbProps) {
    super(scope, id, {
      ...props,
      encryption: serviceProps.getEncryption(props),
      pointInTimeRecovery: serviceProps.getPitr(props),
      billingMode: serviceProps.getBillingMode(props),
      deletionProtection: serviceProps.getDeletionDetection(props)
    });
    serviceProps.createBackupPlan(this, props);

    this.node.addValidation({
      validate: () => {
        return [
          ...serviceVal.checkThroughoutLimit(props) ? [] : ['Please set a throughput limit'],
          ...serviceVal.checkAutoscalingEnabled(props, this) ? [] : ['Please enable autoscaling'],
        ]
      }
    })
  }
}
