export interface IEvent {
    id?: number;
    username?: string;
    event?: string;
    url?: string;
    ext?: string;
}

export class Event {
    private id?: number;          // 事件id
    private username?: string;    // 用户名
    private event?: string;       // 事件名称(statusChange、addrChange,upgradeResult、wifiProbe、taskStatus)
    private url?: string;         // 注册URL
    private ext?: string;
    constructor(r: IEvent) {
        this.id = r.id;
        this.username = r.username;
        this.event = r.event;
        this.url = r.url;
        this.ext = r.ext;
    }
    getEvent(): string {return this.event};
    getUrl(): string {return this.url};
}

