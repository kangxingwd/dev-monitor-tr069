export interface IBatchTask {
    btask_id?: number;
    btask_name?: string;
    username?: string;
    devs_num?: number;
    target_version?: string;
    time?: string;
    ext?: string;
}

export class BatchTask {
    private btask_id?: number;          //批量任务id
    private btask_name?: string;        //批量任务名
    private username?: string;          //任务的所属用户名
    private devs_num?: number;
    private target_version?: string;
    private time?: string;              //提交任务的时间
    private ext?: string;         //任务的额外属性
    constructor(r: IBatchTask) {
        this.btask_id = r.btask_id;
        this.btask_name = r.btask_name;
        this.username = r.username;
        this.devs_num = r.devs_num;
        this.target_version = r.target_version;
        this.time = r.time;
        this.ext = r.ext;
    }
    getBtaskName(): string {return this.btask_name};
    getUsername(): string {return this.username};
    getDevsNum(): number {return this.devs_num};
    getTime(): string {return this.time};
    getTargetVersion(): string {return this.target_version};
    getExtAttrs(): string {return this.ext};
}
