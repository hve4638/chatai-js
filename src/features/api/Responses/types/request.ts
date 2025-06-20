import { ChatRoleName, ResponseFormat } from '@/types';
import type { APIKeyAuth, BaseRequest } from '@/types/request-data';

export interface ResponsesRequest extends BaseRequest {
    top_p?: number;
    response_format?: ResponseFormat;

    thinking_effort?: 'low' | 'medium' | 'high';
    thinking_summary?: 'auto' | 'concise' | 'detailed';
}
export interface ResponsesData extends ResponsesRequest, APIKeyAuth { }
