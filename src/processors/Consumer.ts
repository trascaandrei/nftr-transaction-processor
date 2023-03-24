import { ConsumeMessage } from "amqplib";
import { AMQPAnalytic } from "../core/AMQPAnalytic";
import { AMQPClient } from "../core/AMQPClient";
import { AMQPConfig, ConsumerConfig, Message, ScrsBlock } from "../types";
import { ScrsProcessor } from "./ScrsProcessor";
import { TxsProcessor } from "./TxsProcessor";

export class Consumer {
    private _client: AMQPClient;
    private _analytic: AMQPAnalytic;
    private _amqpConfig: AMQPConfig;
    private _scrsProcessor: ScrsProcessor;
    private _txsProcessor: TxsProcessor;

    constructor(config: ConsumerConfig) {
        this._client = new AMQPClient(config.amqpConnect);
        this._analytic = new AMQPAnalytic(config.analytic);
        this._amqpConfig = config.amqp;
        this._scrsProcessor = new ScrsProcessor();
        this._txsProcessor = new TxsProcessor();
    }

    public async start(): Promise<void> {
        await this._client.init(this._amqpConfig.queue, this._amqpConfig.exchanges, this._consume.bind(this));
        // this._analytic.start();
    }

    public async stop(): Promise<void> {
        await this._client.disconnect();
        this._analytic.stop();
    }

    private async _consume(msg: ConsumeMessage): Promise<void> {
        try {
            const content = JSON.parse(msg.content.toString());

            if (content.txs && typeof(content.txs) === "object") {
                await this._txsProcessor.process(content as Message);
            }

            if (content.scrs && typeof(content.scrs) === "object") {
                await Promise.allSettled([
                    this._scrsProcessor.process(content as ScrsBlock),
                    this._txsProcessor.process(content as Message)  
                ]);
            }
        } catch (e: unknown) {
            console.error(e);
        }
    }
};
