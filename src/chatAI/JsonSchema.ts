import { Schema, BaseSchema } from './types'

class JsonSchema {
    static JSON():BaseSchema {
        return {type: 'json'};
    }
    static Object(properties:{[key:string]:Schema}):Schema {
        return { type: 'object', properties };
    }
    static Array(items:Schema) {
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

    static isJson(schema:BaseSchema) {
        return schema.type === 'json';
    }
    static isString(schema:Schema) {
        return schema.type === 'string';
    }
    static isNumber(schema:Schema) {
        return schema.type === 'number';
    }
    static isBoolean(schema:Schema) {
        return schema.type === 'boolean';
    }
    static isArray(schema:Schema) {
        return schema.type === 'array';
    }
    static isObject(schema:Schema) {
        return schema.type === 'object';
    }

    static parse(schema:BaseSchema, handler:{
        'json': ()=>object,
        'array' : (element:object)=>object,
        'object' : (properties:object)=>object,
        'boolean' : ()=>object,
        'number' : ()=>object,
        'string' : ()=>object,
    }) {
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
                return handler.object(properties);
            }   
            case 'json': return handler.json();
            case 'boolean': return handler.boolean();
            case 'number': return handler.number();
            case 'string': return handler.string();
        }
    }
}


export default JsonSchema;