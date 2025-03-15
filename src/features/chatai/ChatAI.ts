import axios, { AxiosResponse } from 'axios';
import type { ChatAIRequest, ChatAIRequestOption, ChatAIRequestForm, RequestDebugOption, ValidChatRequestForm } from '@/types/request';
import { EndpointName, KnownProvider } from '@/types/request';
import type { ChatAIResult, ChatAIResultRequest, ChatAIResultResponse } from '@/types/response';

import {
    EndpointAction,

    ChatCompletionsEndpoint,
    ClaudeEndpoint,
    GenerativeLanguageEndpoint,
    VertexAIEndpoint,
} from '@/features/endpoints';
import type BaseEndpoint from '@/features/endpoints/BaseEndpoint';

import { ChatAIError } from '@/errors';
import { AsyncQueue } from '@/utils';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';


class ChatAI {
    static #providers:Record<string, EndpointName> = {
        [KnownProvider.Anthropic] : EndpointName.Claude,
        [KnownProvider.OpenAI] : EndpointName.ChatCompletions,
        [KnownProvider.Google] : EndpointName.GenerativeLanguage,
        [KnownProvider.VertexAI] : EndpointName.VertexAI,
    };
    #endpoints:Record<string, BaseEndpoint> = {};
    
    constructor() {
        this.refreshCache();
    }

    refreshCache() {
        this.#endpoints[EndpointName.Claude] = new ClaudeEndpoint();
        this.#endpoints[EndpointName.ChatCompletions] = new ChatCompletionsEndpoint();
        this.#endpoints[EndpointName.GenerativeLanguage] = new GenerativeLanguageEndpoint();
        this.#endpoints[EndpointName.VertexAI] = new VertexAIEndpoint();
    }

    async request(form:ChatAIRequestForm, debug:RequestDebugOption = {}):Promise<ChatAIResult> {
        const processedForm = this.#preprocessForm(form);
        
        const endpoint = this.#endpoints[processedForm.endpoint];
        const option = { stream: false }
        const [successed, requestArgs, response] = await this.#fetchEndpoint(endpoint, processedForm, option);

        let requestResult = (
            debug.disableMasking
            ? this.#convertArgsToRequestResult(requestArgs)
            : await this.#maskResultRequest(endpoint, processedForm, option)
        );
        if (successed) {
            return {
                request : requestResult,
                response : await endpoint.parseResponseOK(requestArgs, response),
            };
        }
        else {
            return {
                request : requestResult,
                response : await endpoint.parseResponseFail(requestArgs, response),
            };
        }
    }

    /**
     * 스트리밍을 통한 요청
     * 
     * @param form 
     * @param debug 
     * @returns [messageGenerator, responsePromise]
     */
    async stream(
        form:ChatAIRequestForm,
        debug:RequestDebugOption = {}
    ):Promise<[AsyncGenerator<string, void, unknown>, Promise<ChatAIResult>]> {
        const processedForm = this.#preprocessForm(form);
        
        const endpoint = this.#endpoints[processedForm.endpoint];
        const option = { stream: true }
        const [successed, requestArgs, response] = await this.#fetchEndpoint(endpoint, processedForm, option);

        if (!successed) throw new ChatAIError('Request failed');
        const streamDataQueue = new AsyncQueue<string>();
        const messageQueue = new AsyncQueue<string>();
        streamDataQueue.enableBlockIfEmpty(true);
        messageQueue.enableBlockIfEmpty(true);
        
        const debugRawStream:string[] = [];
        const decoder = new TextDecoder();
        response.data.on('data', (chunk: AllowSharedBufferSource | undefined) => {
            const lines = decoder.decode(chunk, { stream: true }).split('\n');
            for (const line of lines) {
                streamDataQueue.enqueue(line);
                if (debug.rawStream) {
                    debugRawStream.push(line);
                }
            }
        });
        response.data.on('end', () => {
            streamDataQueue.enableBlockIfEmpty(false);
        });


        async function *messageGenerator(queue:AsyncQueueConsumer<string>) {
            while (true) {
                const text = await queue.dequeue();
                if (text === null) {
                    break;
                }
                yield text as string;
            }
        }
        const resolveResponse = async () => {
            const request = (
                debug.disableMasking
                ? this.#convertArgsToRequestResult(requestArgs)
                : await this.#maskResultRequest(endpoint, processedForm, option)
            );
            const response = await endpoint.parseStream(streamDataQueue.consumer(), messageQueue.producer());
            const result:ChatAIResult = {
                request: request,
                response: response,
            }

            if (debug.rawStream) {
                result.debug ??= {}
                result.debug['rawStream'] = debugRawStream;
            }
            return result;
        };
        
        return [messageGenerator(messageQueue.consumer()), resolveResponse()];
    }

    async batch() {
        ;
    }

    async batchResult() {
        ;
    }

    async #fetchEndpoint(
        endpoint:BaseEndpoint, form:ValidChatRequestForm, option:ChatAIRequestOption
    ):Promise<[boolean, ChatAIRequest, AxiosResponse<any, any>]> {
        const action = await endpoint.preprocess(form, option);
        if (action === EndpointAction.Abort) {
            throw new ChatAIError('Request aborted by preprocess');
        }
        try {
            let retryCount = 0;
            let response:AxiosResponse<any, any>;
            let requestArgs:ChatAIRequest;
            while (true) {
                if (retryCount >= 5) {
                    throw new ChatAIError('Request failed after 5 tries. Aborting.');
                }
                requestArgs = await this.#getRequestArgs(endpoint, form, option);
                const { url, data, config } = requestArgs;
                
                try {
                    response = await axios.post(url, data, {
                        ...config,
                        responseType: option.stream ? 'stream' : 'json',
                    });
                }
                catch (error: unknown) {
                    const action = await endpoint.catchFetchFailed(error, retryCount);
                    if (action === EndpointAction.Retry) {
                        retryCount++;
                        continue;
                    }
                    else {
                        throw error;
                    }
                }
                
                if (response.status >= 200 && response.status < 300) {
                    return [
                        true,
                        requestArgs,
                        response,
                    ];
                }
                else {
                    const action = await endpoint.catchResponseFailed(response, retryCount);
                    if (action === EndpointAction.Retry) {
                        retryCount++;
                        continue;
                    }
                    else if (action === EndpointAction.Abort) {
                        throw new ChatAIError(`Request failed with status ${response.status}`);
                    }
                    else {
                        return [
                            false,
                            requestArgs,
                            response,
                        ];
                    }
                }
            }
        }
        finally {
            endpoint.postprocess(form, option);
        }
    }

    #preprocessForm(source:ChatAIRequestForm):ValidChatRequestForm {
        const form = structuredClone(source);
        
        if (form.provider && form.base_url && form.endpoint) {
            console.warn(`'provider' is ignored because 'base_url' and 'endpoint' are provided`);
            delete form.provider;
        }

        if (form.provider) {
            const endpointName = ChatAI.#providers[form.provider];
            const endpoint = this.#endpoints[endpointName];
            if (!endpointName || !endpoint) {
                throw new ChatAIError(`Unknown provider: ${form.provider}`);
            }
            
            form.base_url ??= endpoint.baseURL;
            form.endpoint ??= endpointName;
        }
        
        if (!form.base_url) {
            throw new ChatAIError(`'provider' or 'base_url' is required`);
        }
        else if (!form.endpoint) {
            throw new ChatAIError(`'provider' or 'endpoint' is required`);
        }

        form.temperature ??= 1.0;
        form.top_p ??= 1.0;
        form.max_tokens ??= 1024;

        return form as ValidChatRequestForm;
    }

    async #getRequestArgs(endpoint:BaseEndpoint, form:ValidChatRequestForm, option:ChatAIRequestOption):Promise<ChatAIRequest> {
        const url = await endpoint.makeRequestURL(form, option);
        const data = await endpoint.makeRequestData(form, option);
        const config = await endpoint.makeRequestConfig(form, option);
        
        return { url, data, config, form };
    }

    async #maskResultRequest(endpoint:BaseEndpoint, form:ValidChatRequestForm, option: ChatAIRequestOption):Promise<ChatAIResultRequest> {
        const maskedForm = endpoint.maskSecret(form);
        const args = await this.#getRequestArgs(endpoint, maskedForm, option);
        return {
            form : maskedForm,
            url : args.url,
            headers : args.config.headers,
            data : args.data,
        };
    }

    #convertArgsToRequestResult(requestArgs:ChatAIRequest):ChatAIResultRequest {
        return {
            form : requestArgs.form,
            url : requestArgs.url,
            headers : requestArgs.config.headers,
            data : requestArgs.data,
        };
    }

    async rawStream(form:ChatAIRequestForm) {
        const processedForm = this.#preprocessForm(form);
        
        const endpoint = this.#endpoints[processedForm.endpoint];
        const option = { stream: true }
        const [successed, requestArgs, response] = await this.#fetchEndpoint(endpoint, processedForm, option);
        
        const queue = new AsyncQueue<string>();
        const decoder = new TextDecoder();
        response.data.on('data', (chunk: AllowSharedBufferSource | undefined) => {
            const lines = decoder.decode(chunk, { stream: true }).split('\n');
            for (const line of lines) {
                queue.enqueue(line);
            }
        });
        response.data.on('end', () => {
            queue.enableBlockIfEmpty(false);
        });

        
        async function *messageGenerator(queue:AsyncQueueConsumer<string>) {
            while (true) {
                const text = await queue.dequeue();
                if (text === null) {
                    break;
                }
                yield text as string;
            }
        }
        return messageGenerator(queue.consumer());
    }
}

export default ChatAI;