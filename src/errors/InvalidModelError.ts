class InvalidModelError extends Error {
    constructor(model:string) {
        super(`Invalid model: ${model}`);
    }
}

export default InvalidModelError;