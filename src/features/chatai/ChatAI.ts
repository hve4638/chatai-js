import type { RequestDebugOption } from './types'
import type { ChatAIResult, ChatAIResultResponse } from '@/types/response'
import {
    AnthropicAPI,
    type AnthropicData,

    BaseChatAIRequestAPI,
    ChatCompletionsAPI,
    type ChatCompletionsData,

    GenerativeLanguageAPI,
    type GenerativeLanguageData,
    ResponsesData,
    VertexAIAPI,
    VertexAIData,
} from '@/features/api'
import APIProcess from './APIProcess'
import ResponsesAPI from '../api/Responses/ResponsesAPI'
import Channel from '@hve/channel'
import { ChatAIResponse } from '@/types'
import { IncomingMessage } from 'node:http'

class ChatAI {
    private constructor() { }

    static readonly request = {
        chatCompletion: async (data: ChatCompletionsData, debug: RequestDebugOption = {}) => {
            const api = new ChatCompletionsAPI(data, { stream: false });

            return await this.#request(api, debug) as ChatAIResult;
        },
        responses: async (data: ChatCompletionsData, debug: RequestDebugOption = {}) => {
            const api = new ResponsesAPI(data, { stream: false });

            return await this.#request(api, debug) as ChatAIResult;
        },
        anthropic: async (data: AnthropicData, debug: RequestDebugOption = {}) => {
            const api = new AnthropicAPI(data, { stream: false });

            return await this.#request(api, debug) as ChatAIResult;
        },
        generativeLanguage: async (data: GenerativeLanguageData, debug: RequestDebugOption = {}) => {
            const api = new GenerativeLanguageAPI(data, { stream: false });

            return await this.#request(api, debug) as ChatAIResult;
        },
        requestVertexAI: async (data: VertexAIData, debug: RequestDebugOption = {}) => {
            const api = new VertexAIAPI(data, { stream: false });

            return await this.#request(api, debug) as ChatAIResult;
        }
    }
    static readonly stream = {
        chatCompletion: async (data: ChatCompletionsData, debug: RequestDebugOption = {}) => {
            const api = new ChatCompletionsAPI(data, { stream: true });

            return await this.#stream(api, debug);
        },
        responses: async (data: ChatCompletionsData, debug: RequestDebugOption = {}) => {
            const api = new ResponsesAPI(data, { stream: true });

            return await this.#stream(api, debug);
        },
        anthropic: async (data: AnthropicData, debug: RequestDebugOption = {}) => {
            const api = new AnthropicAPI(data, { stream: true });

            return await this.#stream(api, debug);
        },
        generativeLanguage: async (data: GenerativeLanguageData, debug: RequestDebugOption = {}) => {
            const api = new GenerativeLanguageAPI(data, { stream: true });

            return await this.#stream(api, debug);
        },
    }

    /**
     * OpenAI의 AI 요청 Endpoint
     * 
     * 대부분의 공급자는 ChatCompletion API와의 호환성 제공
     * */
    static async requestChatCompletion(data: ChatCompletionsData, debug: RequestDebugOption = {}): Promise<ChatAIResult> {
        const api = new ChatCompletionsAPI(data, { stream: false });

        return await this.#request(api, debug);
    }

    /** OpenAI 신규 API */
    static async requestResponses(data: ResponsesData, debug: RequestDebugOption = {}): Promise<ChatAIResult> {
        const api = new ResponsesAPI(data, { stream: false });

        return await this.#request(api, debug);
    }

    /** Google API */
    static async requestGenerativeLanguage(data: GenerativeLanguageData, debug: RequestDebugOption = {}): Promise<ChatAIResult> {
        const api = new GenerativeLanguageAPI(data, { stream: false });

        return await this.#request(api, debug);
    }

    /** Anthropic API */
    static async requestAnthropic(data: AnthropicData, debug: RequestDebugOption = {}): Promise<ChatAIResult> {
        const api = new AnthropicAPI(data, { stream: false });

        return await this.#request(api, debug);
    }

    static async requestVertexAI(data: VertexAIData, debug: RequestDebugOption = {}): Promise<ChatAIResult> {
        const api = new VertexAIAPI(data, { stream: false });

        return await this.#request(api, debug);
    }

    static async #request(api: BaseChatAIRequestAPI, debug: RequestDebugOption = {}): Promise<ChatAIResult> {
        const { success, requestArgs, response } = await APIProcess.requestAPI(api);

        let requestResult = (
            debug.disableMasking
                ? APIProcess.parseToResultRequest(requestArgs)
                : await APIProcess.makeMaskedRequest(api)
        );
        if (success) {
            return {
                request: requestResult,
                response: await api.parseResponseOK(requestArgs, response),
            };
        }
        else {
            return {
                request: requestResult,
                response: await api.parseResponseFail(requestArgs, response),
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
    static async #stream(api: BaseChatAIRequestAPI, debug: RequestDebugOption = {}): Promise<{
        messages: AsyncGenerator<string, void, unknown>
        result: Promise<ChatAIResult>,
        debug?: {
            rawStream?: AsyncGenerator<string, void, unknown>
        }
    }> {
        const { success, requestArgs, response } = await APIProcess.requestAPI(api);

        let resultRequest = (
            debug.disableMasking
                ? APIProcess.parseToResultRequest(requestArgs)
                : await APIProcess.makeMaskedRequest(api)
        );
        if (!success) {
            async function* noGen() { return; }
            return {
                messages: noGen(),
                result: api.parseResponseFail(requestArgs, response)
                    .then((response) => ({
                        request: resultRequest,
                        response,
                    })),
            };
        }

        const rawStreamCh = new Channel<string>();
        const {
            messageStream,
            response: resultResponse,
        } = api.parseResponseStreamOK(
            requestArgs,
            response as ChatAIResponse<IncomingMessage>,
            debug.rawStream ? rawStreamCh : undefined
        );

        async function* messageGenerator(chan: Channel<string>) {
            while (true) {
                const text = await chan.consume();
                if (text === null) {
                    break;
                }
                yield text as string;
            }
        }
        const resolveResponse = async (resultResponse: ChatAIResultResponse) => {
            const result: ChatAIResult = {
                request: resultRequest,
                response: resultResponse,
            }
            return result;
        };

        const debugResult: any = {};
        // debugResult.rawStream = messageGenerator(rawStreamCh);
        // debugResult.ch = rawStreamCh;
        debugResult.ch = messageStream;

        return {
            // messages: messageGenerator(messageStream),
            messages: messageGenerator(messageStream),
            result: resultResponse.then(chatAIResponse => resolveResponse(chatAIResponse)),
            debug: debugResult,
        };
    }
}

export default ChatAI;