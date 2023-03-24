import * as dotnev from 'dotenv';
dotnev.config();

export class Config {
    public static AMQP_PORT: number = Number(process.env.AMQP_PORT) || 5672;
    public static AMQP_HOST: string = process.env.AMQP_HOST || 'localhost';
    public static AMQP_USERNAME: string = process.env.AMQP_USERNAME || 'guest';
    public static AMQP_PASSWORD: string = process.env.AMQP_PASSWORD || 'guest';
    public static AMQP_QUEUE_NAME: string = process.env.AMQP_QUEUE_NAME;
    public static AMQP_EXCHANGES: string[] = JSON.parse(process.env.AMQP_EXCHANGES || "[]");
    public static EVERY_N_MINUTES: number = Number(process.env.EVERY_N_MINUTES) || 1;
    public static ADDRESS: string = process.env.ADDRESS;
    public static NFTR_HOST: string = process.env.NFTR_HOST;
    public static LIST_NFT_URI: string = process.env.LIST_NFT_URI;
    public static UPDATE_NFT_URI: string = process.env.UPDATE_NFT_URI;
    public static WITHDRAW_NFT_URI: string = process.env.WITHDRAW_NFT_URI;
    public static NFTR_API_KEY: string = process.env.NFTR_API_KEY || '\"\"';
};
