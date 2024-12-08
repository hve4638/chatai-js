import type { IChatAIAPI } from '../types'
import type { RequestForm, RequestOption, RequestDebugOption } from '../types/request-form'
import { ChatAIResponse } from '../types/response-data';
import { HTTPError } from '../errors'
import { AsyncQueue } from '../utils'
import axios, { AxiosResponse } from 'axios'

abstract class ChatAIAPI implements IChatAIAPI {
    async preprocess() {

    }
    async postprocess() {

    }

    async request(
        form: RequestForm,
        debug: RequestDebugOption = {}
    ): Promise<ChatAIResponse> {
        const [url, data, config] = this.makeRequestData(form);

        try {
            const res = await axios.post(url, data, config);

            if (!debug.unmaskSecret) {
                const maskedForm = {
                    ...form,
                    secret: ChatAIAPI.deepCopy(form.secret)
                };
                ChatAIAPI.mask(maskedForm.secret)

                const [url, data, config] = this.makeRequestData(maskedForm);
                return await this.handleRawResponse(res, { form, url, data, config });
            }
            else {
                return await this.handleRawResponse(res, { form, url, data, config });
            }

        }
        catch (error: unknown) {
            return await this.handleFetchError(error, { form, url, data, config });
        }
    }

    static mask(data:any) {
        if (typeof data === 'object' && data !== null) {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    if (typeof data[key] === 'object' && data[key] !== null) {
                        this.mask(data[key]);
                    } else {
                        data[key] = '****';
                    }
                }
            }
        }
        return data;
    }

    static deepCopy<T>(data:T):T {
        return JSON.parse(JSON.stringify(data));
    }

    async handleRawResponse(res: AxiosResponse, { form, url, data, config }: {
        form: RequestForm,
        url: string,
        data: RequestInit,
        config: object
    }): Promise<ChatAIResponse> {
        if (res.status >= 200 && res.status < 300) {
            const result = this.handleResponse(res.data);

            return {
                request: {
                    url: url,
                    headers: data.headers as object,
                    data: data,
                },
                response: {
                    ok: true,
                    http_status: res.status,
                    http_status_text: res.statusText,
                    ...result,
                },
            };
        }
        else {
            return {
                request: {
                    url: url,
                    headers: data.headers as object,
                    data: data,
                },
                response: {
                    ok: false,
                    http_status: res.status,
                    http_status_text: res.statusText,
                    raw: res.data,
                    content: [],
                    warning: null,
                    tokens: 0,
                    finish_reason: '',
                }
            }
        }
    }

    async stream(
        form: RequestForm,
        debug: RequestDebugOption = {}
    ) {
        const [url, data, config] = this.makeRequestData(form);

        try {
            const res = await axios.post(url, data, config);

            return await this.handleStream(res, { form, url, data, config });
        }
        catch (error: unknown) {
            await this.handleFetchError(error, { form, url, data, config });
            throw error;
        }
    }

    async handleStream(res: AxiosResponse, { form, url, data }: {
        form: RequestForm,
        url: string,
        data: object,
        config: object
    }): Promise<[AsyncGenerator<string, void, unknown>, Promise<ChatAIResponse>]> {
        throw new Error('Not implemented');
        // if (!res.body) {
        //     throw new HTTPError(res, 'No body in response');
        // }

        // const queue = new AsyncQueue();
        // queue.enableBlockIfEmpty(true);

        // const resultText:string[] = [];

        // async function read() {
        //     console.log('[read] start!')
        //     const reader = res.body!.getReader();
        //     const decoder = new TextDecoder();

        //     let done = false;
        //     while(!done) {
        //         const { value, done: readerDone } = await reader.read();
        //         const text = decoder.decode(value, { stream: true });
        //         const lines = text.split('\n').filter(line => line.trim() !== '');

        //         console.log('[read] : ', text)
        //         const sleep = new Promise(resolve => setTimeout(resolve, 100))
        //         await sleep;
        //         for (const line of lines) {
        //             if (!line.startsWith('data:')) {
        //                 continue;
        //             }

        //             const json = line.slice(5).trim();
        //             if (json === '[DONE]') {
        //                 done = true;
        //                 break;
        //             }

        //             try {
        //                 const data = JSON.parse(json);
        //                 const text = data.choices?.[0]?.delta?.content;
        //                 if (text) {
        //                     resultText.push(text);
        //                     queue.enqueue(text);
        //                 }
        //             }
        //             catch(e) {
        //                 console.error('\n\n\n')
        //                 console.error('Error parsing stream data:', e);
        //                 console.error(data);
        //                 console.error('line');
        //                 console.error(line);
        //             }
        //         }
        //     }
        //     queue.enableBlockIfEmpty(false);
        // }
        // async function *stream() {
        //     while(true) {
        //         console.log('[stream] wait')
        //         const text = await queue.dequeue();
        //         console.log('[stream] read!')
        //         if (text === null) {
        //             break;
        //         }
        //         yield text as string;
        //     }
        // }
        // async function result() {
        //     console.log('[result] read start')
        //     await read();
        //     console.log('[result] read end')

        //     return resultText.join('') as any;
        // }

        // return [stream(), result()];
    }

    protected async handleFetchError(
        error: unknown,
        { form, url, data, config }: {
            form: RequestForm,
            url: string,
            data: object,
            config: object
        }
    ): Promise<ChatAIResponse> {
        let errorData: any;
        if (error instanceof Error) {
            errorData = {
                name: error.name,
                reason: error.message,
                stack: error.stack
            }
        }
        else if (typeof error === 'object') {
            errorData = error;
        }
        else {
            errorData = {
                name: 'UnknownError',
                reason: `${error}`
            }
        }

        return {
            request: {
                form: form,
                url: url,
                headers: (config as any).headers ?? {},
                data: data,
            },
            response: {
                ok: false,
                http_status: 0,
                http_status_text: '',
                raw: errorData,
                content: [],
                warning: null,
                tokens: 0,
                finish_reason: '',
            }
        }
    }

    abstract makeRequestData(form: RequestForm): [string, object, object];
    abstract handleResponse(data: any): Omit<ChatAIResponse['response'], 'ok' | 'http_status' | 'http_status_text'>;

}

export default ChatAIAPI;