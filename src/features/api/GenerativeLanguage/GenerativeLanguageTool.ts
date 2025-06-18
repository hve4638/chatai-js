import { GenerationConfig, GenerativeLanguageBody, GenerativeLanguageMessagePart, GenerativeLanguageMessages, GenerativeLanguageRequest, GenerativeLanguageResponse, HarmCategory, Roles, SafetyFilters, SafetySettings } from './types';

import { ResponseFormat, ChatAIResponse } from '@/types';
import { ModelUnsupportError } from '@/errors';
import {
    ChatMessages,
    ChatType,
    ChatRoleName,
} from '@/types/request';
import { JSONSchema } from '@/features/chatai';
import { ChatAIResultResponse, FinishReason } from '@/types/response';

type GoogleResponseFormat = {
    response_mime_type: 'application/json';
    response_schema?: any;
} | { response_mime_type: null; };

class GenerativeLanguageTool {
    static parseBody(request: GenerativeLanguageRequest): GenerativeLanguageBody {
        const contents: GenerativeLanguageMessages = GenerativeLanguageTool.parseMessages(request.messages);
        const generationConfig: GenerationConfig = {
            maxOutputTokens: request.max_tokens ?? 1024,
        };

        if (request.temperature) generationConfig.temperature = request.temperature;
        if (request.top_p) generationConfig.topP = request.top_p;

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
        const body: GenerativeLanguageBody = {
            contents: contents,
            generationConfig: generationConfig,
            safetySettings: safetySettings,
        } as any;

        return body;
    }

    static parseMessages(messages: ChatMessages): GenerativeLanguageMessages {
        const contents: GenerativeLanguageMessages = [];

        for (const request of messages) {
            const role = request.role;
            const parts: GenerativeLanguageMessagePart[] = request.content.map(content => {
                if (content.chatType === ChatType.Text) {
                    return {
                        text: content.text ?? ''
                    }
                }
                else if (content.chatType === ChatType.ImageBase64) {
                    return {
                        inline_data: {
                            'mime_type': `image/${content.extension ?? 'jpeg'}`,
                            'data': content.data ?? ''
                        }
                    } as GenerativeLanguageMessagePart;
                }
                else if (content.chatType === ChatType.PDFBase64) {
                    return {
                        inline_data: {
                            'mime_type': 'application/pdf',
                            'data': content.data
                        }
                    } as GenerativeLanguageMessagePart;
                }
                else if (content.chatType === ChatType.ImageURL) {
                    throw new ModelUnsupportError(`Generative Language API does not support chatType: IMAGE_URL`);
                }
                else if (content.chatType === ChatType.PDFUrl) {
                    throw new ModelUnsupportError(`Generative Language API does not support chatType: PDF_URL`);
                }
                else {
                    const unhandledType = (content as any)?.chatType;
                    throw new ModelUnsupportError(`Gemini API does not support chatType: ${unhandledType}`);
                }
            });

            contents.push({
                role: Roles[role] ?? Roles[ChatRoleName.User],
                parts: parts,
            });
        }
        return contents;
    }

    static parseResponseFormat(responseFormat?: ResponseFormat): GoogleResponseFormat {
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

    static parseSafetySettings(safetySettings?: Partial<SafetyFilters>): SafetySettings {
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

        const thinkingContent: string[] = [];
        const content: string[] = [];
        const candidate = data.candidates[0];
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

        let finishReason: FinishReason;
        let warning: string | null = null;
        switch (candidate.finishReason) {
            case 'STOP':
                finishReason = FinishReason.End;
                break;
            case 'MAX_TOKENS':
                finishReason = FinishReason.MaxToken;
                break;
            case 'SAFETY':
                finishReason = FinishReason.Blocked;
                warning = 'blocked by SAFETY';
                break;
            case 'OTHER':
                finishReason = FinishReason.Unknown;
                warning = 'blocked by OTHER';
                break;
            default:
                finishReason = FinishReason.Unknown;
                warning = `unhandled reason: ${candidate.finishReason}`;
                break;
        }

        return {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: data,

            content: content,
            thinking_content: thinkingContent,
            warning: warning,

            tokens: {
                input: data.usageMetadata?.promptTokenCount ?? 0,
                output: data.usageMetadata?.candidatesTokenCount ?? 0,
                total: data.usageMetadata?.totalTokenCount ?? 0,
            },
            finish_reason: finishReason,
        }
    }
}

export default GenerativeLanguageTool;