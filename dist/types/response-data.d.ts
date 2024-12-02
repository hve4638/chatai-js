export interface ChatAPIResponse {
    input?: {
        promptText: string;
        note: {
            [key: string]: string;
        };
        content: string[];
    };
    output: {
        content: string[];
    };
    tokens: number;
    finishReason: string;
    error: string | null;
    warning: string | null;
    normalResponse: boolean;
}
//# sourceMappingURL=response-data.d.ts.map