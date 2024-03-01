import {
    aws_s3 as s3,
    aws_backup as backup,
    aws_iam as iam,
    aws_events as events,
    Duration,
} from 'aws-cdk-lib';

import { CompliantS3Props } from '.';

/**
* AWS Config rules that I want to opt out
* @default - table is compliant against all rules
*
* List of rules to opt out:
* S3_BUCKET_ACL_PROHIBITED
* S3_BUCKET_DEFAULT_LOCK_ENABLED
* S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED
* S3_BUCKET_LOGGING_ENABLED
* S3_BUCKET_POLICY_GRANTEE_CHECK
* S3_BUCKET_PUBLIC_READ_PROHIBITED
* S3_BUCKET_PUBLIC_WRITE_PROHIBITED
* S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
* S3_BUCKET_SSL_REQUESTS_ONLY
* S3_DEFAULT_ENCRYPTION_KMS
* S3_EVENT_NOTIFICATIONS_ENABLED
* S3_LIFECYCLE_POLICY_CHECK
* S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN
*/

const S3_BUCKET_DEFAULT_LOCK_ENABLED = 'S3_BUCKET_DEFAULT_LOCK_ENABLED';
const S3_BUCKET_ACL_PROHIBITED = 'S3_BUCKET_ACL_PROHIBITED';
const S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED = 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED';
const S3_BUCKET_SSL_REQUESTS_ONLY = 'S3_BUCKET_SSL_REQUESTS_ONLY';
const S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN = 'S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN';

//S3_BUCKET_DEFAULT_LOCK_ENABLED
export function getDefaultLock(props: CompliantS3Props) {
    if (props.disabledRules?.includes(S3_BUCKET_DEFAULT_LOCK_ENABLED)) {
        return props.objectLockEnabled;
    }
    return !props.disabledRules?.includes(S3_BUCKET_DEFAULT_LOCK_ENABLED);
}

//S3_BUCKET_ACL_PROHIBITED
export function getAclProhibited(props: CompliantS3Props) {
    if (props.disabledRules?.includes(S3_BUCKET_ACL_PROHIBITED)) {
        return props.accessControl;
    }
    return s3.BucketAccessControl.PRIVATE;
}

//S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED
export function getPublicAccess(props: CompliantS3Props) {
    if (props.disabledRules?.includes(S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED)) {
        return props.blockPublicAccess;
    }
    return s3.BlockPublicAccess.BLOCK_ALL;
}

// S3_BUCKET_SSL_REQUESTS_ONLY
export function getSslRequestsOnly(props: CompliantS3Props){
    if (props.disabledRules?.includes('S3_BUCKET_SSL_REQUESTS_ONLY')) {
        return props.enforceSSL;
    }
    return !props.disabledRules?.includes(S3_BUCKET_SSL_REQUESTS_ONLY);
}

// S3_DEFAULT_ENCRYPTION_KMS
// export function getEncryption(props: CompliantS3Props){
//     if (props.disabledRules?.includes('S3_DEFAULT_ENCRYPTION_KMS')) {
//         return props.encryption;
//     }
//     return s3.BucketEncryption.KMS;
// }

export function createBackupPlan(s3: s3.Bucket, props: CompliantS3Props) {
    try {
        if (props.disabledRules?.includes(S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN)) {
            return undefined;
        }
        const backupPlan = new backup.BackupPlan(s3, 's3BackupPlan', {
            backupVault: createBackupVault(s3, props),
            backupPlanRules: [
                new backup.BackupPlanRule({
                    ruleName: 'daily-s3-backup',
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
        backupPlan.addSelection('s3', {
            resources: [backup.BackupResource.fromArn(s3.bucketArn)],
        });
        return backupPlan;
    } catch (error) {
        console.error('An error occurred while creating the backup plan:', error);
        throw error;
    }
}

export function createBackupVault(s3: s3.Bucket, props: CompliantS3Props) {
    try {
        if (props.disabledRules?.includes(S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN)) {
            const backupVault = new backup.BackupVault(s3, 's3BackupVault');
            return backupVault;
        }

        if (props.backupVaultName) {
            return backup.BackupVault.fromBackupVaultName(
                s3,
                'ImportedBackupVault',
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