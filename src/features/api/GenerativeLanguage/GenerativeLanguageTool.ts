import { GenerationConfig, GenerativeLanguageBody, GenerativeLanguageMessages, GenerativeLanguageRequest, GenerativeLanguageResponse, HarmCategory, Roles, SafetyFilters, SafetySettings } from './types';

import { ChatRoleName, ChatType, ChatAIRequestForm, ResponseFormat, ChatAIResponse } from '@/types';
import { ModelUnsupportError } from '@/errors';
import { ChatMessage } from '@/types/request';
import { JSONSchema } from '@/features/chatai';
import { ChatAIRequestOption } from '../types';
import { ChatAIResultResponse } from '@/types/response';

type GoogleResponseFormat = {
    response_mime_type: 'application/json';
    response_schema?: any;
} | { response_mime_type: null; };

class GenerativeLanguageTool {
    static parseBody(request: GenerativeLanguageRequest): GenerativeLanguageBody {
        const contents: GenerativeLanguageMessages = GenerativeLanguageTool.parseMessages(request.messages);
        const generationConfig: GenerationConfig = {
            maxOutputTokens: request.max_tokens ?? 1024,
            temperature: request.temperature ?? 1.0,
            topP: request.top_p ?? 1.0,
        };

        const responseFormat = GenerativeLanguageTool.parseResponseFormat(request.response_format);
        if (responseFormat.response_mime_type) {
            generationConfig.response_mime_type = responseFormat.response_mime_type;
            generationConfig.response_schema = responseFormat.response_schema;
        }

        if (request.thinking_summary) {
            generationConfig.thinkingConfig ??= {}
            generationConfig.thinkingConfig.includeThoughts = request.thinking_summary;
        }
        if (request.thinking_tokens) {
            generationConfig.thinkingConfig ??= {}
            generationConfig.thinkingConfig.thinkingBudget = request.thinking_tokens;
        }

        const safetySettings = GenerativeLanguageTool.parseSafetySettings(request.safety_settings);
        const body:GenerativeLanguageBody = {
            contents: contents,
            generationConfig: generationConfig,
            safetySettings: safetySettings,
        } as any;

        return body;
    }

    static parseMessages(messages: ChatMessage[]): GenerativeLanguageMessages {
        const contents: GenerativeLanguageMessages = [];

        for (const request of messages) {
            const role = request.role;
            const parts = request.content.map(content => {
                if (content.chatType === ChatType.TEXT) {
                    return {
                        text: content.text ?? ''
                    }
                }
                else if (content.chatType === ChatType.IMAGE_URL) {
                    throw new ModelUnsupportError(`Gemini API does not support chatType : IMAGE_URL`);
                }
                else if (content.chatType === ChatType.IMAGE_BASE64) {
                    return {
                        inline_data: {
                            'mime_type': `image/${content.extension ?? 'jpeg'}`,
                            'data': content.image_url ?? ''
                        }
                    }
                }
                else {
                    throw new ModelUnsupportError(`Gemini API does not support chatType : ${content.chatType}`);
                }
            });
            contents.push({
                role: Roles[role] ?? Roles[ChatRoleName.User],
                parts: parts,
            });
        }
        return contents;
    }

    static parseResponseFormat(responseFormat?: ResponseFormat):GoogleResponseFormat {
        if (!responseFormat) return { response_mime_type: null };

        if (responseFormat.type == 'json') {
            if (!responseFormat.schema) {
                return {
                    'response_mime_type': 'application/json',
                };
            }
            else {
                const schema = JSONSchema.parse(responseFormat.schema, {
                    'array': (element) => ({ 'type': 'ARRAY', 'items': element }),
                    'object': (properties, options) => {
                        return {
                            'type': 'OBJECT',
                            'properties': properties,
                        }
                    },
                    'boolean': () => ({ 'type': 'BOOLEAN' }),
                    'number': () => ({ 'type': 'NUMBER' }),
                    'string': () => ({ 'type': 'STRING' }),
                });

                return {
                    'response_mime_type': 'application/json',
                    'response_schema': schema,
                };
            }
        }

        return { response_mime_type: null };
    }

    static parseSafetySettings(safetySettings?: Partial<SafetyFilters>):SafetySettings {
        const safety = safetySettings ?? {};
        
        return Object.entries(safety).map(([category, value]) => {
            return {
                category: category as HarmCategory,
                threshold: value,
            }
        });
    }

    static parseResponseOK(response: ChatAIResponse<GenerativeLanguageResponse>): ChatAIResultResponse {
        const data = response.data;
        let warning: string | null;

        const thinkingContent: string[] = [];
        const content: string[] = [];
        const candidate = data.candidates[0]
        if (candidate.content.parts) { // 추론 모델에서 MAX_TOKENS로 끝났을 때 parts가 없을 수 있음
            for (const part of candidate.content.parts) {
                if (part.thought) {
                    thinkingContent.push(part.text);
                }
                else {
                    content.push(part.text);
                }
            }
        }

        if (content.length === 0) {
            content.push('');
        }

        const reason = candidate.finishReason;

        if (reason == 'STOP') warning = null;
        else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
        else if (reason == 'MAX_TOKENS') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;

        return {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: data,

            thinking_content: thinkingContent,
            content: content,
            warning: warning,

            tokens: {
                input: data.usageMetadata?.promptTokenCount ?? 0,
                output: data.usageMetadata?.candidatesTokenCount ?? 0,
                total: data.usageMetadata?.totalTokenCount ?? 0,
            },
            finish_reason: reason,
        }
    }
}

export default GenerativeLanguageTool;