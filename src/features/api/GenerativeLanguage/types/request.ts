
import { TextFormat, JSONSchemaFormat, JSONObjectFormat, EnumFormat } from '@/types/response-format';
import type { SafetyFilterThreshold } from './body';
import { BaseRequest, APIKeyAuth, VertexAIAuth } from '@/types/request-data';

export type GenerativeLanguageResponseFormat = TextFormat | JSONSchemaFormat | JSONObjectFormat | EnumFormat;

export interface GenerativeLanguageRequest extends BaseRequest{
    top_p?: number;
    top_k?: number;
    safety_settings?: Partial<SafetyFilters>;
    response_format?: GenerativeLanguageResponseFormat;
    
    thinking_tokens?: number;
    thinking_summary?: boolean;
}
export interface GenerativeLanguageData extends GenerativeLanguageRequest, APIKeyAuth {}
export interface VertexAIGenerativeLanguageData extends GenerativeLanguageRequest, VertexAIAuth {}

export type SafetyFilters = {
    HARM_CATEGORY_SEXUALLY_EXPLICIT: SafetyFilterThreshold;
    HARM_CATEGORY_HATE_SPEECH: SafetyFilterThreshold;
    HARM_CATEGORY_HARASSMENT: SafetyFilterThreshold;
    HARM_CATEGORY_DANGEROUS_CONTENT: SafetyFilterThreshold;
}
export type HarmCategory = keyof SafetyFilters;