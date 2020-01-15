var eventId, oTabFlow, taskFlag;

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
            "url": cgiDtUrl("taskObjects", cgiobj),
            "type": "GET",
            "dataSrc": function (d) {
                console.log(d)
                var data = initBackDatas(d);
                if (data.status == 0) {
                    return dtObjToArray(data.data.taskObjects);
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
                "data": "name"
            },
            {
                "data": "desc"
            },
            {
                "data": "taskType",
                "render":function(d,t,f){
                    if(d === "custom"){
                        return "自定义"
                    }else if(d === "linkAccess"){
                        return "访问链接"
                    }else if(d === "upgrade"){
                        return "升级"
                    }
                }
            },
            {
                "data": "taskArgs",
            },
            {
                "data": "name",
                "width": 98,
                "orderable": false,
                "render": function (d, t, f) {
                    return '<div class="btn-group btn-group-xs"><a data-msg1="' + f.name + '" data-msg2="' + f.desc + '" data-msg3="' + f.taskType + '" data-msg4="' + f.taskArgs + '" data-msg="' + f.taskObjId + '" onclick="toTasks(this);"><img src="../../images/edit.png" title="修改" alt="" class="left"></a><a data-msg="' + f.taskObjId + '" onclick="tabDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></div>';
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
    eventId = $(that).attr("data-msg");
    createModalTips("确定删除该任务对象吗？", "TabDelete");
}
var taskName, taskDesc,taskType,taskArgs
function toTasks(that){
    // getFiles()
    taskFlag = true //为true时 修改任务对象
    eventId = $(that).attr("data-msg");
    taskName = $(that).attr("data-msg1");
    taskDesc = $(that).attr("data-msg2");
    taskType = $(that).attr("data-msg3");
    taskArgs = $(that).attr("data-msg4");
    $("#modal_edit").modal("show")
    $("#task_obj_name").val(taskName)
    $("#task_describe").val(taskDesc)
    if(taskType === "linkAccess"){
        $("#task_id").html("URL:")
        $("#task_id").css("margin-left","40px")
        $("#version").css("display","none")
        $("#task_url").css("display","inline-block")   
    }
    $("#task_type").val(taskType)
    setTimeout(function() {
        if(taskArgs){
            $("#version").val(taskArgs)
            $("#task_url").val(taskArgs)
        }
    },500)
    $('#task_type').change(function(){
        var p1=$(this).children('option:selected').val();//这就是selected的值 
            if(p1 == "upgrade"){
                $("#task_id").html("升级文件:")
                $("#task_id").css("margin-left","0px")
                if($("#task_url")){
                    $("#task_url").css("display","none")
                    $("#version").css("display","inline-block")
                }
            }else if(p1 === "linkAccess"){
                $("#task_id").html("URL:")
                $("#task_id").css("margin-left","40px")
                $("#version").css("display","none")
                $("#task_url").css("display","inline-block")            
            }else if(p1 == "custom"){
                $("#task_id").html("自定义文件:")
                $("#task_id").css("margin-left","-20px")
                if($("#task_url")){
                    $("#task_url").css("display","none")
                    $("#version").css("display","inline-block")
                }
                var length = cus.length
                for(var i= 0; i< length; i++){
                    var html = '<option value="' + cus[i] + '">' + cus[i] + '</option>'
                    $("#version").append(html);
                }
            }
        });

}
function TabDelete() {
    let id = [eventId + ""]
    let obj = {
        "objIds": id
    }
    cgicall.ajax({
        url: 'taskObjects',
        type:"DELETE",
        contentType:"application/json",
        data: JSON.stringify(obj),
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
var task_obj = []
function getFiles(){
    cgicall.get("files",{
        "pageNumber":1,
        "pageSize":1000
    },
    function(d){
        task_obj = d.data.files
        let length = task_obj.length
        for(var i= 0; i< length; i++){
            var html = '<option value="' + task_obj[i].fileName + '">' + task_obj[i].fileName+ '</option>'
            $("#version").append(html);
        }
    })
}
getFiles()
function tabAdd() {
    //初始化弹框,点击修改再点击添加之后 会出现问题
    $("#version").css("display","inline-block")
    $("#task_url").css("display","none")
    $("#task_id").html("自定义文件:")
    $("#task_id").css("margin-left","-20px")
    $("#version").empty()
    getFiles()    
    $("#task_obj_name").val("")
    $("#task_describe").val("")
    $("#task_type").val("custom")
    taskFlag = false //为false时 添加任务对象
    $('#task_type').change(function(){
        var p1=$(this).children('option:selected').val();//这就是selected的值 
         if(p1 == "upgrade"){
             $("#task_id").html("升级文件:")
             $("#task_id").css("margin-left","0px")
             if($("#task_url")){
                 $("#task_url").css("display","none")
                 $("#version").css("display","inline-block")
             }
         }else if(p1 === "linkAccess"){
             $("#task_id").html("URL:")
             $("#task_id").css("margin-left","40px")
             $("#version").css("display","none")
             $("#task_url").css("display","inline-block")            
         }else if(p1 == "custom"){
             $("#task_id").html("自定义文件:")
             $("#task_id").css("margin-left","-20px")
             if($("#task_url")){
                 $("#task_url").css("display","none")
                 $("#version").css("display","inline-block")
             }
             let length = cus.length
             for(var i= 0; i< length; i++){
                 var html = '<option value="' + cus[i] + '">' + cus[i] + '</option>'
                 $("#version").append(html);
             }
         }
     });
      $('#modal_edit').modal("show");
  }
function DoSave() {
    if($("#task_obj_name").val().trim() == ""){
        $('#modal_edit').modal("hide");
        createModalTips("任务名称不能为空");
        return
    }
    let type = $("#task_type").val()
    let obj={
        "name":$("#task_obj_name").val(),
        "desc":$("#task_describe").val()?$("#task_describe").val():" ",
        "taskType":type,
    }
    if(type == "upgrade"){
        obj.upgradeFile = $("#version").val()
    }else if(type == "linkAccess"){
        obj.url = $("#task_url").val()
    }else{
        obj.customFile = $("#version").val()
    }
    if(taskFlag){
        if($("#task_obj_name").val().trim() !== taskName || type !== taskType || $("#task_describe").val() !== taskDesc || $("#version").val() !== taskArgs){
            cgicall.post("taskObjects/"+ eventId ,obj,function(d){
                if(d.status == "0"){
                    $('#modal_edit').modal("hide");
                    createModalTips("对象修改成功");
                    initDataTab();
                }else{
                    $('#modal_edit').modal("hide");
                    createModalTips("修改失败！" + errorTips(d.data.errMsg));
                }
            })
        }else{
            $('#modal_edit').modal("hide")
            createModalTips("您未做任何修改");
        }
    }else{
        cgicall.post("taskObjects",obj,function(d){
            if(d.status == "0"){
                $('#modal_edit').modal("hide");
                createModalTips("对象添加成功");
                initDataTab();
            }else{
                $('#modal_edit').modal("hide");
                createModalTips("添加失败！" + errorTips(d.data.errMsg));
            }
        })
    }

}
