import type { RequestForm, RequestOption } from '../../types/request-form';
import { ChatAPIResponse } from '../../types/response-data';
import ChatAIAPI from '../ChatAIAPI';
declare class GoogleVertexAIAPI extends ChatAIAPI {
    #private;
    private static claude;
    private lasttoken;
    request(form: RequestForm, option: RequestOption): Promise<ChatAPIResponse>;
    makeRequestData(form: RequestForm): [string, RequestInit];
    updateData(data: any): void;
    responseThen(rawResponse: any, requestForm: RequestForm): ChatAPIResponse;
    private updateForm;
}
export default GoogleVertexAIAPI;
//# sourceMappingURL=googleVertexAIAPI.d.ts.map