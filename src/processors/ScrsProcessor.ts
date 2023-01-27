import { ListArgsBuilder } from "../builders/ListArgsBuilder";
import { Config } from "../config/config";
import { ListArgs, ScrsBlock, SmartContractResult } from "../types";
import { NftOperation } from "../utils/NftOperation";
import { OperationResult } from "../utils/OperationResult";
import { Utility } from "../utils/Utility";
import { DataProcessor } from "./DataProcessor";
import { ListNftApiCaller } from "./ListNftApiCaller";

export class ScrsProcessor implements DataProcessor<ScrsBlock, Promise<void>> {
    private _listNftApiCaller: ListNftApiCaller;
    
    constructor() {
        this._listNftApiCaller = new ListNftApiCaller();
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

        await this._processListTransactions(transactions);
    }

    private async _processListTransactions(transactions: Map<string, SmartContractResult[]>): Promise<void> {
        for (const [originalTxHash, scResults] of transactions) {
            const { listOpArgs, opResultArgs, ownerAddress } = this._getListTransactionDetails(scResults);

            if (!listOpArgs || !opResultArgs) {
                // TODO: should create an analytic class responsible for recording how many transactions failed
                console.warn(`It is not a list transaction: ${originalTxHash} -> ${JSON.stringify(scResults)}: `, { listOpArgs, opResultArgs, ownerAddress });
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

                    await this._listNftApiCaller.call(url, { body: { ...listArgs } });
                } else {
                    console.warn(`Not enough arguments for list op result. Expected 3, got ${tokens}`);
                }
            } else {
                console.warn(`Not enough arguments for list op. Expected 5, got ${tokens}`);
            }
            
        }
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
};
