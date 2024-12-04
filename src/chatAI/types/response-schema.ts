export type Schema = {
    type: 'string'|'number'|'boolean';
} | {
    type: 'array',
    items: Schema
} | {
    type: 'object',
    properties: {[key:string]:Schema}
};

export type BaseSchema = {
    type: 'json'
} | Schema;
