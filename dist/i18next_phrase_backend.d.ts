import Phrase, { Options } from "./phrase";
import { BackendModule, ReadCallback } from "i18next";
export declare class I18nextPhraseBackend implements BackendModule<Options> {
    options: Options;
    static type: "backend";
    phrase?: Phrase;
    type: "backend";
    constructor(_services: any, _options: Options);
    init(_services: any, options: Options): void;
    read(language: string, _namespace: string, callback: ReadCallback): void;
}
