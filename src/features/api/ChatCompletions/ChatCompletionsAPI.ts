import { AxiosRequestConfig, AxiosResponse } from 'axios';

import { ChatAIRequest, ChatAIRequestOption } from '@/types'
import { ChatAIResultResponse, FinishReason } from '@/types/response';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';
import { assertFieldExists, AsyncQueue } from '@/utils'

import type { ChatCompletionsData, ChatCompletionsResponse } from './types';
import { BaseChatAIRequestAPI } from '../base';
import ChatCompletionsTool from './ChatCompletionsTool';
import { ChatAIResponse } from '@/types';

class ChatCompletionsAPI extends BaseChatAIRequestAPI<ChatCompletionsData> {
    static readonly DEFAULT_BASE_URL = 'https://api.openai.com/v1/chat/completions';
    static readonly DEFAULT_OPTIONS = {
        TOP_P: 1.0,
        TEMPERATURE: 1.0,
        MAX_OUTPUT_TOKENS: 1024,
    };

    constructor(body: ChatCompletionsData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new ChatCompletionsAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        return this.body.url ?? ChatCompletionsAPI.DEFAULT_BASE_URL;
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
        const body = ChatCompletionsTool.parseBody(this.body, this.option);
        return body;
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse<ChatCompletionsResponse>): Promise<ChatAIResultResponse> {
        const data = response.data;

        const content:string[] = [];
        const choice = data.choices[0];
        content.push(choice.message.content);
        const rawFinishResponse = choice.finish_reason;

        let finishReason: FinishReason;
        let warning: string | null = null;
        switch (rawFinishResponse) {
            case 'stop':
                finishReason = FinishReason.End;
                break;
            case 'length':
                finishReason = FinishReason.MaxToken;
                break;
            default:
                finishReason = FinishReason.Unknown;
                warning = `unhandled reason: ${rawFinishResponse}`;
                break;
        }

        return {
            ok: true,
            http_status: response.status,
            http_status_text: response.message,
            raw: data,

            content,
            thinking_content: [],
            warning: '',

            tokens: {
                input: data.usage?.prompt_tokens ?? 0,
                output: data.usage?.completion_tokens ?? 0,
                total: data.usage?.total_tokens ?? 0,
            },
            finish_reason: finishReason,
        };
    }

    async mergeStreamFragment() {
        throw new Error('Not implemented');
    }

    async parseStreamData():Promise<string | undefined> {
        throw new Error('Not implemented');
    }

    // getMessageFromStreamChunk(chunk: any): string {
    //     return chunk['choices'][0]['delta']['content'];
    // }

    // handleResponse(res: any) {
    //     let warning: string | null;
    //     const reason = res.choices[0]?.finish_reason;
    //     const text = res.choices[0]?.message?.content ?? '';

    //     if (reason === 'stop') warning = null;
    //     else if (reason === 'length') warning = 'max token limit';
    //     else warning = `unhandle reason : ${reason}`;

    //     return {
    //         raw: res,

    //         content: [text],
    //         warning: warning,

    //         tokens: {
    //             input: res.usage?.prompt_tokens ?? 0,
    //             output: res.usage?.completion_tokens ?? 0,
    //             total: res.usage?.total_tokens ?? 0,
    //         },
    //         finish_reason: reason,
    //     };
    // }
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

export default ChatCompletionsAPI;