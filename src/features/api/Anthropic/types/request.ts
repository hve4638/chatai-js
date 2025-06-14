import { ResponseFormat } from '@/types';
import type { BaseRequest, APIKeyAuth, VertexAIAuth } from '@/types/request-data';

export interface AnthropicRequest extends BaseRequest {
    top_p?: number;
    top_k?: number;
    response_format?: ResponseFormat;

    thinking_tokens?: number;
}
export interface AnthropicData extends AnthropicRequest, APIKeyAuth {}
export interface VertexAIAnthropicData extends AnthropicRequest, VertexAIAuth {}

