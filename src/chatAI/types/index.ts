export type {
    Schema,
    BaseSchema,
    JSONObjectSchemaOptions,
    IJSONSchema,
    JSONSchemaHandler
} from './response-schema'

import { RequestDebugOption, RequestForm, RequestOption } from './request-form'
import { ChatAIResponse } from './response-data'

export interface IChatAIAPI {
    preprocess():void;
    postprocess():void;
    request(requsetdata:RequestForm):Promise<ChatAIResponse>;
    /**
     * @return [url, data, config]
     */
    makeRequestData(form: RequestForm): [string, object, object];
    handleResponse(response: any): Omit<ChatAIResponse['response'],'ok'|'http_status'|'http_status_text'>;
}