import type { BaseRequest, APIKeyAuth, VertexAIAuth } from '@/types/request-data';
import { JSONObjectFormat, JSONSchemaFormat, TextFormat } from '@/types/response-format';

export type AnthropicRequestResponseFormat = TextFormat | JSONObjectFormat | JSONSchemaFormat;

export interface AnthropicRequest extends BaseRequest {
    top_p?: number;
    top_k?: number;
    response_format?: AnthropicRequestResponseFormat;

    thinking_tokens?: number;
}
export interface AnthropicData extends AnthropicRequest, APIKeyAuth {}
export interface VertexAIAnthropicData extends AnthropicRequest, VertexAIAuth {}

