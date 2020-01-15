var filename, oTabFlow;

$(function () {
    verifyEventsInit();
    oTabFlow = createDtFlow();
    createInitModal();
    initEvents();
});

function initDataTab() {
    dtReloadData(oTabFlow, false);
}

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}

function initEvents() {
    $("#file_content").on("change", function () {
        $("#tab-cover").html('未选择文件');
        $("#tab-cover").html(document.getElementById("file_content").files[0].name);
        $("#oui").val(document.getElementById("file_content").files[0].name.split("-")[1]);
        $("#productClass").val(document.getElementById("file_content").files[0].name.split("-")[4]);
        $("#version").val(document.getElementById("file_content").files[0].name.match(/V\d+(\.\d+)+-\d+/)[0]);
    })
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
            "url": cgiDtUrl("files", cgiobj),
            "type": "GET",
            "dataSrc": function (d) {
                var data = initBackDatas(d);
                if (data.status == 0) {
                    return dtObjToArray(data.data.files);
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
                "data": "fileName"
            },
            {
                "data": "oui"
            },
            {
                "data": "fileType",
                "render": function (d, t, f) {
                    // if (d == '1 Firmware Upgrade Image') {
                    //     return '固件升级映像';
                    // } else if (d == '2 Web Content') {
                    //     return '网页内容';
                    // } else if (d == '3 Vendor Configuration File') {
                    //     return '供应商配置文件';
                    // } else if (d == '4 Tone File') {
                    //     return '音调文件';
                    // } else if (d == '5 Ringer File') {
                    //     return '铃声文件';
                    // }else{
                    //     return d
                    // }
                    if(d == '1 Firmware Upgrade Image'){
                        return '固件升级映像';
                    }else if(d == '2 Web Content' || d == '3 Vendor Configuration File' || d == '4 Tone File' || d == '5 Ringer File'){
                        return "自定义文件"
                    }else{
                        return d
                    }
                }
            },
            {
                "data": "productClass",
            },
            {
                "data": "version"
            },
            {
                "data": "fileName",
                "width": 98,
                "orderable": false,
                "render": function (d, t, f) {
                    return '<div class="btn-group btn-group-xs"><a onclick="tabDelete(this);"data-msg="' + d + '"><img src="../../images/delete.png" title="删除" alt=""></a></a></div>';
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

function initEvents_table() {
    $(".add").on("click", tabAdd);
    $('#tableSeach').bind('input propertychange', function () {
        oTabFlow.api().search($("#tableSeach").val()).draw();
    })
}

function tabDelete(that) {
    filename = $(that).attr("data-msg");
    createModalTips("确定删除该文件吗？", "TabDelete");
}

function TabDelete() {
    // cgicall.post('file/delete', {
    //         "file_name": filename
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
    let url = 'files/' + filename
    cgicall.ajax({
        url: url,
        type:"delete",
        success:function(d){
            if(d.status === 0){
                $("#modal_spin").modal("hide")
                createModalTips("删除成功！");
                initDataTab();
            }else{
                $("#modal_spin").modal("hide")
                createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}

function tabAdd() {
    $("#tab-cover").html('未选择文件');
    $(".tip").html('');
    $("#file_type").val('1 Firmware Upgrade Image');
    $("#productClass").val('')
    $("#version").val('');
    $("#oui").val('');
    $("#version").val('');
    $("#file_content").val('');
    $('#modal_edit').modal("show");
}

function checkFileSize() {
    try {
        var file = document.getElementById('file_content').files[0];
        var size = Math.floor(file.size / 1024 / 1024);
        if (size > 100) {
            createModalTips('上传文件不得超过100M');
            return false;
        }
    } catch (error) {}
    return true;
}


function DoSave() {
    if (!verification()) return;
    if (!checkFileSize()) return false;
    var file_type = $("#file_type").val();
    var selectedFile = document.getElementById("file_content").files[0];
    var filename = selectedFile.name;
    var reader = new FileReader();
    var file_content;
    var oui = $("#oui").val();
    var productClass = $("#productClass").val();
    var version = $("#version").val();
    reader.readAsDataURL(selectedFile);
    $("#modal_edit").modal("hide");
    $("#modal_spin .modal-body p").html("正在上传文件！<br>请稍候...");
    $("#modal_spin").modal("show");
    reader.onload = function (e) {
        file_content = e.target.result;
        var obj = {
            "fileName":filename,
            "fileType": file_type,
            "oui": oui,
            "productClass": productClass,
            "version": version,
            "content": file_content,
        }
        // cgicall.post('file/upload', obj,
        //     function (d) {
        //         if (d.status == 0) {
        //             $("#modal_spin").modal("hide");
        //             createModalTips("上传文件成功！");
        //             initDataTab();
        //         } else {
        //             $("#modal_spin").modal("hide");
        //             createModalTips("上传文件失败！" + errorTips(d.data.errMsg));
        //         }
        //     });
        let url = "files/upload/" + filename
        cgicall.ajax({
            url: url,
            type: "PUT",
            contentType:"application/json",
            data: JSON.stringify(obj),
            success:function(d){
                if(d.status === 0){
                    $("#modal_spin").modal("hide");
                    createModalTips("上传文件成功！");
                    initDataTab();
                }else{
                    $("#modal_spin").modal("hide")
                    createModalTips("上传文件失败！" + errorTips(d.data.errMsg));
                }
            }
        })
    };
}
