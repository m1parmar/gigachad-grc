import { Injectable, Logger } from '@nestjs/common';

/**
 * AWS Integration Configuration
 */
export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  assumeRoleArn?: string;
}

/**
 * AWS Security Finding from Security Hub
 */
interface SecurityHubFinding {
  Id: string;
  Title: string;
  Description: string;
  Severity: { Label: string; Normalized: number };
  Compliance: { Status: string };
  ProductName: string;
  GeneratorId: string;
  Resources: Array<{ Type: string; Id: string; Region: string }>;
  CreatedAt: string;
  UpdatedAt: string;
}

/**
 * AWS CloudTrail Event
 */
interface CloudTrailEvent {
  EventId: string;
  EventName: string;
  EventSource: string;
  EventTime: string;
  Username: string;
  SourceIPAddress: string;
  UserAgent: string;
  Resources: Array<{ ResourceType: string; ResourceName: string }>;
}

/**
 * AWS Config Compliance Result
 */
interface ConfigComplianceResult {
  ConfigRuleName: string;
  ComplianceType: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | 'INSUFFICIENT_DATA';
  EvaluationResultIdentifier: {
    EvaluationResultQualifier: {
      ConfigRuleName: string;
      ResourceType: string;
      ResourceId: string;
    };
  };
  ResultRecordedTime: string;
}

/**
 * IAM User/Role Summary
 */
interface IAMSummary {
  users: Array<{
    UserName: string;
    UserId: string;
    Arn: string;
    CreateDate: string;
    PasswordLastUsed?: string;
    MFAEnabled: boolean;
    AccessKeys: Array<{ AccessKeyId: string; Status: string; CreateDate: string }>;
  }>;
  roles: Array<{
    RoleName: string;
    RoleId: string;
    Arn: string;
    CreateDate: string;
    AssumeRolePolicyDocument: any;
  }>;
  policies: Array<{
    PolicyName: string;
    PolicyId: string;
    Arn: string;
    AttachmentCount: number;
  }>;
}

/**
 * AWS Sync Result
 */
export interface AWSSyncResult {
  securityHub: {
    findings: SecurityHubFinding[];
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  cloudTrail: {
    events: CloudTrailEvent[];
    totalEvents: number;
    securityEvents: number;
  };
  config: {
    rules: ConfigComplianceResult[];
    compliantCount: number;
    nonCompliantCount: number;
    compliancePercentage: number;
  };
  iam: IAMSummary;
  s3: {
    buckets: Array<{
      Name: string;
      Region: string;
      PublicAccessBlocked: boolean;
      Encrypted: boolean;
      VersioningEnabled: boolean;
      LoggingEnabled: boolean;
    }>;
  };
  guardDuty: {
    findings: Array<{
      Id: string;
      Type: string;
      Severity: number;
      Title: string;
      Description: string;
      CreatedAt: string;
    }>;
    totalFindings: number;
  };
  collectedAt: string;
  errors: string[];
}

@Injectable()
export class AWSConnector {
  private readonly logger = new Logger(AWSConnector.name);

  /**
   * Test connection to AWS
   */
  async testConnection(config: AWSConfig): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    if (!config.accessKeyId || !config.secretAccessKey) {
      return { success: false, message: 'Access Key ID and Secret Access Key are required' };
    }

    try {
      // Test by calling STS GetCallerIdentity
      const response = await this.makeAWSRequest(
        'sts',
        config.region || 'us-east-1',
        'GetCallerIdentity',
        {},
        config,
      );

      if (response.error) {
        return { success: false, message: response.error };
      }

      return {
        success: true,
        message: `Connected to AWS as ${response.Arn || response.UserId}`,
        details: {
          accountId: response.Account,
          arn: response.Arn,
          userId: response.UserId,
        },
      };
    } catch (error: any) {
      this.logger.error('AWS connection test failed', error);
      return { success: false, message: error.message || 'Connection failed' };
    }
  }

  /**
   * Full sync - collect security evidence from AWS
   */
  async sync(config: AWSConfig): Promise<AWSSyncResult> {
    const errors: string[] = [];
    const region = config.region || 'us-east-1';

    this.logger.log('Starting AWS sync...');

    // Collect data from various AWS services in parallel
    const [securityHub, cloudTrail, configRules, iam, s3Buckets, guardDuty] = await Promise.all([
      this.getSecurityHubFindings(config, region).catch(e => {
        errors.push(`Security Hub: ${e.message}`);
        return { findings: [], totalFindings: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 };
      }),
      this.getCloudTrailEvents(config, region).catch(e => {
        errors.push(`CloudTrail: ${e.message}`);
        return { events: [], totalEvents: 0, securityEvents: 0 };
      }),
      this.getConfigCompliance(config, region).catch(e => {
        errors.push(`Config: ${e.message}`);
        return { rules: [], compliantCount: 0, nonCompliantCount: 0, compliancePercentage: 0 };
      }),
      this.getIAMSummary(config).catch(e => {
        errors.push(`IAM: ${e.message}`);
        return { users: [], roles: [], policies: [] };
      }),
      this.getS3BucketSecurity(config, region).catch(e => {
        errors.push(`S3: ${e.message}`);
        return { buckets: [] };
      }),
      this.getGuardDutyFindings(config, region).catch(e => {
        errors.push(`GuardDuty: ${e.message}`);
        return { findings: [], totalFindings: 0 };
      }),
    ]);

    this.logger.log(`AWS sync complete with ${errors.length} errors`);

    return {
      securityHub,
      cloudTrail,
      config: configRules,
      iam,
      s3: s3Buckets,
      guardDuty,
      collectedAt: new Date().toISOString(),
      errors,
    };
  }

  /**
   * Get Security Hub findings
   */
  private async getSecurityHubFindings(config: AWSConfig, region: string) {
    const response = await this.makeAWSRequest(
      'securityhub',
      region,
      'GetFindings',
      {
        Filters: {
          RecordState: [{ Value: 'ACTIVE', Comparison: 'EQUALS' }],
        },
        MaxResults: 100,
      },
      config,
    );

    const findings = response.Findings || [];
    
    return {
      findings: findings.slice(0, 50), // Limit for storage
      totalFindings: findings.length,
      criticalCount: findings.filter((f: any) => f.Severity?.Label === 'CRITICAL').length,
      highCount: findings.filter((f: any) => f.Severity?.Label === 'HIGH').length,
      mediumCount: findings.filter((f: any) => f.Severity?.Label === 'MEDIUM').length,
      lowCount: findings.filter((f: any) => f.Severity?.Label === 'LOW').length,
    };
  }

  /**
   * Get CloudTrail events (security-related)
   */
  private async getCloudTrailEvents(config: AWSConfig, region: string) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const response = await this.makeAWSRequest(
      'cloudtrail',
      region,
      'LookupEvents',
      {
        StartTime: startTime.toISOString(),
        EndTime: endTime.toISOString(),
        MaxResults: 50,
        LookupAttributes: [
          { AttributeKey: 'ReadOnly', AttributeValue: 'false' }, // Only write events
        ],
      },
      config,
    );

    const events = response.Events || [];
    const securityEventNames = [
      'CreateUser', 'DeleteUser', 'CreateAccessKey', 'DeleteAccessKey',
      'AttachUserPolicy', 'DetachUserPolicy', 'CreateRole', 'DeleteRole',
      'PutBucketPolicy', 'DeleteBucketPolicy', 'AuthorizeSecurityGroupIngress',
      'RevokeSecurityGroupIngress', 'CreateSecurityGroup', 'DeleteSecurityGroup',
    ];

    return {
      events,
      totalEvents: events.length,
      securityEvents: events.filter((e: any) => 
        securityEventNames.some(name => e.EventName?.includes(name))
      ).length,
    };
  }

  /**
   * Get AWS Config compliance status
   */
  private async getConfigCompliance(config: AWSConfig, region: string) {
    const response = await this.makeAWSRequest(
      'config',
      region,
      'DescribeComplianceByConfigRule',
      {},
      config,
    );

    const rules = response.ComplianceByConfigRules || [];
    const compliantCount = rules.filter((r: any) => r.Compliance?.ComplianceType === 'COMPLIANT').length;
    const nonCompliantCount = rules.filter((r: any) => r.Compliance?.ComplianceType === 'NON_COMPLIANT').length;

    return {
      rules,
      compliantCount,
      nonCompliantCount,
      compliancePercentage: rules.length > 0 
        ? Math.round((compliantCount / rules.length) * 100) 
        : 0,
    };
  }

  /**
   * Get IAM summary (users, roles, policies)
   */
  private async getIAMSummary(config: AWSConfig): Promise<IAMSummary> {
    // IAM is global, not regional
    const [usersResponse, rolesResponse, policiesResponse] = await Promise.all([
      this.makeAWSRequest('iam', 'us-east-1', 'ListUsers', {}, config),
      this.makeAWSRequest('iam', 'us-east-1', 'ListRoles', {}, config),
      this.makeAWSRequest('iam', 'us-east-1', 'ListPolicies', { Scope: 'Local' }, config),
    ]);

    // Get MFA status for each user
    const users = await Promise.all(
      (usersResponse.Users || []).slice(0, 20).map(async (user: any) => {
        const mfaResponse = await this.makeAWSRequest(
          'iam', 'us-east-1', 'ListMFADevices',
          { UserName: user.UserName },
          config,
        ).catch(() => ({ MFADevices: [] }));

        const keysResponse = await this.makeAWSRequest(
          'iam', 'us-east-1', 'ListAccessKeys',
          { UserName: user.UserName },
          config,
        ).catch(() => ({ AccessKeyMetadata: [] }));

        return {
          UserName: user.UserName,
          UserId: user.UserId,
          Arn: user.Arn,
          CreateDate: user.CreateDate,
          PasswordLastUsed: user.PasswordLastUsed,
          MFAEnabled: (mfaResponse.MFADevices || []).length > 0,
          AccessKeys: (keysResponse.AccessKeyMetadata || []).map((k: any) => ({
            AccessKeyId: k.AccessKeyId,
            Status: k.Status,
            CreateDate: k.CreateDate,
          })),
        };
      })
    );

    return {
      users,
      roles: (rolesResponse.Roles || []).slice(0, 20).map((r: any) => ({
        RoleName: r.RoleName,
        RoleId: r.RoleId,
        Arn: r.Arn,
        CreateDate: r.CreateDate,
        AssumeRolePolicyDocument: r.AssumeRolePolicyDocument,
      })),
      policies: (policiesResponse.Policies || []).map((p: any) => ({
        PolicyName: p.PolicyName,
        PolicyId: p.PolicyId,
        Arn: p.Arn,
        AttachmentCount: p.AttachmentCount,
      })),
    };
  }

  /**
   * Get S3 bucket security configuration
   */
  private async getS3BucketSecurity(config: AWSConfig, region: string) {
    const listResponse = await this.makeAWSRequest('s3', region, 'ListBuckets', {}, config);
    const buckets = listResponse.Buckets || [];

    const bucketDetails = await Promise.all(
      buckets.slice(0, 20).map(async (bucket: any) => {
        const [publicAccess, encryption, versioning, logging] = await Promise.all([
          this.makeAWSRequest('s3', region, 'GetPublicAccessBlock', { Bucket: bucket.Name }, config)
            .catch(() => null),
          this.makeAWSRequest('s3', region, 'GetBucketEncryption', { Bucket: bucket.Name }, config)
            .catch(() => null),
          this.makeAWSRequest('s3', region, 'GetBucketVersioning', { Bucket: bucket.Name }, config)
            .catch(() => null),
          this.makeAWSRequest('s3', region, 'GetBucketLogging', { Bucket: bucket.Name }, config)
            .catch(() => null),
        ]);

        return {
          Name: bucket.Name,
          Region: region,
          PublicAccessBlocked: !!(publicAccess?.PublicAccessBlockConfiguration?.BlockPublicAcls),
          Encrypted: !!encryption?.ServerSideEncryptionConfiguration,
          VersioningEnabled: versioning?.Status === 'Enabled',
          LoggingEnabled: !!logging?.LoggingEnabled,
        };
      })
    );

    return { buckets: bucketDetails };
  }

  /**
   * Get GuardDuty findings
   */
  private async getGuardDutyFindings(config: AWSConfig, region: string) {
    // First get the detector ID
    const detectorsResponse = await this.makeAWSRequest(
      'guardduty', region, 'ListDetectors', {}, config,
    );

    const detectorId = detectorsResponse.DetectorIds?.[0];
    if (!detectorId) {
      return { findings: [], totalFindings: 0 };
    }

    // Get findings
    const findingsResponse = await this.makeAWSRequest(
      'guardduty', region, 'ListFindings',
      { DetectorId: detectorId, MaxResults: 50 },
      config,
    );

    const findingIds = findingsResponse.FindingIds || [];
    if (findingIds.length === 0) {
      return { findings: [], totalFindings: 0 };
    }

    // Get finding details
    const detailsResponse = await this.makeAWSRequest(
      'guardduty', region, 'GetFindings',
      { DetectorId: detectorId, FindingIds: findingIds.slice(0, 20) },
      config,
    );

    const findings = (detailsResponse.Findings || []).map((f: any) => ({
      Id: f.Id,
      Type: f.Type,
      Severity: f.Severity,
      Title: f.Title,
      Description: f.Description,
      CreatedAt: f.CreatedAt,
    }));

    return {
      findings,
      totalFindings: findingIds.length,
    };
  }

  /**
   * Make AWS API request using Signature V4
   * Note: In production, use the official AWS SDK
   */
  private async makeAWSRequest(
    service: string,
    region: string,
    action: string,
    params: any,
    config: AWSConfig,
  ): Promise<any> {
    // This is a simplified implementation
    // In production, use @aws-sdk/client-* packages
    
    const endpoint = `https://${service}.${region}.amazonaws.com`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `${this.getServiceTarget(service)}.${action}`,
    };

    // For a real implementation, you would:
    // 1. Sign the request with AWS Signature V4
    // 2. Handle pagination
    // 3. Handle assume role if configured

    // Simulated response for demonstration
    // In production, replace with actual AWS SDK calls
    this.logger.debug(`AWS API call: ${service}.${action}`);
    
    return this.simulateAWSResponse(service, action);
  }

  private getServiceTarget(service: string): string {
    const targets: Record<string, string> = {
      sts: 'AWSSecurityTokenService',
      securityhub: 'SecurityHub',
      cloudtrail: 'CloudTrail_20131101',
      config: 'StarlingDoveService',
      iam: 'IAMService',
      s3: 'AmazonS3',
      guardduty: 'GuardDuty',
    };
    return targets[service] || service;
  }

  /**
   * Simulate AWS responses for demonstration
   * Replace with actual AWS SDK in production
   */
  private simulateAWSResponse(service: string, action: string): any {
    // This returns mock data structure
    // In production, use actual AWS SDK calls
    const mockResponses: Record<string, Record<string, any>> = {
      sts: {
        GetCallerIdentity: {
          Account: '123456789012',
          Arn: 'arn:aws:iam::123456789012:user/demo',
          UserId: 'AIDAEXAMPLEID',
        },
      },
      securityhub: {
        GetFindings: { Findings: [] },
      },
      cloudtrail: {
        LookupEvents: { Events: [] },
      },
      config: {
        DescribeComplianceByConfigRule: { ComplianceByConfigRules: [] },
      },
      iam: {
        ListUsers: { Users: [] },
        ListRoles: { Roles: [] },
        ListPolicies: { Policies: [] },
        ListMFADevices: { MFADevices: [] },
        ListAccessKeys: { AccessKeyMetadata: [] },
      },
      s3: {
        ListBuckets: { Buckets: [] },
      },
      guardduty: {
        ListDetectors: { DetectorIds: [] },
        ListFindings: { FindingIds: [] },
        GetFindings: { Findings: [] },
      },
    };

    return mockResponses[service]?.[action] || {};
  }
}

