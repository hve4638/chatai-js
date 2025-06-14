export interface GenerativeLanguageResponse {
    candidates: {
        content: {
            parts: {
                text: string;
                thought?: boolean;
            }[];
            role: string;
        };
        finishReason: string;
        index: number;
    }[];
    usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
        promptTokensDetails: {
            modality: string;
            tokenCount: number;
        }[];
        thoughtsTokenCount: number;
    };
    modelVersion: string;
    responseId: string;
}
