import { AxiosRequestConfig } from 'axios';

export type ChatAIRequest<TForm = any> = {
    form: TForm;
    url: string;
    data: object;
    config: AxiosRequestConfig;
}

export interface ChatAIResponse<TData = unknown> {
    code?: string;
    status: number;
    message: string;
    data: TData;
}