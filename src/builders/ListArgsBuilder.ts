import { ListArgs } from "../types";
import { Builder } from "./Builder";

export class ListArgsBuilder extends Builder<ListArgs> {
    private _collectionTicker: string;
    private _nonce: string;
    private _price: number;
    private _customRoyalties: number;
    private _ownerAddress: string;
    private _transactionId: string;

    addCollectionTicker(collectionTicker: string): ListArgsBuilder {
        this._collectionTicker = collectionTicker;
        return this;
    }

    addNonce(nonce: string): ListArgsBuilder {
        this._nonce = nonce;
        return this;
    }

    addPrice(price: number): ListArgsBuilder {
        this._price = price;
        return this;
    }

    addCustomRoyalties(customRoyalties: number): ListArgsBuilder {
        this._customRoyalties = customRoyalties;
        return this;
    }

    addOwnerAddress(address: string): ListArgsBuilder {
        this._ownerAddress = address;
        return this;
    }

    addTransactionId(transactionId: string): ListArgsBuilder {
        this._transactionId = transactionId;
        return this;
    }

    public build(): ListArgs {
        return {
            collectionTicker: this._collectionTicker,
            nonce: this._nonce,
            price: this._price,
            customRoyalties: this._customRoyalties,
            ownerAddress: this._ownerAddress,
            transactionId: this._transactionId
        } as ListArgs;
    }
};
