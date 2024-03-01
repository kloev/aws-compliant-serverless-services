import {
    aws_s3 as s3
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

// S3_BUCKET_LOGGING_ENABLED
export function checkLoggingEnabled(s3logging: s3.CfnBucket.LoggingConfigurationProperty, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_BUCKET_LOGGING_ENABLED')) {
        return true;
    }
    if (s3logging === undefined) {
        return false;
    }
    return true;
}

//regel muss überprüft werden ob so anwndbar
// S3_BUCKET_POLICY_GRANTEE_CHECK
// export function checkPolicyGrantee(s3policy: s3.BucketPolicy, props: CompliantS3Props): boolean {
//     if (props.disabledRules?.includes('S3_BUCKET_POLICY_GRANTEE_CHECK')) {
//         return true;
//     }
//     if (s3policy === undefined) {
//         return false;
//     }
//     return true;
// }

// S3_BUCKET_PUBLIC_READ_PROHIBITED
//The rule is compliant when both of the following are true:
// The Block Public Access setting restricts public policies or the bucket policy does not allow public read access.
// The Block Public Access setting restricts public ACLs or the bucket ACL does not allow public read access.
// The rule is noncompliant when:
// If the Block Public Access setting does not restrict public policies, AWS Config evaluates whether the policy allows public read access. If the policy allows public read access, the rule is noncompliant.
// If the Block Public Access setting does not restrict public bucket ACLs, AWS Config evaluates whether the bucket ACL allows public read access. If the bucket ACL allows public read access, the rule is noncompliant.
export function checkPublicReadProhibited(s3public: s3.BlockPublicAccess, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_BUCKET_PUBLIC_READ_PROHIBITED')) {
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

// S3_BUCKET_PUBLIC_WRITE_PROHIBITED
export function checkPublicWriteProhibited(s3public: s3.BlockPublicAccess, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_BUCKET_PUBLIC_WRITE_PROHIBITED')) {
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

// S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED
export function checkServerSideEncryption(props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED')) {
        return true;
    }
    if (props.encryption === undefined || props.encryption === 'UNENCRYPTED' || props.encryption === 'S3_MANAGED') {
        return false;
    }
    return true;
}

// S3_DEFAULT_ENCRYPTION_KMS
export function checkEncryptionCustomerKMS(props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_DEFAULT_ENCRYPTION_KMS')) {
        return true;
    }
    if(props.encryptionKey === undefined){
        return false;
    }
    return true;
}

// S3_EVENT_NOTIFICATIONS_ENABLED
export function checkEventNotifications(bucket: s3.Bucket, props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_EVENT_NOTIFICATIONS_ENABLED')) {
        return true;
    }
    if (bucket.addEventNotification === undefined) {
        return false;
    }
    return true;
}

// S3_LIFECYCLE_POLICY_CHECK
export function checkLifecyclePolicy(props: CompliantS3Props): boolean {
    if (props.disabledRules?.includes('S3_LIFECYCLE_POLICY_CHECK')) {
        return true;
    }
    if (props.lifecycleRules === undefined) {
        return false;
    }
    return true;
}

