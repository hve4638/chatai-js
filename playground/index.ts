import AIModelAPI, {
    ChatRole,
    Models,
    ModelNames,
    ChatType,
    JSONSchema,
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
        response_format : new JSONSchema({
            name : 'response_message',
            schema : JSONSchema.Object({
                'output' : JSONSchema.String(),
                'user_intent' : JSONSchema.String(),
                'user_emotion' : JSONSchema.String(),
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