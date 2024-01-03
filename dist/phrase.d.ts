import { PhraseApi } from "./phrase_api";
export declare const PHRASE_SDK_VERSION = "1.1.0";
export interface Options {
    distribution: string;
    secret: string;
    appVersion?: string;
    cacheExpirationTime: number;
    host?: string;
    debug?: boolean;
}
export default class Phrase {
    options: Options;
    fileFormat: string;
    uuid: string;
    api: PhraseApi;
    private repo;
    constructor(options: Options);
    log(s: string): void;
    requestTranslations(localeCode: string): Promise<any>;
    clearCache(): void;
    private cacheResponse;
    private generateCacheKey;
    private getUUID;
}
