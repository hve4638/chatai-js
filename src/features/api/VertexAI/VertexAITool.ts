import { AnthropicAPITool, AnthropicRequest } from '../Anthropic';
import { GenerativeLanguageRequest, GenerativeLanguageTool } from '../GenerativeLanguage';
import { ChatAIRequestOption } from '../types';
import { VertexAIData } from './types';

class VertexAITool {
    static parseBody(request: VertexAIData, option: ChatAIRequestOption) {
        if (request.type === 'anthropic') {
            return VertexAITool.parseAnthropicBody(request, option);
        }
        else if (request.type === 'generative_language') {
            return VertexAITool.parseGenerativeLanguageBody(request, option);
        }
        else {
            return {};
        }
    }

    static parseAnthropicBody(request: AnthropicRequest, option: ChatAIRequestOption) {
        const { messages, system } = AnthropicAPITool.parseMessages(request.messages);

        const body = {
            anthropic_version: 'vertex-2023-10-16',
            messages: messages,
            system: system,
            max_tokens: request.max_tokens ?? 1024,
            temperature: request.temperature ?? 1.0,
            top_p: request.top_p ?? 1.0,
        };
        return body;
    }

    // Generative Language API
    static parseGenerativeLanguageBody(response: GenerativeLanguageRequest, option: ChatAIRequestOption) {
        return GenerativeLanguageTool.parseBody(response);
        const messages = GenerativeLanguageTool.parseMessages(response.messages);
        return {
            contents: messages,
            generationConfig: {
                maxOutputTokens: 1024,
            }
        };
    }

    static parseAnthropicResponseOK(response: any) {
        return AnthropicAPITool.parseResponseOK(response);
    }

    static parseGenerativeLanguageResponseOK(response: any) {
        return GenerativeLanguageTool.parseResponseOK(response);
    }
}

export default VertexAITool;