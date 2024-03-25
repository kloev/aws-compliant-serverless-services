import {
    Duration,
    aws_backup as backup,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_iam as iam
} from 'aws-cdk-lib';
import { CompliantDynamodbProps } from '.';

//Compliant config rules
const DYNAMODB_BILLING_MODE = 'DYNAMODB_BILLING_MODE';
const DYNAMODB_IN_BACKUP_PLAN = 'DYNAMODB_IN_BACKUP_PLAN';
const DYNAMODB_PITR_ENABLED = 'DYNAMODB_PITR_ENABLED';
const DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED = "DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED";
const DYNAMODB_TABLE_ENCRYPTED_KMS = 'DYNAMODB_TABLE_ENCRYPTED_KMS';
const DYNAMODB_TABLE_ENCRYPTION_ENABLED = 'DYNAMODB_TABLE_ENCRYPTION_ENABLED';
const BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED = 'BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED';

const DELETE_BACK_AFTER_DAYS_DEFAULT = 35;

/**
 * sets encryption type to customer managed if not disabled 
 * 
 * @param props : CompliantDynamodbProps
 * @returns boolean
 */
export function getEncryption(props: CompliantDynamodbProps) {
    if (
        props.disabledRules?.includes(DYNAMODB_TABLE_ENCRYPTION_ENABLED) ||
        props.disabledRules?.includes(DYNAMODB_TABLE_ENCRYPTED_KMS)
    ) {
        return props.encryption;
    }
    if (props.disabledRules?.includes(DYNAMODB_TABLE_ENCRYPTION_ENABLED) &&
        props.disabledRules?.includes(DYNAMODB_TABLE_ENCRYPTED_KMS)) {
        return props.encryption;
    }
    return dynamodb.TableEncryption.CUSTOMER_MANAGED;
}

/**
 * checks if point in time recovery is enabled
 * @param props : CompliantDynamodbProps
 * @returns boolean
 */
export function getPitr(props: CompliantDynamodbProps) {
    if (props.disabledRules?.includes(DYNAMODB_PITR_ENABLED)) {
        return props.pointInTimeRecovery;
    }
    return !props.disabledRules?.includes(DYNAMODB_PITR_ENABLED);
}

/**
 * checks if deletion protection is enabled
 * @param props : CompliantDynamodbProps
 * @returns boolean
 */
export function getDeletionDetection(props: CompliantDynamodbProps) {
    if (props.disabledRules?.includes(DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED)) {
        return props.deletionProtection;
    }
    return !props.disabledRules?.includes(DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED);
}

/**
 * checks if billing mode is set to provisioned
 * @param props : CompliantDynamodbProps
 * @returns boolean
 */
export function getBillingMode(props: CompliantDynamodbProps) {
    if (props.disabledRules?.includes(DYNAMODB_BILLING_MODE)) {
        return props.billingMode;
    }
    return dynamodb.BillingMode.PAY_PER_REQUEST;
}

/**
 * creates a backup plan for the table
 * @param table : dynamodb.Table
 * @param props : CompliantDynamodbProps
 * @returns beackupPlan
 */
export function createBackupPlan(table: dynamodb.Table, props: CompliantDynamodbProps) {
    try {
        if (props.disabledRules?.includes(DYNAMODB_IN_BACKUP_PLAN)) {
            return undefined;
        }
        const backupPlan = new backup.BackupPlan(table, 'DynamoDbBackupPlan', {
            backupVault: createBackupVault(table, props),
            backupPlanRules: [
                new backup.BackupPlanRule({
                    ruleName: 'daily-dynamodb-backup-',
                    scheduleExpression:
                        props.backupPlanStartTime ??
                        events.Schedule.cron({
                            hour: '21',
                            minute: '0',
                        }),
                    deleteAfter: Duration.days(props.deleteBackupAfterDays ?? DELETE_BACK_AFTER_DAYS_DEFAULT),
                }),
            ],
        });
        backupPlan.addSelection('DynamoDb', {
            resources: [backup.BackupResource.fromArn(table.tableArn)],
        });
        return backupPlan;
    } catch (error) {
        console.error('An error occurred while creating the backup plan:', error);
        throw error;
    }
}

/**
 * creates a backup vault for the table
 * @param table : dynamodb.Table
 * @param props : CompliantDynamodbProps
 * @returns backupVault
 */
export function createBackupVault(table: dynamodb.Table, props: CompliantDynamodbProps) {
    try {
        if (props.disabledRules?.includes(BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED)) {
            const backupVault = new backup.BackupVault(table, 'DynamoDbBackupVault');
            return backupVault;
        }

        if (props.backupVaultName) {
            return backup.BackupVault.fromBackupVaultName(
                table,
                'ImportedBackupVault',
                props.backupVaultName,
            );
        }

        return new backup.BackupVault(table, 'DynamoDbBackupVault', {
            accessPolicy: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        sid: 'backup-recovery-point-manual-deletion-disabled',
                        effect: iam.Effect.DENY,
                        principals: [new iam.AnyPrincipal()],
                        actions: [
                            'backup:DeleteRecoveryPoint',
                            'backup:PutBackupVaultAccessPolicy',
                            'backup:UpdateRecoveryPointLifecycle',
                        ],
                        resources: ['*'],
                    }),
                ],
            }),
        });
    } catch (error) {
        console.error('An error occurred while creating the backup vault:', error);
        throw error;
    }
}