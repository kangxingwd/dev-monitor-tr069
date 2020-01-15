
export interface ITaskObj {
    id?: number,
    name?: string,
    description?: string,
    username?: string,
    task_type?: string,
    upgrade_file?: string,
    url?: string,
    custom_file?: string,
    date?: string,
    ext?: string
}

export class TaskObj {
    private id?: number
    private name?: string
    private description?: string
    private username?: string
    private task_type?: string
    private upgrade_file?: string
    private url?: string
    private custom_file?: string
    private date?: string
    private ext?: string
    constructor(r: ITaskObj) {
        this.id = r.id
        this.name = r.name
        this.description = r.description
        this.username = r.username
        this.task_type = r.task_type
        this.upgrade_file = r.upgrade_file
        this.url = r.url
        this.custom_file = r.custom_file
        this.date = r.date
        this.ext = r.ext
    }
    getId(): number {return this.id}
    getObjName(): string {return this.name}
    getDesc(): string {return this.description}
    getUsername(): string {return this.username}
    getTaskType(): string {return this.task_type}
    getUpgradeFile(): string {return this.upgrade_file}
    getUrl(): string {return this.url}
    getCustomFile(): string {return this.custom_file}
    getDate(): string {return this.date}
    getExt(): string {return this.ext}
}