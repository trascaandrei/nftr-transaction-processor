import { Config } from './config/config';
import { Consumer } from './processors/Consumer';
import { ConsumerConfig } from './types';

class Server {
    private _consumer: Consumer;

    constructor() {
        const config: ConsumerConfig = {
            amqpConnect: {
                hostname: Config.AMQP_HOST,
                port: Config.AMQP_PORT,
                username: Config.AMQP_USERNAME,
                password: Config.AMQP_PASSWORD
            },
            amqp: {
                queue: Config.AMQP_QUEUE_NAME,
                exchanges: Config.AMQP_EXCHANGES
            },
            analytic: {
                minutes: Config.EVERY_N_MINUTES
            }
        };

        this._consumer = new Consumer(config);
    }

    public async start() {
        try {

            await this._consumer.start();

            // await this._consumer.stop();
        } catch (e) {
            console.error(e);
            process.exit(-1);
        }
    }
};

new Server().start();
