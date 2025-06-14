export interface ChatAIResponse<TData = any> {
    code?: string;
    status: number;
    message: string;
    data: TData;
}