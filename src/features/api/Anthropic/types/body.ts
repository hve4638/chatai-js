import { Roles } from './roles';

export type AnthropicBody = {
    model: string
    messages: AnthropicMessages;
    system?: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stream?: boolean;

    thinking?: {
        type?: 'enabled';
        budget_tokens?: number;
    }
}

export type AnthropicMessages = {
    role: Roles;
    content: ({
        type: 'text';
        text: string;
    } | {
        type: 'image';
        source: {
            type: 'base64';
            media_type: string;
            data: string;
        };
    })[];
}[];