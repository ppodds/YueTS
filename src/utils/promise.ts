export async function batchRun<T>(
    tasks: (() => Promise<T>)[],
    batchSize: number,
): Promise<Awaited<T>[]> {
    if (batchSize <= 0) {
        throw new Error("Batch size should larger than 0");
    }
    const result: Awaited<T>[] = [];
    let cur = 0;
    while (cur < tasks.length) {
        const end =
            cur + batchSize > tasks.length ? tasks.length : cur + batchSize;
        const batch = tasks.slice(cur, end);
        const batchTasks = batch.map((task) => task());
        const batchResult = await Promise.all(batchTasks);
        result.push(...batchResult);
        cur += batchSize;
    }
    return result;
}
