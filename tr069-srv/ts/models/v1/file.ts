export interface IFile {
    alias_filename?: string;
    filename?: string;
    username?: string;
    filetype?: string;
    oui?: string;
    product_class?: string;
    soft_version?: string;
}

export class File {
    private alias_filename?: string;        //存在MongoDB的文件名 由filename+username拼接
    private filename?: string;              //显示给用户的文件名
    private username?: string;              //所属用户名
    private filetype?: string;              //文件类型
    private oui?: string;
    private product_class?: string;         //文件适用的设备型号
    private soft_version?: string;          //文件的软件版本
    constructor(r: IFile) {
        this.alias_filename = r.alias_filename;
        this.filename = r.filename;
        this.username = r.username;
        this.filetype = r.filetype;
        this.oui = r.oui;
        this.product_class = r.product_class;
        this.soft_version = r.soft_version;
    }
}

