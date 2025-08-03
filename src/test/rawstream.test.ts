import 'dotenv/config';

import { ChatAI, Chat, ChatRole, ResponseFormat, JSONSchema, FinishReason } from '@/.'
import Channel from '@hve/channel';

const hasApiKey = !!process.env['OPENAI_KEY'];

// OpenAI 모델 목록 : https://platform.openai.com/docs/models
(hasApiKey ? describe : describe.skip)('ResponsesAPI', () => {
    let apiKey: string;

    beforeAll(() => {
        apiKey = process.env['OPENAI_KEY'] as string;
    });

    test('fetch: stream', async () => {
        const uesrMessage = "Say just 'hello'. Do not answer anything else."

        const streamResult = await ChatAI.stream.responses({
            messages: [
                ChatRole.User(
                    Chat.Text(uesrMessage)
                )
            ],
            model: 'gpt-4o-mini-2024-07-18',
            auth: {
                api_key: apiKey
            },
            max_tokens: 128,
            temperature: 0.1,
        }, { rawStream: true });

        const {
            messages,
            result,
            debug
        } = streamResult;
        const resulted = await result;
        console.log(resulted);
        const {
            rawStream,
            ch
        } = debug as any;

        const messageCh = ch as Channel<string>;
        const ls: (string | null)[] = [];

        ls.push(await messageCh.consume());
        ls.push(await messageCh.consume());
        ls.push(await messageCh.consume());

        // console.log(`Stream: start`);
        // for (const s in rawStream) {
        //     console.log(`Stream: ${s}`);
        // }
        // console.log(`Stream: done`);
    }, 1000 * 15);
})
