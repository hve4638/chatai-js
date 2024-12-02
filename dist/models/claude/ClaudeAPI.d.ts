import { type RequestForm } from '../../types/request-form';
import { ChatAPIResponse } from '../../types/response-data';
import ChatAIAPI from '../ChatAIAPI';
declare class ClaudeAPI extends ChatAIAPI {
    makeRequestData(form: RequestForm): [string, any];
    responseThen(rawResponse: any, requestForm: RequestForm): ChatAPIResponse;
}
export default ClaudeAPI;
//# sourceMappingURL=ClaudeAPI.d.ts.map