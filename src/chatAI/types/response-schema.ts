export type Schema = {
    type: 'string'|'number'|'boolean';
} | {
    type: 'array',
    items: Schema
} | {
    type: 'object',
    properties: {[key:string]:Schema}
    options : JsonObjectSchemaOptions
};

export type BaseSchema = {
    type: 'json'
} | Schema;

export type JsonObjectSchemaOptions = {
    required?: string[],
    allow_additional_properties?: boolean
}

export interface IJsonSchema {
    get name():string;
    hasSchema():boolean;
    parse(handler:JsonSchemaHandler):object;
}

export interface JsonSchemaHandler {
    'array' : (element:object)=>object,
    'object' : (properties:{[key:string]:Schema}, options:JsonObjectSchemaOptions)=>object,
    'boolean' : ()=>object,
    'number' : ()=>object,
    'string' : ()=>object,
}