import { RequestData } from "../types";

export interface ApiCaller<T> {
    call: (url: string, requestData?: RequestData) => Promise<T>
};
