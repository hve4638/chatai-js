import { Roles } from './roles';

export interface ChatCompletionsBody {
    messages: ChatCompletionsMessages;
    model: string;

    /** @deprecated */
    max_tokens?: number;
    max_completion_tokens?: number;
    temperature?: number;
    top_p?: number;

    audio?: unknown;
    frequency_penalty?: number;
    logit_bias?: unknown;
    logprobs?: boolean;
    
    stream?: boolean;
    stream_options?: {
        include_usage?: boolean;
    }
    reasoning_effort?: 'low' | 'medium' | 'high';
    response_format?: ChatCompletionsBodyResponseFormat;
}

export type ChatCompletionsMessages = {
    role: Roles;
    content: (
        {
            type: 'text';
            text: string;
        } | {
            type: 'image_url';
            image_url: string;
        } | {
            type: 'file';
            file: {
                filename: string;
                file_data: string;
            } | {
                file_id: string;
            }
        })[];
}[];

export type ChatCompletionsBodyResponseFormat = {
    type: 'json_object';
} | {
    type: 'json_schema';
    json_schema: {
        name: string;
        strict: boolean;
        schema: any;
    }
}