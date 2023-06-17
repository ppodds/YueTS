import { EnvParser } from "../env-parser";

describe("EnvParser", () => {
    let parser: EnvParser;

    beforeEach(() => {
        parser = new EnvParser();
    });

    it("should parse a simple key-value pair", () => {
        expect(
            parser.parseFromObject({
                TEST: "test",
            })
        ).toEqual({
            test: "test",
        });
    });

    it("should parse a simple key-value pair contains underscore", () => {
        expect(
            parser.parseFromObject({
                TEST_TEST: "test",
            })
        ).toEqual({
            testTest: "test",
        });
    });

    it("should parse a simple key-value pair contains underscore and any case", () => {
        expect(
            parser.parseFromObject({
                TesT_tEsT: "test",
            })
        ).toEqual({
            testTest: "test",
        });
    });

    it("should parse a simple key-value pair which key with a underscore at the end", () => {
        expect(
            parser.parseFromObject({
                TEST_test_: "test",
            })
        ).toEqual({
            testTest_: "test",
        });
    });

    it("should parse a nested key-value pair", () => {
        expect(
            parser.parseFromObject({
                TEST1__TEST2: "test",
            })
        ).toEqual({
            test1: {
                test2: "test",
            },
        });
    });

    it("should parse a nested key-value pair contains underscore", () => {
        expect(
            parser.parseFromObject({
                TEST1__TEST2_TEST3: "test",
            })
        ).toEqual({
            test1: {
                test2Test3: "test",
            },
        });
    });

    it("should parse a random orded list entry", () => {
        expect(
            parser.parseFromObject({
                TEST__2: "test2",
                TEST__0: "test0",
                TEST__1: "test1",
            })
        ).toEqual({
            test: ["test0", "test1", "test2"],
        });
    });

    it("should parse a list entry", () => {
        expect(
            parser.parseFromObject({
                TEST__0: "test",
            })
        ).toEqual({
            test: ["test"],
        });
    });

    it("should parse a list entry contains three objects", () => {
        expect(
            parser.parseFromObject({
                TEST__0: "test0",
                TEST__1: "test1",
                TEST__2: "test2",
            })
        ).toEqual({
            test: ["test0", "test1", "test2"],
        });
    });

    it("should parse a nested list entry", () => {
        expect(
            parser.parseFromObject({
                TEST1__TEST2__0: "0",
                TEST1__TEST2__1: "1",
            })
        ).toEqual({
            test1: {
                test2: ["0", "1"],
            },
        });
    });

    it("should parse a nested list entry (3 layers)", () => {
        expect(
            parser.parseFromObject({
                TEST1__TEST2__TEST3__0: "0",
                TEST1__TEST2__TEST3__1: "1",
            })
        ).toEqual({
            test1: {
                test2: {
                    test3: ["0", "1"],
                },
            },
        });
    });

    it("should not parse as a list entry when the key is not a number", () => {
        expect(
            parser.parseFromObject({
                TEST__0A: "test",
            })
        ).toEqual({
            test: {
                "0a": "test",
            },
        });
    });

    it("should parse multiple simple key-value pair", () => {
        expect(
            parser.parseFromObject({
                TEST1: "test1",
                TEST2: "test2",
                TEST3: "test3",
            })
        ).toEqual({
            test1: "test1",
            test2: "test2",
            test3: "test3",
        });
    });

    it("should parse multiple nested key-value pair", () => {
        expect(
            parser.parseFromObject({
                TEST1__TEST2: "test1.test2",
                TEST1__TEST3: "test1.test3",
            })
        ).toEqual({
            test1: {
                test2: "test1.test2",
                test3: "test1.test3",
            },
        });
    });

    it("should parse multiple nested key-value pair (3 layers)", () => {
        expect(
            parser.parseFromObject({
                TEST1__TEST2__TEST3: "test1.test2.test3",
                TEST1__TEST2__TEST4: "test1.test2.test4",
            })
        ).toEqual({
            test1: {
                test2: {
                    test3: "test1.test2.test3",
                    test4: "test1.test2.test4",
                },
            },
        });
    });

    it("should return error when merging invalid nested objects", () => {
        expect(() =>
            parser.parseFromObject({
                TEST1__TEST2: "test1.test2",
                TEST1__TEST3: "test1.test3",
                TEST1: "error",
            })
        ).toThrowError();
    });
});
