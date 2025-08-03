export type JSONSchemaFormat = {
    type: 'json_schema';
    name: string;
    schema: JSONSchemaElement;
}

export type JSONSchemaElement =
    IStringSchema
    | INumberSchema
    | IBooleanSchema
    | IEnumSchema
    | IArraySchema
    | IObjectSchema;

export type BaseMetadata = {
    description?: string;
    optional?: boolean;
}
export type IStringSchema = BaseMetadata & { type: 'string' };
export type INumberSchema = BaseMetadata & { type: 'number'; };
export type IBooleanSchema = BaseMetadata & { type: 'boolean'; };
export type IEnumSchema = BaseMetadata & { type: 'enum'; enum: string[]; };
export type IArraySchema = BaseMetadata & { type: 'array'; items: JSONSchemaElement; };
export type IObjectSchema = BaseMetadata & { type: 'object'; fields: Record<string, JSONSchemaElement>; allowAdditionalProperties?: boolean; };

type JSONObjectSchemaOption = {
    required: string[],
}

export interface JSONSchemaHandler {
    'string': (schema: IStringSchema) => object;
    'number': (schema: INumberSchema) => object;
    'boolean': (schema: IBooleanSchema) => object;
    'enum': (schema: IEnumSchema) => object;
    'array': (schema: IArraySchema, element: object) => object;
    'object': (schema: IObjectSchema, fields: Record<string, object>, option: JSONObjectSchemaOption) => object;
}