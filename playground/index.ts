import AIModelAPI, { ChatRole, Models, ChatType } from '../src'

// https://ai.google.dev/api/generate-content?hl=ko#v1beta.GenerationConfig

async function run()  {
    const api = new AIModelAPI({ fetch });
    const data = await api.request({
        message: [
            {
                role: ChatRole.SYSTEM,
                content: [
                    {
                        chatType: ChatType.TEXT,
                        text: "Understand the user's intent and emotions and respond accordingly."
                    }
                ]
            },
            {
                role: ChatRole.USER,
                content: [
                    {
                        chatType: ChatType.TEXT,
                        text: "Introduce yourself"
                    }
                ]
            }
        ],
        model: Models.GOOGLE_GEMINI,
        model_detail: 'gemini-1.5-flash-002',
        secret: {
            api_key : process.env['API_KEY']
        },
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