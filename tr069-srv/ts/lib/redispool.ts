import redis = require('redis')
import events = require('events')
import bluebird = require('bluebird')

bluebird.promisifyAll(redis.Multi.prototype)
bluebird.promisifyAll(redis.RedisClient.prototype)

export { RedisClient } from "redis"

//import { logger_game_item } from "../lib/logger_game"

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(), ms))
}

class MyRedisClient {
    private opt: any        // 连接参数
    private emitter: events.EventEmitter    // 内部触发器
    private idle: boolean                   // 是否处于空闲状态
    private client: redis.RedisClient       // redis客户端连接

    constructor(opt: any = {}) {
        this.opt = opt
        this.idle = false
        this.emitter = new events.EventEmitter()

        this.createRedisClient()
    }

    private createRedisClient() {
        let [self, seq, emitter, opt] = [this, 0, this.emitter, this.opt]
        const createNew = function () {
            let client = redis.createClient(opt)

            // client.on("connect", () => p("connect", idx))
            // client.on("reconnecting", e => p("reconnecting", e.toString()))

            // 连接已经可用
            client.on("ready", () => {
                if (self.client)
                    throw new Error("logical error")

                self.idle = true
                self.client = client
                emitter.emit("ready")
            })

            // 连接出错
            client.on("error", e => {
                client.end(true)
            })

            // 连接断开
            client.on("end", () => {
                client.end(true)
                self.client = undefined
                self.idle = false
                emitter.emit("restart", 1000)
            })
        }

        emitter.on("restart", async (ms = 0) => {
            await sleep(ms)
            if (self.client)
                throw new Error("logical error")
            createNew()
        })

        emitter.emit("restart")
    }

    async getRedisClient(timeout = 5000): Promise<redis.RedisClient> {
        const self = this

        // 如果空闲连接，直接返回
        if (self.idle) {
            self.idle = false       // 设置状态忙
            return self.client
        }

        // 等待连接空闲
        const getIdleClient = async () => {
            return new Promise<redis.RedisClient>((resolve, reject) => {
                let on_ready: () => void
                let emitter = self.emitter

                // 超时返回
                const id = setTimeout(() => {
                    emitter.removeListener("ready", on_ready)	// 取消ready事件监听
                    reject(new Error("timeout"))
                }, timeout)

                // 有空闲连接
                on_ready = () => {
                    clearTimeout(id) 							// 取消超时定时器
                    emitter.removeListener("ready", on_ready) 	// 取消ready事件监听
                    self.idle = false                           // 设置状态忙
                    return resolve(self.client)
                }

                emitter.on("ready", on_ready)
            })
        }

        return await getIdleClient()
    }

    release() {
        if (this.idle)
            return

        this.idle = true            // 设置状态空闲
        this.emitter.emit("ready")	// 发布空闲事件
    }
}

let clientOptions: string
let redisClientMap: Map<number, MyRedisClient>
export function init(opt: any): void {
    if (clientOptions) {
        throw new Error("alreay init RedisPool!")
    }
    clientOptions = JSON.stringify(opt)
    redisClientMap = new Map<number, MyRedisClient>()
}

interface GetRedisClientOpt {
    db: number,
    timeout?: number
}

export async function getRedisClientAsync(cb: (client: any) => any, opt: GetRedisClientOpt) {
    const [db, timeout] = [opt.db != 0 && !opt.db ? 0 : opt.db, !opt.timeout ? 5000 : opt.timeout]

    let myClient: MyRedisClient
    if (!redisClientMap.has(db)) {
        let opt = JSON.parse(clientOptions)
        opt.db = db
        redisClientMap.set(db, new MyRedisClient(opt))
    }
    myClient = redisClientMap.get(db)

    let client: redis.RedisClient
    try {
        client = await myClient.getRedisClient(timeout)
        return await cb(client)
    } catch (e) {
        throw e
    } finally {
        if (client) {
            myClient.release()
        }
    }
}
