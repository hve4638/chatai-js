import { Roles } from './roles';

export type ChatCompletionsMessages = {
    role: Roles;
    content: ({ type: 'text', text: string } | { type: 'image_url', image_url: string })[];
}[];
export interface ChatCompletionsBody {
    model: string;
    messages: ChatCompletionsMessages;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stream?: boolean;
    stream_options?: {
        include_usage?: boolean;
    }
    response_format?: ChatCompletionsResponseFormat;
}

export type ChatCompletionsResponseFormat = {
    type: 'json_object';
} | {
    type: 'json_schema';
    json_schema: {
        name: string;
        strict: boolean;
        schema: any;
    }
}