import AIModelAPI, {
    ChatRole,
    Models,
    ModelNames,
    ChatType,
    JsonSchema,
} from '../src'

// https://ai.google.dev/api/generate-content?hl=ko#v1beta.GenerationConfig

async function run()  {
    const api = new AIModelAPI({ fetch });
    const data = await api.request({
        message: [
            {
                role: ChatRole.USER,
                content: [
                    {
                        chatType: ChatType.TEXT,
                        text: "다음을 json으로 출력해 : Hello, World!"
                    }
                ]
            },
        ],
        model: ModelNames.OPENAI_GPT,
        model_detail: Models.OPENAI_GPT['gpt-4o-mini'],
        secret: {
            api_key : process.env['API_KEY']
        },
        response_format : JsonSchema.JSON(),
        additional : {
            response_mime_type : 'application/json',
            response_schema : {
                type : 'ARRAY',
                items : {
                    type : 'OBJECT',
                    properties : {
                        'response' : { 'type' : 'STRING' },
                        'emotion' : { 'type' : 'STRING' },
                        'intent' : { 'type' : 'STRING' }
                    }
                }
            }
        }
    });
    console.log(data)
}

run();