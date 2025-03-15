import ChatAI, { Chat, ChatRole, KnownProvider } from '@/.'

// Gemini 모델 목록 : https://ai.google.dev/gemini-api/docs/models/gemini?hl=ko
describe('Gemini api test', ()=>{
    let apiKey:string;
    let chatAI:ChatAI;

    beforeAll(()=>{
        if (process.env['GEMINI_KEY'] == null) {
            throw new Error("env 'GEMINI_KEY' is not set. ");
        }
        apiKey = process.env['GEMINI_KEY'] as string;
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
            provider : KnownProvider.Google,
            model_name : 'gemini-2.0-flash-lite',
            secret : {
                api_key : apiKey
            },
            max_tokens : 10,
            temperature : 0.1,
        });
        
        console.log(JSON.stringify(result, null, 2));

        const {request, response} = result;
        expect(request.url).toEqual('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=SECRET');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe('STOP');
        expect(response.content[0].trim()).toEqual('hello')
    });

    test('fetch : stream', async ()=>{
        const [stream, resultPromise] = await chatAI.stream({
            message : [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            provider : KnownProvider.Google,
            model_name : 'gemini-2.0-flash',
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

        // 스트리밍 텍스트와 결과 텍스트가 동일한지 확인
        expect(response.content[0]).toEqual(message);
        
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe('STOP');
        expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello')
    });
});