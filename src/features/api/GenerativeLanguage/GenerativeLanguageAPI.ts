import { AxiosRequestConfig, AxiosResponse } from 'axios';

import { bracketFormat } from '@/utils';
import { AsyncQueueConsumer } from '@/utils/AsyncQueue';

import type { ChatAIRequest, ChatAIRequestOption } from '@/types/request'
import type { ChatAIResultResponse } from '@/types/response';

import {
    GenerativeLanguageMessages,
    GenerativeLanguageData,
    GenerativeLanguageBody,
    GenerationConfig,
} from './types';

import { BaseChatAIRequestAPI } from '../base';
import GenerativeLanguageTool from './GenerativeLanguageTool';
import { ChatAIResponse } from '@/types';

class GenerativeLanguageAPI extends BaseChatAIRequestAPI<GenerativeLanguageData> {
    static readonly DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';
    static readonly ENDPOINT_URL = '/v1beta/models/{{model}}:generateContent?key={{api_key}}';
    static readonly STREAM_ENDPOINT_URL = '/v1beta/models/{{model}}:streamGenerateContent?alt=sse&key={{api_key}}';

    constructor(body: GenerativeLanguageData, option: ChatAIRequestOption) {
        super(body, option);
    }

    mask() {
        const copiedBody = structuredClone(this.body);
        this.maskField(copiedBody.auth)

        const copied = new GenerativeLanguageAPI(copiedBody, this.option);
        return copied;
    }

    async makeRequestURL() {
        const baseURL = this.body.endpoint_url ?? GenerativeLanguageAPI.DEFAULT_BASE_URL;
        if (this.body.endpoint_path) {
            console.warn('GenerativeLanguageAPI : endpoint_path does not supported');
        }
        let url: string;
        if (this.option.stream) {
            url = baseURL + bracketFormat(GenerativeLanguageAPI.STREAM_ENDPOINT_URL, {
                api_key: this.body.auth.api_key,
                model: this.body.model,
            });
        }
        else {
            url = baseURL + bracketFormat(GenerativeLanguageAPI.ENDPOINT_URL, {
                api_key: this.body.auth.api_key,
                model: this.body.model,
            });
        }

        return url;
    }
    async makeRequestConfig(): Promise<AxiosRequestConfig<any>> {
        const headers = {
            'Content-Type': 'application/json',
        }
        if (this.option.stream) {
            return { headers, responseType: 'stream' };
        }
        else {
            return { headers };
        }
    }
    async makeRequestData() {
        const body = GenerativeLanguageTool.parseBody(this.body);
        return body;
    }
    async parseResponseOK(request: ChatAIRequest, response: ChatAIResponse): Promise<ChatAIResultResponse> {
        return GenerativeLanguageTool.parseResponseOK(response);
    }

    async mergeStreamFragment(streamConsumer: AsyncQueueConsumer<string>): Promise<unknown | null> {
        let partOfChunk: string | null = null;
        while (true) {
            const line = await streamConsumer.dequeue();
            if (line === null) return null;

            let fragment: string;
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

    async parseStreamData(data: unknown, resultResponse: ChatAIResultResponse): Promise<string | undefined> {
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

export default GenerativeLanguageAPI;