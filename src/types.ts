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

export type TransactionDetails = Omit<SmartContractResult, "callType" | "originalTxHash" | "prevTxHash"> & {
    chainID: string;
    version: number;
    signature: string;
};

export interface TxsBlock extends Block {
    txs: Record<string, TransactionDetails>;
};

export type Message = ScrsBlock | TxsBlock;

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

interface MsgResponse {
    message: string;
};

export interface ErrorResponse extends MsgResponse {};

export interface SuccessResponse extends MsgResponse {};

export type ListNftApiResponse = ErrorResponse | { nftId: string; };

export type BuyAndWithdrawResponse = SuccessResponse | ErrorResponse;

export type UpdatePriceResponse = SuccessResponse | ErrorResponse;
