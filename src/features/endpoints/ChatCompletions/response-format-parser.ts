import { JSONSchema } from '@/features/chatai/JSONSchema';
import { ResponseFormat } from '@/types';

export function parseChatCompletionsResponseFormat(responseFormat?:ResponseFormat) {
    if (!responseFormat) return;

    if (responseFormat.type === 'json') {
        if (!responseFormat.schema) {
            return {
                'type' : 'json_object'
            }
        }
        else {
            const schema = JSONSchema.parse(responseFormat.schema, {
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
            });

            return {
                'type' : 'json_schema',
                'json_schema' : {
                    'name' : responseFormat.name,
                    'strict' : true,
                    'schema' : schema,
                }
            }
        }
    }
    return;
}