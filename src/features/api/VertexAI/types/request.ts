import type { AnthropicRequest } from '@/features/api/Anthropic';
import type { GenerativeLanguageRequest } from '@/features/api/GenerativeLanguage';
import type { VertexAIAuth } from '@/types/request-data';

interface VertexAIGenerativeLanguageData extends GenerativeLanguageRequest, VertexAIAuth {
    type: 'generative_language';
    publisher: 'google';
}; 
interface VertexAIAnthropicData extends AnthropicRequest, VertexAIAuth {
    type: 'anthropic';
    publisher: 'anthropic';
}

export type VertexAIData = VertexAIAnthropicData | VertexAIGenerativeLanguageData;