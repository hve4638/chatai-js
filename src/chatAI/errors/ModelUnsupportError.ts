class ModelUnsupportError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ModelUnsupportError';
    }
}

export default ModelUnsupportError;