import type { TextFormat, JSONObjectFormat, JSONSchemaFormat } from '@/types/response-format';
import type { APIKeyAuth, BaseRequest } from '@/types/request-data';

export type ChatCompletionsAllowedResponseFormat = TextFormat | JSONObjectFormat | JSONSchemaFormat;

export interface ChatCompletionsRequest extends BaseRequest {
    top_p?: number;
    top_k?: number;
    thinking_effort?: 'low' | 'medium' | 'high';
    response_format?: ChatCompletionsAllowedResponseFormat;
}
export interface ChatCompletionsData extends ChatCompletionsRequest, APIKeyAuth { }
