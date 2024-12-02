import { RequestForm, RequestOption } from './request-form';
import { ChatAPIResponse } from './response-data';
export interface IChatAIAPI {
    preprocess(): any;
    postprocess(): any;
    request(requsetdata: RequestForm, option: RequestOption): Promise<ChatAPIResponse>;
    makeRequestData(form: RequestForm): [string, RequestInit];
    responseThen(response: any, requestFrom: RequestForm): ChatAPIResponse;
}
//# sourceMappingURL=index.d.ts.map