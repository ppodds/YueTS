export type EnvValue = string | string[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EnvEntry = Record<string, any>;
export type EnvConfig = Record<string, EnvEntry | EnvValue>;

export class EnvParser {
    /**
     * Parse all the environment variables and return a configuration object.
     * @returns A configuration object with all the environment variables parsed.
     */
    public parse<T extends EnvConfig>(): T {
        return this.parseFromObject<T>(process.env);
    }

    /**
     * Parse all the environment variables from the given object and return a configuration object.
     * @param env environment variables in the form of a key-value pair object.
     * @returns A configuration object with all the environment variables parsed.
     */
    public parseFromObject<T extends EnvConfig>(
        env: Record<string, string | undefined>
    ): T {
        let config = {};
        for (const key in env) {
            const result = this.parseEntryRecursively(key, env[key] || "");
            config = this.mergeRecursively(config, result);
        }
        // parse as a list
        return this.transformListRecursively<T>(config);
    }

    /**
     * Parse a single entry of the environment variables recursively and return a configuration object.
     * @param key The key of the environment variable entry.
     * @param value The value of the environment variable entry.
     * @returns A configuration object with a environment variable parsed.
     */
    private parseEntryRecursively<T extends Record<string, EnvEntry | string>>(
        key: string,
        value: string
    ): T {
        if (!key.includes("__")) {
            return {
                [this.convertToCamelCase(key)]: value,
            } as T;
        }
        const newEntryIndex = key.indexOf("__");
        const newKey = key.substring(newEntryIndex + 2, key.length);
        return {
            [this.convertToCamelCase(key.substring(0, newEntryIndex))]:
                this.parseEntryRecursively(newKey, value),
        } as T;
    }

    private convertToCamelCase(key: string): string {
        // if lower case key contains underscore, we need to convert it to camel case
        let newKey: string = key.toLowerCase();
        let underscoreIndex = newKey.indexOf("_");
        while (underscoreIndex != -1) {
            // array boundary check
            if (underscoreIndex + 1 == newKey.length) {
                break;
            }

            // if the character after underscore is not underscore, we need to convert it to upper case
            if (newKey[underscoreIndex + 1] != "_") {
                newKey =
                    newKey.substring(0, underscoreIndex) +
                    newKey[underscoreIndex + 1].toUpperCase() +
                    newKey.substring(underscoreIndex + 2, newKey.length);
            }

            // find next underscore
            underscoreIndex = newKey.indexOf("_");
        }
        return newKey;
    }

    /**
     * Merge two objects recursively.
     * @param origin The origin object.
     * @param target The target object.
     * @returns The merged object.
     */
    private mergeRecursively(
        origin: Record<string, EnvEntry | string>,
        target: Record<string, EnvEntry | string>
    ): Record<string, EnvEntry | string> {
        for (const key in target) {
            if (origin[key] === undefined) {
                origin[key] = target[key];
            } else {
                if (
                    typeof origin[key] === "object" &&
                    typeof target[key] === "object"
                ) {
                    origin[key] = this.mergeRecursively(
                        origin[key] as EnvEntry,
                        target[key] as EnvEntry
                    );
                } else {
                    throw new Error("Cannot merge two non-object values");
                }
            }
        }
        return origin;
    }

    private transformListRecursively<T extends EnvConfig>(
        config: Record<string, EnvEntry | string>
    ): T {
        for (const key in config) {
            // is a value
            if (typeof config[key] !== "object") {
                continue;
            }

            // assert config is a list
            if (config[key]["0"] !== undefined) {
                const size = Object.getOwnPropertyNames(config[key]).length;
                const list: string[] = new Array(size);
                for (let i = 0; i < size; i++) {
                    if (config[key][i.toString()] === undefined) {
                        throw new Error("Invalid list entry");
                    }
                    list[i] = config[key][i.toString()];
                }
                config[key] = list;
            } else {
                this.transformListRecursively(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    config[key] as Record<string, any>
                );
            }
        }
        return config as T;
    }
}
