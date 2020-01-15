var oTabFlow, status;

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
    let id = window.location.href.split("?")[1]
    if(id.indexOf("&")){
        status = id.split("&")[1]
        id = id.split("&")[0]
    }
    var cgiobj = {
        "pageNumber": 1,
        "pageSize": 1000,
    }
    if(status !== "undefined"){
        cgiobj = {
            "pageNumber": 1,
            "pageSize": 1000,
            "taskStatus":status
        }
    }
    // var cgiobj = 'pageNumber=1&pageSize=1000'
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
            "url": cgiDtUrl("batchTasks/"+ id, cgiobj),
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
                "data":"devId"
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

function initDataTab() {
    dtReloadData(oTabFlow, false);
}
