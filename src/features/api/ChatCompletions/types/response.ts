export interface ChatCompletionsResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: (
        {
            index: number;
            message: {
                role: 'assistant';
                content: string;
                refusal?: unknown;
                annotations?: unknown[];
            };
            logprobes?: boolean;
            finish_reason: 'stop' | 'length';
        }
    )[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        prompt_tokens_details: {
            cached_tokens: number;
            audio_tokens: number;
        },
        completion_tokens_details: {
            reasoning_tokens: number;
            audio_tokens: number;
            accepted_prediction_tokens: number;
            rejected_prediction_tokens: number;
        }
    },
    service_tier: string;
}