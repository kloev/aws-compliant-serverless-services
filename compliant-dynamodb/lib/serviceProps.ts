import {
    Duration,
    aws_backup as backup,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_iam as iam
} from 'aws-cdk-lib';
import { CompliantDynamodbProps } from '.';

//Compliant config rules
const DYNAMODB_AUTOSCALING_ENABLED = 'DYNAMODB_AUTOSCALING_ENABLED';
const DYNAMODB_IN_BACKUP_PLAN = 'DYNAMODB_IN_BACKUP_PLAN';
const DYNAMODB_PITR_ENABLED = 'DYNAMODB_PITR_ENABLED';
const DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED = "DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED";
const DYNAMODB_TABLE_ENCRYPTED_KMS = 'DYNAMODB_TABLE_ENCRYPTED_KMS';
const DYNAMODB_TABLE_ENCRYPTION_ENABLED = 'DYNAMODB_TABLE_ENCRYPTION_ENABLED';
const DYNAMODB_THROUGHPUT_LIMIT_CHECK = "DYNAMODB_THROUGHPUT_LIMIT_CHECK";
const BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED = 'BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED';

export function getEncryption(props: CompliantDynamodbProps) {
    try {
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
    } catch (error) {
        console.error('An error occurred while getting encryption:', error);
        throw error;
    }
}

export function getPitr(props: CompliantDynamodbProps) {
    try {
        if(props.disabledRules?.includes(DYNAMODB_PITR_ENABLED)){
            return props.pointInTimeRecovery;
        }
        return !props.disabledRules?.includes(DYNAMODB_PITR_ENABLED);
    } catch (error) {
        console.error('An error occurred while checking for Pitr:', error);
        throw error;
    }
}

export function getDeletionDetection(props: CompliantDynamodbProps) {
    try {
        if(props.disabledRules?.includes(DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED)){
            return props.deletionProtection;
        }
        return !props.disabledRules?.includes(DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED);
    } catch (error) {
        console.error('An error occurred while checking for deletion detection:', error);
        throw error;
    }
}

export function getBillingMode(props: CompliantDynamodbProps) {
    try {
        if (props.disabledRules?.includes(DYNAMODB_AUTOSCALING_ENABLED)) {
            return props.billingMode;
        }
        return dynamodb.BillingMode.PAY_PER_REQUEST;
    } catch (error) {
        console.error('An error occurred while getting billing mode:', error);
        throw error;
    }
}

export function createBackupPlan(table: dynamodb.Table, props: CompliantDynamodbProps) {
    try {
        if (props.disabledRules?.includes(DYNAMODB_IN_BACKUP_PLAN)) {
            return undefined;
        }
        const backupPlan = new backup.BackupPlan(table, 'DynamoDbBackupPlan', {
            backupVault: createBackupVault(table, props),
            backupPlanRules: [
                new backup.BackupPlanRule({
                    ruleName: 'daily-dynamodb-backup',
                    scheduleExpression:
                        props.backupPlanStartTime ??
                        events.Schedule.cron({
                            hour: '21',
                            minute: '0',
                        }),
                    deleteAfter: Duration.days(props.deleteBackupAfterDays ?? 35),
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