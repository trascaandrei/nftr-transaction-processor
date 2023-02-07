import { ConsumeMessage } from "amqplib";
import { AMQPAnalytic } from "../core/AMQPAnalytic";
import { AMQPClient } from "../core/AMQPClient";
import { AMQPConfig, ConsumerConfig, ScrsBlock } from "../types";
import { ScrsProcessor } from "./ScrsProcessor";

export class Consumer {
    private _client: AMQPClient;
    private _analytic: AMQPAnalytic;
    private _amqpConfig: AMQPConfig;
    private _scrsProcessor: ScrsProcessor;

    constructor(config: ConsumerConfig) {
        this._client = new AMQPClient(config.amqpConnect);
        this._analytic = new AMQPAnalytic(config.analytic);
        this._amqpConfig = config.amqp;
        this._scrsProcessor = new ScrsProcessor();
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

            if (content.scrs && typeof(content.scrs) === "object") {
                await this._scrsProcessor.process(content as ScrsBlock);
            }
        } catch (e: unknown) {
            console.error(e);
        }
    }
};
