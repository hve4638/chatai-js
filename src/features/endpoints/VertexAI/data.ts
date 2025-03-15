export const BASE_URL = 'https://{{location}}-aiplatform.googleapis.com/v1/projects/{{projectid}}/locations/{{location}}/publishers/anthropic/models/{{model}}:rawPredict';
export const DEFAULT_OPTIONS = {
    TOP_P: 1.0,
    TEMPERATURE : 1.0,
    MAX_OUTPUT_TOKENS : 1024,
}