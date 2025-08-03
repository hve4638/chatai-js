import axios, { AxiosError, AxiosResponse } from 'axios';

import { EndpointAction } from '@/features/api';
import type { BaseChatAIRequestAPI } from '@/features/api';

import { ChatAIRequest } from '@/types';
import { ChatAIError } from '@/errors';
import { ChatAIResultRequest } from '@/types/response';
import { ChatAIResponse } from '@/types';

interface RequestResult {
    success: boolean;
    requestArgs: ChatAIRequest;
    response: ChatAIResponse;
}

class APIProcess {
    static async requestAPI(api: BaseChatAIRequestAPI): Promise<RequestResult> {
        const action = await api.preprocess();
        if (action === EndpointAction.Abort) {
            throw new ChatAIError('Request aborted by preprocess');
        }
        try {
            let retryCount = 0;
            let response: AxiosResponse<any, any>;
            let requestArgs: ChatAIRequest;
            while (true) {
                if (retryCount >= 5) {
                    throw new ChatAIError('Request failed after 5 tries. Aborting.');
                }
                requestArgs = await this.getRequestArgs(api);
                const { url, data, config } = requestArgs;
                const option = api.getOption();

                try {
                    response = await axios.post(url, data, {
                        ...config,
                        responseType: option.stream ? 'stream' : 'json',
                    });
                }
                catch (error: unknown) {
                    const action = await api.catchFetchFailed(error, retryCount);
                    if (action === EndpointAction.Retry) {
                        retryCount++;
                        continue;
                    }
                    else {
                        if (error instanceof AxiosError) {
                            return {
                                success: false,
                                requestArgs,
                                response: {
                                    code: error.code,
                                    status: error.status ?? 0,
                                    message: error.message,
                                    data: error.response?.data ?? {},
                                }
                            }
                        }
                        throw error;
                    }
                }

                if (response.status >= 200 && response.status < 300) {
                    return {
                        success: true,
                        requestArgs,
                        response: {
                            status: response.status,
                            message: response.statusText,
                            data: response.data,
                        }
                    };
                }
                else {
                    const action = await api.catchResponseFailed(response, retryCount);
                    if (action === EndpointAction.Retry) {
                        retryCount++;
                        continue;
                    }
                    else if (action === EndpointAction.Abort) {
                        throw new ChatAIError(`Request failed with status ${response.status}`);
                    }
                    else {
                        return {
                            success: false,
                            requestArgs,
                            response: {
                                code: response.statusText,
                                status: response.status,
                                message: `Request failed with status ${response.status}`,
                                data: response.data,
                            }
                        };
                    }
                }
            }
        }
        finally {
            api.postprocess();
        }
    }

    static async makeMaskedRequest(endpoint: BaseChatAIRequestAPI): Promise<ChatAIResultRequest> {
        const masked = endpoint.mask();
        const args = await this.getRequestArgs(masked);
        return this.parseToResultRequest(args);
    }

    static parseToResultRequest(args: ChatAIRequest): ChatAIResultRequest {
        return {
            form: args.form,
            url: args.url,
            headers: args.config.headers,
            data: args.data,
        };
    }

    private static async getRequestArgs(endpoint: BaseChatAIRequestAPI): Promise<ChatAIRequest> {
        const url = await endpoint.makeRequestURL();
        const config = await endpoint.makeRequestConfig();
        const data = await endpoint.makeRequestData();
        const form = endpoint.getBody() as any;

        return { url, data, config, form };
    }
}

export default APIProcess;