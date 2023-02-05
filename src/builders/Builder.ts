export abstract class Builder<T> {
    constructor() {
        if (this.constructor === Builder) {
            throw new Error('Abstract class \'Builder\' can\'t be instantiated');
        }
    }

    public abstract build(): T;
};
