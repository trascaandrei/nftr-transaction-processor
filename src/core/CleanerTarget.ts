export interface CleanerTarget {
    clean: () => Promise<void>;
};
