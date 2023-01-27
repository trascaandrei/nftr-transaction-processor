import { RequestData } from '../types';
import { ApiCaller } from './ApiCaller';
import axios, { AxiosResponse } from 'axios';

export class PostApiCaller<T> implements ApiCaller<T> {
    async call(url: string, requestData: RequestData): Promise<T> {
        const response: AxiosResponse = await axios.post(url, requestData.body);
        return response.data as T;
    }
};
