 var oTabFlow, obj, cgiobj, route, now_size, now_num, route_flag,alldev; //route为当前url"?"拼接的信息  now_size当前页展示数量 now_num当前第几页 判断是否是筛选的设备
 function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
 }
 //跳转页面函数
 function toRoute(num,size){
     cgiobj = route.split("&")[2]
    if(route_flag){
        window.location.href = '/view/admin_status/overview.html?pageNumber='+num+'&pageSize='+size+"&"+cgiobj
    }else{
        window.location.href = '/view/admin_status/overview.html?pageNumber='+num+'&pageSize='+size
    }
 }
 function initDataTab(){
    window.location.href = window.location.href
 }
 //直接加载的函数
 $(function () {
    route = window.location.href.split("?")[1]
    if(route.split("&").length > 2){
        route_flag = true
    }else{
        route_flag = false
    }
    now_num = route.split("&")[0].split("=")[1]
    now_size = route.split("&")[1].split("=")[1]
    createInitModal();
    // changePage()
    initTable() //获取数据
 })
//初始化事件
 function initEvents_table() {
     tabTitleInit();
     $('.delete').on('click', function () {
         OnDelete()
     });
     $(".checkall").on("click", OnSelectAll);
     $('#upgrade').on('click', Upgrade);
     $('#search').on('click', DoSearch);
 }
//全选
 function OnSelectAll() {

     let flag = $(".checkall").is(':checked')
    let length = $(".choose").length
    for(let i= 0;i< length; i++){
        if(flag){
            $(".choose").eq(i).prop("checked",true)
        }else{
            $(".choose").eq(i).prop("checked",false)
        }
    }
 }
 //删除设备
var delete_devId
 function OnDelete(that) {
     delete_devId = $(that).attr("data-msg")
     if($(that).attr("data-msg1") == 1){
        createModalTips("设备在线，不能删除！");
        return;
     }
    //  if (nodeEdit.length < 1) {
    //      createModalTips("请选择要删除的设备！");
    //      return;
    //  } else 
     createModalTips("删除后不可恢复。确定要删除？", "DoDelete");
 }

 function DoDelete() {
    let url = 'devices/' + delete_devId
    cgicall.ajax({
        url: url,
        type:"delete",
        success:function(d){
            if(d.status === 0){
                createModalTips("删除成功！");
                initDataTab();
                $(".checkall").prop("checked", false);
            }else{
            createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        },
        error:function(d){
            createModalTips("删除失败！");
        }
    })
 }
 function toDetials(that) {
     var id = $(that).attr("data-msg");
     window.location.href = "../admin_status/details.html?index=" + id;
 }
 //获取批量任务信息
 var upg = []
 var cus = []
 var link = []
 var all = []
 function getObj(){
    cgicall.get("taskObjects",{
        "pageNumber": 1,
        "pageSize": 1000,
    },function(d){
        if(d.status == "0"){
            upg = []
            cus = []
            link = []
            all = []
            let obj_name = all = d.data.taskObjects
            let obj_length = obj_name.length
            for(var i= 0; i< obj_length; i++){
                if(obj_name[i].taskType == "upgrade"){
                    upg.push(obj_name[i].name)
                }else if(obj_name[i].taskType == "linkAccess"){
                    link.push(obj_name[i].name)
                }else{
                    cus.push(obj_name[i].name)
                }
            }
            $("#task_id").html("任务对象:")
            $("#task_id").css("margin-left","0px")
            $("#version").empty();
            if($("#task_url")){
                $("#task_url").css("display","none")
                $("#version").css("display","inline-block")
            }
            let length = all.length
            for(var i= 0; i< length; i++){
                var html = '<option value="' + all[i].name + '">' + all[i].name + '</option>'
                $("#version").append(html);
            }
        }else if (d.data.errCode == 40001) {
            createModalTips("初始化失败！" + errorTips(d.data.errMsg));
        }
    })
 }

 //添加批量任务
 var devices_id
 function Upgrade() {
    devices_id = []
    let length = $(".choose").length
    for(let i= 0;i< length; i++){
        let flag = $(".choose").eq(i).is(':checked')
        let a = $(".choose").eq(i).attr("data-msg")
        if(flag){
            devices_id.push(a)
        }
    }
    if(devices_id.length == 0){
        createModalTips("请选择要操作的设备！");
        return;
    }
    getObj()
    $('#task_type').change(function(){
       var p1=$(this).children('option:selected').val();//这就是selected的值 
        if(p1 == "upgrade"){
            $("#version").empty();
            let length = upg.length
            for(var i= 0; i< length; i++){
                var html = '<option value="' + upg[i] + '">' + upg[i]+ '</option>'
                $("#version").append(html);
            }
        }else if(p1 === "linkAccess"){
            $("#version").empty();
            let length = link.length
            for(var i= 0; i< length; i++){
                var html = '<option value="' + link[i] + '">' + link[i]+ '</option>'
                $("#version").append(html);
            }       
        }else if(p1 == "custom"){
            $("#version").empty();
            let length = cus.length
            for(var i= 0; i< length; i++){
                var html = '<option value="' + cus[i] + '">' + cus[i] + '</option>'
                $("#version").append(html);
            }
        }else{
            $("#version").empty();
            let length = all.length
            for(var i= 0; i< length; i++){
                var html = '<option value="' + all[i].name + '">' + all[i].name + '</option>'
                $("#version").append(html);
            }
        }
    });
     $('#modal_edit').modal("show");
 }
//确定添加批量任务
 function DoSave() {
    var arr = [];
    if($("#task_name").val().trim() == ""){
        $('#modal_edit').modal("hide");
        createModalTips("任务名称不能为空");
        return
    }
    for (var i = devices_id.length - 1; i >= 0; i--) {
        arr.push(devices_id[i]);
    }
    let name = $("#task_name").val()
    var obj = {
        "btaskName": name+"",
        "taskType": "taskObject",
        "allDevs": 0,
        "devices":arr,
        "taskObjectName": $("#version").val() + ""
    };
    cgicall.ajax({
        url: "batchTasks",
        type:"post",
        contentType:"application/json",
        data:JSON.stringify(obj),
        success:function(d){
        if (d.status == 0) {
            $("#modal_edit").modal("hide")
            createModalTips("添加任务成功！");
            setTimeout(()=>{
                initDataTab();
            },500)
        } else {
            $("#modal_edit").modal("hide")
            createModalTips("添加任务失败！" + errorTips(d.data.errMsg));
        }
        },
        error: function(d){
            $("#modal_edit").modal("hide")
            createModalTips("添加任务失败！" + errorTips(d.data.errMsg));
        }
    })

 }
//获取所有设备的版本信息 代理上信息 和设备型号
 function tabTitleInit() {
     let obj = route.split("query=")[1]
     if(obj){
        obj = obj.split("%22").join("'").split(",")
        obj = eval('(' + obj + ')')
     }else{
         obj = {
             "proxyUser":"",
             "devProductclass":"",
             "softwareVersion":""
         }
    }
    $("#mac").val(obj.mac)
     $("#is_online").val(obj.status)
     cgicall.get("account/proxy_user", function (d) {
         if (d.status == 0) {
             for (var i = 0; i < d.data.proxy_user.length; i++) {
                 var html = '<option value="' + d.data.proxy_user[i] + '">' + d.data.proxy_user[i] + '</option>'
                 $("#proxy_user").append(html);
             }
             $("#proxy_user").val(obj.proxyUser);
         } else if (d.data.errCode == 40001) {
             createModalTips("初始化失败！" + errorTips(d.data.errMsg));
         }
     })
     cgicall.get("devices/dev_productclass", function (d) {
         if (d.status == 0) {
             for (var i = 0; i < d.data.dev_productclass_list.length; i++) {
                 var html = '<option value="' + d.data.dev_productclass_list[i] + '">' + d.data.dev_productclass_list[i] + '</option>'
                 $("#dev_productclass_list").append(html);
             }
             $("#dev_productclass_list").val(obj.devProductclass);
         } else if (d.data.errCode == 40001) {
             createModalTips("初始化失败！" + errorTips(d.data.errMsg));
         }
     })
     cgicall.get("devices/soft_version", function (d) {
         if (d.status == 0) {
             for (var i = 0; i < d.data.soft_version_list.length; i++) {
                 var html = '<option value="' + d.data.soft_version_list[i] + '">' + d.data.soft_version_list[i] + '</option>'
                 $("#soft_version_list").append(html);
             }
             $("#soft_version_list").val(obj.softwareVersion);
         } else if (d.data.errCode == 40001) {
             createModalTips("初始化失败！" + errorTips(d.data.errMsg));
         }
     })
 }
//根据设备型号搜索设备
function DoSearch() {
    var mac = $("#mac").val();
    var proxy_user = $("#proxy_user").val();
    var is_online = $("#is_online").val();
    var dev_productclass = $("#dev_productclass_list").val();
    var soft_version = $("#soft_version_list").val();
    obj = {};
        cgiobj = "&query="
        var filter = {
            "mac": mac,
            "proxyUser": proxy_user,
            "status": is_online,
            "devProductclass": dev_productclass,
            "softwareVersion": soft_version
        }
        for(let key in filter){
            if(filter[key]== ""){
                delete filter[key]
            }
        }
        cgiobj += JSON.stringify(filter)
     window.location.href = "/view/admin_status/overview.html?pageNumber=1&pageSize="+now_size+cgiobj
}
//显示当前页 多少条信息
function flowctrl(all){
    let start = (now_num-1)*now_size + 1
    let end = (now_num)*now_size
    if(end >= all){
        end = all
    }
    $("#table_flowctrl_info").html("第 "+start+" 至 "+end+" 条结果　总共 "+all+" 条")
}
var first_flag= true, last_flag= true //判断上一页与第一页按钮是否可用 判断下一页与最后一页按钮是否可用
//更换页码和数量
function changePage(allnum){
    $("#pageSize").val(now_size)
    $("#pageSize").change(function(){
        var size=$(this).children('option:selected').val();
        var chenge_num = function(now_num,size){
            if(now_num * size > alldev && now_num != 1){
                now_num--
                chenge_num(now_num,size)
            }else{
                toRoute(now_num,size)
            }
        }
        chenge_num(now_num,size)

    })
    //切换下面显示的页码
    if(allnum > 3){
        if(now_num == 1){
            $(".active").eq(0).html(1)
            $(".active").eq(1).html(2)
            $(".active").eq(2).html(3)
        }else if(now_num == allnum){
            $(".active").eq(0).html(allnum - 2)
            $(".active").eq(1).html(allnum - 1)
            $(".active").eq(2).html(allnum)
            $(".active").eq(3).css("display","none")
        }else if(2 < now_num < allnum){
            $(".active").eq(0).html(Number(now_num) - 1)
            $(".active").eq(1).html(Number(now_num))
            $(".active").eq(2).html(Number(now_num) + 1)
        }
    }
    let length = $(".active").length
    for(let i= 0; i<length; i++){
        $(".active").eq(i).css({
            "background-color":"",
            "color":""
        })
        if($(".active").eq(i).html().trim() == now_num){
            $(".active").eq(i).css({
                "background-color":"#1E90FF",
                "color":"white"
            })
        }
        //点击切换到当前页数
        $(".active").eq(i).on("click",function(){
            let num = $(this).html().trim()
            toRoute(num,now_size)
        })
    }
    //点击切换到第一页
    $(".first").on("click",function(){
        if(first_flag){
            toRoute(1,now_size)
        }
    })
    //点击上一页
    $(".previous").on("click",function(){
        let num = Number(now_num) - 1
        if(first_flag){
            toRoute(num,now_size)

        }
    })
    //点击最后一页
    $(".last").on("click",function(){
        if(last_flag){
            toRoute(allnum,now_size)

        }
    })
    //点击下一页
    $(".next").on("click",function(){
        let num = Number(now_num) + 1
        if(last_flag){
            toRoute(num,now_size)

        }
    })
}
//初始化数据
function initTable(){
    let k = (now_num-1)*now_size + 1 //序号
    cgicall.get("devices?"+ route,function(d){
        if(d.status == "0"){
            obj = d.data.devices
            for(let item of d.data.devices){
                let status = item.status == "0"?"离线":"在线"
                let ip = ""
                if(item.realIp != "undefined"){
                    ip =  '<div>'+ item.ip +'(内网)</div>'+'<div>'+ item.realIp +'(外网)</div>'
                }else{
                    ip = '<div>'+ item.ip +'(内网)</div>'
                }
                setTimeout(()=>{
                    var html ='<tr><td><input data-msg= '+item.devId+' class="choose" type="checkbox" /></td><td>'+k+'</td><td>'+item.devId+'</td><td>'+status+'</td><td>'+item.proxyUser+'</td><td>'+item.devProductclass+'</td><td>'+item.softwareVersion+'</td><td>'+item.mac+'</td><td>'+ip+'</td><td>'+item.wlanSSID+'</td><td>'+item.lastActiveTime+'</td><td>'+changeTime(item.upTime)+'</td><td><div class="btn-group btn-group-xs" style="width:80px"><a data-msg="' + item.devId + '"  onclick="toDetials(this);"><img src="../../images/edit.png" title="详情" alt="" class="left"></a><a data-msg='+item.devId+' data-msg1='+item.status+' onclick="OnDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></div></td></tr>' 
                    $("#table_flowctrl").append(html)
                    k++
                },200)
            }
            let allnum = d.data.totalPages //总页数
            alldev = d.data.recordsFiltered
            if(allnum == 2){
                $(".active").eq(1).css("display","inline")
            }else if(allnum == 3){
                $(".active").eq(1).css("display","inline")
                $(".active").eq(2).css("display","inline")
            }else if(allnum > 3){
                $(".active").eq(1).css("display","inline")
                $(".active").eq(2).css("display","inline")
                $(".active").eq(3).css("display","inline")
            }
            //判断更换页码是否允许使用
            first_flag = true
            last_flag = true
            if(now_num == 1){
                $(".first").css("cursor","not-allowed")
                $(".previous").css("cursor","not-allowed")
                first_flag = false
            } 
            if(now_num == allnum){
                $(".next").css("cursor","not-allowed")
                $(".last").css("cursor","not-allowed")
                last_flag = false
            }
                
            
            changePage(allnum)
            flowctrl(d.data.recordsFiltered)
        }else if (d.data.errCode == 40001) {
            window.location.href = "/view/admin_login/login.html";
        } else {
            createModalTips("初始化失败！" + errorTips(d.data.errMsg));
        }
    })
    initEvents_table()
}

//转时间戳
function changeTime(second_time){
    var time
    second_time = Number(second_time)
    if(!second_time){
        return ""
    }
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
    }else{
         time = "0分"+ second_time + "秒"
    }
    return time
}
