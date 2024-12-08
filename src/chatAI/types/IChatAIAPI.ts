import { RequestDebugOption, RequestForm, RequestOption } from './request-form'
import { ChatAIResponse } from './response-data'

export type RequestDataOption = {
    stream: boolean;
}

interface IChatAIAPI {
    preprocess():void;
    postprocess():void;
    request(requsetdata:RequestForm):Promise<ChatAIResponse>;
    /**
     * @return [url, data, config]
     */
    makeRequestData(form: RequestForm, option: RequestDataOption): [string, object, object];
    handleResponse(response: any): Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'>;
}

export default IChatAIAPI;