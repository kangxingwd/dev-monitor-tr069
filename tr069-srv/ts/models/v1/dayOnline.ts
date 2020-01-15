export interface IDayOnline {
    id?: number;                    //
    dev_id?: string;                // 设备ID
    date?: number;                  // 日期
    online_time?: number;           // 在线时长（秒）
    ext?: string;                   // 扩展
}

export class DayOnline {
    private id?: number;
    private dev_id?: string;
    private date?: number;
    private online_time?: number;
    private ext?: string;
    constructor(r: IDayOnline) {
        this.id = r.id;
        this.dev_id = r.dev_id;
        this.date = r.date;
        this.online_time = r.online_time;
        this.ext = r.ext;
    }
    getDevId(): string { return this.dev_id }
    getDate(): number { return this.date }
    getOnlineTime(): number { return this.online_time }
}



