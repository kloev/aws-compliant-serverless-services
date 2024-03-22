# Welcome to your CDK TypeScript Construct Library project

You should explore the contents of this project. It demonstrates a CDK Construct Library that includes a construct (`CompliantDynamodb`)
which contains an AWS DynamoDB table that is compliant against our rules.

The construct defines an interface (`CompliantDynamodbProps`) to configure a non-compliant version..

## Purpose 

The given construct aims to define an DynamoDB table that offers more data security by default. Therefore it has some of its properties predefined and validates some properties. 

## Use of an compliant DynamoDB table

This repo allows to use an compliant DynamoDB table. It is compliant against the following rules:
- [DYNAMODB_IN_BACKUP_PLAN] An backup of the table will be automatically created
- [BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED]  creates an backup vault
- [DYNAMODB_PITR_ENABLED] PITR is enabled by default
- [DYNAMODB_AUTOSCALING_ENABLED] autoscaling is required (provisioned billing)
- [DYNAMODB_THROUGHPUT_LIMIT_CHECK] it is required to put a thoughputlimit (provisioned billing)
- [DYNAMODB_TABLE_ENCRYPTED_KMS] the table required to be encrypted with a customer managed key
- [DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED] deletion protection is enabled by default
- [DYNAMODB_BILLING_MODE] billing mode is set to pay-per-request by default
These rules must be deactivated to use an non-compliant DynamoDB table, otherwise your settings will be overwritten. 

## Sample

create a fully compliant DynamoDb table with imported AWS Backup vault

```typescript
new CompliantDynamoDb(stack, 'MyCompliantDynamoDB', {
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.STRING,
  },
  backupVaultName: 'my-dynamodb-backup-vault',
  deleteBackupAfterDays: 90,
  backupPlanStartTime: 6,
});
```

Opt out of all rules (create a non compliant table)

```typescript
new CompliantDynamoDb(stack, 'MyNonCompliantDynamoDB', {
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.STRING,
  },
  disabledRules: [
    'BACKUP_RECOVERY_POINT_MANUAL_DELETION_DISABLED',
    'DYNAMODB_IN_BACKUP_PLAN',
    'DYNAMODB_PITR_ENABLED',
    'DYNAMODB_AUTOSCALING_ENABLED',
    'DYNAMODB_THROUGHPUT_LIMIT_CHECK',
    'DYNAMODB_TABLE_ENCRYPTED_KMS',
    'DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED',
    'DYNAMODB_BILLING_MODE'
  ],
});
```