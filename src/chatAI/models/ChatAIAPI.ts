import type { IChatAIAPI } from '../types'
import type { RequestForm, RequestOption, RequestDebugOption } from '../types/request-form'
import { ChatAPIResponse } from '../types/response-data';
import { HTTPError } from '../errors'

abstract class ChatAIAPI implements IChatAIAPI {
    async preprocess() {
        
    }
    async postprocess() {
        
    }
    async request(
        form: RequestForm,
        option:RequestOption,
        debug:RequestDebugOption={}
    ):Promise<ChatAPIResponse> {
        const fetch = option.fetch;
        const [url, data] = this.makeRequestData(form);
        if (debug.requestData) {
            debug.requestData.url = url;
            debug.requestData.data = data;
        }
        
        try {
            const res = await fetch(url, data);

            return await this.handleFetch({ res, form, url, data });
        }
        catch (error:unknown) {
            return await this.handleFetchError({ error, form, url, data });
        }
    }

    protected async handleFetch(
        { 
            res,
            form,
            url, data
        }:{
            res:Response,
            form:RequestForm,
            url:string,
            data:RequestInit
        }
    ):Promise<ChatAPIResponse> {
        if (res.ok) {
            const result = this.responseThen(await res.json(), form);
            
            if (result.response) {
                result.response.ok = true;
                result.response.http_status = res.status;
            }
            return {
                ...result,
                request : {
                    form : form,
                    url : url,
                    data : data,
                }
            } as ChatAPIResponse;
        }
        else {
            return {
                request : {
                    form : form,
                    url : url,
                    data : data,
                },
                response : {
                    ok : false,
                    http_status : res.status,
                    raw : await res.json(),
                    content: [],
                    warning : null,
                    tokens : 0,
                    finish_reason : '',
                }
            }
        }
    }
    protected async handleFetchError(
        { 
            error,
            form,
            url, data
        }:{
            error:unknown,
            form:RequestForm,
            url:string,
            data:RequestInit
        }
    ):Promise<ChatAPIResponse> {
        let errorData:any;
        if (error instanceof Error) {
            errorData = {
                name : error.name,
                reason: error.message,
                stack : error.stack
            }
        }
        else if (typeof error === 'object') {
            errorData = error;
        }
        else {
            errorData = {
                name : 'UnknownError',
                reason : `${error}`
            }
        }

        return {
            request : {
                form : form,
                url : url,
                data : data,
            },
            response : {
                ok : false,
                http_status : 0,
                raw : errorData,
                content: [],
                warning : null,
                tokens : 0,
                finish_reason : '',
            }
        }
    }
    abstract makeRequestData(form: RequestForm): [string, RequestInit];
    abstract responseThen(rawResponse: any, requestFrom:RequestForm): Pick<ChatAPIResponse, 'response'>;
}

export default ChatAIAPI;