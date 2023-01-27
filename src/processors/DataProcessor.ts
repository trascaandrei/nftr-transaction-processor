export interface DataProcessor<T, P> {
    process: (data: T) => P;
};
