var oTabFlow;

$(function () {
    verifyEventsInit();
    oTabFlow = createDtFlow();
    createInitModal();
});

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}

function createDtFlow() {
    var cgiobj = {
        "pageNumber": 1,
        "pageSize": 1000
        }
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
            "url": cgiDtUrl("event", cgiobj),
            "type": "GET",
            "dataSrc": function (d) {
                var data = initBackDatas(d);
                if (data.status == 0) {
                    return dtObjToArray(data.data.userEventList);
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
                "data":"event",
                "render": function(d,t,f){
                    if(d == "statusChange"){
                        return "在线/离线 通知"
                    }else if(d == "addrChange"){
                        return "设备地址变更通知"
                    }else if(d == "wifiProbe"){
                        return "wifi探针上报"
                    }else if(d == "taskStatus"){
                        return "任务状态通知"
                    }
                }
            },
            {
                "data":"url"
            },
            {
                "data": "event",
                "width": 98,
                "orderable": false,
                "render": function (d, t, f) {
                    return '<div class="btn-group btn-group-xs"><a data-msg="' + d + '" data-msg1="' + f.url + '" onclick="toTasks(this);"><img src="../../images/edit.png" title="修改" alt="" class="left"></a><a data-msg="' + d + '" onclick="tabDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></div>';
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
            $(tablePrefix + 'filter').append('<div class="table-bt">' +
                '<input type="search" id="tableSeach" class="form-control" placeholder="查找" aria-controls="table_flowctrl">' +
                '<button type="button" class="btn btn-zx blueBtnT add">新增</button></div>'
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
var eventName, eventUrl, eventFlag
function toTasks(that){
    eventFlag = true //为true时 修改事件
    eventName = $(that).attr("data-msg")
    eventUrl = $(that).attr("data-msg1")
    $("#modal_edit").modal("show")
    $(".eventType").val(eventName)
    $("#url").val(eventUrl)
    $(".eventType").attr("disabled",'disabled')
}


function initEvents_table() {
    $(".add").on("click", eventAdd);
    $('#tableSeach').bind('input propertychange', function () {
        oTabFlow.api().search($("#tableSeach").val()).draw();
    })
}
function eventAdd(){
    eventFlag = false //为false时 添加事件
    $(".eventType").val("statusChange")
    $("#url").val("")
    $("#modal_edit").modal("show")
}
function add(){
    let type = $(".eventType").val()
    let url = $("#url").val()
    if(url.trim() === ""){
        // $("#modal_edit").modal("hide")
        createModalTips("url不能为空");
        return
    }
    let data = {
        event: type,
        url:url
    }
    if(!eventFlag){
        cgicall.post("event",data,
            function(d){
                if(d.status == "0"){
                    $("#modal_edit").modal("hide")
                    createModalTips("添加成功");
                    initDataTab()
                }else{
                    $("#modal_edit").modal("hide")
                    createModalTips("添加失败！" + errorTips(d.data.errMsg));
                }
            }
        )
    }else{
        if(url !== eventUrl){
            cgicall.post("event/" + eventName, data, function(d){
                if(d.status == "0"){
                    $("#modal_edit").modal("hide")
                    createModalTips("修改成功");
                    initDataTab()
                }else{
                    $("#modal_edit").modal("hide")
                    createModalTips("修改失败！" + errorTips(d.data.errMsg));
                }
            })
        }else{
            $('#modal_edit').modal("hide")
            createModalTips("您未做任何修改")
        }
    }
}
function tabDelete(that) {
    event_name = $(that).attr("data-msg");
    createModalTips("确定删除该事件吗？", "TabDelete");
}

function TabDelete() {
    // cgicall.post('tasks/delete', {
    //         "batch_task_id": batch_task_id,
    //         "batch_name": batch_name
    //     },
    //     function (d) {
    //         if (d.status == 0) {
    //             $("#modal_spin").modal("hide")
    //             createModalTips("删除成功！");
    //             initDataTab();
    //         } else {
    //             $("#modal_spin").modal("hide")
    //             createModalTips("删除失败！" + errorTips(d.data.errMsg));
    //         }
    //     });


    //批量删除任务
    let url = "event/" + event_name
    cgicall.ajax({
        url: url,
        type:"delete",
        success:function(d){
            if(d.status === 0){
                createModalTips("删除成功！");
                $("#modal_spin").modal("hide");
                initDataTab();
            }else{
                $("#modal_spin").modal("hide")
                createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        }
    })
 
}

function initDataTab() {
    dtReloadData(oTabFlow, false);
}

function toOverview(that) {
    var batch_name = $(that).attr("data-msg1");
    var task_status = $(that).attr("data-msg2");
    window.location.href = "/view/admin_status/overview.html?batch_name=" + batch_name + "&task_status=" + task_status;
}