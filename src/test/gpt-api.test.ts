import ChatAI, { Chat, ChatRole, KnownProvider } from '@/.'

// OpenAI 모델 목록 : https://platform.openai.com/docs/models
describe('GPT API test', ()=>{
    let apiKey:string;
    let chatAI:ChatAI;

    beforeAll(()=>{
        if (process.env['OPENAI_KEY'] == null) {
            throw new Error("env 'OPENAI_KEY' is not set. ");
        }
        apiKey = process.env['OPENAI_KEY'] as string;
    });
    beforeEach(()=>{
        chatAI = new ChatAI();
    });

    test('fetch : request', async () => {
        const result = await chatAI.request({
            message : [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            provider : KnownProvider.OpenAI,
            model_name : 'gpt-4o-mini-2024-07-18',
            secret : {
                api_key : apiKey
            },
            max_tokens : 10,
            temperature : 0.1,
        });

        const {request, response} = result;
        expect(request.url).toEqual('https://api.openai.com/v1/chat/completions');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'Authorization': `Bearer SECRET`
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe('stop');
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello');
    });

    test('fetch : stream', async ()=>{
        const [stream, resultPromise] = await chatAI.stream({
            message : [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            provider : KnownProvider.OpenAI,
            model_name : 'gpt-4o-mini-2024-07-18',
            secret : {
                api_key : apiKey
            },
            max_tokens : 128,
            temperature : 1.0,
        }, { rawStream: true });
        
        let messageList:string[] = [];
        for await (const fragment of stream) {
            messageList.push(fragment);
        }
        
        let message:string = messageList.join('');
        const result = await resultPromise;
        expect(result.response.content[0]).toEqual(message);
    });
});
