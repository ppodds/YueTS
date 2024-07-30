import { batchRun } from "../promise";

describe("batchRun", () => {
    const tasks: (() => Promise<number>)[] = [
        () => new Promise((resolve) => resolve(1)),
        () => new Promise((resolve) => resolve(2)),
        () => new Promise((resolve) => resolve(3)),
    ];

    test("batch size = 2 and task length = 3 should run successful", async () => {
        expect(await batchRun<number>(tasks, 2)).toEqual([1, 2, 3]);
    });

    test("batch size = 1 and task length = 3 should run successful", async () => {
        expect(await batchRun<number>(tasks, 1)).toEqual([1, 2, 3]);
    });

    test("batch size = 10 and task length = 3 should run successful", async () => {
        expect(await batchRun<number>(tasks, 10)).toEqual([1, 2, 3]);
    });

    test("batch size = 0 should throw error", async () => {
        expect(async () => await batchRun<number>(tasks, 0)).rejects.toThrow();
    });

    test("batch size = -1 should throw error", async () => {
        expect(async () => await batchRun<number>(tasks, -1)).rejects.toThrow();
    });
});
