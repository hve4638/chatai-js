import ChatAI, { Chat, ChatRole, KnownProvider } from '@/.'

// Claude 모델 목록 : https://docs.anthropic.com/en/docs/about-claude/models/all-models
describe('env test', ()=>{
    let apiKey:string;
    let chatAI:ChatAI;

    beforeAll(()=>{
        if (process.env['CLAUDE_KEY'] == null) {
            throw new Error("env 'CLAUDE_KEY' is not set. ");
        }
        apiKey = process.env['CLAUDE_KEY'] as string;
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
            provider : KnownProvider.Anthropic,
            model_name : 'claude-3-5-haiku-20241022',
            secret : {
                api_key : apiKey
            },
            max_tokens : 10,
            temperature : 0.1,
        });

        const {request, response} = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            "Content-Type": "application/json",
            "x-api-key": "SECRET",
            "anthropic-version": "2023-06-01"
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe('end_turn');
        expect(response.content[0].trim()).toEqual('hello')
    });
    
    test('fetch : stream', async ()=>{
        const [stream, resultPromise] = await chatAI.stream({
            message : [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            provider : KnownProvider.Anthropic,
            model_name : 'claude-3-5-haiku-20241022',
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
        const response = result.response;
        expect(result.response.content[0]).toEqual(message);
        
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe('end_turn');
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello')
    });
});