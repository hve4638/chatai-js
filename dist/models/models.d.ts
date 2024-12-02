export declare const MODELS: {
    readonly GOOGLE_GEMINI: "GOOGLE_GEMINI";
    readonly OPENAI_GPT: "OPENAI_GPT";
    readonly CLAUDE: "CLAUDE";
    readonly GOOGLE_VERTEXAI: "GOOGLE_VERTEXAI";
    readonly DEBUG_MODE: "DEBUG";
};
export type MODELS = typeof MODELS[keyof typeof MODELS];
export declare const MODEL_CATEGORY: {
    readonly GOOGLE_GEMINI: {
        readonly name: "Google Gemini";
        readonly models: readonly [{
            readonly name: "Gemini 1.5 Pro Exp 0827";
            readonly value: "gemini-1.5-pro-exp-0827";
        }, {
            readonly name: "Gemini 1.5 Pro-002";
            readonly value: "gemini-1.5-pro-002";
        }, {
            readonly name: "Gemini 1.5 Pro";
            readonly value: "gemini-1.5-pro-latest";
        }, {
            readonly name: "Gemini 1.5 Flash";
            readonly value: "gemini-1.5-flash";
        }, {
            readonly name: "Gemini 1.0 Pro";
            readonly value: "gemini-1.0-pro";
        }];
    };
    readonly OPENAI_GPT: {
        readonly name: "OpenAI GPT";
        readonly models: readonly [{
            readonly name: "GPT-4o";
            readonly value: "gpt-4o";
        }, {
            readonly name: "GPT-4o mini";
            readonly value: "gpt-4o-mini";
        }, {
            readonly name: "GPT-4 Turbo";
            readonly value: "gpt-4-turbo";
        }];
    };
    readonly CLAUDE: {
        readonly name: "Anthropic Claude";
        readonly models: readonly [{
            readonly name: "Claude 3.5 Sonnet";
            readonly value: "claude-3-5-sonnet-20240620";
        }, {
            readonly name: "Claude 3 Opus";
            readonly value: "claude-3-opus-20240229";
        }, {
            readonly name: "Claude 3 Haiku";
            readonly value: "claude-3-haiku-20240307";
        }];
    };
    readonly GOOGLE_VERTEXAI: {
        readonly name: "Google VertexAI";
        readonly models: readonly [{
            readonly name: "Claude 3.5 Sonnet";
            readonly value: "claude-3-5-sonnet@20240620";
        }, {
            readonly name: "Claude 3 Opus";
            readonly value: "claude-3-opus@20240229";
        }, {
            readonly name: "Claude 3 Haiku";
            readonly value: "claude-3-haiku@20240307";
        }];
    };
};
//# sourceMappingURL=models.d.ts.map