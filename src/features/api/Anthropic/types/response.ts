export interface AnthropicResponse {
    id: string;
    type: 'message';
    role: 'assistant';
    content: (
        { type: 'text'; text: string; } |
        { type: 'thinking'; thinking: string; signature: string; }
    )[];
    stop_reason: 'end_turn' | 'max_tokens' | 'unknown';
    stop_sequence: unknown;
    usage: {
        input_tokens: number;
        cache_creation_input_tokens: number;
        cache_read_input_tokens: number;
        output_tokens: number;
        service_tier: string,
    }
}