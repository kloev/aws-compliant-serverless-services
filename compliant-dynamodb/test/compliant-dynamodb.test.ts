import {
  App, Stack,
  aws_dynamodb as dynamodb
} from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CompliantDynamodbTable } from '../lib/index';
import * as serviceProps from '../lib/serviceProps';
import { BackupPlan, BackupPlanRule } from 'aws-cdk-lib/aws-backup';
/**
 * Fully Compliant Test
 */
test('DynamoDbTable is compliant - disabledRules empty', () => {
  // GIVEN
  const app = new App();
  const stack = new Stack(app, 'testing-stack');
  //WHEN
  new CompliantDynamodbTable(stack, 'DynamoDB', {
    partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    disabledRules: [],
  });
  //THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true,
    },
    BillingMode: 'PAY_PER_REQUEST',
    SSESpecification: {
      KMSMasterKeyId: {
        'Fn::GetAtt': ['DynamoDBKey4C4C6A3D', 'Arn'],
      },
      SSEEnabled: true,
      SSEType: 'KMS',
    },
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
  template.hasResourceProperties('AWS::Backup::BackupPlan', {});
});

test('DynamoDbTable is compliant - disabledRules not given', () => {
  // GIVEN
  const app = new App();
  const stack = new Stack(app, 'testing-stack');
  //WHEN
  new CompliantDynamodbTable(stack, 'DynamoDB', {
    partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  });
  //THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: true,
    },
    BillingMode: 'PAY_PER_REQUEST',
    SSESpecification: {
      KMSMasterKeyId: {
        'Fn::GetAtt': ['DynamoDBKey4C4C6A3D', 'Arn'],
      },
      SSEEnabled: true,
      SSEType: 'KMS',
    },
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
  template.hasResourceProperties('AWS::Backup::BackupPlan', {});
});

/**
 * Billing Mode Tests
 */
test('DynamoDB Billing Mode is PAY_PER_REQUEST', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: [],
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    BillingMode: 'PAY_PER_REQUEST'
  });
});

test('DynamoDB Billing Mode is PROVISIONED', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_AUTOSCALING_ENABLED', 'DYNAMODB_THROUGHPUT_LIMIT_CHECK', 'DYNAMODB_BILLING_MODE'],
    billingMode: dynamodb.BillingMode.PROVISIONED,
    readCapacity: 5,
    writeCapacity: 5,
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  });
});

test('DynamoDB Billing Mode is PAY_PER_REQUEST, even if PROVISIONED is given, rule not disabled', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: [],
    billingMode: dynamodb.BillingMode.PROVISIONED,
  });
  // THEN
  expect(() => {
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
    });
  }).toThrow();
});

/**
 * PITR Tests
 */
test('DynamoDB PITR enabled', () => {
  // WHEN
  const app = new App();
  const stack = new Stack(app, "TestStack");
  new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true }
  });
});

test('DynamoDB PITR should be enabled, even if defined PITR is disabled', () => {
  // WHEN
  const app = new App();
  const stack = new Stack(app, "TestStack");
  new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    pointInTimeRecovery: false
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true }
  });
});

test('DynamoDB PITR disabled', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_PITR_ENABLED'],
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    PointInTimeRecoverySpecification: Match.absent()
  });
});

/**
 * KMS Tests
 */
test('DynamoDB KMS Encryption is Customer Managed', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    SSESpecification: {
      SSEEnabled: true,
      SSEType: 'KMS'
    }
  })
});

test('DynamoDB KMS Encryption is default, DYNAMODB_TABLE_ENCRYPTED_KMS disabled', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_TABLE_ENCRYPTED_KMS']
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    SSESpecification: Match.absent()
  });
});

test('DynamoDB KMS Encryption is default, DYNAMODB_TABLE_ENCRYPTION_ENABLED and DYNAMODB_TABLE_ENCRYPTED_KMS disabled', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_TABLE_ENCRYPTION_ENABLED', 'DYNAMODB_TABLE_ENCRYPTED_KMS']
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    SSESpecification: Match.absent()
  })
});

test('DynamoDB KMS Encryption is AWS Managed', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_TABLE_ENCRYPTED_KMS'],
    encryption: dynamodb.TableEncryption.AWS_MANAGED
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    SSESpecification: {
      SSEEnabled: true,
      // SSEType: 'AWS_MANAGED'
    }
  });
});

test('DynamoDB KMS Encryption is AWS Owned', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_TABLE_ENCRYPTION_ENABLED', 'DYNAMODB_TABLE_ENCRYPTED_KMS'],
    encryption: dynamodb.TableEncryption.DEFAULT
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    SSESpecification: {
      SSEEnabled: false,
    }
  })
});

/**
 * Deletion Protection Tests
 */
test('DynamoDB Deletion Protection is enabled', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    DeletionProtectionEnabled: true,
  })
});

test('DynamoDB Deletion Protection is disabled', () => {
  const app = new App();
  const stack = new Stack(app, "TestStack");
  // WHEN
  const testtable = new CompliantDynamodbTable(stack, 'MyTestConstruct', {
    partitionKey: {
      name: 'id',
      type: dynamodb.AttributeType.STRING,
    },
    disabledRules: ['DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED']
  });
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    DeletionProtectionEnabled: Match.absent(),
  })
});