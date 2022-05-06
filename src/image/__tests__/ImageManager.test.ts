import { ImageManager } from "../ImageManager";
import { promises as fs } from "fs";

export const TESTFILE = `${__dirname}/test.jpg`;

afterAll(async () => {
    await ImageManager.instance.close();
});

test("the test image phash should equal", async () => {
    const phash = await ImageManager.instance.makePhash(
        await fs.readFile(TESTFILE)
    );

    expect(phash).toEqual(
        "0111010111100100110010001000110011001111100110011001100110000011"
    );
});

test("the origin image buffer should not be changed", async () => {
    const originImageBuffer = await fs.readFile(TESTFILE);
    const bePassedBuffer = Buffer.alloc(originImageBuffer.length);
    originImageBuffer.copy(bePassedBuffer);

    await ImageManager.instance.makePhash(bePassedBuffer);

    expect(bePassedBuffer).toEqual(originImageBuffer);
});
