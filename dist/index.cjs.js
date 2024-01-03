"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  I18nextPhraseBackend: () => I18nextPhraseBackend
});
module.exports = __toCommonJS(src_exports);

// src/phrase_api.ts
var PhraseResponse = class {
  constructor(version, body) {
    this.version = version;
    this.body = body;
  }
};
var PhraseApiError = class extends Error {
};
var PhraseApi = class {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  async getTranslations(distribution, secret, locale, fileFormat, uuid, sdkVersion, currentVersion, appVersion, lastUpdate) {
    const params = Object.entries({
      client: "i18next",
      sdk_version: sdkVersion,
      unique_identifier: uuid,
      current_version: currentVersion,
      app_version: appVersion,
      last_update: lastUpdate
    }).filter(([_key, value]) => {
      return value != null;
    });
    const url = new URL(`${this.baseUrl}/${distribution}/${secret}/${locale}/${fileFormat}`);
    url.search = new URLSearchParams(params).toString();
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json"
      }
    });
    const code = response.status;
    if (code >= 200 && code <= 299) {
      const url2 = new URL(response.url);
      const version = url2.searchParams.get("version");
      const json = await response.text();
      return new PhraseResponse(version, json);
    } else if (code === 304) {
      return null;
    } else {
      throw new PhraseApiError("HTTP code " + code);
    }
  }
};

// src/memory_storage.ts
var MemoryStorage = class {
  constructor() {
    this.length = 0;
    this.data = /* @__PURE__ */ new Map();
  }
  clear() {
    this.data.clear();
  }
  getItem(key) {
    return this.data.get(key) || null;
  }
  key(index) {
    throw new Error("Method not implemented.");
  }
  removeItem(key) {
    this.data.delete(key);
  }
  setItem(key, value) {
    this.data.set(key, value);
  }
};

// src/repository.ts
var Repository = class {
  constructor() {
    this.KEY_PREFIX = "i18next-phrase-backend::";
    if (this.isLocalStorageAvailable()) {
      this.storage = localStorage;
    } else {
      this.storage = new MemoryStorage();
    }
  }
  setItem(key, value) {
    this.storage.setItem(`${this.KEY_PREFIX}${key}`, value);
  }
  getItem(key) {
    return this.storage.getItem(`${this.KEY_PREFIX}${key}`);
  }
  clear() {
    this.storage.clear();
  }
  isLocalStorageAvailable() {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(`${this.KEY_PREFIX}storage`, "enabled");
        if (localStorage.getItem(`${this.KEY_PREFIX}storage`) === "enabled") {
          localStorage.removeItem(`${this.KEY_PREFIX}storage`);
          return true;
        }
      } catch {
      }
    }
    return false;
  }
};

// src/uuid.ts
var import_uuid = require("uuid");
var UUID = class {
  constructor() {
    this.value = (0, import_uuid.v4)();
  }
};

// src/phrase.ts
var PHRASE_SDK_VERSION = "1.1.0";
var DEFAULT_FORMAT = "i18next";
var DEFAULT_URL = "https://ota.eu.phrase.com";
var Phrase = class {
  constructor(options) {
    this.repo = new Repository();
    this.options = options;
    this.fileFormat = DEFAULT_FORMAT;
    this.uuid = this.getUUID();
    this.api = new PhraseApi(this.options.host || DEFAULT_URL);
  }
  log(s) {
    if (this.options.debug) {
      console.log("PHRASE: " + s);
    }
  }
  async requestTranslations(localeCode) {
    const cacheKey = this.generateCacheKey(this.options.distribution, this.options.secret, localeCode);
    const expirationKey = `${cacheKey}::expiration`;
    const expirationDate = this.repo.getItem(expirationKey);
    if (!expirationDate || Date.now() > parseInt(expirationDate)) {
      const currentVersion = this.repo.getItem(`${cacheKey}::current_version`);
      const lastUpdate = this.repo.getItem(`${cacheKey}::last_update`);
      try {
        const response = await this.api.getTranslations(
          this.options.distribution,
          this.options.secret,
          localeCode,
          this.fileFormat,
          this.uuid,
          PHRASE_SDK_VERSION,
          currentVersion,
          this.options.appVersion,
          lastUpdate
        );
        if (response != null) {
          this.log("OTA update for `" + localeCode + "`: OK");
          this.cacheResponse(cacheKey, response);
        } else {
          this.log("OTA update for `" + localeCode + "`: NOT MODIFIED");
        }
        const expiryTime = 1e3 * this.options.cacheExpirationTime;
        this.repo.setItem(`${cacheKey}::expiration`, (Date.now() + expiryTime).toString());
      } catch (e) {
        this.log("OTA update for `" + localeCode + "`: ERROR: " + e);
        return {};
      }
    }
    const cacheValue = this.repo.getItem(cacheKey);
    if (cacheValue) {
      return JSON.parse(cacheValue);
    } else {
      this.log("Nothing found in cache, no translations returned");
      return {};
    }
  }
  clearCache() {
    this.repo.clear();
  }
  cacheResponse(cacheKey, response) {
    var _a;
    this.repo.setItem(cacheKey, response.body);
    this.repo.setItem("last_update", Date.now().toString());
    this.repo.setItem(`${cacheKey}::current_version`, ((_a = response.version) == null ? void 0 : _a.toString()) || "");
  }
  generateCacheKey(distribution, secret, localeCode) {
    return `${distribution}::${secret}::${localeCode}`;
  }
  getUUID() {
    const uuidKey = "UUID";
    let uuid = null;
    uuid = this.repo.getItem(uuidKey);
    if (!uuid) {
      uuid = new UUID().value;
      this.repo.setItem(uuidKey, uuid);
    }
    return uuid;
  }
};

// src/i18next_phrase_backend.ts
var I18nextPhraseBackend = class {
  constructor(_services, _options) {
    this.options = {};
  }
  init(_services, options) {
    if (!options.distribution || !options.secret) {
      throw new Error("distribution and secret are required");
    }
    this.options = options;
    this.options.cacheExpirationTime = this.options.cacheExpirationTime || 60 * 5;
    this.phrase = new Phrase(options);
  }
  read(language, _namespace, callback) {
    if (this.phrase) {
      this.phrase.requestTranslations(language).then((translations) => {
        callback(null, translations);
      }).catch((error) => {
        callback(error, null);
      });
    }
  }
};
I18nextPhraseBackend.type = "backend";
