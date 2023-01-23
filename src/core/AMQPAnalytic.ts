import { AnalyticConfig, MessagesAnalytic } from "../types";
import { Analytic } from "./Analytic";

export class AMQPAnalytic extends Analytic<Boolean> {
    private _currentAnalytic: MessagesAnalytic;
    private _config: AnalyticConfig;
    private _timmer;

    constructor(config: AnalyticConfig) {
        super();
        this._currentAnalytic = {
            total: 0,
            nonEmpty: 0
        };

        this._config = config;
    }

    public record(data: Boolean): void {
        ++this._currentAnalytic.total;

        if (!data) {
            ++this._currentAnalytic.nonEmpty;
        }
    }

    public start(): void {
        this._timmer = setInterval(() => { this._display(); }, this._config.minutes * 60 * 1000);
    }

    public stop(): void {
        clearInterval(this._timmer);
    }

    private _display(): void {
        const date = new Date();
        const minutes = date.getMinutes();
        const msg = `${date.getHours() + 2}:${minutes <= 9 ? '0' : ''}${minutes} => ${this._currentAnalytic.nonEmpty}/${this._currentAnalytic.total} non empty messages.`;
        console.log(msg);
    }
};
