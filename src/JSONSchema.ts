import type { JSONFormat, RawJSONSchema, JSONSchemaHandler, JSONObjectSchemaOptions } from './types'

export function JSONFormat(name:string, schema:RawJSONSchema|undefined):JSONFormat {
    return {
        type : 'json',
        name, schema
    }
}

export const JSONSchema = {
    hasSchema(jsonFormat:JSONFormat) {
        return jsonFormat.schema !== undefined;
    },
    parse(schema:RawJSONSchema, handler:JSONSchemaHandler) {
        switch(schema.type) {
            case 'array':
            {
                const items = this.parse(schema.items, handler);
                return handler.array(items);
            }   
            case 'object':
            {
                const properties = {}
                for (const key in schema.properties) {
                    properties[key] = this.parse(schema.properties[key], handler);
                }
                return handler.object(properties, schema.options);
            }
            case 'boolean': return handler.boolean();
            case 'number': return handler.number();
            case 'string': return handler.string();
        }
    },
    Object(properties:{[key:string]:RawJSONSchema}, options:JSONObjectSchemaOptions):RawJSONSchema {
        return { type: 'object', properties, options };
    },
    Array(items:RawJSONSchema):RawJSONSchema {
        return { type: 'array', items };
    },
    Boolean():RawJSONSchema {
        return { type: 'boolean' };
    },
    Number():RawJSONSchema {
        return { type: 'number' };
    },
    String():RawJSONSchema {
        return { type: 'string' };
    }
} as const;