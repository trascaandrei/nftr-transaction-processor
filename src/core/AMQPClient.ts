import client, { Channel, Connection, ConsumeMessage, Options } from "amqplib";

export class AMQPClient {
    private _connection: Connection;
    private _channel: Channel;
    private _initialize: Promise<void>;

    public constructor(options: Options.Connect) {
        this._initialize = this._initConnection(options);
    }

    public async init(queue: string, exchanges: string[], consumer: (msg: unknown) => void): Promise<void> {
        await this._initialize;
        await this._channel.assertQueue(queue);

        await Promise.all(exchanges.map((exchange: string) => this._channel.assertExchange(exchange, "fanout")));
        await Promise.all(exchanges.map((exchange: string) => this._channel.bindQueue(queue, exchange, "")));

        await this._channel.consume(queue, (msg: ConsumeMessage) => {
            consumer(msg);
            this._channel.ack(msg);
        });
    };

    public async disconnect(): Promise<void> {
        await this._channel.close();
        await this._connection.close();
    }

    private async _initConnection(options: Options.Connect): Promise<void> {
        this._connection = await client.connect(options);
        this._channel = await this._connection.createChannel();
    }
};
