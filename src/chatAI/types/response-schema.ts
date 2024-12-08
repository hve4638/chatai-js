

export type Schema = {
    type: 'string'|'number'|'boolean';
} | {
    type: 'array',
    items: Schema
} | {
    type: 'object',
    properties: {[key:string]:Schema}
    options : JSONObjectSchemaOptions
};

export type BaseSchema = {
    type: 'json'
} | Schema;

export type JSONObjectSchemaOptions = {
    required?: string[],
    allow_additional_properties?: boolean
}

export interface IJSONSchema {
    get name():string;
    hasSchema():boolean;
    parse(handler:JSONSchemaHandler):object;
}

export interface JSONSchemaHandler {
    'array' : (element:object)=>object,
    'object' : (properties:{[key:string]:Schema}, options:JSONObjectSchemaOptions)=>object,
    'boolean' : ()=>object,
    'number' : ()=>object,
    'string' : ()=>object,
}