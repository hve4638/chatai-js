import AIModelAPI, {
    ChatRole,
    Models,
    ModelNames,
    ChatType,
    JsonSchema,
} from '../src'

async function run()  {
    const api = new AIModelAPI({ fetch });
    const data = await api.request({
        message: [
            {
                role: ChatRole.USER,
                content: [
                    {
                        chatType: ChatType.TEXT,
                        text: "Describe yourself very briefly."
                    }
                ]
            },
        ],
        model: ModelNames.OPENAI_GPT,
        model_detail: Models.OPENAI_GPT['gpt-4o'],
        secret: {
            api_key : process.env['API_KEY']
        },
        response_format : new JsonSchema({
            name : 'response_message',
            schema : JsonSchema.Object({
                'output' : JsonSchema.String(),
                'user_intent' : JsonSchema.String(),
                'user_emotion' : JsonSchema.String(),
            }, {
                required : ['output', 'user_intent', 'user_emotion'],
                allow_additional_properties : false
            }),
        }),
        max_tokens: 100,
    });
    console.log(data.response.raw);
    console.log(data.response);
}

run();