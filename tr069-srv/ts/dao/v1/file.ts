import {IFile, File} from "../../models/v1/file";
import {getConnectionAsync} from "../../lib/mysqlpool";

export async function addFile(aliasFilename: string, filename: string, username: string, oui: string, fileType: string,
                              productClass: string, softVersion: string): Promise<any> {
    let sql = `insert into file2user(alias_filename, filename, username, filetype, oui, product_class, soft_version) values('${aliasFilename}','${filename}','${username}','${fileType}','${oui}','${productClass}','${softVersion}')`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

export async function isExistFile(aliasFilename: string): Promise<any> {
    let sql = `select count(*) as filecount from file2user where alias_filename = '${aliasFilename}'`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows[0].filecount===0?false:true
}

export async function countFiles(username: string, filetype?: string, oui?: string, productClass?: string, softVersion?: string): Promise<any> {
    let sql = `select count(*) as filecount from file2user where username = '${username}'`
    sql = filetype? (sql + ` and filetype = '${filetype}'`) : sql
    sql = oui? (sql + ` and oui = '${oui}'`) : sql
    sql = productClass? (sql + ` and product_class = '${productClass}'`) : sql
    sql = softVersion? (sql + ` and soft_version = '${softVersion}'`) : sql
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows[0].filecount
}

export async function getFiles(username: string, start: number, limit: number, filetype?: string, oui?: string, productClass?: string, softVersion?: string): Promise<any> {
    let sql: string = `select filename, filetype, oui, product_class, soft_version from file2user where username = '${username}'`
    sql = filetype? (sql + ` and filetype = '${filetype}'`) : sql
    sql = oui? (sql + ` and oui = '${oui}'`) : sql
    sql = productClass? (sql + ` and product_class = '${productClass}'`) : sql
    sql = softVersion? (sql + ` and soft_version = '${softVersion}'`) : sql
    sql = sql + ` limit ${start},${limit}`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return rows
}

export async function removeFile(aliasFilename: string): Promise<any> {
    let sql = `delete from file2user where alias_filename = '${aliasFilename}'`
    let ret = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any;
    return ret.affectedRows
}

export async function getExistFile(fileName: string, username: string): Promise<any> {
    let sql: string = `select filename, filetype, oui, product_class, soft_version from file2user where username = '${username}' and filename = '${fileName}'`
    let rows = await getConnectionAsync(async conn => await conn.queryAsync(sql)) as any
    if (rows.length === 0)
        return null
    return rows[0]
}

