import { JSONSchema } from '@/features/chatai/JSONSchema';
import { ChatAIRequest, ChatAIRequestOption, ChatRoleName, ChatType, type ChatAIRequestForm } from '@/types/request'
import type { ChatAIResult, ChatAIResultResponse } from '@/types/response';

import BaseEndpoint from '../BaseEndpoint'

import { assertFieldExists, assertNotNull, AsyncQueue, bracketFormat } from '@/utils'

import {
    DEFAULT_BASE_URL,
    ENDPOINT_URL,
    STREAM_ENDPOINT_URL,
    DEFAULT_OPTIONS,
} from './data'
import {
    GenerativeLanguageMessage,
    Roles,
    DefaultRole,
} from './types'
import {
    parseMessage
} from './message-parser'
import { parseGenerativeLanguageResponseFormat } from './response-format-parser';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';


class GenerativeLanguageEndpoint extends BaseEndpoint {
    get baseURL() {
        return DEFAULT_BASE_URL;
    }

    async makeRequestURL(form:ChatAIRequestForm, option:ChatAIRequestOption) {
        const baseURL = form.base_url ?? DEFAULT_BASE_URL;
        let url:string;
        if (option.stream) {
            url = baseURL + bracketFormat(STREAM_ENDPOINT_URL, {
                api_key : form.secret.api_key,
                model_name : form.model_name
            });
        }
        else {
            url = baseURL + bracketFormat(ENDPOINT_URL, {
                api_key : form.secret.api_key,
                model_name : form.model_name
            });
        }

        return url;
    }
    async makeRequestConfig(form:ChatAIRequestForm, option:ChatAIRequestOption):Promise<AxiosRequestConfig<any>> {
        const headers = {
            'Content-Type': 'application/json',
        }
        if (option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(form:ChatAIRequestForm, option:ChatAIRequestOption) {
        assertFieldExists(form.model_name, 'model_name');
        
        const contents:GenerativeLanguageMessage = parseMessage(form.message);
        const generationConfig = {
            maxOutputTokens: form.max_tokens ?? DEFAULT_OPTIONS.MAX_OUTPUT_TOKENS,
            temperature: form.temperature ?? DEFAULT_OPTIONS.TEMPERATURE,
            topP: form.top_p ?? DEFAULT_OPTIONS.TOP_P,
        };

        const responseFormat = parseGenerativeLanguageResponseFormat(form.response_format);
        if (responseFormat) {
            generationConfig['response_mime_type'] = responseFormat['response_mime_type'];
            generationConfig['response_schema'] = responseFormat['response_schema'];
        }
        if (form.response_format) {
            if (form.response_format.type == 'json') {
                const jsonFormat = form.response_format;
                if (!jsonFormat.schema) {
                    generationConfig['response_mime_type'] = 'application/json';
                }
                else {
                    const schema = JSONSchema.parse(jsonFormat.schema, {
                        'array' : (element)=> ({'type':'ARRAY', 'items':element}),
                        'object' : (properties, options) => {
                            return {
                                'type': 'OBJECT',
                                'properties': properties,
                            }
                        },
                        'boolean' : ()=>({'type' : 'BOOLEAN'}),
                        'number' : ()=>({'type' : 'NUMBER'}),
                        'string' : ()=>({'type' : 'STRING'}),
                    });

                    generationConfig['response_mime_type'] = 'application/json';
                    generationConfig['response_schema'] = schema;
                }
            }
        }
        if (form.additional?.response_mime_type) {
            generationConfig['response_mime_type'] = form.additional.response_mime_type;
        }
        if (form.additional?.response_schema) {
            generationConfig['response_schema'] = form.additional.response_schema;
        }
        
        const body = {
            contents: contents,
            generationConfig : generationConfig,
            safetySettings : DEFAULT_OPTIONS.SAFETY_SETTINGS,
        };
        
        return body;
    }
    async parseResponseOK(request:ChatAIRequest, response:AxiosResponse):Promise<ChatAIResultResponse> {
        const data = response.data
        let warning: string | null;
      
        const reason = data.candidates[0]?.finishReason;
        const text:string = data.candidates[0]?.content?.parts[0].text ?? '';
        
        if (reason == 'STOP') warning = null;
        else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
        else if (reason == 'MAX_TOKENS') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;
        
        return {
            ok : true,
            http_status : response.status,
            http_status_text : response.statusText,
            raw : data,

            content: [text],
            warning : warning,

            tokens : {
                input : data.usageMetadata?.promptTokenCount ?? 0,
                output : data.usageMetadata?.candidatesTokenCount ?? 0,
                total : data.usageMetadata?.totalTokenCount ?? 0,
            },
            finish_reason : reason,
        }
    }

    async mergeStreamFragment(streamConsumer:AsyncQueueConsumer<string>):Promise<unknown|null> {
        let partOfChunk:string|null = null;
        while(true) {
            const line = await streamConsumer.dequeue();
            if (line === null) return null;
            
            let fragment:string;
            if (partOfChunk === null) {
                if (!line.startsWith('data:')) {
                    continue;
                }
                
                fragment = line.slice(5).trim();
            }
            else {
                fragment = partOfChunk + line;
                partOfChunk = null;
            }

            try {
                return JSON.parse(fragment);
            }
            catch (e) {
                partOfChunk = fragment;
                console.error('Incomplete stream data : ', fragment);
                continue;
            }
        }
    }

    async parseStreamData(data:unknown, resultResponse:ChatAIResultResponse):Promise<string|undefined> {
        const streamData = data as {
            usageMetadata?: {
                promptTokenCount?: number,
                candidatesTokenCount?: number,
                totalTokenCount?: number,
            },
            candidates?: {
                finishReason?: string,
                content?: {
                    parts: {
                        text?: string
                    }[]
                }
            }[],
            modelVersion?: string,
        };

        const usage = streamData.usageMetadata;
        if (usage) {
            resultResponse.tokens = {
                input: usage.promptTokenCount ?? 0,
                output: usage.candidatesTokenCount ?? 0,
                total: usage.totalTokenCount ?? 0
            }
        }

        const firstCandidate = streamData.candidates?.[0];
        if (!firstCandidate) {
            return;
        }
        if (firstCandidate.finishReason) {
            const reason = firstCandidate.finishReason;
            resultResponse.finish_reason = firstCandidate.finishReason;

            let warning: string | null;
            if (reason == 'STOP') warning = null;
            else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
            else if (reason == 'MAX_TOKENS') warning = 'max token limit';
            else warning = `unhandle reason : ${reason}`;

            resultResponse.warning = warning;
        }
        
        return firstCandidate.content?.parts[0]?.text;
    }
    
    // handleResponse(res: any) {
    //     let warning: string | null;
      
    //     const reason = res.candidates[0]?.finishReason;
    //     const text:string = res.candidates[0]?.content?.parts[0].text ?? '';
        
    //     if (reason == 'STOP') warning = null;
    //     else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
    //     else if (reason == 'MAX_TOKENS') warning = 'max token limit';
    //     else warning = `unhandle reason : ${reason}`;
        
    //     return {
    //         raw : res,

    //         content: [text],
    //         warning : warning,

    //         tokens : {
    //             input : res.usageMetadata?.promptTokenCount ?? 0,
    //             output : res.usageMetadata?.candidatesTokenCount ?? 0,
    //             total : res.usageMetadata?.totalTokenCount ?? 0,
    //         },
    //         finish_reason : reason,
    //     }
    // }
    
    // async handleStreamChunk(chunkOutputQueue:AsyncQueue, messageInputQueue:AsyncQueue):Promise<Omit<ChatAIResult['response'],'ok'|'http_status'|'http_status_text'>> {
    //     const contents:string[] = [];
    //     const response:Omit<ChatAIResult['response'],'ok'|'http_status'|'http_status_text'> = {
    //         raw: {},
    //         content: [],
    //         warning: null,
    //         tokens: {
    //             input: 0,
    //             output: 0,
    //             total : 0,
    //         },
    //         finish_reason: '',
    //     }
    //     let partOfChunk:string|null = null;
    //     while (true) {
    //         let text:string;
    //         const line = await chunkOutputQueue.dequeue();
    //         if (line === null) break;
            
    //         if (partOfChunk === null) {
    //             if (!line.startsWith('data:')) {
    //                 continue;
    //             }
                
    //             text = line.slice(5).trim();
    //         }
    //         else {
    //             text = partOfChunk + line;
    //             partOfChunk = null;
    //         }

    //         let chunkData:any;
    //         try {
    //             chunkData = JSON.parse(text);
    //         }
    //         catch (e) {
    //             partOfChunk = text;
    //             console.error('Incomplete chunk', text);
    //             continue;
    //         }

    //         const usage = chunkData.usageMetadata;
    //         if (usage) {
    //             response.tokens = {
    //                 input: usage.promptTokenCount ?? 0,
    //                 output: usage.candidatesTokenCount ?? 0,
    //                 total: usage.totalTokenCount ?? 0
    //             }
    //         }

    //         const firstCandidate = chunkData.candidates?.[0];
    //         if (firstCandidate) {
    //             if (firstCandidate.finishReason) {
    //                 const reason = firstCandidate.finishReason;
    //                 response.finish_reason = firstCandidate.finishReason;

    //                 let warning: string | null;
    //                 if (reason == 'STOP') warning = null;
    //                 else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
    //                 else if (reason == 'MAX_TOKENS') warning = 'max token limit';
    //                 else warning = `unhandle reason : ${reason}`;

    //                 response.warning = warning;
    //             }
    //             const content = firstCandidate.content?.parts[0]?.text ?? '';
    //             messageInputQueue.enqueue(content);
    //             contents.push(content);
    //         }
    //     }
    //     messageInputQueue.enableBlockIfEmpty(false);
    //     response.content.push(contents.join(''));
    //     return response;
    // }
}

export default GenerativeLanguageEndpoint;