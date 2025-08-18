import type { APIKeyAuth, BaseRequest } from '@/types/request-data';
import { JSONObjectFormat, JSONSchemaFormat, TextFormat } from '@/types/response-format';

type ResponsesAllowedResponseFormat = TextFormat | JSONObjectFormat | JSONSchemaFormat;

export interface ResponsesRequest extends BaseRequest {
    top_p?: number;
    response_format?: ResponsesAllowedResponseFormat;

    thinking_effort?: 'minimal' | 'low' | 'medium' | 'high';
    thinking_summary?: 'auto' | 'concise' | 'detailed';
    verbosity: 'low' | 'medium' | 'high';
}
export interface ResponsesData extends ResponsesRequest, APIKeyAuth { }
