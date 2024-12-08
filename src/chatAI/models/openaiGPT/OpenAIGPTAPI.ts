import type { ChatRole, ChatType, RequestDebugOption } from '../../types/request-form'
import type { RequestForm } from '../../types/request-form'

import { OPENAI_GPT_URL, ROLE, ROLE_DEFAULT } from './data'

import { assertNotNull } from '../../utils'

import ChatAIAPI from '../ChatAIAPI'

type GPTMessage = {
    role: ROLE;
    content: string;
}[];

class OpenAIGPTAPI extends ChatAIAPI {
    makeRequestData(form:RequestForm): [string, object, object] {
        assertNotNull(form.secret?.api_key, 'api_key is required');

        const message:GPTMessage = [];
        for(const m of form.message) {
            message.push({
                role: ROLE[m.role] ?? ROLE_DEFAULT,
                content: m.content[0].text!
            });
        }

        const url = OPENAI_GPT_URL;
        const body = {
            model : form.model_detail,
            messages : message,
            max_tokens: form.max_tokens ?? 1024,
            temperature: form.temperature ?? 1.0,
            top_p : form.top_p ?? 1.0,
        }
        if (form.response_format) {
            if (form.response_format.hasSchema()) {
                body['response_format'] = {
                    'type' : 'json_schema',
                    'json_schema' : {
                        'name' : form.response_format.name,
                        'strict' : true,
                        'schema' : form.response_format.parse({
                            'array' : (element)=> ({'type':'array', 'items':element}),
                            'object' : (properties, options) => {
                                return {
                                    'type': 'object',
                                    'properties': properties,
                                    'required': options.required ?? [],
                                    'additionalProperties': options.allow_additional_properties ?? false
                                }
                            },
                            'boolean' : ()=>({'type' : 'boolean'}),
                            'number' : ()=>({'type' : 'number'}),
                            'string' : ()=>({'type' : 'string'}),
                        }),
                    }
                }
            }
            else {
                body['response_format'] = {
                    'type' : 'json_object'
                }
            }
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${form.secret.api_key}`
        }
        return [url, body, {headers}];
    }

    getMessageFromStreamChunk(chunk:any):string {
        return chunk['choices'][0]['delta']['content'];
    }

    handleResponse(res: any) {
        let tokens: number;
        let warning: string | null;
        try {
            tokens = res.usage.completion_tokens;
        }
        catch (e) {
            tokens = 0;
        }
      
        const reason = res.choices[0]?.finish_reason;
        const text = res.choices[0]?.message?.content ?? '';

        if (reason === 'stop') warning = null;
        else if (reason === 'length') warning = 'max token limit';
        else warning = `unhandle reason : ${reason}`;
        
        return  {
            raw : res,

            content: [text],
            warning : warning,

            tokens : tokens,
            finish_reason : reason,
        };
    }
}

export default OpenAIGPTAPI;