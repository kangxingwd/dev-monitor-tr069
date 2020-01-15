import {CwmpParams} from "../../../config/cwmp";

export function parseCwmpParams(parameterList :string[]): any {
    let devParams: any = {};
    for( let paramArray of parameterList){
        if(CwmpParams.hasOwnProperty(paramArray[0])){
            devParams[CwmpParams[paramArray[0]]] = paramArray[1];
        }else {
            devParams[paramArray[0]] = paramArray[1];
        }
    }
    return devParams;
}



