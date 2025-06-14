import { z } from 'zod';
export type ResponseFormat = TextFormat | JSONFormat;

export type TextFormat = {
    type: 'text';
}

export type JSONFormat = {
    type: 'json';
    name : string;
    schema?: RawJSONSchema;
}

export type JSONObjectFormat = {
    type: 'json-object';
    name : string;
}

export type JSONSchemaFormat = {
    type: 'json-schema';
    name : string;
    schema: z.ZodObject<any>;
}

export type RawJSONSchema = {
    type: 'string'|'number'|'boolean';
} | {
    type: 'array',
    items: RawJSONSchema
} | {
    type: 'object',
    properties: {[key:string]:RawJSONSchema}
    options : JSONObjectSchemaOptions
};

export type JSONObjectSchemaOptions = {
    required?: string[],
    allow_additional_properties?: boolean
}

export interface JSONSchemaHandler {
    'array' : (element:object)=>object,
    'object' : (properties:{[key:string]:RawJSONSchema}, options:JSONObjectSchemaOptions)=>object,
    'boolean' : ()=>object,
    'number' : ()=>object,
    'string' : ()=>object,
}