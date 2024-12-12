import type {
    IChatAIAPI,
    ChatAIResponse,
    RequestForm,
    RequestOption,
    RequestDebugOption,
} from '../types'
import { RequestDataOption } from '../types/IChatAIAPI';
import { AsyncQueue } from '../utils'
import { AxiosResponse, AxiosError } from 'axios'
import { default as axios } from 'axios'

abstract class ChatAIAPI implements IChatAIAPI {
    async preprocess() {

    }
    async postprocess() {

    }

    async request(
        form: RequestForm,
        debug: RequestDebugOption = {}
    ): Promise<ChatAIResponse> {
        const [url, data, config] = this.makeRequestData(form, { stream: false });

        try {
            const res = await axios.post(url, data, config);

            if (!debug.unmaskSecret) {
                const maskedForm = {
                    ...form,
                    secret: ChatAIAPI.deepCopy(form.secret)
                };
                ChatAIAPI.mask(maskedForm.secret)
                
                const [url, data, config] = this.makeRequestData(maskedForm, { stream: false });
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
                        data[key] = 'SECRET';
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
                    headers: (config as any).headers,
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
                    tokens: {
                        input: 0,
                        output: 0,
                        total : 0,
                    },
                    finish_reason: '',
                }
            }
        }
    }

    async stream(
        form: RequestForm,
        debug: RequestDebugOption = {}
    ) {
        const [url, data, config] = this.makeRequestData(form, { stream: true });
        config['responseType'] = 'stream';

        try {
            const res = await axios.post(url, data, config);

            if (!debug.unmaskSecret) {
                const maskedForm = {
                    ...form,
                    secret: ChatAIAPI.deepCopy(form.secret)
                };
                ChatAIAPI.mask(maskedForm.secret)

                const [url, data, config] = this.makeRequestData(maskedForm, { stream: true });
                config['responseType'] = 'stream';
                return await this.handleStream(res, { form, url, data, config });
            }
            else {
                return await this.handleStream(res, { form, url, data, config });
            }

        }
        catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                return await this.handleStreamError(error, { form, url, data, config })
            }
            else {
                throw error;
            }
        }
    }

    async handleStream(res: AxiosResponse, { form, url, data, config }: {
        form: RequestForm,
        url: string,
        data: object,
        config: object
    }): Promise<[AsyncGenerator<string, void, unknown>, Promise<ChatAIResponse>]> {
        const chunkInputQueue = new AsyncQueue();
        const messageQueue = new AsyncQueue();
        chunkInputQueue.enableBlockIfEmpty(true);
        messageQueue.enableBlockIfEmpty(true);

        async function *messageGenerator(queue:AsyncQueue) {
            while (true) {
                const text = await queue.dequeue();
                if (text === null) {
                    break;
                }
                yield text as string;
            }
        }
        const responseResolve = async () => {
            const response = await this.handleStreamChunk(chunkInputQueue, messageQueue);

            return {
                response: {
                    ...response,
                    ok: true,
                    http_status: res.status,
                    http_status_text: res.statusText,
                },
                request: {
                    url: url,
                    headers: (config as any).headers ?? {},
                    data: data,
                }
            }
        };
        
        const decoder = new TextDecoder();
        res.data.on('data', (chunk: AllowSharedBufferSource | undefined) => {
            const lines = decoder.decode(chunk, { stream: true }).split('\n');
            for (const line of lines) {
                chunkInputQueue.enqueue(line);
            }
        });
        res.data.on('end', () => {
            chunkInputQueue.enableBlockIfEmpty(false);
        });
        
        return [messageGenerator(messageQueue), responseResolve()];
    }

    protected async handleStreamError(error: AxiosError, { form, url, data, config }: {
        form: RequestForm,
        url: string,
        data: object,
        config: object
    }): Promise<[AsyncGenerator<string, void, unknown>, Promise<ChatAIResponse>]> {
        async function *emptyGenerator() {
            return;
        }
        const resultPromise = new Promise<ChatAIResponse>((resolve) => {
            resolve({
                request: {
                    form: form,
                    url: url,
                    headers: (config as any).headers ?? {},
                    data: data,
                },
                response : {
                    ok: false,
                    http_status: error.response?.status ?? 0,
                    http_status_text: error.response?.statusText ?? '',
                    raw: error.response?.data ?? {},
                    content: [],
                    warning: null,
                    tokens: {
                        input: 0,
                        output: 0,
                        total : 0,
                    },
                    finish_reason: '',
                }
            });
        });

        return [emptyGenerator(), resultPromise];
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
                tokens: {
                    input: 0,
                    output: 0,
                    total : 0,
                },
                finish_reason: '',
            }
        }
    }

    abstract handleStreamChunk(chunkOutputQueue:AsyncQueue, messageInputQueue:AsyncQueue):Promise<Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'>>;
    abstract makeRequestData(form: RequestForm, option: RequestDataOption): [string, object, object];
    abstract handleResponse(data: any): Omit<ChatAIResponse['response'], 'ok' | 'http_status' | 'http_status_text'>;

}

export default ChatAIAPI;