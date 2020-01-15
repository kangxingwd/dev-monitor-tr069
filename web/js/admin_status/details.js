var id,
    dev_productclass,
    soft_version,
    status;
var oTabFlow,
    task_id;

$(function () {
    verifyEventsInit();
    initEvents();
    initData();
    oTabFlow = createDtFlow();
    // keepUp();
    createInitModal();
});

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}

function initDataTab () {
    dtReloadData(oTabFlow, false);
}

function initData() {
    id = window.location.href.split('=')[1] //得到index
    let obj = {
        "devId": id
    }
    cgicall.get('devices?query='+JSON.stringify(obj), function (d) {
        if (d.status == 0) {
            let obj = {
                "address":d.data.devices[0].address,
                "devices_id_num":d.data.devices[0].devId,
                "dev_productclass": d.data.devices[0].devProductclass,
                "ip":d.data.devices[0].ip,
                "last_time":d.data.devices[0].lastActiveTime,
                "mac":d.data.devices[0].mac,
                "memory_free":d.data.devices[0].memoryFree,
                "memory_total":d.data.devices[0].memoryTotal,
                "soft_version":d.data.devices[0].softwareVersion,
                "up_time":d.data.devices[0].upTime,
                "wlan_ssid":d.data.devices[0].wlanSSID,
            }
            jsonTraversal(obj, jsTravSet);
            $('#up_time').val(ToDataTime(d.data.devices[0].upTime));
            $("#dev_id_title").html(d.data.devices[0].devId);
            dev_productclass = d.data.devices[0].devProductclass;
            soft_version = d.data.devices[0].softwareVersion;
            status = d.data.devices[0].status;
            var total = d.data.devices[0].memoryTotal;
            var free = d.data.devices[0].memoryFree;
            var percent = parseInt((total - free) / total * 100) + '%';
            if (percent != 'NaN%') {
                $("#memory").val(percent);
            }
        } else {
            createModalTips("获取版本信息失败！" + errorTips(d.data));
        }
    })
}

function ToDataTime(d) {
    if (d != '') {
        var second_time = parseInt(d);
        var time = parseInt(second_time) + "秒";
        if (parseInt(second_time) > 60) {

            var second = parseInt(second_time) % 60;
            var min = parseInt(second_time / 60);
            time = min + "分" + second + "秒";

            if (min > 60) {
                min = parseInt(second_time / 60) % 60;
                var hour = parseInt(parseInt(second_time / 60) / 60);
                time = hour + "小时" + min + "分" + second + "秒";

                if (hour > 24) {
                    hour = parseInt(parseInt(second_time / 60) / 60) % 24;
                    var day = parseInt(parseInt(parseInt(second_time / 60) / 60) / 24);
                    time = day + "天" + hour + "小时" + min + "分" + second + "秒";
                }
            }
        }

        return time;
    }
}

function initEvents() {
    $('#reboot').on('click', Reboot);
    $('#restore').on('click', Restore);
    $('#delete').on('click', Delete);
    $('#upgrade').on('click', Upgrade);
}

function Reboot() {
    createModalTips("确定对该设备进行重启操作吗？", "DoReboot");
}

function DoReboot() {
    cgicall.post('devices/'+ id + '/tasks', {
            "name": "reboot",
        },
        function (d) {
            if (d.status == 0) {
                $("#modal_spin").modal("hide")
                createModalTips("添加任务成功！");
                initDataTab ();
            } else {
                $("#modal_spin").modal("hide")
                createModalTips("添加任务失败！" + errorTips(d.data.errMsg));
            }
        });
}

function Restore() {
    createModalTips("确定对该设备进行恢复出厂设置吗？", "DoRestore");
}

function DoRestore() {
    cgicall.post('devices/'+ id + '/tasks', {
        "name": "factoryReset",
        },
        function (d) {
            if (d.status == 0) {
                $("#modal_spin").modal("hide")
                createModalTips("添加任务成功！");
                initDataTab ();
            } else {
                $("#modal_spin").modal("hide")
                createModalTips("添加任务失败！" + errorTips(d.data.errMsg));
            }
        });
}

function Delete() {
    if (status == 1 || status == '1') {
        createModalTips("设备在线，不能删除！");
        return;
    }
    createModalTips("确定对该设备进行删除操作吗？", "Dodelete");
}

function Dodelete() {
    let url = 'devices/' + id
    cgicall.ajax({
        url: url,
        type:"delete",
        success:function(d){
            if(d.status === 0){
                $("#modal_spin").modal("hide")
                createModalTips("删除成功！");
                history.go(-1);
            }else{
            createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}

function Upgrade() {
    let productClass = {
        "productClass": dev_productclass
    }
    cgicall.get("files", {
        "pageNumber": 1,
        "pageSize": 1000,
        "query": JSON.stringify(productClass),
    }, function (d) {
        if (d.status == 0) {
            $("#version").html('');
            if (d.data.files.length < 1) {
                createModalTips("没有可以升级的文件！");
            } else {
                for (var i = 0; i < d.data.files.length; i++) {
                    var html = '<option value="' + d.data.files[i].fileName + '">' + d.data.files[i].fileName + '</option>'
                    $("#version").append(html);
                }
                $('#modal_edit').modal("show");
            }
        } else {
            createModalTips("初始化失败！" + errorTips(d.data.errMsg));
        }
    })
}

function DoSave() {
    var file = $("#version").val();
    cgicall.post('devices/'+ id + '/tasks', {
            "name": "upgrade",
            "file":  file,
        },
        function (d) {
            if (d.status == 0) {
                $("#modal_edit").modal("hide")
                createModalTips("添加任务成功！");
                initDataTab ();
            } else {
                $("#modal_edit").modal("hide")
                createModalTips("添加任务失败！" + errorTips(d.data.errMsg));
            }
        });
}


function createDtFlow() {
    // var cgiobj = {
    //     "pageNumber": 1,
    //     "pageSize": 10,
    // }
    var tablePrefix = '#table_flowctrl_';
    return $("#table_flowctrl").dataTable({
        "pagingType": "full_numbers",
        "order": [
            [2, 'asc']
        ],
        "language": {
            "url": '../../js/lib/dataTables.chinese.json'
        },
        "sDom": '<"top"l>rft<"bottom"pi><"clear">',
        "ajax": {
            "url": cgiDtUrl('devices/'+ id + '/tasks?pageSize=1000'),
            "type": "GET",
            "dataSrc": function (d) {
                var data = initBackDatas(d);
                if (data.status == 0) {
                    return dtObjToArray(data.data.tasks);
                } else if (data.data.errCode == 40001) {
                    window.location.href = "/view/admin_login/login.html";

                }
                return [];
            }
        },
        "columns": [{
                "data": null,
                "width": 60,
                "orderable": false,
                "searchable": false
            },
            {
                "data":"taskId"
            },
            {
                "data":"taskName"
            },
            {
                "data": "taskArgs",
            },
            {
                "data": "taskStatus",
                "render": function (d, t, f) {
                    if(d == "0"){
                        return "成功"
                    }else if(d == "1"){
                        return "失败"
                    }else if(d == "2"){
                        return "已获取"
                    }else{
                        return "未获取"
                    }
                }

            },
            {
                "data": "faultCode",
            },
            {
                "data":"faultMessage"
            },
            {
                "data": "time"
            },
            {
                "data": "retries",
            },
            {
                "data": "retries",
                "width": 98,
                "orderable": false,
                "render": function (d, t, f) {
                    if (typeof f.faultCode != "undefined") {
                        return '<div class="btn-group btn-group-xs"><a data-msg="' + f.taskId + '" onclick="retry(this);"><img src="../../images/refresh.png" title="重试" alt="" class="left"></a><a data-msg="' + f.taskId + '" onclick="tabDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></div>';
                    } else {
                        return '<div class="btn-group btn-group-xs"><a data-msg="' + f.taskId + '" onclick="tabDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></div>';
                    }
                }
            }
        ],
        "rowCallback": function (nTd, sData, oData, iRow, iCol) {
            dtBindRowSelectEvents(nTd);
            $(nTd).find("td").eq(0).html(iRow + 1).css("white-space", "nowrap");
        },
        "drawCallback": function () {
            $("body > div.tooltip").remove();
            $('[data-toggle="tooltip"]').tooltip();
        },
        "initComplete": function () {
            $(tablePrefix + 'filter').append('<div>' +
                '<input type="search" id="tableSeach" class="form-control" placeholder="查找" aria-controls="table_flowctrl"></div>'
            );
            $(tablePrefix + 'filter').find("label").css("display", "none");
            initEvents_table();
        },
        "fnFooterCallback": function (nFoot, aData, iStart, iEnd, aiDisplay) {
            if (iStart == iEnd) {
                if (iStart > 0) {
                    setTimeout(function () {
                        oTabFlow.fnPageChange('previous', true);
                    }, 200);
                }
            }
        }
    });
}

function initEvents_table() {
    $('#tableSeach').bind('input propertychange', function () {
        oTabFlow.api().search($("#tableSeach").val()).draw();
    })
}

function retry(that) {
    task_id = $(that).attr("data-msg");
    cgicall.post('tasks/'+task_id+'/retry', 
        function (d) {
            if (d.status == 0) {
                $("#modal_spin").modal("hide")
                initDataTab();
                createModalTips("重试成功！");
            } else {
                $("#modal_spin").modal("hide")
                createModalTips("重试失败！" + errorTips(d.data.errMsg));
            }
        });
}

function tabDelete(that) {
    task_id = $(that).attr("data-msg");
    createModalTips("确定删除该项任务吗？", "TabDelete");
}

function TabDelete() {

    // cgicall.post('task/delete', {
    //         "task_id": task_id,
    //         "dev_id": id
    //     },
    //     function (d) {
    //         if (d.status == 0) {
    //             $("#modal_spin").modal("hide")
    //             createModalTips("删除成功！");
    //             initDataTab ();
    //         } else {
    //             $("#modal_spin").modal("hide")
    //             createModalTips("删除失败！" + errorTips(d.data.errMsg));
    //         }
    //     });
        let url = 'tasks/' + task_id
    cgicall.ajax({
        url: url,
        type:"delete",
        success:function(d){
            if(d.status === 0){
                $("#modal_spin").modal("hide")
                createModalTips("删除成功！");
                initDataTab();
            }else{
            createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}

// function keepUp() {
//     setInterval(initDataTab  , 5000);
// }