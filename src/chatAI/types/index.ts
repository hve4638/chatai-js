export type {
    Schema,
    BaseSchema,
    JsonObjectSchemaOptions,
    IJsonSchema,
    JsonSchemaHandler
} from './response-schema'

import { RequestForm, RequestOption } from './request-form'
import { ChatAPIResponse } from './response-data'

export interface IChatAIAPI {
    preprocess();
    postprocess();
    request(requsetdata:RequestForm, option: RequestOption):Promise<ChatAPIResponse>;
    makeRequestData(form: RequestForm): [string, RequestInit];
    responseThen(response: any, requestFrom:RequestForm): Pick<ChatAPIResponse, 'response'>;
}