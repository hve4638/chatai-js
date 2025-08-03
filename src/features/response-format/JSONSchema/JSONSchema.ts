import { IArraySchema, IBooleanSchema, IEnumSchema, INumberSchema, IObjectSchema, IStringSchema, JSONSchemaElement, JSONSchemaHandler } from '@/types/response-format';

import type { ObjectSchemaMetadata, SchemaMetadata } from './types';

class JSONSchema {
    static Object(fields: Record<string, JSONSchemaElement>, metadata?: ObjectSchemaMetadata): JSONSchemaElement {
        return new ObjectSchema(fields, metadata);
    }

    static Array(items: JSONSchemaElement, metadata?: SchemaMetadata): JSONSchemaElement {
        return new ArraySchema(items, metadata);
    }

    static Boolean(metadata?: SchemaMetadata): JSONSchemaElement {
        return new BooleanSchema(metadata);
    }

    static Number(metadata?: SchemaMetadata): JSONSchemaElement {
        return new NumberSchema(metadata);
    }

    static String(metadata?: SchemaMetadata): JSONSchemaElement {
        return new StringSchema(metadata);
    }

    static Enum(enums: string[], metadata?: SchemaMetadata): JSONSchemaElement {
        return new EnumSchema(enums, metadata);
    }

    static parse(schema: JSONSchemaElement, handler: JSONSchemaHandler): object {
        switch (schema.type) {
            case 'array':
                {
                    const items = this.parse(schema.items, handler);
                    
                    return handler.array(schema, items);
                }
            case 'object':
                {
                    const fields: Record<string, object> = {}
                    const required: string[] = [];
                    
                    for (const key in schema.fields) {
                        const field = schema.fields[key];
                        fields[key] = this.parse(field, handler);

                        if (field.optional !== true) {
                            required.push(key);
                        }
                    }
                    return handler.object(schema, fields, { required });
                }
            case 'enum': return handler.enum(schema);
            case 'boolean': return handler.boolean(schema);
            case 'number': return handler.number(schema);
            case 'string': return handler.string(schema);
            default: throw new Error(`Unknown schema type: ${(schema as any).type}`);
        }
    }
}

class BaseSchema {
    description?: string;
    optional?: boolean;

    constructor(metadata: SchemaMetadata = {}) {
        this.description = metadata.description;
        this.optional = metadata.optional;
    }
}

class ObjectSchema extends BaseSchema implements IObjectSchema {
    readonly type = 'object';
    allowAdditionalProperties?: boolean;

    constructor(public fields: Record<string, JSONSchemaElement>, metadata: ObjectSchemaMetadata = {}) {
        super(metadata);
        this.allowAdditionalProperties = metadata.allowAdditionalProperties;
    }
}

class ArraySchema extends BaseSchema implements IArraySchema {
    readonly type = 'array';

    constructor(public items: JSONSchemaElement, metadata: SchemaMetadata = {}) {
        super(metadata);
    }
}

class BooleanSchema extends BaseSchema implements IBooleanSchema {
    readonly type = 'boolean';

    constructor(metadata: SchemaMetadata = {}) {
        super(metadata);
    }
}

class NumberSchema extends BaseSchema implements INumberSchema {
    readonly type = 'number';

    constructor(metadata: SchemaMetadata = {}) {
        super(metadata);
    }
}

class EnumSchema extends BaseSchema implements IEnumSchema {
    readonly type = 'enum';
    enum: string[];

    constructor(choices: string[], metadata: SchemaMetadata = {}) {
        super(metadata);
        this.enum = choices;
    }
}

class StringSchema extends BaseSchema implements IStringSchema {
    readonly type = 'string';

    constructor(metadata: SchemaMetadata = {}) {
        super(metadata);
    }
}

export default JSONSchema;