export declare class PhraseResponse {
    version: string | null;
    body: string;
    constructor(version: string | null, body: string);
}
export declare class PhraseApi {
    baseUrl: string;
    constructor(baseUrl: string);
    getTranslations(distribution: string, secret: string, locale: string, fileFormat: string, uuid: string, sdkVersion: string, currentVersion: string | null, appVersion: string | undefined, lastUpdate: string | null): Promise<PhraseResponse | null>;
}
