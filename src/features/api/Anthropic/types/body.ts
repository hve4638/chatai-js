import { Roles } from './roles';

export type AnthropicClaudeBody = {
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
    content: AnthropicMessageContent[];
}[];

export type AnthropicMessageContent = (
    {
        type: 'text';
        text: string;
    } | {
        type: 'image';
        source: {
            type: 'base64';
            media_type: string;
            data: string;
        } | {
            type: 'url';
            url: string;
        } | {
            type: 'file';
            file_id: string;
        };
    } | {
        type: 'document';
        source: {
            type: 'url';
            url: string;
        } | {
            type: 'base64',
            media_type: 'application/pdf',
            data: string
        } | {
            type: 'file',
            file_id: string;
        }
    }
);