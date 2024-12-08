import { Schema, BaseSchema, IJSONSchema, JSONSchemaHandler, JSONObjectSchemaOptions } from './types'

type JSONSchemaArgs = {
    name?:string;
    schema?:BaseSchema;
}

class JSONSchema implements IJSONSchema {
    private _name:string;
    private schema?:BaseSchema;

    constructor({
        name,
        schema
    }:JSONSchemaArgs) {
        this._name = name ?? '';
        this.schema = schema;
    }
    
    get name() {
        return this._name;
    }

    hasSchema() {
        return this.schema !== undefined;
    }

    parse(handler:JSONSchemaHandler) {
        if(!this.hasSchema()) {
            return undefined;
        }
        else {
            return this.parseSchema(this.schema!, handler);
        }
    }

    private parseSchema(schema:BaseSchema, handler:JSONSchemaHandler) {
        switch(schema.type) {
            case 'array':
            {
                const items = this.parseSchema(schema.items, handler);
                return handler.array(items);
            }   
            case 'object':
            {
                const properties = {}
                for (const key in schema.properties) {
                    properties[key] = this.parseSchema(schema.properties[key], handler);
                }
                return handler.object(properties, schema.options);
            }
            case 'boolean': return handler.boolean();
            case 'number': return handler.number();
            case 'string': return handler.string();
        }
    }

    static Object(properties:{[key:string]:Schema}, options:JSONObjectSchemaOptions):Schema {
        return { type: 'object', properties, options };
    }
    static Array(items:Schema):Schema {
        return { type: 'array', items };
    }
    static Boolean():Schema {
        return { type: 'boolean' };
    }
    static Number():Schema {
        return { type: 'number' };
    }
    static String():Schema {
        return { type: 'string' };
    }
}


export default JSONSchema;