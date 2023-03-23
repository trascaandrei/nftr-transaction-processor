import { CleanerTarget } from "./CleanerTarget";
import { CronJob } from 'cron';

export class Cleaner {
    private _cronJob: CronJob;

    constructor(cronTime: string, target: CleanerTarget) {
        this._cronJob = new CronJob(cronTime, async () => {
            try {
                await target.clean();
            } catch (err: unknown) {
                console.error(`An error occurred during clean operation: `, err);
            }
        });
    }

    public start(): void {
        if (this._cronJob.running) {
            return console.warn("The job has already started.");
        }

        this._cronJob.start();
    }

    public stop(): void {
        if (!this._cronJob.running) {
            return console.warn("The job hasn't started yet.");
        }

        this._cronJob.stop();
    }
};
