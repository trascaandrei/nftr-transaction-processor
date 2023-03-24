import { ApiCaller } from './ApiCaller';
import axios, { AxiosResponse } from 'axios';
import { RequestData } from '../types';

export class DeleteApiCaller<T> implements ApiCaller<T> {
    async call(url: string, requestData: RequestData): Promise<T> {
        const response: AxiosResponse = await axios.delete(url, {
            headers: requestData.headers
        });
        return response.data as T;
    }
};
