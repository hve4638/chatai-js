import { AxiosRequestConfig, AxiosResponse } from 'axios'

import { ChatAIRequest, ChatAIRequestOption } from '@/types'
import { ChatAIResponse } from '@/types'
import { assertFieldExists, AsyncQueue } from '@/utils'

import { BaseChatAIRequestAPI } from '../base'
import { ResponsesData } from './types'
import ResponsesTool from './ResponsesTool'

class ResponsesAPI extends BaseChatAIRequestAPI<ResponsesData> {
    static readonly DEFAULT_URL = 'https://api.openai.com/v1/responses';
    // static readonly DEFAULT_PATH = '/v1/responses';

    constructor(body: ResponsesData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new ResponsesAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        return this.body.url ?? ResponsesAPI.DEFAULT_URL;
    }
    async makeRequestConfig(): Promise<AxiosRequestConfig<any>> {
        assertFieldExists(this.body.auth.api_key, 'secret.api_key');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.body.auth.api_key}`
        }
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData(): Promise<object> {
        return ResponsesTool.parseBody(this.body, this.option);
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse) {
        return ResponsesTool.parseResponseOK(response as ChatAIResponse<any>);
    }

    getMessageFromStreamChunk(chunk: any): string {
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
            raw: res,

            content: [text],
            warning: warning,

            tokens: {
                input: res.usage?.prompt_tokens ?? 0,
                output: res.usage?.completion_tokens ?? 0,
                total: res.usage?.total_tokens ?? 0,
            },
            finish_reason: reason,
        };
    }

    async mergeStreamFragment() {
        throw new Error('Not implemented');
    }

    async parseStreamData():Promise<string | undefined> {
        throw new Error('Not implemented');
    }

    // protected async mergeStreamFragment(streamConsumer: AsyncQueueConsumer<string>): Promise<unknown | null> {
    //     let partOfChunk: string | null = null;
    //     while (true) {
    //         const line = await streamConsumer.dequeue();
    //         if (line === null) return null;

    //         let fragment: string;
    //         if (partOfChunk === null) {
    //             if (!line.startsWith('data:')) {
    //                 continue;
    //             }

    //             fragment = line.slice(5).trim();
    //             if (fragment === '[DONE]') {
    //                 return null;
    //             }
    //         }
    //         else {
    //             fragment = partOfChunk + line;
    //             partOfChunk = null;
    //         }

    //         try {
    //             return JSON.parse(fragment);
    //         }
    //         catch (e) {
    //             partOfChunk = fragment;
    //             console.error('Incomplete stream data : ', fragment);
    //             continue;
    //         }
    //     }
    // }
    // protected async parseStreamData(data: unknown, response: ChatAIResultResponse): Promise<string | undefined> {
    //     const streamData = data as {
    //         usage?: {
    //             prompt_tokens?: number,
    //             completion_tokens?: number,
    //             total_tokens?: number,
    //         },
    //         choices?: {
    //             finish_reason?: string,
    //             delta?: {
    //                 content?: string,
    //             },
    //         }[],
    //     };

    //     const usage = streamData.usage;
    //     if (usage) {
    //         response.tokens.input = (usage?.prompt_tokens ?? 0) as number;
    //         response.tokens.output = (usage?.completion_tokens ?? 0) as number;
    //         response.tokens.total = (usage?.total_tokens ?? 0) as number;
    //     }
    //     const choice = streamData.choices?.[0];
    //     if (!choice) {
    //         return undefined;
    //     }
    //     if (choice.finish_reason) {
    //         response.finish_reason = choice.finish_reason;

    //         if (choice.finish_reason === 'stop') response.warning = null;
    //         else if (choice.finish_reason === 'length') response.warning = 'max token limit';
    //         else response.warning = `unhandle reason : ${response.warning}`;
    //     }

    //     return choice.delta?.content;
    // }
}

export default ResponsesAPI;