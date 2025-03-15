import { assertFieldExists, AsyncQueue } from '@/utils'
import { ChatAIRequest, ChatAIRequestOption, ValidChatRequestForm } from '@/types/request'

import BaseEndpoint from '../BaseEndpoint'
import { parseChatCompletionsMessage } from './message-parser'

import { 
    DEFAULT_BASE_URL,
    ENDPOINT_URL,
    DEFAULT_OPTIONS,
} from './data'
import { parseChatCompletionsResponseFormat } from './response-format-parser';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ChatAIResultResponse } from '@/types/response'
import { AsyncQueueConsumer } from '@/utils/AsyncQueue'

class ChatCompletionsEndpoint extends BaseEndpoint {
    get baseURL() {
        return DEFAULT_BASE_URL;
    }

    async makeRequestURL(form:ValidChatRequestForm, option:ChatAIRequestOption) {
        return form.base_url + ENDPOINT_URL;
    }
    async makeRequestConfig(form:ValidChatRequestForm, option:ChatAIRequestOption):Promise<AxiosRequestConfig<any>> {
        assertFieldExists(form.secret.api_key, 'secret.api_key');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${form.secret.api_key}`
        }
        if (option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
        // return { headers };
    }
    async makeRequestData(form:ValidChatRequestForm, option: ChatAIRequestOption) {
        assertFieldExists(form.model_name, 'model_name');

        const message = parseChatCompletionsMessage(form.message);
        const body = {
            model : form.model_name,
            messages : message,
            max_tokens: form.max_tokens,
            temperature: form.temperature,
            top_p : form.top_p,
        }

        if (option.stream) {
            body['stream'] = true;
            body['stream_options'] = {"include_usage": true};
        }
        const responseFormat = parseChatCompletionsResponseFormat(form.response_format);
        if (responseFormat) {
            body['response_format'] = responseFormat;
        }
        return body;
    }
    async parseResponseOK(request:ChatAIRequest, response:AxiosResponse<any>) {
        const data = response.data;
        
        let warning: string | null;
        const reason = data.choices[0]?.finish_reason;
        const text = data.choices[0]?.message?.content ?? '';

        if (reason === 'stop') warning = null;
        else if (reason === 'length') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;
        
        return {
            ok : true,
            http_status : response.status,
            http_status_text : response.statusText,
            raw : data,
            
            content: [text],
            warning : warning,

            tokens : {
                input: data.usage?.prompt_tokens ?? 0,
                output: data.usage?.completion_tokens ?? 0,
                total : data.usage?.total_tokens ?? 0,
            },
            finish_reason : reason,
        };
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
    protected override async mergeStreamFragment(streamConsumer: AsyncQueueConsumer<string>): Promise<unknown | null> {
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
                if (fragment === '[DONE]') {
                    return null;
                }
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
    protected override async parseStreamData(data: unknown, response: ChatAIResultResponse): Promise<string | undefined> {
        const streamData = data as {
            usage? : {
                prompt_tokens? : number,
                completion_tokens? : number,
                total_tokens? : number,
            },
            choices? : {
                finish_reason? : string,
                delta? : {
                    content? : string,
                },
            }[],
        };

        const usage = streamData.usage;
        if (usage) {
            response.tokens.input = (usage?.prompt_tokens ?? 0) as number;
            response.tokens.output = (usage?.completion_tokens ?? 0) as number;
            response.tokens.total = (usage?.total_tokens ?? 0) as number;
        }
        const choice = streamData.choices?.[0];
        if (!choice) {
            return undefined;
        }
        if (choice.finish_reason) {
            response.finish_reason = choice.finish_reason;
            
            if (choice.finish_reason === 'stop') response.warning = null;
            else if (choice.finish_reason === 'length') response.warning = 'max token limit';
            else response.warning = `unhandle reason : ${response.warning}`;
        }

        return choice.delta?.content;
    }
}

export default ChatCompletionsEndpoint;