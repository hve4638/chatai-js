import ChatAIError from "./ChatAIError";

class MissingFieldError extends ChatAIError {
    constructor(field:string) {
        super(`required field '${field}'`);
        this.name = 'MissingFieldError';
    }
}

export default MissingFieldError;