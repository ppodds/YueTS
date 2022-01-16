/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.tsx?$",
    extensionsToTreatAsEsm: [".ts"],
    preset: "ts-jest/presets/default-esm",
    globals: {
        "ts-jest": {
            useESM: true,
        },
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
};
