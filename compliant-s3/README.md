# Welcome to your CDK TypeScript Construct Library project

You should explore the contents of this project. It demonstrates a CDK Construct Library that includes a construct (`CompliantS3`)
which contains an AWS S3 bucket that is compliant agianst our rules. 

The construct defines an interface (`CompliantS3Props`) to configure a non-compliant version.

## Purpose 

The given construct aims to define an S3 bucket that offers more data security by default. Therefore it has some of its properties predefined and validates some properties. 

## Use of an compliant S3 bucket
This repo allows to use an compliant S3 bucket and API Stage. It is compliant against the following rules:
- [S3_BUCKET_ACL_PROHIBITED] no ACL are allowed
- [S3_BUCKET_DEFAULT_LOCK_ENABLED] object lock is enabled
- [S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED] public access is forbidden
- [S3_BUCKET_LOGGING_ENABLED] logging must be defined
- [S3_BUCKET_PUBLIC_READ_PROHIBITED] public access is forbidden
- [S3_BUCKET_PUBLIC_WRITE_PROHIBITED] public access is forbidden
- [S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED] encryption must be enabled
- [S3_BUCKET_SSL_REQUESTS_ONLY] the bucket only allows ssl requests
- [S3_DEFAULT_ENCRYPTION_KMS] encryption must be secured by a customer managed key
- [S3_EVENT_NOTIFICATIONS_ENABLED] event notifications must be enabled
- [S3_LIFECYCLE_POLICY_CHECK] the bucket must have a lifecycle policy
- [S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN] a backup is automatically created
These rules must be deactivated to use an non-compliant S3 bucket, otherwise your settings will be overwritten. 

## Sample

create a fully compliant S3 bucket 

```typescript
const kmskey = new kms.Key( stack, 'MyKey');
    const loggingbucket = new s3.Bucket(stack, 'MyLoggingBucket', {
    });
    const s3bucket = new CompliantS3(stack, 'MyCompliantS3Bucket', {
        bucketName: 'mybucket',
        serverAccessLogsBucket: loggingbucket,
        serverAccessLogsPrefix: 'logs/',
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmskey,
        lifecycleRules: [
            {
                abortIncompleteMultipartUploadAfter: Duration.days(7),
                transitions: [
                    {
                        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                        transitionAfter: Duration.days(30)
                    }
                ]
            }
        ],
        publicReadAccess: false,
    });
    const myLambda = new lambda.Function(stack, 'MyLambda', {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline('exports.handler = function(event, ctx, cb) { return cb(null, "hi"); }')
    });
    s3bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(myLambda), { prefix: 'home/myusername/*' });
```

Opt out of all rules (create a non compliant S3 bucket)

```typescript
    const s3bucket = new CompliantS3(stack, 'MyNonCompliantS3Bucket', {
        bucketName: 'mybucket',
        disabledRules: [
            'S3_BUCKET_ACL_PROHIBITED',
            'S3_BUCKET_DEFAULT_LOCK_ENABLED',
            'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
            'S3_BUCKET_LOGGING_ENABLED',
            'S3_BUCKET_PUBLIC_READ_PROHIBITED',
            'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
            'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
            'S3_BUCKET_SSL_REQUESTS_ONLY',
            'S3_DEFAULT_ENCRYPTION_KMS',
            'S3_EVENT_NOTIFICATIONS_ENABLED',
            'S3_LIFECYCLE_POLICY_CHECK',
            'S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
        ],
    });
```