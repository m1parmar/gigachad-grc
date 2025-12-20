# Evidence Collectors

Automate evidence collection from cloud providers and security tools.

## Overview

Evidence collectors automatically gather compliance evidence from:
- Cloud infrastructure (AWS, Azure)
- Identity providers (Okta, Google Workspace)
- Development platforms (GitHub)
- Device management (Jamf)

## Supported Integrations

### AWS

Collect evidence from Amazon Web Services:

| Evidence Type | Source |
|---------------|--------|
| S3 Bucket Configurations | Access policies, encryption settings |
| IAM Policies | User permissions, role configurations |
| EC2 Security Groups | Firewall rules, network access |
| VPC Flow Logs | Network traffic analysis |
| AWS Config Rules | Compliance rule status |

### Azure

Collect evidence from Microsoft Azure:

| Evidence Type | Source |
|---------------|--------|
| Resource Inventory | All deployed resources |
| Security Center | Security findings, recommendations |
| Policy Compliance | Azure Policy compliance status |
| Activity Logs | Administrative actions |
| Key Vault | Secret management status |

### GitHub

Collect evidence from GitHub repositories:

| Evidence Type | Source |
|---------------|--------|
| Branch Protection | Required reviews, status checks |
| Dependabot Alerts | Vulnerable dependencies |
| Secret Scanning | Exposed credentials |
| Code Scanning | Security vulnerabilities |
| Repository Settings | Access permissions |

### Okta

Collect evidence from Okta identity management:

| Evidence Type | Source |
|---------------|--------|
| MFA Enrollment | User MFA status |
| Password Policies | Password requirements |
| Inactive Users | Accounts not logged in |
| Admin Access | Administrative privileges |
| Application Access | Application assignments |

### Google Workspace

Collect evidence from Google Workspace:

| Evidence Type | Source |
|---------------|--------|
| User MFA Status | 2-Step Verification enrollment |
| Admin Roles | Administrative privileges |
| Drive Sharing | External sharing settings |
| Security Events | Login attempts, suspicious activity |
| Device Management | Managed device status |

### Jamf

Collect evidence from Jamf device management:

| Evidence Type | Source |
|---------------|--------|
| Device Encryption | FileVault status |
| OS Versions | Operating system currency |
| Security Patches | Patch compliance |
| Application Inventory | Installed software |
| Device Compliance | Policy compliance status |

## Setting Up Collectors

### 1. Navigate to Integrations

Go to **Data → Integrations → Evidence Collectors**

### 2. Add New Collector

Click **Add Collector** and select provider.

### 3. Configure Credentials

Provide required authentication:

| Provider | Credentials Needed |
|----------|-------------------|
| AWS | Access Key ID, Secret Access Key, Region |
| Azure | Tenant ID, Client ID, Client Secret |
| GitHub | Personal Access Token or OAuth App |
| Okta | API Token, Organization URL |
| Google | Service Account JSON |
| Jamf | API Credentials, Server URL |

### 4. Set Collection Schedule

Configure when to collect:

- **Hourly**: For real-time monitoring
- **Daily**: Standard compliance evidence
- **Weekly**: Less dynamic data
- **Manual**: On-demand only

### 5. Select Evidence Types

Choose what to collect:
- Toggle individual evidence types
- All types enabled by default
- Disable what's not needed

### 6. Test Connection

Click **Test Connection** to verify:
- Credentials are valid
- Permissions are sufficient
- Network access works

### 7. Save and Enable

Save configuration and enable collection.

## Evidence Collection

### Automatic Collection

Collections run on schedule:
1. Collector connects to source
2. Retrieves specified evidence
3. Uploads to evidence library
4. Links to relevant controls
5. Logs collection activity

### Manual Collection

Trigger collection on-demand:
1. Go to collector details
2. Click **Collect Now**
3. Wait for completion
4. Review collected evidence

### Collection Status

Monitor collection health:

| Status | Meaning |
|--------|---------|
| ✅ Success | Collection completed |
| ⚠️ Partial | Some evidence failed |
| ❌ Failed | Collection error |
| ⏳ Running | Currently collecting |
| ⏸️ Paused | Collection disabled |

## Credential Security

### Storage

Credentials are secured:
- Encrypted at rest (AES-256)
- Access controlled by RBAC
- Never exposed in logs
- Rotatable without disruption

### Best Practices

- Use service accounts, not personal
- Grant minimum required permissions
- Rotate credentials regularly
- Monitor for unauthorized use

### Required Permissions

#### AWS

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetBucketPolicy",
      "s3:GetBucketEncryption",
      "ec2:DescribeSecurityGroups",
      "iam:ListPolicies",
      "config:GetComplianceDetailsByConfigRule"
    ],
    "Resource": "*"
  }]
}
```

#### GitHub

Required scopes:
- `repo` (for private repos)
- `read:org`
- `admin:repo_hook`

#### Okta

Required permissions:
- Read-only Administrator
- Or custom role with necessary permissions

## Evidence Management

### Automatic Organization

Evidence is automatically:
- Named consistently
- Dated accurately
- Tagged by source
- Linked to controls

### Control Mapping

Map evidence to controls:
1. Configure control mappings
2. Evidence auto-links on collection
3. Or manually link afterward

### Retention

Collected evidence follows:
- Organization retention policies
- Automatic cleanup when expired
- Audit trail maintained

## Troubleshooting

### Connection Failed

1. Verify credentials are correct
2. Check network/firewall rules
3. Ensure service is accessible
4. Review error messages

### Missing Evidence

1. Check evidence types enabled
2. Verify permissions allow access
3. Review collection logs
4. Test with manual collection

### Stale Evidence

1. Check collection schedule
2. Review last collection status
3. Verify schedule is enabled
4. Look for errors in logs

### Rate Limiting

1. Reduce collection frequency
2. Limit evidence types
3. Use service account limits
4. Contact provider for increases

## Related Topics

- [Evidence Collection](../compliance/evidence.md)
- [Evidence Retention](evidence-retention.md)
- [Integrations](../integrations/connecting-integrations.md)

