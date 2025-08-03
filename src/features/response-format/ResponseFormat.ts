import type { JSONObjectFormat, JSONSchemaElement, JSONSchemaFormat, TextFormat } from '@/types/response-format';

class ResponseFormat {
    static JSONSchema(schema: JSONSchemaElement, { name }: { name?: string } = {}): JSONSchemaFormat {
        return {
            type: 'json_schema',
            name: name ?? 'response',
            schema: schema,
        }
    }

    static Text(): TextFormat {
        return {
            type: 'text'
        }
    }

    static JSONObject(): JSONObjectFormat {
        return {
            type: 'json_object'
        }
    }
}

export default ResponseFormat;