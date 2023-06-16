export class EnvParser {
    /**
     * Parse all the environment variables and return a configuration object.
     * @returns A configuration object with all the environment variables parsed.
     */
    public parse(): Record<string, any> {
        return this.parseFromObject(process.env);
    }

    /**
     * Parse all the environment variables from the given object and return a configuration object.
     * @param env environment variables in the form of a key-value pair object.
     * @returns A configuration object with all the environment variables parsed.
     */
    public parseFromObject(
        env: Record<string, string | undefined>
    ): Record<string, any> {
        let config = {};
        for (const key in env) {
            const result = this.parseEntryRecursively(key, env[key] || "");
            config = this.mergeRecursively(config, result);
        }
        // parse as a list
        return this.transformListRecursively(config);
    }

    /**
     * Parse a single entry of the environment variables recursively and return a configuration object.
     * @param key The key of the environment variable entry.
     * @param value The value of the environment variable entry.
     * @returns A configuration object with a environment variable parsed.
     */
    private parseEntryRecursively(
        key: string,
        value: string
    ): Record<string, any> {
        if (!key.includes("__")) {
            return {
                [this.convertToCamelCase(key)]: value,
            };
        }
        const newEntryIndex = key.indexOf("__");
        const newKey = key.substring(newEntryIndex + 2, key.length);
        return {
            [this.convertToCamelCase(key.substring(0, newEntryIndex))]:
                this.parseEntryRecursively(newKey, value),
        };
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
        origin: Record<string, any>,
        target: Record<string, any>
    ): Record<string, any> {
        for (const key in target) {
            if (origin[key] === undefined) {
                origin[key] = target[key];
            } else {
                if (
                    typeof origin[key] === "object" &&
                    typeof target[key] === "object"
                ) {
                    origin[key] = this.mergeRecursively(
                        origin[key],
                        target[key]
                    );
                } else {
                    throw new Error("Cannot merge two non-object values");
                }
            }
        }
        return origin;
    }

    private transformListRecursively(
        config: Record<string, any>
    ): Record<string, any> | string[] {
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
            }
        }
        return config;
    }
}
