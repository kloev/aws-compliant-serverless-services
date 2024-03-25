import {
    aws_s3 as s3,
    aws_backup as backup,
    aws_iam as iam,
    aws_events as events,
    Duration,
} from 'aws-cdk-lib';

import { CompliantS3Props } from '.';

const DELETE_BACK_AFTER_DAYS_DEFAULT = 35;
const BACKUP_CRON_SCHEDULE_DEFAULT = '21 0 * * ? *';

const S3_BUCKET_DEFAULT_LOCK_ENABLED = 'S3_BUCKET_DEFAULT_LOCK_ENABLED';
const S3_BUCKET_ACL_PROHIBITED = 'S3_BUCKET_ACL_PROHIBITED';
const S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED = 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED';
const S3_BUCKET_SSL_REQUESTS_ONLY = 'S3_BUCKET_SSL_REQUESTS_ONLY';
const S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN = 'S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN';
const BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED = 'BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED';

/**
 * S3_BUCKET_DEFAULT_LOCK_ENABLED
 * checks if the default lock is enabled
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function getDefaultLock(props: CompliantS3Props) {
    if (props.disabledRules?.includes(S3_BUCKET_DEFAULT_LOCK_ENABLED)) {
        return props.objectLockEnabled;
    }
    return !props.disabledRules?.includes(S3_BUCKET_DEFAULT_LOCK_ENABLED);
}

/**
 * S3_BUCKET_ACL_PROHIBITED
 * checks if ACL is prohibited
 * @param props : CompliantS3Props
 * @returns accessControl
 */
export function getAclProhibited(props: CompliantS3Props) {
    if (props.disabledRules?.includes(S3_BUCKET_ACL_PROHIBITED)) {
        return props.accessControl;
    }
    return s3.BucketAccessControl.PRIVATE;
}

/**
 * S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED
 * checks if public access is prohibited
 * @param props : CompliantS3Props
 * @returns publicAccess
 */
export function getPublicAccess(props: CompliantS3Props) {
    if (props.disabledRules?.includes(S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED)) {
        return props.blockPublicAccess;
    }
    return s3.BlockPublicAccess.BLOCK_ALL;
}

/**
 * S3_BUCKET_SSL_REQUESTS_ONLY
 * checks if SSL requests only
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function getSslRequestsOnly(props: CompliantS3Props){
    if (props.disabledRules?.includes('S3_BUCKET_SSL_REQUESTS_ONLY')) {
        return props.enforceSSL;
    }
    return !props.disabledRules?.includes(S3_BUCKET_SSL_REQUESTS_ONLY);
}

/**
 * creates a backup plan
 * @param s3 : s3 bucket
 * @param props : CompliantS3Props
 * @returns backupPlan
 */
export function createBackupPlan(s3: s3.Bucket, props: CompliantS3Props) {
    try {
        if (props.disabledRules?.includes(S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN)) {
            return undefined;
        }
        const backupPlan = new backup.BackupPlan(s3, 's3BackupPlan', {
            backupVault: createBackupVault(s3, props),
            backupPlanRules: [
                new backup.BackupPlanRule({
                    ruleName: 'daily-s3-backup' ,
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
        backupPlan.addSelection('s3', {
            resources: [backup.BackupResource.fromArn(s3.bucketArn)],
        });
        return backupPlan;
    } catch (error) {
        console.error('An error occurred while creating the backup plan:', error);
        throw error;
    }
}

/**
 * creates a backup vault
 * @param s3 : s3 bucket
 * @param props : CompliantS3Props
 * @returns backupVault
 */
export function createBackupVault(s3: s3.Bucket, props: CompliantS3Props) {
    try {
        if (props.disabledRules?.includes(BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED)) {
            const backupVault = new backup.BackupVault(s3, 's3BackupVault' + s3.bucketName);
            return backupVault;
        }

        if (props.backupVaultName) {
            return backup.BackupVault.fromBackupVaultName(
                s3,
                'ImportedBackupVault' + s3.bucketName,
                props.backupVaultName,
            );
        }

        return new backup.BackupVault(s3, 's3BackupVault', {
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