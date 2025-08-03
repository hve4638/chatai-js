export interface SchemaMetadata {
    description?: string;
    optional?: boolean;
}

export interface ObjectSchemaMetadata extends SchemaMetadata {
    allowAdditionalProperties?: boolean;
}