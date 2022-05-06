const { parentPort } = require("worker_threads");
const sharp = require("sharp");

/**
 * Calculates the perceptual hash of an image.
 * @param {Buffer} buf buffer to be calculated
 * @returns {Promise<string>} phash
 */
async function makePhash(buf) {
    try {
        const regularImageBuffer = await sharp(buf)
            .greyscale()
            .resize(32, 32, { fit: "fill" })
            .rotate()
            .raw()
            .toBuffer();
        // Reference: https://github.com/btd/sharp-phash

        const SAMPLE_SIZE = 32;

        // init sqrt
        const sqrt = new Array(SAMPLE_SIZE);
        for (let i = 1; i < SAMPLE_SIZE; i++) {
            sqrt[i] = 1;
        }
        sqrt[0] = 1 / Math.sqrt(2.0);

        // init cosines
        const cosines = new Array(SAMPLE_SIZE);
        for (let k = 0; k < SAMPLE_SIZE; k++) {
            cosines[k] = new Array(SAMPLE_SIZE);
            for (let n = 0; n < SAMPLE_SIZE; n++) {
                cosines[k][n] = Math.cos(
                    ((2 * k + 1) / (2.0 * SAMPLE_SIZE)) * n * Math.PI
                );
            }
        }

        const LOW_SIZE = 8;

        // copy signal
        const s = new Array(SAMPLE_SIZE);
        for (let x = 0; x < SAMPLE_SIZE; x++) {
            s[x] = new Array(SAMPLE_SIZE);
            for (let y = 0; y < SAMPLE_SIZE; y++) {
                s[x][y] = regularImageBuffer[SAMPLE_SIZE * y + x];
            }
        }

        // apply 2D DCT II
        const dct = new Array(SAMPLE_SIZE);
        for (let u = 0; u < SAMPLE_SIZE; u++) {
            dct[u] = new Array(SAMPLE_SIZE);
            for (let v = 0; v < SAMPLE_SIZE; v++) {
                let sum = 0;
                for (let i = 0; i < SAMPLE_SIZE; i++) {
                    for (let j = 0; j < SAMPLE_SIZE; j++) {
                        sum += cosines[i][u] * cosines[j][v] * s[i][j];
                    }
                }
                sum *= (sqrt[u] * sqrt[v]) / 4;
                dct[u][v] = sum;
            }
        }

        // get AVG on high frequencies
        let totalSum = 0;
        for (let x = 0; x < LOW_SIZE; x++) {
            for (let y = 0; y < LOW_SIZE; y++) {
                totalSum += dct[x + 1][y + 1];
            }
        }

        const avg = totalSum / (LOW_SIZE * LOW_SIZE);

        // compute hash
        let fingerprint = "";

        for (let x = 0; x < LOW_SIZE; x++) {
            for (let y = 0; y < LOW_SIZE; y++) {
                fingerprint += dct[x + 1][y + 1] > avg ? "1" : "0";
            }
        }
        return fingerprint;
    } catch (err) {
        return null;
    }
}

parentPort.on("message", (buf) =>
    makePhash(buf).then((phash) => parentPort.postMessage(phash))
);
