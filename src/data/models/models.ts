import ModelName from './model-names';
import OpenAIGPTModels from './openai-gpt-models';
import GeminiModels from './google-gemini-models';
import ClaudeModels from './anthropic-claude-models';
import VertexAIModels from './vertexai-models';

const ModelDetails = {
    [ModelName.GOOGLE_GEMINI] : GeminiModels,
    [ModelName.OPENAI_GPT] : OpenAIGPTModels,
    [ModelName.CLAUDE] : ClaudeModels,
    [ModelName.GOOGLE_VERTEXAI] : VertexAIModels,
} as const;

export default ModelDetails;