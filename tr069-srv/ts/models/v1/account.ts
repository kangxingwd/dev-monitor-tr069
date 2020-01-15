interface IAccount {
    id?: number;    // 账号ID
    username?: string;      // 用户名
    password?: string;      // 密码
    level?: number;         // 权限等级, 1,2,3  分别代表3个级别代理商
    parent_id?: number;     // 上一级的 userid
    enable?: number;        // 开启状态， 1 开启，0 禁用
    description?: string;          // 备注
    last_time?: string;     // 最近操作时间
    ext?: string;           // 扩展
    token?: string
}

export class Account {
    private id?: number;
    private username?: string;      //账号
    private password?: string;      //密码
    private level?: number;         //等级
    private parent_id?: number;     // 上一级的 userid
    private enable?: number;        // 开启状态
    private description?: string;          // 备注
    private last_time?: string;     // 最近操作时间
    private ext?: string;           // 扩展
    private token?: string;             //token校验
    constructor(r: IAccount) {
        this.id = r.id;
        this.username = r.username;
        this.password = r.password;
        this.level = r.level;
        this.parent_id = r.parent_id;
        this.enable = r.enable;
        this.description = r.description;
        this.last_time = r.last_time;
        this.ext = r.ext;
        this.token = r.token;
    }
    getAccountId(): number { return this.id }
    getUserName(): string { return this.username }
    getLevel(): number { return this.level }
    getParentId(): number {return this.parent_id }
    getEnable(): number { return this.enable }
    getLastTime(): string { return this.last_time }
    getToken(): string { return this.token }
}

