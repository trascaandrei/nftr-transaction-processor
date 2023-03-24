import { ListArgsBuilder } from "../builders/ListArgsBuilder";
import { Config } from "../config/config";
import { BuyAndWithdrawResponse, ListArgs, ListNftApiResponse, ScrsBlock, SmartContractResult } from "../types";
import { NftOperation } from "../utils/NftOperation";
import { OperationResult } from "../utils/OperationResult";
import { Utility } from "../utils/Utility";
import { BuyNftApiCaller } from "./BuyNftApiCaller";
import { DataProcessor } from "./DataProcessor";
import { ListNftApiCaller } from "./ListNftApiCaller";
import { WithdrawNftApiCaller } from "./WithdrawNftApiCaller";

export class ScrsProcessor implements DataProcessor<ScrsBlock, Promise<void>> {
    private _listNftApiCaller: ListNftApiCaller;
    private _buyNftApiCaller: BuyNftApiCaller;
    private _withdrawNftApiCaller: WithdrawNftApiCaller;
    
    constructor() {
        this._listNftApiCaller = new ListNftApiCaller();
        this._buyNftApiCaller = new BuyNftApiCaller();
        this._withdrawNftApiCaller = new WithdrawNftApiCaller();
    }

    public async process(data: ScrsBlock): Promise<void> {
        const originalTxHashes: Set<string> = new Set<string>();

        for (const key of Object.keys(data.scrs)) {
            if (data.scrs[key].sender === Config.ADDRESS || data.scrs[key].receiver === Config.ADDRESS) {
                if (data.scrs[key].originalTxHash) {
                    originalTxHashes.add(data.scrs[key].originalTxHash);
                }
            }
        }

        const transactions: Map<string, SmartContractResult[]> = new Map();

        for (const key of Object.keys(data.scrs)) {
            if (originalTxHashes.has(data.scrs[key].originalTxHash)) {
                if (!transactions.has(data.scrs[key].originalTxHash)) {
                    transactions.set(data.scrs[key].originalTxHash, [] as SmartContractResult[]);
                }

                const scResults: SmartContractResult[] = transactions.get(data.scrs[key].originalTxHash);
                scResults.push(data.scrs[key]);

                transactions.set(data.scrs[key].originalTxHash, scResults);
            }
        }

        if (!transactions.size) {
            return;
        }

        const promises: Promise<void>[] = [
            this._processListTransactions(transactions),
            this._processBuyAndWithdrawTransactions(transactions)
        ]

        const results: PromiseSettledResult<void>[] = await Promise.allSettled(promises);
        results.forEach((result: PromiseSettledResult<void>) => {
            if (result.status === "rejected") {
                console.error(JSON.stringify(result.reason));
            }
        });
    }

    private async _processListTransactions(transactions: Map<string, SmartContractResult[]>): Promise<void> {
        const promises: Promise<ListNftApiResponse>[] = [];

        for (const [originalTxHash, scResults] of transactions) {
            const { listOpArgs, opResultArgs, ownerAddress } = this._getListTransactionDetails(scResults);

            if (!listOpArgs || !opResultArgs) {
                if (listOpArgs) {
                    console.warn(`List transaction failed: ${originalTxHash} -> ${JSON.stringify(scResults)}: `, { listOpArgs, opResultArgs, ownerAddress });
                }

                continue;
            }

            let listArgsBuilder: ListArgsBuilder = new ListArgsBuilder();
            let tokens: string[] = listOpArgs.split("@");

            if (tokens.length === 5) {
                /* add collection ticker and nonce */
                listArgsBuilder = listArgsBuilder.addCollectionTicker(Utility.convertHexToString(tokens[1])).addNonce(tokens[2]);

                /* add price */
                listArgsBuilder = listArgsBuilder.addPrice(Utility.convertHexToDecimal(tokens[3]) / 10000000000 / 100000000);

                /* add custom royalties */
                listArgsBuilder = listArgsBuilder.addCustomRoyalties(Utility.convertHexToDecimal(tokens[4]) / 100);

                /* add owner address */
                listArgsBuilder = listArgsBuilder.addOwnerAddress(Utility.convertBase64ToBech32Address(ownerAddress));
                tokens = opResultArgs.split("@");

                if (tokens.length === 3) {
                    /* add transaction id and build the final object */
                    const listArgs: ListArgs = listArgsBuilder.addTransactionId(tokens[2]).build();
                    const url: string = `${Config.NFTR_HOST}${Config.LIST_NFT_URI}`;

                    promises.push(this._listNftApiCaller.call(url, { body: { ...listArgs }, headers: { 'nftr-api-key': Config.NFTR_API_KEY } }));
                } else {
                    console.warn(`Not enough arguments for list op result. Expected 3, got ${tokens}`);
                }
            } else {
                console.warn(`Not enough arguments for list op. Expected 5, got ${tokens}`);
            }
            
        }

        if (!promises.length) {
            return;
        }

        const results: PromiseSettledResult<ListNftApiResponse>[] = await Promise.allSettled(promises);

        results.forEach((result: PromiseSettledResult<ListNftApiResponse>) => {
            if (result.status === "rejected") {
                console.error(JSON.stringify(result.reason));
            }
        });
    }

    private _getListTransactionDetails(scResults: SmartContractResult[]): Record<string, string> {
        const result: Record<string, string> = {
            listOpArgs: undefined,
            opResultArgs: undefined,
            ownerAddress: undefined
        };

        for (const scResult of scResults) {
            const data: string = Utility.convertBase64ToString(scResult.data);

            if (data.startsWith(NftOperation.LIST)) {
                result.listOpArgs = data;
            } else if (data.startsWith(OperationResult.OK)) {
                result.opResultArgs = data;
                result.ownerAddress = scResult.receiver;
            }

            if (result.listOpArgs && result.opResultArgs) {
                return result;
            }
        }

        return result;
    }
    
    private async _processBuyAndWithdrawTransactions(transactions: Map<string, SmartContractResult[]>): Promise<void> {
        const promises: Promise<BuyAndWithdrawResponse>[] = [];

        for (const [originalTxHash, scResults] of transactions) {
            const { opType, transactionId, address } = this._getBuyOrWithdrawTransactionDetails(scResults);

            if (!opType || !transactionId) {
                if (opType) {
                    const msg: string = `${opType === NftOperation.BUY ? 'Buy' : 'Withdraw'} transaction failed`;
                    console.warn(`${msg}: ${originalTxHash} -> ${JSON.stringify(scResults)}: `, { opType, transactionId, address });
                }

                continue;
            }

            if (opType === NftOperation.BUY) {
                const url: string = `${Config.NFTR_HOST}${Config.UPDATE_NFT_URI}/${transactionId}`;
                promises.push(this._buyNftApiCaller.call(url, { body: { ownerAddress: address }, headers: { 'nftr-api-key': Config.NFTR_API_KEY } }));
            } else if (opType === NftOperation.WITHDRAW) {
                const url: string = `${Config.NFTR_HOST}${Config.WITHDRAW_NFT_URI}/${transactionId}`;
                promises.push(this._withdrawNftApiCaller.call(url, { headers: { 'nftr-api-key': Config.NFTR_API_KEY } }));
            }
        }

        if (!promises.length) {
            return;
        }

        const results: PromiseSettledResult<BuyAndWithdrawResponse>[] = await Promise.allSettled(promises);

        results.forEach((result: PromiseSettledResult<BuyAndWithdrawResponse>) => {
            if (result.status === "rejected") {
                console.error(JSON.stringify(result.reason));
            }
        });
    }

    private _getBuyOrWithdrawTransactionDetails(scResults: SmartContractResult[]): Record<string, string> {
        const result: Record<string, string> = {
            opType: undefined, /* buy or withdraw operation */
            transactionId: undefined, /* transaction id */
            address: undefined /* the address of the new owner */
        };

        for (const scResult of scResults) {
            const data: string = Utility.convertBase64ToString(scResult.data);
            const tokens: string[] = data.split("@");

            if (tokens.length >= 3 && tokens[tokens.length - 1] === NftOperation.BUY) {
                result.opType = NftOperation.BUY;
                result.address = Utility.convertBase64ToBech32Address(scResult.receiver);
            } else if (tokens.length >= 3 && tokens[tokens.length - 1] === NftOperation.WITHDRAW) {
                result.opType = NftOperation.WITHDRAW;
            } else if (tokens.length === 3 && `@${tokens[1]}` === OperationResult.OK) {
                result.transactionId = tokens[2];
            }

            if (result.opType && result.transactionId) {
                return result;
            }
        }

        return result;
    }
};
