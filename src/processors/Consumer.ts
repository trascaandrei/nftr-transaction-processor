import { ConsumeMessage } from "amqplib";
import { AMQPAnalytic } from "../core/AMQPAnalytic";
import { AMQPClient } from "../core/AMQPClient";
import { AMQPConfig, ConsumerConfig } from "../types";

export class Consumer {
    private _client: AMQPClient;
    private _analytic: AMQPAnalytic;
    private _amqpConfig: AMQPConfig;

    constructor(config: ConsumerConfig) {
        this._client = new AMQPClient(config.amqpConnect);
        this._analytic = new AMQPAnalytic(config.analytic);
        this._amqpConfig = config.amqp;
    }

    public async start(): Promise<void> {
        await this._client.init(this._amqpConfig.queue, this._amqpConfig.exchanges, this._consume);
        this._analytic.start();
    }

    public async stop(): Promise<void> {
        await this._client.disconnect();
        this._analytic.stop();
    }

    private async _consume(msg: ConsumeMessage): Promise<void> {
        console.log(msg.content.toString());

        /**
         * TODO: base on the message, you also can record data
         */
    }
};
