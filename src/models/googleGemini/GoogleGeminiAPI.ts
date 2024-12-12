import { ChatAIError, ModelUnsupportError } from '../../errors';
import { RequestDataOption } from '../../types/IChatAIAPI';
import { CHAT_TYPE, type RequestForm } from '../../types/request-form'
import type { ChatAIResponse } from '../../types/response-data';

import { assertNotNull, AsyncQueue, bracketFormat } from '../../utils'

import ChatAIAPI from '../ChatAIAPI'

import { 
    GENIMIAPI_URL_FORMAT,
    GEMINIAPI_STREAM_URL_FORMAT,
    GENIMI_OPTION_SAFETY,
    ROLE,
    ROLE_DEFAULT,
} from './data'

type GeminiMessage = { 
    role: string;
    parts: ({text: string}|{inline_data:{mime_type:string, data:string}})[];
}[];

class GoogleGeminiAPI extends ChatAIAPI {
    makeRequestData(form:RequestForm, option:RequestDataOption):[string, object, object] {
        assertNotNull(form.secret?.api_key, 'form.secret.api_key is required');
        assertNotNull(form.model_detail, 'model_detail is required');
        
        let url = bracketFormat(GENIMIAPI_URL_FORMAT, {
            apikey : form.secret.api_key,
            modelname : form.model_detail
        });
        if (option.stream) {
            url = bracketFormat(GEMINIAPI_STREAM_URL_FORMAT, {
                apikey : form.secret.api_key,
                modelname : form.model_detail
            });
        }
        else {
            url = bracketFormat(GENIMIAPI_URL_FORMAT, {
                apikey : form.secret.api_key,
                modelname : form.model_detail
            });
        }

        const contents:GeminiMessage = [];
        for(const request of form.message) {
            const role = request.role;
            const parts = request.content.map(content => {
                if (content.chatType === CHAT_TYPE.TEXT) {
                    return {
                        text: content.text ?? ''
                    }
                }
                else if (content.chatType === CHAT_TYPE.IMAGE_URL) {
                    throw new ModelUnsupportError(`Gemini API does not support chatType : IMAGE_URL`);
                }
                else if (content.chatType === CHAT_TYPE.IMAGE_BASE64) {
                    return {
                        inline_data : {
                            'mime_type' : `image/${content.extension ?? 'jpeg'}`,
                            'data' : content.image_url ?? ''
                        }
                    }

                }
            });
            contents.push({
                role: ROLE[role] ?? ROLE_DEFAULT,
                parts: parts as any
            });
        }
        const generationConfig = {
            maxOutputTokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            topP: form.top_p ?? 1.0,
        };
        if (form.response_format) {
            if (!form.response_format.hasSchema()) {
                generationConfig['response_mime_type'] = 'application/json';
            }
            else {
                generationConfig['response_mime_type'] = 'application/json';
                generationConfig['response_schema'] = form.response_format.parse({
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
            safetySettings : GENIMI_OPTION_SAFETY
        };
        
        const headers = {
            'Content-Type': 'application/json'
        }
        return [url, body, {headers}];
    }
    
    handleResponse(res: any) {
        let warning: string | null;
      
        const reason = res.candidates[0]?.finishReason;
        const text:string = res.candidates[0]?.content?.parts[0].text ?? '';
        
        if (reason == 'STOP') warning = null;
        else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
        else if (reason == 'MAX_TOKENS') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;
        
        return {
            raw : res,

            content: [text],
            warning : warning,

            tokens : {
                input : res.usageMetadata?.promptTokenCount ?? 0,
                output : res.usageMetadata?.candidatesTokenCount ?? 0,
                total : res.usageMetadata?.totalTokenCount ?? 0,
            },
            finish_reason : reason,
        }
    }
    
    async handleStreamChunk(chunkOutputQueue:AsyncQueue, messageInputQueue:AsyncQueue):Promise<Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'>> {
        const contents:string[] = [];
        const response:Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'> = {
            raw: {},
            content: [],
            warning: null,
            tokens: {
                input: 0,
                output: 0,
                total : 0,
            },
            finish_reason: '',
        }
        let partOfChunk:string|null = null;
        while (true) {
            let text:string;
            const line = await chunkOutputQueue.dequeue();
            if (line === null) break;
            
            if (partOfChunk === null) {
                if (!line.startsWith('data:')) {
                    continue;
                }
                
                text = line.slice(5).trim();
            }
            else {
                text = partOfChunk + line;
                partOfChunk = null;
            }

            let chunkData:any;
            try {
                chunkData = JSON.parse(text);
            }
            catch (e) {
                partOfChunk = text;
                console.error('Incomplete chunk', text);
                continue;
            }

            const usage = chunkData.usageMetadata;
            if (usage) {
                response.tokens = {
                    input: usage.promptTokenCount ?? 0,
                    output: usage.candidatesTokenCount ?? 0,
                    total: usage.totalTokenCount ?? 0
                }
            }

            const firstCandidate = chunkData.candidates?.[0];
            if (firstCandidate) {
                if (firstCandidate.finishReason) {
                    const reason = firstCandidate.finishReason;
                    response.finish_reason = firstCandidate.finishReason;

                    let warning: string | null;
                    if (reason == 'STOP') warning = null;
                    else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
                    else if (reason == 'MAX_TOKENS') warning = 'max token limit';
                    else warning = `unhandle reason : ${reason}`;

                    response.warning = warning;
                }
                const content = firstCandidate.content?.parts[0]?.text ?? '';
                messageInputQueue.enqueue(content);
                contents.push(content);
            }
        }
        messageInputQueue.enableBlockIfEmpty(false);
        response.content.push(contents.join(''));
        return response;
    }
}

export default GoogleGeminiAPI;