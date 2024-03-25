import {
    aws_s3 as s3
} from 'aws-cdk-lib';
import { CompliantS3Props } from '.';

const S3_BUCKET_LOGGING_ENABLED = 'S3_BUCKET_LOGGING_ENABLED';
const S3_BUCKET_PUBLIC_READ_PROHIBITED = 'S3_BUCKET_PUBLIC_READ_PROHIBITED';
const S3_BUCKET_PUBLIC_WRITE_PROHIBITED = 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED';
const S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED = 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED';
const S3_DEFAULT_ENCRYPTION_KMS = 'S3_DEFAULT_ENCRYPTION_KMS';
const S3_EVENT_NOTIFICATIONS_ENABLED = 'S3_EVENT_NOTIFICATIONS_ENABLED';
const S3_LIFECYCLE_POLICY_CHECK = 'S3_LIFECYCLE_POLICY_CHECK';


/**
 * S3_BUCKET_LOGGING_ENABLED
 * The rule is compliant when the bucket has logging enabled.
 * 
 * @param s3logging : s3.CfnBucket.LoggingConfigurationProperty
 * @param props : CompliantS3Props
 * @returns  boolean
 */
export function checkLoggingEnabled(s3logging: s3.CfnBucket.LoggingConfigurationProperty, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_BUCKET_LOGGING_ENABLED)) {
        return true;
    }
    if (s3logging === undefined) {
        return false;
    }
    return true;
}

/**
 * S3_BUCKET_PUBLIC_READ_PROHIBITED
 * The rule is compliant when both of the following are true:
 * - The Block Public Access setting restricts public policies or the bucket policy does not allow public read access.
 * - The Block Public Access setting restricts public ACLs or the bucket ACL does not allow public read access.
 * 
 * The rule is noncompliant when:
 * - If the Block Public Access setting does not restrict public policies, AWS Config evaluates whether the policy allows public read access. If the policy allows public read access, the rule is noncompliant.
 * - If the Block Public Access setting does not restrict public bucket ACLs, AWS Config evaluates whether the bucket ACL allows public read access. If the bucket ACL allows public read access, the rule is noncompliant.
 * @param s3public : s3.BlockPublicAccess
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function checkPublicReadProhibited(s3public: s3.BlockPublicAccess, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_BUCKET_PUBLIC_READ_PROHIBITED)) {
        return true;
    }
    if (
        (s3public?.blockPublicPolicy === true || s3public?.restrictPublicBuckets === true)
        && s3public?.blockPublicAcls === true
    ) {
        return true;
    }
    return false;
}

/**
 * S3_BUCKET_PUBLIC_WRITE_PROHIBITED
 * The rule is compliant when both of the following are true:
 * - The Block Public Access setting restricts public policies or the bucket policy does not allow public write access.
 * - The Block Public Access setting restricts public ACLs or the bucket ACL does not allow public write access.
 * 
 * @param s3public : s3.BlockPublicAccess
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function checkPublicWriteProhibited(s3public: s3.BlockPublicAccess, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_BUCKET_PUBLIC_WRITE_PROHIBITED)) {
        return true;
    }
    if (
        (s3public?.blockPublicPolicy === true || s3public?.restrictPublicBuckets === true) && s3public?.blockPublicAcls === true
    ) {
        return true;
    }
    return false;
}

/**
 * S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
 * The rule is compliant when server-side encryption is enabled for the S3 bucket.
 * 
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function checkServerSideEncryption(props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED)) {
        return true;
    }
    if (!props.encryption || props.encryption === 'UNENCRYPTED' || props.encryption === 'S3_MANAGED') {
        return false;
    }
    return true;
}

/**
 * S3_DEFAULT_ENCRYPTION_KMS
 * The rule is compliant when the default encryption key is set to a KMS key.
 * 
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function checkEncryptionCustomerKMS(props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_DEFAULT_ENCRYPTION_KMS)) {
        return true;
    }
    if (!props.encryptionKey) {
        return false;
    }
    return true;
}

/**
 * S3_EVENT_NOTIFICATIONS_ENABLED
 * The rule is compliant when the bucket has event notifications enabled.
 * @param bucket : s3.Bucket
 * @param props : CompliantS3Props
 * @returns boolean
 */
export function checkEventNotifications(bucket: s3.Bucket, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_EVENT_NOTIFICATIONS_ENABLED)) {
        return true;
    }
    if (!bucket.addEventNotification) {
        return false;
    }
    return true;
}

/**
 * S3_LIFECYCLE_POLICY_CHECK
 * The rule is compliant when the bucket has a lifecycle policy.
 * @param props : compliantS3Props
 * @returns boolean
 */
export function checkLifecyclePolicy(props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes(S3_LIFECYCLE_POLICY_CHECK)) {
        return true;
    }
    if (!props.lifecycleRules) {
        return false;
    }
    return true;
}

