import { toDatetimeString } from "../../../src/core/utils/time.js";

test("date string should be equal", () => {
    const time1 = new Date(2022, 0, 18, 16, 38, 25);
    const time2 = new Date(2020, 11, 31, 0, 0, 0);
    const time3 = new Date(2022, 5, 18, 24, 0, 0);
    expect(toDatetimeString(time1)).toEqual("2022-01-18 16:38:25");
    expect(toDatetimeString(time2)).toEqual("2020-12-31 00:00:00");
    expect(toDatetimeString(time3)).toEqual("2022-06-19 00:00:00");
});
