export interface ITask {
    task_id?: number;
    dev_id?: string;
    btask_id?: number;
    task_name?: string;     // 任务名称
    channel?: string;
    task_status?: number;
    dev_exist?: number;
    fault_code?: number;
    fault_msg?: string;
    fault_detail?: string;
    retries?: number;
    date?: string;
    ext?: string;
}

export class Task {
    private task_id?: number;       // 任务ID
    private dev_id?: string;        // 设备ID
    private btask_id?: number;      // 批量任务ID
    private task_name?: string;     // 任务名称
    private channel?: string;      //对应的批量任务的id
    private task_status?: number;   //单个任务的执行状态 0-未完成，1-成功，2-失败
    private dev_exist?: number;     //单个任务对应的设备的状态  1-正常设备  0-设备被删除
    private fault_code?: number;
    private fault_msg?: string;
    private fault_detail?: string;
    private retries?: number;
    private date?: string;
    private ext?: string;
    constructor(r: ITask) {
        this.task_id = r.task_id;
        this.dev_id = r.dev_id;
        this.btask_id = r.btask_id;
        this.channel = r.channel;
        this.task_status = r.task_status;
        this.dev_exist = r.dev_exist;
        this.fault_code = r.fault_code;
        this.fault_msg = r.fault_msg;
        this.fault_detail = r.fault_detail;
        this.retries = r.retries;
        this.date = r.date;
        this.ext = r.ext;
    }
    getTaskName(): string {return this.task_name};
}
