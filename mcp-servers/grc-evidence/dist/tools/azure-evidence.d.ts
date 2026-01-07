interface AzureEvidenceParams {
    subscriptionId: string;
    resourceTypes?: string[];
}
interface EvidenceResult {
    service: string;
    collectedAt: string;
    subscriptionId: string;
    findings: unknown[];
    summary: {
        totalResources: number;
        compliantResources: number;
        nonCompliantResources: number;
    };
}
export declare function collectAzureEvidence(params: AzureEvidenceParams): Promise<EvidenceResult>;
export {};
//# sourceMappingURL=azure-evidence.d.ts.map