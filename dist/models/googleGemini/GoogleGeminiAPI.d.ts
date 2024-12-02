import type { RequestForm } from '../../types/request-form';
import type { ChatAPIResponse } from '../../types/response-data';
import ChatAIAPI from '../ChatAIAPI';
declare class GoogleGeminiAPI extends ChatAIAPI {
    makeRequestData(form: RequestForm): [string, any];
    responseThen(rawResponse: any, requestFrom: RequestForm): ChatAPIResponse;
}
export default GoogleGeminiAPI;
//# sourceMappingURL=GoogleGeminiAPI.d.ts.map