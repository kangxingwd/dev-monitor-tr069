import bluebird = require("bluebird")
import mysql = require("mysql")
import { poolOpt } from "../config/mysql";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}


let pool1: any
export function initPool(opt1: any) {
    pool1 = bluebird.promisifyAll(mysql.createPool(opt1))
}

/* 访问数据库 */
export async function getConnectionAsync(cb: (conn: any) => any) {
    let conn = await pool1.getConnectionAsync()
    conn = bluebird.promisifyAll(conn)
    try {
        return await cb(conn)
    } catch (e) {
        throw e
    } finally {
        conn.release()
    }
}

export async function transactionAsync(cb: (conn: any) => any) {
    let conn = await pool1.getConnectionAsync()
    conn = bluebird.promisifyAll(conn)
    await conn.beginTransactionAsync()
    try {
        let result = await cb(conn)
        await conn.commitAsync()
        return result
    } catch (e) {
        await conn.rollbackAsync()
        throw e
    } finally {
        conn.release()
    }
}

export async function createConnection(opt: mysql.ConnectionOptions) {
    let conn = mysql.createConnection(opt)
    return bluebird.promisifyAll(conn)
}
