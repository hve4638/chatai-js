import { GenerationConfig, GenerativeLanguageBody, GenerativeLanguageMessagePart, GenerativeLanguageMessages, GenerativeLanguageRequest, GenerativeLanguageResponse, GenerativeLanguageResponseFormat, HarmCategory, Roles, SafetyFilters, SafetySettings } from './types';

import { ChatAIResponse } from '@/types';
import { ModelUnsupportError } from '@/errors';
import {
    ChatMessages,
    ChatType,
    ChatRoleName,
} from '@/types/request';
import { ChatAIResultResponse, FinishReason } from '@/types/response';
import { JSONSchema } from '@/features/response-format';

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

    static parseResponseFormat(responseFormat?: GenerativeLanguageResponseFormat): GoogleResponseFormat {
        if (!responseFormat) {
            return { response_mime_type: null }
        }
        else if (responseFormat.type == 'text') {
            return { response_mime_type: null }
        }
        else if (responseFormat.type == 'json_object') {
            return {
                'response_mime_type': 'application/json',
            };
        }
        else if (responseFormat.type == 'json_schema') {
            const schema = JSONSchema.parse(responseFormat.schema, {
                'array': (schema, element) => ({ 'type': 'ARRAY', 'items': element }),
                'object': ({ description }, fields, option) => {
                    return {
                        'type': 'OBJECT',
                        'properties': fields,
                        'required': option.required,
                        ...(description && { description })
                    }
                },
                'boolean': ({ description }) => ({ 'type': 'BOOLEAN', ...(description && { description }) }),
                'number': ({ description }) => ({ 'type': 'NUMBER', ...(description && { description }) }),
                'string': ({ description }) => ({ 'type': 'STRING', ...(description && { description }) }),
                'enum': ({ enum: choices, description }) => ({ type: 'STRING', enum: choices, ...(description && { description }) }),
            });

            return {
                'response_mime_type': 'application/json',
                'response_schema': schema,
            };
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

        let { finishReason, warning = null } = this.parseFinishReason(candidate.finishReason);

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

    static parseFinishReason(reason: string): { finishReason: FinishReason; warning: string | null; } {
        switch (reason) {
            case 'STOP':
                return {
                    finishReason: FinishReason.End,
                    warning: null,
                };
            case 'MAX_TOKENS':
                return {
                    finishReason: FinishReason.MaxToken,
                    warning: null,
                };
                break;
            case 'SAFETY':
                return {
                    finishReason: FinishReason.Blocked,
                    warning: 'blocked by SAFETY',
                }
            case 'OTHER':
                return {
                    finishReason: FinishReason.Unknown,
                    warning: 'blocked by OTHER',
                };
            default:
                return {
                    finishReason: FinishReason.Unknown,
                    warning: `unhandled reason: ${reason}`,
                }
        }
    }
}

export default GenerativeLanguageTool;