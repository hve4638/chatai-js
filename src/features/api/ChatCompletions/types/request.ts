import { ChatRoleName, ResponseFormat } from '@/types';
import type { APIKeyAuth, BaseRequest } from '@/types/request-data';

export interface ChatCompletionsRequest extends BaseRequest {
    top_p?: number;
    top_k?: number;
    thinking_effort?: 'low' | 'medium' | 'high';
    response_format?: ResponseFormat;
}
export interface ChatCompletionsData extends ChatCompletionsRequest, APIKeyAuth {}
