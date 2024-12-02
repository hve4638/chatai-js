import type { IChatAIAPI } from '../types';
import type { RequestForm, RequestOption, RequestDebugOption } from '../types/request-form';
import { ChatAPIResponse } from '../types/response-data';
declare abstract class ChatAIAPI implements IChatAIAPI {
    preprocess(): Promise<void>;
    postprocess(): Promise<void>;
    request(form: RequestForm, option: RequestOption, debug?: RequestDebugOption): Promise<ChatAPIResponse>;
    abstract makeRequestData(form: RequestForm): [string, RequestInit];
    abstract responseThen(response: any, requestFrom: RequestForm): ChatAPIResponse;
}
export default ChatAIAPI;
//# sourceMappingURL=ChatAIAPI.d.ts.map