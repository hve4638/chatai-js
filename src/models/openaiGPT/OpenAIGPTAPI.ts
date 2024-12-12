import { CHAT_ROLE, CHAT_TYPE, RequestDebugOption } from '../../types/request-form'
import type { RequestForm } from '../../types/request-form'

import { OPENAI_GPT_URL, ROLE, ROLE_DEFAULT } from './data'

import { assertFieldExists, assertNotNull, AsyncQueue } from '../../utils'

import ChatAIAPI from '../ChatAIAPI'
import { RequestDataOption } from '../../types/IChatAIAPI'
import { ChatAIResponse } from '../../types'

type GPTMessage = {
    role: ROLE;
    content: string|{type:string, text:string}|{type:string, image_url:string}[];
}[];

class OpenAIGPTAPI extends ChatAIAPI {
    makeRequestData(form:RequestForm, option: RequestDataOption): [string, object, object] {
        assertFieldExists(form.secret.api_key, 'secret.api_key');
        assertFieldExists(form.model_detail, 'model_detail');

        const message:GPTMessage = [];
        for(const m of form.message) {
            if (m.content.length === 0) continue;
            if (m.content.length === 1) {
                message.push({
                    role: ROLE[m.role] ?? ROLE_DEFAULT,
                    content: m.content[0].text!
                });
            }
            else {
                const chatBlock = {
                    role: ROLE[m.role] ?? ROLE_DEFAULT,
                    content: [] as any[]
                };
                for (const chat of m.content) {
                    if (chat.chatType === CHAT_TYPE.TEXT) {
                        chatBlock.content.push({
                            type : 'text',
                            text : chat.text
                        });
                    }
                    else if (chat.chatType === CHAT_TYPE.IMAGE_URL) {
                        chatBlock.content.push({
                            type : 'image_url',
                            image_url : {
                                url : chat.image_url
                            }
                        });
                    }
                    else if (chat.chatType === CHAT_TYPE.IMAGE_BASE64) {
                        chatBlock.content.push({
                            type : 'image_url',
                            image_url : {
                                url : `data:image/${chat.extension ?? 'jpeg'};base64,${chat.image_url}`
                            }
                        });
                    }
                }

                message.push(chatBlock);
            }
            message.push({
                role: ROLE[m.role] ?? ROLE_DEFAULT,
                content: m.content[0].text!
            });
        }
        
        const url = OPENAI_GPT_URL;
        const body = {
            model : form.model_detail,
            messages : message,
            max_tokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            top_p : form.top_p ?? 1.0,
            
        }
        if (option.stream) {
            body['stream'] = true;
            body['stream_options'] = {"include_usage": true};
        }
        if (form.response_format) {
            if (form.response_format.hasSchema()) {
                body['response_format'] = {
                    'type' : 'json_schema',
                    'json_schema' : {
                        'name' : form.response_format.name,
                        'strict' : true,
                        'schema' : form.response_format.parse({
                            'array' : (element)=> ({'type':'array', 'items':element}),
                            'object' : (properties, options) => {
                                return {
                                    'type': 'object',
                                    'properties': properties,
                                    'required': options.required ?? [],
                                    'additionalProperties': options.allow_additional_properties ?? false
                                }
                            },
                            'boolean' : ()=>({'type' : 'boolean'}),
                            'number' : ()=>({'type' : 'number'}),
                            'string' : ()=>({'type' : 'string'}),
                        }),
                    }
                }
            }
            else {
                body['response_format'] = {
                    'type' : 'json_object'
                }
            }
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${form.secret.api_key}`
        }
        return [url, body, {headers}];
    }

    getMessageFromStreamChunk(chunk:any):string {
        return chunk['choices'][0]['delta']['content'];
    }

    handleResponse(res: any) {
        let warning: string | null;
        const reason = res.choices[0]?.finish_reason;
        const text = res.choices[0]?.message?.content ?? '';

        if (reason === 'stop') warning = null;
        else if (reason === 'length') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;
        
        return {
            raw : res,

            content: [text],
            warning : warning,

            tokens : {
                input: res.usage?.prompt_tokens ?? 0,
                output: res.usage?.completion_tokens ?? 0,
                total : res.usage?.total_tokens ?? 0,
            },
            finish_reason : reason,
        };
    }

    async handleStreamChunk(chunkOutputQueue:AsyncQueue, messageInputQueue:AsyncQueue) {
        const contents:string[] = [];
        const response:Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'> = {
            raw: {},
            content: [],
            warning: null,
            tokens: {
                input: 0,
                output: 0,
                total: 0,
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
                if (text === '[DONE]') {
                    break;
                }
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
            
            const choice = chunkData.choices?.[0];
            if (choice) {
                if (choice.finish_reason) {
                    response.finish_reason = choice.finish_reason;
                    
                    if (choice.finish_reason === 'stop') response.warning = null;
                    else if (choice.finish_reason === 'length') response.warning = 'max token limit';
                    else response.warning = `unhandle reason : ${response.warning}`;
                }
                const content = choice.delta?.content ?? '';
                messageInputQueue.enqueue(content);
                contents.push(content);
            }
            if (chunkData.usage) {
                response.tokens.input = (chunkData.usage?.prompt_tokens ?? 0) as number;
                response.tokens.output = (chunkData.usage?.completion_tokens ?? 0) as number;
                response.tokens.total = (chunkData.usage?.total_tokens ?? 0) as number;
            }
        }
        messageInputQueue.enableBlockIfEmpty(false);
        response.content.push(contents.join(''));
        return response;
    }
}

export default OpenAIGPTAPI;