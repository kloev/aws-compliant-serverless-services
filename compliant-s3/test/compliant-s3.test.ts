import {
    App, Duration, Stack,
    aws_s3 as s3,
    aws_lambda as lambda,
    aws_s3_notifications as s3n,
    aws_events as events,
    aws_backup as backup,
    aws_iam as iam,
    aws_kms as kms
} from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CompliantS3 } from '../lib/index';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/index.ts

/**
 * Test for Compliant S3
 */
test('Compliant S3', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const kmskey = new kms.Key( stack, 'MyKey');
    const loggingbucket = new s3.Bucket(stack, 'MyLoggingBucket', {
        // bucketName: 'myloggingbucket',
        // accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
        // encryption: s3.BucketEncryption.S3_MANAGED,
    });
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
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
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        LoggingConfiguration: {
            DestinationBucketName: {
                Ref: 'MyLoggingBucket4382CD04'
            },
            LogFilePrefix: 'logs/'
        },
        ObjectLockEnabled: true,
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true
        },
        AccessControl: 'Private',
        // NotificationConfiguration: {
        //     LambdaConfigurations: [
        //         {
        //             Event: 's3:ObjectCreated:*',
        //             Filter: {
        //                 S3Key: {
        //                     Rules: [
        //                         {
        //                             Name: 'prefix',
        //                             Value: 'home/myusername/*'
        //                         }
        //                     ]
        //                 }
        //             },
        //             Function: myLambda.functionArn
        //         }
        //     ]
        // },
        BucketEncryption: {
            ServerSideEncryptionConfiguration: [
                {
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'aws:kms',
                        KMSMasterKeyID: {
                            "Fn::GetAtt": [
                                "MyKey6AB29FA6",
                                "Arn"
                            ]
                        }
                    }
                }
            ]
        },
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
        Bucket: {
            Ref: 'MyTestConstruct5DDB28CF'
        },
        PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: "s3:*",
                    Effect: "Deny",
                    Principal: { AWS: "*" },
                    Resource:
                        [{ "Fn::GetAtt": ["MyTestConstruct5DDB28CF", "Arn"] },
                        {
                            "Fn::Join":
                                [
                                    "",
                                    [
                                        {
                                            "Fn::GetAtt": [
                                                "MyTestConstruct5DDB28CF",
                                                "Arn"
                                            ]
                                        },
                                        "/*"
                                    ]
                                ]
                        }
                        ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        }
    });
    template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
            BackupPlanName: 's3BackupPlan',
            BackupPlanRule: [
                {
                    RuleName: 'daily-s3-backup',
                    TargetBackupVault: { "Fn::GetAtt": ["MyTestConstructs3BackupVault711E3461", "BackupVaultName"] },
                    ScheduleExpression: 'cron(0 21 * * ? *)',
                    Lifecycle: {
                        DeleteAfterDays: 35
                    }
                },
            ]
        }
    });
    template.hasResourceProperties('AWS::Backup::BackupVault', {
        AccessPolicy: {
            Statement: [
                {
                    Action: [
                        'backup:DeleteRecoveryPoint',
                        'backup:PutBackupVaultAccessPolicy',
                        'backup:UpdateRecoveryPointLifecycle',
                    ],
                    Effect: 'Deny',
                    Principal: {
                        AWS: '*',
                    },
                    Resource: '*',
                    Sid: 'backup-recovery-point-manual-deletion-disabled',
                },
            ],
            Version: '2012-10-17',
        },
    });
});

/**
 * Test for S3 with disabled rules -> non compliant
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
test('Non Compliant S3, with disabled rules, default settings', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack
        , 'MyTestConstruct', {
        bucketName: 'mybucket',
        disabledRules: [
            'S3_BUCKET_ACL_PROHIBITED',
            'S3_BUCKET_DEFAULT_LOCK_ENABLED',
            'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
            'S3_BUCKET_LOGGING_ENABLED',
            // 'S3_BUCKET_POLICY_GRANTEE_CHECK',
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
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        AccessControl: Match.absent(),
        ObjectLockEnabled: Match.absent(),
        BlockPublicAccess: Match.absent(),
        LoggingConfiguration: Match.absent(),
        PublicAccessBlockConfiguration: Match.absent(),
        LifecycleRules: Match.absent(),
        BucketEncryption: Match.absent(),
    });
});

/**
 * Test S3 Logging
 */
test('S3 with Logging with another Bucket', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const loggingbucket = new s3.Bucket(stack, 'MyLoggingBucket');
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        serverAccessLogsBucket: loggingbucket,
        serverAccessLogsPrefix: 'logs/',
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED']
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        LoggingConfiguration: {
            DestinationBucketName: {
                Ref: 'MyLoggingBucket4382CD04'
            },
            LogFilePrefix: 'logs/'
        },
    });
});

test('S3 with Logging in same Bucket', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        serverAccessLogsPrefix: 'logs/',
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED','S3_BUCKET_ACL_PROHIBITED']
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        LoggingConfiguration: {
            DestinationBucketName: Match.absent(),
            LogFilePrefix: 'logs/'
        },
    });
});

/**
 * Test S3 Encryption
 */
test('S3 with KMS Customer Owned Encryption', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const kmskey = new kms.Key( stack, 'MyKey');
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        encryptionKey: kmskey,
        encryption: s3.BucketEncryption.KMS,
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK','S3_BUCKET_LOGGING_ENABLED',]
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        BucketEncryption: {
            ServerSideEncryptionConfiguration: [
                {
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'aws:kms',
                        KMSMasterKeyID: {
                            "Fn::GetAtt": [
                                "MyKey6AB29FA6",
                                "Arn"
                            ]
                        }
                    }
                }
            ]
        },
    });
});

test('S3 with KMS Managed Encryption', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        encryption: s3.BucketEncryption.KMS_MANAGED,
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_LOGGING_ENABLED',]
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        BucketEncryption: {
            ServerSideEncryptionConfiguration: [
                {
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'aws:kms',
                    }
                }
            ]
        },
    });
});

test('S3 with S3 Managed Encryption', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        encryption: s3.BucketEncryption.S3_MANAGED,
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED',]
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        BucketEncryption: {
            ServerSideEncryptionConfiguration: [
                {
                    ServerSideEncryptionByDefault: {
                        SSEAlgorithm: 'AES256',
                    }
                }
            ]
        },
    });
});

test('S3 with Default Encryption', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED',]
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        BucketEncryption: Match.absent(),
    });
});

/**
 * Test S3 Public Access
 */
test('S3 without Public Access', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED',]
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true
        },
    });
});

test('S3 with Public Access', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED', 
        'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED', 'S3_BUCKET_PUBLIC_READ_PROHIBITED', 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED'],
        publicReadAccess: true,
        blockPublicAccess: {
            blockPublicPolicy: false,
            blockPublicAcls: false,
            ignorePublicAcls: false,
            restrictPublicBuckets: false,
        },
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'mybucket',
        PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false
        },
    });
});

/**
 * Test S3 Backup
 */
test('S3 with Backup, backup props defined', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED',],
        bucketName: 'mybucket',
        deleteBackupAfterDays: 30,
        backupPlanStartTime: events.Schedule.cron({ minute: '0', hour: '21' }),
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
            BackupPlanName: 's3BackupPlan',
            BackupPlanRule: [
                {
                    RuleName: 'daily-s3-backup',
                    TargetBackupVault: { "Fn::GetAtt": ["MyTestConstructs3BackupVault711E3461", "BackupVaultName"] },
                    ScheduleExpression: 'cron(0 21 * * ? *)',
                    Lifecycle: {
                        DeleteAfterDays: 30
                    }
                }
            ]
        }
    });
    template.hasResourceProperties('AWS::Backup::BackupVault', {
        AccessPolicy: {
            Statement: [
                {
                    Action: [
                        'backup:DeleteRecoveryPoint',
                        'backup:PutBackupVaultAccessPolicy',
                        'backup:UpdateRecoveryPointLifecycle',
                    ],
                    Effect: 'Deny',
                    Principal: {
                        AWS: '*',
                    },
                    Resource: '*',
                    Sid: 'backup-recovery-point-manual-deletion-disabled',
                },
            ],
            Version: '2012-10-17',
        },
    });
});

test('S3 with Backup, backup props defined with existing BackupVault', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const backupvault = new backup.BackupVault(stack, 'MyBackupVault', {
        backupVaultName: 'myBackupVault',
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
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        disabledRules: ['S3_LIFECYCLE_POLICY_CHECK','S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED',],
        bucketName: 'mybucket',
        backupVaultName: backupvault.backupVaultName,
        deleteBackupAfterDays: 30,
        backupPlanStartTime: events.Schedule.cron({ minute: '0', hour: '21' }),
    });
    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
            BackupPlanName: 's3BackupPlan',
            BackupPlanRule: [
                {
                    RuleName: 'daily-s3-backup',
                    TargetBackupVault: { "Fn::GetAtt": ["MyBackupVaultC4DF6F64", "BackupVaultName"] },
                    ScheduleExpression: 'cron(0 21 * * ? *)',
                    Lifecycle: {
                        DeleteAfterDays: 30
                    }
                }
            ]
        }
    });
    template.hasResourceProperties('AWS::Backup::BackupVault', {
        AccessPolicy: {
            Statement: [
                {
                    Action: [
                        'backup:DeleteRecoveryPoint',
                        'backup:PutBackupVaultAccessPolicy',
                        'backup:UpdateRecoveryPointLifecycle',
                    ],
                    Effect: 'Deny',
                    Principal: {
                        AWS: '*',
                    },
                    Resource: '*',
                    Sid: 'backup-recovery-point-manual-deletion-disabled',
                },
            ],
            Version: '2012-10-17',
        },
    });
});

test('S3 without Backup', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");
    // WHEN
    const s3bucket = new CompliantS3(stack, 'MyTestConstruct', {
        bucketName: 'mybucket',
        disabledRules: ['S3_RESOURCES_PROTECTED_BY_BACKUP_PLAN', 'S3_LIFECYCLE_POLICY_CHECK', 'S3_DEFAULT_ENCRYPTION_KMS', 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED', 'S3_BUCKET_LOGGING_ENABLED',],
    });
    // THEN
    expect(() => {
        const template = Template.fromStack(stack);
        template.hasResourceProperties('AWS::S3::Bucket', {
            BucketName: 'mybucket',
        });
        template.hasResource('AWS::Backup::BackupPlan', {});
        template.hasResource('AWS::Backup::BackupVault', {});
    }).toThrow();
});