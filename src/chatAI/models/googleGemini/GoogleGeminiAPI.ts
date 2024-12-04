import type { RequestForm } from '../../types/request-form'
import type { ChatAPIResponse } from '../../types/response-data';

import { assertNotNull, bracketFormat } from '../../utils'

import ChatAIAPI from '../ChatAIAPI'

import { 
    GENIMIAPI_URL_FORMAT,
    GENIMI_OPTION_SAFETY,
    ROLE,
    ROLE_DEFAULT,
} from './data'

type GeminiMessage = { 
    role: string;
    parts: {
        text: string;
    }[];
}[];

class GoogleGeminiAPI extends ChatAIAPI {
    makeRequestData(form:RequestForm):[string, any] {
        assertNotNull(form.secret?.api_key, 'form.secret.api_key is required');
        assertNotNull(form.model_detail, 'model_detail is required');
        
        const url = bracketFormat(GENIMIAPI_URL_FORMAT, {
            apikey : form.secret.api_key,
            modelname : form.model_detail
        });
        const contents:GeminiMessage = [];
        for(const request of form.message) {
            const role = request.role;
            const parts = request.content.map(content => {
                return {
                    text: content.text ?? ''
                }
            });
            contents.push({
                role: ROLE[role] ?? ROLE_DEFAULT,
                parts: parts
            });
        }
        const generationConfig = {
            maxOutputTokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            topP: form.top_p ?? 1.0,
        };
        if (form.response_format) {
            if (!form.response_format.hasSchema()) {
                generationConfig['response_mime_type'] = 'application/json';
            }
            else {
                generationConfig['response_mime_type'] = 'application/json';
                generationConfig['response_schema'] = form.response_format.parse({
                    'array' : (element)=> ({'type':'ARRAY', 'items':element}),
                    'object' : (properties, options) => {
                        return {
                            'type': 'OBJECT',
                            'properties': properties,
                        }
                    },
                    'boolean' : ()=>({'type' : 'BOOLEAN'}),
                    'number' : ()=>({'type' : 'NUMBER'}),
                    'string' : ()=>({'type' : 'STRING'}),
                });
            }
        }
        if (form.additional?.response_mime_type) {
            generationConfig['response_mime_type'] = form.additional.response_mime_type;
        }
        if (form.additional?.response_schema) {
            generationConfig['response_schema'] = form.additional.response_schema;
        }
        
        const body = {
            contents: contents,
            generationConfig : generationConfig,
            safetySettings : GENIMI_OPTION_SAFETY
        };
        
        const data = {
            method : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        return [url, data];
    }
    responseThen(rawResponse: any, requestFrom: RequestForm): ChatAPIResponse {
        let tokens: number;
        let warning: string | null;
        try {
            tokens = rawResponse.usageMetadata.candidatesTokenCount;
        }
        catch (e) {
            tokens = 0;
        }
      
        const reason = rawResponse.candidates[0]?.finishReason;
        const text:string = rawResponse.candidates[0]?.content?.parts[0].text ?? '';
        
        if (reason == 'STOP') warning = null;
        else if (reason == 'SAFETY') warning = 'blocked by SAFETY';
        else if (reason == 'MAX_TOKENS') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;
      
        return {
            output : {
                content : [text]
            },
            tokens : tokens,
            finishReason : reason,

            error : null,
            warning : warning,
            normalResponse : true,
        }
    }
}

export default GoogleGeminiAPI;