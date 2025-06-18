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
        
        const body:any = {
            anthropic_version: 'vertex-2023-10-16',
            messages: messages,
            max_tokens: request.max_tokens ?? 1024,
        };
        if (system) body.system = system;
        if (request.temperature) body.temperature = request.temperature;
        if (request.top_p) body.top_p = request.top_p;

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