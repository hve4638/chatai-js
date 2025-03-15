import { JSONSchema } from '@/features/chatai/JSONSchema';
import { ResponseFormat } from '@/types';

export function parseGenerativeLanguageResponseFormat(responseFormat?:ResponseFormat) {
    if (!responseFormat) return;

    if (responseFormat.type == 'json') {
        if (!responseFormat.schema) {
            return {
                'response_mime_type' : 'application/json',
            };
        }
        else {
            const schema = JSONSchema.parse(responseFormat.schema, {
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

            return {
                'response_mime_type' : 'application/json',
                'response_schema' : schema,
            };
        }
    }

    return;
}