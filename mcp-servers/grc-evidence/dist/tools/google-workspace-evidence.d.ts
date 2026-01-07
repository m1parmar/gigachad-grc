interface GoogleWorkspaceEvidenceParams {
    checks?: string[];
    timeRange?: {
        startTime: string;
        endTime: string;
    };
}
interface EvidenceResult {
    service: string;
    collectedAt: string;
    findings: unknown[];
    summary: {
        totalEvents: number;
        criticalFindings: number;
        warnings: number;
    };
}
export declare function collectGoogleWorkspaceEvidence(params: GoogleWorkspaceEvidenceParams): Promise<EvidenceResult>;
export {};
//# sourceMappingURL=google-workspace-evidence.d.ts.map