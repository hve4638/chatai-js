export type ChatCompletionsStreamData = {
    'id': string;
    'object': 'chat.completion.chunk';
    'created': number;
    'model': string;
    'service_tier': 'default' | string;
    'system_fingerprint': string;
    'choices': Array<{
        'index': 0,
        'delta': {
            'role': 'assistant',
            'content': '',
            'refusal': null
        } | {},
        'logprobs': null,
        'finish_reason': null | 'stop' | 'length';
    }>;
    'usage': {
        'prompt_tokens': number;
        'completion_tokens': number;
        'total_tokens': number;
        'prompt_tokens_details': {
            'cached_tokens': number;
            'audio_tokens': number;
        },
        'completion_tokens_details': {
            'reasoning_tokens': number;
            'audio_tokens': number;
            'accepted_prediction_tokens': number;
            'rejected_prediction_tokens': number;
        }
    } | null;
}