import { Config } from "../config/config";
import { Cleaner } from "../core/Cleaner";
import { CleanerTarget } from "../core/CleanerTarget";
import { Message, ScrsBlock, SmartContractResult, TxsBlock, UpdatePriceResponse } from "../types";
import { NftOperation } from "../utils/NftOperation";
import { OperationResult } from "../utils/OperationResult";
import { Utility } from "../utils/Utility";
import { DataProcessor } from "./DataProcessor";
import { UpdateNftPriceApiCaller } from "./UpdateNftPriceApiCaller";

enum OperationState {
    UNKNOWN = 'unknown',
    SUCCESS = 'success',
    FAIL = 'fail'
};

type UpdatePriceType = {
    price?: number;
    transactionId?: string;
    state: OperationState;
    timestamp: number;
};

export class TxsProcessor implements DataProcessor<Message, Promise<void>>, CleanerTarget {
    private _map: Map<string, UpdatePriceType>;
    private _updateNftPriceApiCaller: UpdateNftPriceApiCaller;
    private _cleaner: Cleaner;

    constructor() {
        this._map = new Map<string, UpdatePriceType>();
        this._updateNftPriceApiCaller = new UpdateNftPriceApiCaller();
        /* every hour */
        this._cleaner = new Cleaner("0 * * * *", this);
        this._cleaner.start();
    }

    public async clean(): Promise<void> {
        console.log("Start cleanning...");
        let removed: number = 0;
        const size: number = this._map.size;

        for (const [key, details] of this._map) {
            if (details.state === OperationState.UNKNOWN && details.timestamp < Date.now() - 3600 * 1000) {
                this._map.delete(key);
                console.log(`Deleted key ${key}.`);
                ++removed;
            }
        }

        console.log(`Cleanning finished: ${removed}/${size} keys were deleted.\n\n`);
    }

    public async process(data: Message): Promise<void> {
        if (data["txs"]) {
            this._processTxsBlock(data as TxsBlock);
        } else if (data["scrs"]) {
            this._processScrsBlock(data as ScrsBlock);
        } else {
            console.warn("Invalid data received.");
            return;
        }

        const promises: Promise<UpdatePriceResponse>[] = [];
        let changePriceTxs: number = 0;
        const size: number = this._map.size;

        for (const [key, details] of this._map) {
            if (details.state === OperationState.SUCCESS) {
                const url: string = `${Config.NFTR_HOST}${Config.UPDATE_NFT_URI}/${details.transactionId}`;
                promises.push(this._updateNftPriceApiCaller.call(url, { body: { price: details.price }, headers: { 'nftr-api-key': Config.NFTR_API_KEY } }));
                this._map.delete(key);
                ++changePriceTxs;
            }
        }

        console.log(`Change price transactions: ${changePriceTxs}/${size}\n\n`);

        if (!promises.length) {
            return;
        }

        const results: PromiseSettledResult<UpdatePriceResponse>[] = await Promise.allSettled(promises);

        results.forEach((result: PromiseSettledResult<UpdatePriceResponse>) => {
            if (result.status === "rejected") {
                console.error(JSON.stringify(result.reason));
            }
        });
    }

    private _processTxsBlock(data: TxsBlock): void {
        for (const key of Object.keys(data.txs)) {
            if (data.txs[key].sender === Config.ADDRESS || data.txs[key].receiver === Config.ADDRESS) {
                const decodedData: string = Utility.convertBase64ToString(data.txs[key].data);

                if (!decodedData.startsWith(NftOperation.UPDATE_PRICE)) {
                    continue;
                }

                const base64Key: string = Utility.convertHexToBase64(key);
                const tokens: string[] = decodedData.split("@");

                if (tokens.length !== 3) {
                    console.warn(`Invalid change price transaction: not enough arguments - ${decodedData}`);
                    return;
                }

                let state: OperationState = OperationState.UNKNOWN;

                if (this._map.has(base64Key)) {
                    state = OperationState.SUCCESS;
                }

                this._map.set(base64Key, {
                    price: Utility.convertHexToDecimal(tokens[2]) / 10000000000 / 100000000,
                    transactionId: tokens[1],
                    timestamp: Date.now(),
                    state
                });
            }
        }
    }

    private _processScrsBlock(data: ScrsBlock): void {
        const scResultsMap: Map<string, SmartContractResult[]> = new Map<string, SmartContractResult[]>();

        for (const key of Object.keys(data.scrs)) {
            if (data.scrs[key].sender === Config.ADDRESS || data.scrs[key].receiver === Config.ADDRESS) {
                if (data.scrs[key].originalTxHash) {
                    if (!scResultsMap.has(data.scrs[key].originalTxHash)) {
                        scResultsMap.set(data.scrs[key].originalTxHash, []);
                    }

                    const scResults: SmartContractResult[] = scResultsMap.get(data.scrs[key].originalTxHash);
                    scResults.push(data.scrs[key]);
                    scResultsMap.set(data.scrs[key].originalTxHash, scResults);
                }
            }
        }

        for (const [txhash, scResults] of scResultsMap) {
            if (scResults.length !== 1) {
                continue;
            }

            const scResult: SmartContractResult = scResults[0];
            const decodedData: string = Utility.convertBase64ToString(scResult.data);
            
            if (!decodedData.startsWith(OperationResult.OK)) {
                continue;
            }

            let updateDetails: UpdatePriceType | undefined = undefined;

            if (this._map.has(txhash)) {
                updateDetails = this._map.get(txhash);
                updateDetails.state = OperationState.SUCCESS;
            } else {
                updateDetails = {
                    state: OperationState.UNKNOWN,
                    timestamp: Date.now()
                } as UpdatePriceType;
            }

            this._map.set(txhash, updateDetails);
        }
    }
};
