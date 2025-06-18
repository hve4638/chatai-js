import 'dotenv/config';
import { ChatAI, Chat, ChatRole } from '@/.'
import { FinishReason } from '@/types';

const hasApiKey = !!process.env['CLAUDE_KEY'];

(hasApiKey ? describe : describe.skip)('env test', () => {
    let apiKey: string;

    beforeAll(() => {
        apiKey = process.env['CLAUDE_KEY'] as string;
    });

    test('fetch: request', async () => {
        const result = await ChatAI.requestAnthropic({
            messages: [
                ChatRole.User(
                    Chat.Text("Say just 'hello'. Do not answer anything else.")
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 10,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim()).toEqual('hello');
    }, 10000);

    test('fetch: vision', async () => {
        const target = './.test/target.jpg';

        const result = await ChatAI.requestAnthropic({
            messages: [
                ChatRole.User(
                    Chat.Image.From(target),
                    Chat.Text("What's in this image?"),
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);
        expect(response.content[0].trim().toLowerCase()).toContain('apple');
    }, 1000 * 60);

    test('fetch: PDF', async () => {
        // PDF 내용
        // 1. 1+1=?
        // 2. 2+4=?
        // 3. 4*4=?
        // 4. 10/2=?
        const target = './.test/math.pdf';

        const result = await ChatAI.requestAnthropic({
            messages: [
                ChatRole.User(
                    Chat.PDF.From(target),
                    Chat.Text("Answer questions in the PDF."),
                )
            ],
            model: 'claude-3-5-haiku-20241022',
            auth: {
                api_key: apiKey
            },
            max_tokens: 1024,
            temperature: 0.1,
        });

        const { request, response } = result;
        expect(request.url).toEqual('https://api.anthropic.com/v1/messages');
        expect(request.headers).toEqual({
            'Content-Type': 'application/json',
            'x-api-key': 'SECRET',
            'anthropic-version': '2023-06-01'
        });
        expect(response.ok).toBe(true);
        expect(response.http_status).toBe(200);
        expect(response.finish_reason).toBe(FinishReason.End);

        const answer = response.content[0].trim().toLowerCase();
        expect(answer).toContain('2'); // 1+1
        expect(answer).toContain('6'); // 2+4
        expect(answer).toContain('16'); // 4*4
        expect(answer).toContain('5'); // 10/2
    });

    test('fetch : stream', async () => {
        // const [stream, resultPromise] = await ChatAI.stream({
        //     message : [
        //         ChatRole.User(
        //             Chat.Text("Say just 'hello'. Do not answer anything else.")
        //         )
        //     ],
        //     provider : KnownProvider.Anthropic,
        //     model_name : 'claude-3-5-haiku-20241022',
        //     secret : {
        //         api_key : apiKey
        //     },
        //     max_tokens : 128,
        //     temperature : 1.0,
        // }, { rawStream: true });

        // let messageList:string[] = [];
        // for await (const fragment of stream) {
        //     messageList.push(fragment);
        // }

        // let message:string = messageList.join('');
        // const result = await resultPromise;
        // const response = result.response;
        // expect(result.response.content[0]).toEqual(message);

        // expect(response.ok).toBe(true);
        // expect(response.http_status).toBe(200);
        // expect(response.finish_reason).toBe('end_turn');
        // expect(response.content[0].trim().toLowerCase().replaceAll('.', '')).toEqual('hello')
    });
});