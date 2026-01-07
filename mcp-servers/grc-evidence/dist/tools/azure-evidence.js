import { DefaultAzureCredential } from '@azure/identity';
import { ResourceManagementClient } from '@azure/arm-resources';
export async function collectAzureEvidence(params) {
    const { subscriptionId, resourceTypes = ['security-center', 'key-vault', 'network', 'storage'] } = params;
    const findings = [];
    let compliantCount = 0;
    let nonCompliantCount = 0;
    try {
        const credential = new DefaultAzureCredential();
        const resourceClient = new ResourceManagementClient(credential, subscriptionId);
        // Collect resource groups
        const resourceGroups = [];
        for await (const rg of resourceClient.resourceGroups.list()) {
            resourceGroups.push({
                name: rg.name,
                location: rg.location,
                tags: rg.tags,
                provisioningState: rg.properties?.provisioningState,
            });
        }
        findings.push({
            type: 'resource_groups',
            count: resourceGroups.length,
            groups: resourceGroups,
        });
        // Collect resources by type
        for (const resourceType of resourceTypes) {
            try {
                switch (resourceType.toLowerCase()) {
                    case 'security-center':
                        findings.push(await collectSecurityCenterEvidence(subscriptionId));
                        break;
                    case 'key-vault':
                        findings.push(await collectKeyVaultEvidence(resourceClient));
                        break;
                    case 'network':
                        findings.push(await collectNetworkEvidence(resourceClient));
                        break;
                    case 'storage':
                        findings.push(await collectStorageEvidence(resourceClient));
                        break;
                    default:
                        findings.push({
                            type: resourceType,
                            error: `Unsupported resource type: ${resourceType}`,
                        });
                }
            }
            catch (error) {
                findings.push({
                    type: resourceType,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                nonCompliantCount++;
            }
        }
        // Calculate totals
        const resourceCount = findings.reduce((total, f) => {
            const finding = f;
            if (typeof finding.count === 'number') {
                return total + finding.count;
            }
            return total;
        }, 0);
        return {
            service: 'azure',
            collectedAt: new Date().toISOString(),
            subscriptionId,
            findings,
            summary: {
                totalResources: resourceCount,
                compliantResources: compliantCount,
                nonCompliantResources: nonCompliantCount,
            },
        };
    }
    catch (error) {
        return {
            service: 'azure',
            collectedAt: new Date().toISOString(),
            subscriptionId,
            findings: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
            summary: {
                totalResources: 0,
                compliantResources: 0,
                nonCompliantResources: 0,
            },
        };
    }
}
async function collectSecurityCenterEvidence(subscriptionId) {
    // Note: In a real implementation, you would use @azure/arm-security
    // This is a placeholder that shows the structure
    return {
        type: 'security_center',
        subscriptionId,
        collectedAt: new Date().toISOString(),
        findings: {
            secureScore: {
                current: 0,
                max: 100,
                percentage: 0,
            },
            recommendations: [],
            alerts: [],
            note: 'Azure Security Center evidence collection requires @azure/arm-security SDK',
        },
    };
}
async function collectKeyVaultEvidence(resourceClient) {
    const keyVaults = [];
    // List all Key Vault resources
    for await (const resource of resourceClient.resources.list({
        filter: "resourceType eq 'Microsoft.KeyVault/vaults'",
    })) {
        keyVaults.push({
            name: resource.name,
            location: resource.location,
            id: resource.id,
            tags: resource.tags,
            sku: resource.sku,
        });
    }
    return {
        type: 'key_vault',
        count: keyVaults.length,
        vaults: keyVaults,
        compliance: {
            // In a real implementation, you would check:
            // - Soft delete enabled
            // - Purge protection enabled
            // - Network rules configured
            // - Access policies properly configured
            note: 'Detailed Key Vault compliance checks require additional API calls',
        },
    };
}
async function collectNetworkEvidence(resourceClient) {
    const networkResources = {
        virtualNetworks: [],
        networkSecurityGroups: [],
        publicIpAddresses: [],
    };
    // List Virtual Networks
    for await (const resource of resourceClient.resources.list({
        filter: "resourceType eq 'Microsoft.Network/virtualNetworks'",
    })) {
        networkResources.virtualNetworks.push({
            name: resource.name,
            location: resource.location,
            id: resource.id,
        });
    }
    // List Network Security Groups
    for await (const resource of resourceClient.resources.list({
        filter: "resourceType eq 'Microsoft.Network/networkSecurityGroups'",
    })) {
        networkResources.networkSecurityGroups.push({
            name: resource.name,
            location: resource.location,
            id: resource.id,
        });
    }
    // List Public IP Addresses
    for await (const resource of resourceClient.resources.list({
        filter: "resourceType eq 'Microsoft.Network/publicIPAddresses'",
    })) {
        networkResources.publicIpAddresses.push({
            name: resource.name,
            location: resource.location,
            id: resource.id,
        });
    }
    return {
        type: 'network',
        count: networkResources.virtualNetworks.length +
            networkResources.networkSecurityGroups.length +
            networkResources.publicIpAddresses.length,
        resources: networkResources,
        compliance: {
            note: 'Detailed network compliance checks require examining NSG rules, VNet peering, etc.',
        },
    };
}
async function collectStorageEvidence(resourceClient) {
    const storageAccounts = [];
    // List Storage Accounts
    for await (const resource of resourceClient.resources.list({
        filter: "resourceType eq 'Microsoft.Storage/storageAccounts'",
    })) {
        storageAccounts.push({
            name: resource.name,
            location: resource.location,
            id: resource.id,
            sku: resource.sku,
            kind: resource.kind,
        });
    }
    return {
        type: 'storage',
        count: storageAccounts.length,
        accounts: storageAccounts,
        compliance: {
            // In a real implementation, you would check:
            // - HTTPS only
            // - Encryption at rest
            // - Public blob access disabled
            // - Network rules configured
            note: 'Detailed storage compliance checks require @azure/arm-storage SDK',
        },
    };
}
//# sourceMappingURL=azure-evidence.js.map