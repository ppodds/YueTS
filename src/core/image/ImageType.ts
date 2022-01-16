export enum ImageType {
    PIC = 0,
    HPIC = 1,
    WTFPIC = 2,
}

export function toString(type: ImageType) {
    switch (type) {
        case ImageType.PIC:
            return "pic";
        case ImageType.HPIC:
            return "hpic";
        case ImageType.WTFPIC:
            return "wtfpic";
    }
}
