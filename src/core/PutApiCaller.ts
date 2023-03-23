import { RequestData } from '../types';
import { ApiCaller } from './ApiCaller';
import axios, { AxiosResponse } from 'axios';

export class PutApiCaller<T> implements ApiCaller<T> {
    async call(url: string, requestData: RequestData): Promise<T> {
        const response: AxiosResponse = await axios.put(url, requestData.body, {
            headers: requestData.headers
        });
        return response.data as T;
    }
};
