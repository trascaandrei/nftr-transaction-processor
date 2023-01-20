import { Options } from "amqplib";

export interface MessagesAnalytic {
    total: number;
    nonEmpty: number;
};

export interface AnalyticConfig {
    minutes: number;
};

export interface AMQPConfig {
    queue: string;
    exchanges: string[];
};

export interface ConsumerConfig {
    amqpConnect: Options.Connect;
    amqp: AMQPConfig;
    analytic: AnalyticConfig;
};
