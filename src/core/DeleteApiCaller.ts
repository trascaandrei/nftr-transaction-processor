import { ApiCaller } from './ApiCaller';
import axios, { AxiosResponse } from 'axios';

export class DeleteApiCaller<T> implements ApiCaller<T> {
    async call(url: string): Promise<T> {
        const response: AxiosResponse = await axios.delete(url);
        return response.data as T;
    }
};
