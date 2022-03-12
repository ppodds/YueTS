import imageManager from "../../../src/core/image/ImageManager.js";
import { promises as fs } from "fs";

export const TESTFILE = "./tests/core/image/test.jpg";

test("the test image phash should equal", async () => {
    const phash = await imageManager.makePhash(await fs.readFile(TESTFILE));

    expect(phash).toEqual(
        "0111010111100100110010001000110011001111100110011001100110000011"
    );
});

test("the origin image buffer should not be changed", async () => {
    const originImageBuffer = await fs.readFile(TESTFILE);
    const bePassedBuffer = Buffer.alloc(originImageBuffer.length);
    originImageBuffer.copy(bePassedBuffer);

    await imageManager.makePhash(bePassedBuffer);

    expect(bePassedBuffer).toEqual(originImageBuffer);
});
