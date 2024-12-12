export type ResponseFormat = TextFormat | JSONFormat;

export type TextFormat = {
    type: 'text';
}

export type JSONFormat = {
    type: 'json';
    name : string;
    schema?: RawJSONSchema;
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