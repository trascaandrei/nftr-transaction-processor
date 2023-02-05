import { Address } from "@multiversx/sdk-core";

export class Utility {
    public static convertBase64ToString(rawStr: string): string {
        if (!rawStr) {
            return "";
        }

        return Utility._convertEncodedStrToTargetEncoding(rawStr, "base64");
    }

    public static convertHexToString(rawStr: string): string {
        return Utility._convertEncodedStrToTargetEncoding(rawStr, "hex");
    }

    public static convertHexToDecimal(rawStr: string): number {
        return parseInt(rawStr, 16);
    }

    public static convertBase64ToHex(rawStr: string): string {
        return Utility._convertEncodedStrToTargetEncoding(rawStr, "base64", "hex");
    }

    public static convertBase64ToBech32Address(rawStr: string): string {
        const hex: string = Utility._convertEncodedStrToTargetEncoding(rawStr, "base64", "hex");

        return Address.fromHex(hex).bech32();
    }

    private static _convertEncodedStrToTargetEncoding(rawStr: string, encoding: BufferEncoding, targetEncoding: BufferEncoding = "ascii"): string {
        return Buffer.from(rawStr, encoding).toString(targetEncoding);
    }
};
