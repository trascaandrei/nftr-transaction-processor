import { Options } from "amqplib";

export interface MessagesAnalytic {
    total: number;
    nonEmpty: number;
};

export interface AnalyticConfig {
    minutes: number;
};

export interface AMQPConfig {
    queue: string;
    exchanges: string[];
};

export interface ConsumerConfig {
    amqpConnect: Options.Connect;
    amqp: AMQPConfig;
    analytic: AnalyticConfig;
};

export interface Block {
    hash: string;
}

export interface SmartContractResult {
    nonce?: number;
    value?: number;
    receiver?: string;
    sender?: string;
    // relayer?: string,
    // relayedValue?: number,
    data?: string;
    prevTxHash?: string;
    originalTxHash?: string;
    gasLimit?: number;
    gasPrice?: number;
    callType?: number;
};

export interface ScrsBlock extends Block {
    scrs: Record<string, SmartContractResult>;
};

export interface ListArgs {
    collectionTicker: string;
    nonce: string;
    price: number;
    customRoyalties: number;
    transactionId: string;
    ownerAddress: string;
};

export interface RequestData {
    headers?: Record<string, string>;
    body?: Record<string, unknown>;
};

export interface ErrorResponse {
    message: string;
};

export type ListNftApiResponse = ErrorResponse | { nftId: string; };
