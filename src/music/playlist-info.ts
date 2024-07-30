export interface PlaylistItem {
    title: string;
    webpageUrl: string;
    durationString: string;
}

export interface PlaylistInfo {
    title: string;
    items: PlaylistItem[];
}
