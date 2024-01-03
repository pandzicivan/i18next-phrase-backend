export default class Repository {
    private storage;
    KEY_PREFIX: string;
    constructor();
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
    clear(): void;
    isLocalStorageAvailable(): boolean;
}
