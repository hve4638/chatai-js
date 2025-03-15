import { ChatRoleName } from '@/types';

export const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
export const ENDPOINT_URL = '/v1beta/models/{{model_name}}:generateContent?key={{api_key}}';
export const STREAM_ENDPOINT_URL = '/v1beta/models/{{model_name}}:streamGenerateContent?alt=sse&key={{api_key}}';

export const DEFAULT_OPTIONS = {
    TOP_P: 1.0,
    TEMPERATURE : 1.0,
    MAX_OUTPUT_TOKENS : 1024,
    SAFETY_SETTINGS : [
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
        }
    ] as const,
}
