import {devAddrMap} from "../../daemon/v1/dev_addr";
import querystring = require("querystring");
import { log_dev as log } from '../log'
import daoDev = require("../../dao/v1/dev");
import { getAsync } from "./nbi/common";
import { sleepMs } from "./utils";
import devlib = require("./../../dao/v1/dev")
import { notify } from "../../daemon/v1/daemon";

export class DevIpQueue {
	front: DevIpNode
	rear: DevIpNode
	length: number
	locked: boolean
	constructor() {
		this.front = new DevIpNode(null)
		this.rear = this.front
		this.length = 0
		this.locked = false
	}
	push(devIpObj: any) {
		while (this.locked)
			sleepMs(1)
		this.locked = true
		let newNode: DevIpNode = new DevIpNode(devIpObj)
		this.rear.next = newNode
		this.rear = newNode
		this.length++
		this.locked = false
	}
	pop(): any {
		if (this.length === 0)
			return null
		while (this.locked)
			sleepMs(1)
		this.locked = true
		let devIpObj: any = this.front.next.devIpObj
		devIpObj = devIpObj ? devIpObj : {}
		this.front = this.front.next
		this.length--
		this.locked = false
		return devIpObj
	}
}

class DevIpNode{
	devIpObj: any
	next: DevIpNode
	constructor(devIpObj: any) {
		if(!devIpObj){
			this.devIpObj = null
		} else {
			this.devIpObj = {
				devId: devIpObj.devId,
				ip: devIpObj.ip
			}
		}
		this.next = null
	}
}

export async function initMap(): Promise<any>{
	let devs: any[] = await devlib.getAllDev()
	for (let dev of devs) {
		notify("updateDevAddr", [{
			id: dev.dev_id,
			ip: dev.connect_ip
		}])
	}
}

export async function reqAddress(devId: string, ip: string): Promise<any> {
	let { addr, expect }: any = await getAddr(ip)
	if (!addr) {
		return
	}
	if (!expect) {
		devAddrMap.set(devId, { srcIP: ip, dev_site: addr });
		log.debug(devAddrMap.get(devId))
		return
	}
	let site: any = await getAddrInfo(addr)
	if (site) {
		devAddrMap.set(devId, {
			srcIP: ip, dev_site: `${addr}`,
			lat: site.lat, lng: site.lng
		});
		log.debug(devAddrMap.get(devId))
	} else {
		log.debug(`'${ip}-->${addr}'不可查`)
	}
	return
}
	
async function getAddrInfo(addr: string): Promise<any>{
	let infoUrl: string = `http://api.map.baidu.com/geocoder?${querystring.stringify({ address: `${addr}`, output: 'json' })}`
	let infoResp = await getAsync({ url: infoUrl })
	if (infoResp.statusCode === 200 && infoResp.body) {
		let location: any = JSON.parse(infoResp.body)
		if (location && (location.result)) {
			return location.result.location
		} 
	}
	return null
}

async function getAddr(ip: string): Promise<any>{
	let addrUrl: string = `http://www.36ip.cn/?type=json&ip=${ip}`;
	let addrResp = await getAsync({url: addrUrl})
	if (addrResp.body && (addrResp.statusCode === 200 || addrResp.statusCode === 304)) {
		let address: any = JSON.parse(addrResp.body)
		if(null != address.data.split(' ')[1]){			//若返回数据符合‘地址 运营商’格式
			return {addr:address.data.split(' ')[0], expect:true}
		}
	}
	//备用url
	let reserveAddrUrl: string = `http://ip.taobao.com/service/getIpInfo.php?ip=${ip}`
	addrResp = await getAsync({ url: reserveAddrUrl })
	if (addrResp.body && addrResp.statusCode === 200) {
		let address: any = JSON.parse(addrResp.body)
		if("CN" != address.data.country_id){			//国外IP或内网IP
			return { addr:`${"XX" == address.data.country ? "" : address.data.country} ${"XX" == address.data.region ? "" : address.data.region} ${"XX" == address.data.city ? "" : address.data.city}`, expect:false}
		}
		return {addr:`${address.data.region}${address.data.city}`, expect: true}
	}
	return null
}

export async function getMaps(devId: number): Promise<any>{
	let addrMap: Map<string, any> = new Map<string, any>();
	let retChunk: any[] = [];
	let devIdList: string[] = await daoDev.getAllDevIdListByUserId(devId)
	for(let devId of devIdList){
		let devAddr: any = devAddrMap.get(devId);
		if(null == devAddr)
			continue;
		let addr: any;
		let count: number;
		if((addr = addrMap.get(devAddr.dev_site)) != null){
			count = addr.dev_count + 1;
		}else{
			count = 1;
		}
		addrMap.set(devAddr.dev_site, {dev_site: devAddr.dev_site, dev_count: count, lat: ''+devAddr.lat, lng: ''+devAddr.lng});
	}
	for(let [key, value] of addrMap){
		retChunk.push(value);
	}
	return retChunk
}


