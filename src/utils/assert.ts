import { MissingFieldError } from '../errors';

export function assertNotNull(data, errorMessage:string) {
    if (data == null) {
        throw new Error(errorMessage);
    }
    return true;
}

export function assertFieldExists(data:any, fieldName:string) {
    if (
        data == null
    ) {
        throw new MissingFieldError(fieldName);
    }
}