import { ChatAIResultResponse, FinishReason } from '@/types';

export function getDefaultChatAIResponse(): ChatAIResultResponse {
    return {
        ok: false,
        http_status: 0,
        http_status_text: '',
        raw: undefined,
        thinking_content: [],
        content: [],
        warning: null,
        tokens: {
            input: 0,
            output: 0,
            total: 0
        },
        finish_reason: FinishReason.Unknown,
    };
}