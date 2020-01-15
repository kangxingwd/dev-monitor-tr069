export interface IDev {
    dev_id?: string;                // 设备ID
    user_id?: number;               // 账号ID
    cwmp_id?: string;               // cwmp的默认ID
    manufacturer?: string;          // 厂商
    oui?:  string;                  // 厂商唯一标识符
    soft_version?: string;         // 软件版本
    dev_productclass?: string;     // 设备型号
    ip?: string;                    // 设备IP
    connect_ip?: string;            // 连接服务器的ip
    assign_time?: string;          // 最近修改时间
    assign_userid?: number;        // 最近修改的用户
    status?: number;                // 设备状态,1 在线  0 离线
    last_inform?: number;            // 最后一次心跳时间
    history_online_time?: number;   // 历史在线时长
    ext?: string;
}

export class Dev {
    private dev_id?: string;
    private user_id?: number;
    private cwmp_id?: string;
    private manufacturer?: string;
    private oui?: string;
    private soft_version?: string;
    private dev_productclass?: string;
    private ip?: string;
    private connect_ip?: string;
    private assign_time?: string;           // 最近修改时间
    private assign_userid?: number;        // 最近修改的用户
    private status?: number;
    private last_inform?: number;
    private history_online_time?: number;
    private ext?: string;
    constructor(r: IDev) {
        this.dev_id = r.dev_id;
        this.user_id = r.user_id;
        this.cwmp_id = r.cwmp_id;
        this.manufacturer = r.manufacturer;
        this.oui = r.oui;
        this.soft_version = r.soft_version;
        this.dev_productclass = r.dev_productclass;
        this.assign_time = r.assign_time;
        this.assign_userid = r.assign_userid;
        this.ip = r.ip;
        this.connect_ip = r. connect_ip;
        this.status = r.status;
        this.last_inform = r.last_inform;
        this.history_online_time = r.history_online_time;
        this.ext = r.ext;
    }
    getDevId(): string { return this.dev_id }
    getUserId(): number { return this.user_id }
    getCwmpId(): string { return this.cwmp_id }
    getManufacturer(): string { return this.manufacturer }
    getOui(): string { return this.oui }
    getSoftVersion(): string { return this.soft_version }
    getDevProductclass(): string {return this.dev_productclass }
    getAssignTime(): string { return this.assign_time }
    getAssignUserId(): number { return this.assign_userid }
    getIp(): string { return this.ip }
    getConnectIp(): string { return this.connect_ip }
    getStatus(): number { return this.status }
    getLastInform(): number { return this.last_inform }
    getHistoryOnlineTime(): number { return this.history_online_time }
}

export function getDefaultDev(): IDev {
    return {
        dev_id: "",
        user_id: 0,
        cwmp_id: "",
        manufacturer: "",
        oui: "",
        soft_version: "",
        dev_productclass: "",
        ip: "",
        connect_ip: "",
        assign_time: "",
        assign_userid: 0,
        status: 0,
        last_inform: 0,
        history_online_time: 0,
        ext: ""
    }
}


