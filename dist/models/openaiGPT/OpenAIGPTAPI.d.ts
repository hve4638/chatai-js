import type { RequestForm } from '../../types/request-form';
import { ChatAPIResponse } from '../../types/response-data';
import ChatAIAPI from '../ChatAIAPI';
declare class OpenAIGPTAPI extends ChatAIAPI {
    makeRequestData(form: RequestForm): [string, any];
    responseThen(rawResponse: any, requestForm: RequestForm): ChatAPIResponse;
}
export default OpenAIGPTAPI;
//# sourceMappingURL=OpenAIGPTAPI.d.ts.map