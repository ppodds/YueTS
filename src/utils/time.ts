function formatTime(time: number): string {
    if (time < 10) {
        return "0" + time.toString();
    }
    return time.toString();
}

export function toDatetimeString(time: Date) {
    return `${time.getFullYear()}-${formatTime(
        time.getMonth() + 1
    )}-${formatTime(time.getDate())} ${formatTime(
        time.getHours()
    )}:${formatTime(time.getMinutes())}:${formatTime(time.getSeconds())}`;
}
