var oTabFlow, username;

$(function () {
    verifyEventsInit();
    oTabFlow = createDtFlow();
    createInitModal();
});

function initDataTab() {
    dtReloadData(oTabFlow, false);
}

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit,#modal_edit2").modal({
        "backdrop": "static",
        "show": false
    });
}

function createDtFlow() {
    var cgiobj = {
        "page": 1,
        "count": 10000
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
            "url": cgiDtUrl("account"),
            "type": "GET",
            "dataSrc": function (d) {
                var data = initBackDatas(d);
                if (data.status == 0) {
                    return dtObjToArray(data.data.accounts);
                } else if (data.data.errCode == 40001) {
                    window.location.href = "/view/admin_login/login.html";

                } else {
                    createModalTips(errorTips(d.data.errMsg));
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
                "data": "username",
                // "render": function(d,t,f){
                //     console.log(d)
                // }
            },
            {
                "data": "desc"
            },
            {
                "data": "last_time"
            },
            {
                "data": "enable",
                "render": function (d, t, f) {
                    if (f.username == 'admin') {
                        return '';
                    } else {
                        if (typeof d != "undefined" && d != 1) {
                            return '<a class="btn btn-dangered btn-xs" onclick="set_enable(this)"><img src="../../images/no.png" class="en">禁用</a>';
                        } else {
                            return '<a class="btn btn-successed btn-xs" onclick="set_enable(this)"><img src="../../images/yes.png" class="en">启用 </a>';
                        }
                    }
                }
            },
            {
                "data": "last_time",
                "render": function (d, t, f) {
                    return '<a class="btn btn-reseted btn-xs"  onclick="reset(this);"><img src="../../images/reset.png" class="en">重置</a>';
                }
            },
            {
                "data": "last_time",
                "width": 98,
                "orderable": false,
                "render": function (d, t, f) {
                    if (f.username == 'admin') {
                        return '';
                    } else {
                        return '<div class="btn-group btn-group-xs"><a onclick="edit(this);"><img src="../../images/newst.png" title="编辑" alt="" class="left"></a></a><a onclick="OnDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></a></div>';
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
            $(tablePrefix + 'filter').append('<div class="table-bt">' +
                '<input type="search" id="tableSeach" class="form-control" placeholder="查找" aria-controls="table_flowctrl">' +
                '<button type="button" class="btn btn-zx blueBtnT add">新增</button></div>'
            );
            $(tablePrefix + 'filter').find("label").css("display", "none");
            // $(tablePrefix + 'wrapper').find(".bottom").append('<div">' +
            //     '<a class="btn btn-default add greenBtn" style="margin-top: 5px;">新增</a>' +
            //     '</div>');
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
    $(".add").on("click", tabAdd);
    $('#tableSeach').bind('input propertychange', function () {
        oTabFlow.api().search($("#tableSeach").val()).draw();
    })
}

function tabAdd() {
    $(".tip").html('');
    $("#account").val('')
    $("#password").val('888888')
    $("#descc").val('');
    $('#modal_edit').modal("show");
}

function DoSave() {
    if (!verification()) return;
    var obj = {
        "option":"add",
        "data":{
            "username" : $("#account").val(),
            "password" : $("#password").val(),
            "desc" : $("#descc").val()
        }
    }
    // cgicall.post('account', obj, function (d) {
    //     $("#modal_edit").modal("hide")
    //     if (d.status == 0) {
    //         createModalTips("保存成功！");
    //         initDataTab();
    //     } else {
    //         createModalTips("保存失败！" + errorTips(d.data.errMsg));
    //     }
    // });
    cgicall.ajax({
        url:"account",
        contentType : "application/json",
        type:"POST",
        data:JSON.stringify(obj),
        success:function(d){
            $("#modal_edit").modal("hide")
            if (d.status == 0) {
                createModalTips("保存成功！");
                initDataTab();
            } else {
                createModalTips("保存失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}

function set_enable(that) {
    getSelected(that);
    if (nodeEdit[0].enable == 0 || nodeEdit[0].enable == '0') {
        createModalTips("确定启用该账号吗？", "DoEnable");
    } else {
        createModalTips("确定禁用该账号吗？", "DoEnable");
    }

}

function DoEnable() {
    var obj = {
        'option':"change_status",
        'data':{
            'enable': nodeEdit[0].enable == 1 ? 0 : 1,
            'username': nodeEdit[0].username
        }
    };
    // cgicall.post("account", obj, function (d) {
    //     cgicallBack(d, initDataTab, function () {
    //         createModalTips(errorTips(d.data.errMsg));
    //     });
    // });
    cgicall.ajax({
        url:"account",
        contentType : "application/json",
        type:"POST",
        data:JSON.stringify(obj),
        success:function(d){
            cgicallBack(d, initDataTab, function () {
                createModalTips(errorTips(d.data.errMsg));
            });
        }
    })
}

function getSelected(that) {
    nodeEdit = [];
    if (that) {
        var node = $(that).closest("tr");
        var data = oTabFlow.api().row(node).data();
        nodeEdit.push(data);
    } else {
        nodeEdit = dtGetSelected(oTabFlow);
    }
}

function reset(that) {
    getSelected(that);
    createModalTips("确定重置密码吗？", "DoReset");
}

function DoReset() {
    // cgicall.post("account", {
    //     "option":"reset_passwd",
    //     "data":{
    //         "username": nodeEdit[0].username
    //     }
    // }, function (d) {
    //     if (d.status == 0) {
    //         createModalTips("重置成功！");
    //         initDataTab();
    //     } else {
    //         createModalTips("重置失败！" + errorTips(d.data.errMsg));
    //     }
    // });
    let obj = {
        "option":"reset_passwd",
        "data":{
            "username": nodeEdit[0].username
        }
    }
    cgicall.ajax({
        url:"account",
        contentType : "application/json",
        type:"POST",
        data:JSON.stringify(obj),
        success:function(d){
            if (d.status == 0) {
                createModalTips("重置成功！");
                initDataTab();
            } else {
                createModalTips("重置失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}

function OnDelete(that) {
    getSelected(that);
    if (nodeEdit.length == 0) {
        createModalTips("请选择要删除的用户！");
        return;
    }
    createModalTips("删除后不可恢复。确定要删除？", "DoDelete");
}


function DoDelete() {
    let obj = {
        "option":"delete",
        "data":{
            "accounts":[nodeEdit[0].username]
        }
    }

    // cgicall.post('account/delete', obj, function (d) {
    //     if (d.status == 0) {
    //         createModalTips("删除成功！");
    //         initDataTab();
    //     } else {
    //         createModalTips("删除失败！" + errorTips(d.data.errMsg));
    //     }
    // });

    //删除问题
    cgicall.ajax({
        url:"account",
        contentType : "application/json",
        type:"POST",
        data:JSON.stringify(obj),
        success:function(d){
            if (d.status == 0) {
                createModalTips("删除成功！");
                initDataTab();
            } else {
                createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}

function edit(that) {
    getSelected(that);
    username = nodeEdit[0].username;
    var desc = nodeEdit[0].desc;
    $("#username").val(username);
    $("#desc").val(desc);
    $('#modal_edit2').modal("show");
}

function DoSave2() {
    // var obj = {};
    // obj.account = username;
    // obj.desc = $("#desc").val();
    // cgicall.post('account/update', obj, function (d) {
    //     $("#modal_edit2").modal("hide")
    //     if (d.status == 0) {
    //         createModalTips("保存成功！");
    //         initDataTab();
    //     } else {
    //         createModalTips("保存失败！" + errorTips(d.data.errMsg));
    //     }
    // });
    let obj = {
        "option":"update",
        "data":{
            "username": username,
            "desc":$("#desc").val()
        }
    }
    cgicall.ajax({
        url:"account",
        contentType : "application/json",
        type:"POST",
        data:JSON.stringify(obj),
        success:function(d){
            $("#modal_edit2").modal("hide")
            if (d.status == 0) {
                createModalTips("保存成功！");
                initDataTab();
            } else {
                createModalTips("保存失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}