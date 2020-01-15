var oTabFlow,route,now_num,now_size, obj;

$(function () {
    route = window.location.href.split("?")[1]
    // if(route.split("&").length > 2){
    //     route_flag = true
    // }else{
    //     route_flag = false
    // }
    now_num = route.split("&")[0].split("=")[1]
    now_size = route.split("&")[1].split("=")[1]
    verifyEventsInit();
    oTabFlow = createDtFlow();
    createInitModal();
});
function initDataTab(){
    window.location.href = window.location.href
}
//跳转页面函数
function toRoute(num,size){
    window.location.href = '/view/admin_status/task.html?pageNumber='+num+'&pageSize='+size
}
function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}
//跳转到任务详情
function toTasks(that){
    let id = $(that).attr("data-msg")
    window.location.href = "../admin_status/taskdetail.html?"+ id
}

function initEvents_table() {
    $('#tableSeach').bind('input propertychange', function (d) {
        // d.api().search($("#tableSeach").val()).draw();
        console.log($('#tableSeach').val())
        let val = $('#tableSeach').val()
        let len = obj.length
        for(let i=0;i<len; i++){
            $(".filter").eq(i).css("display","")            
            if(obj[i].batchTaskName.indexOf(val) == -1&& obj[i].taskArgs.indexOf(val) == -1&&obj[i].taskType.indexOf(val) == -1){
                $(".filter").eq(i).css("display","none")
            }
        }
    })
}

function tabDelete(that) {
    batch_name = $(that).attr("data-msg1");
    batch_task_id = $(that).attr("data-msg2");
    createModalTips("确定删除该项任务吗？", "TabDelete");
}
function TabDelete() {
    //批量删除任务
    let url = "batchTasks/" + batch_task_id
    cgicall.ajax({
        url: url,
        type:"delete",
        success:function(d){
            if(d.status === 0){
                $("#modal_spin").modal("hide");
                createModalTips("删除成功！");
                setTimeout(()=>{

                    initDataTab();
                },500)
            }else{
                $("#modal_spin").modal("hide")
                createModalTips("删除失败！" + errorTips(d.data.errMsg));
            }
        }
    })
 
}

//筛选任务
function toOverview(that) {
    var batch_name = $(that).attr("data-msg1");
    var task_status = $(that).attr("data-msg2");
    window.location.href = "../admin_status/taskdetail.html?"+batch_name+"&"+task_status
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
        // window.location.href = '/view/admin_status/overview.html?pageNumber='+now_num+'&pageSize='+size
        toRoute(now_num,size)
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
//创建表格
function createDtFlow(){
    let k = (now_num-1)*now_size + 1 //序号
    let data = {
        "pageNumber":now_num,
        "pageSize":now_size,
    } //分页请求数据
    cgicall.get("batchTasks",data,function(d){
        if(d.status == "0"){
            obj = d.data.batchTasks
            var change_lan = function(d) {
                    if(d === "custom"){
                        return "自定义"
                    }else if(d === "linkAccess"){
                        return "访问链接"
                    }else if(d === "upgrade"){
                        return "升级"
                    }  
            }
            for(let item of obj){
                var html ='<tr class= "filter"><td>'+k+'</td><td>'+item.batchTaskName+'</td><td>'+change_lan(item.taskType)+'</td><td>'+item.taskArgs+'</td><td>'+item.total+'</td><td><div class="btn-group btn-group-xs"><a class="btn btn-zx blueBtnT" data-msg1="' + item.batchTaskId + '" data-msg2="2"  onclick="toOverview(this);">'+item.unfinished+'</a></div></td><td><div class="btn-group btn-group-xs"><a class="btn btn-zx blueBtnT" data-msg1="' + item.batchTaskId + '" data-msg2="0"  onclick="toOverview(this);">' + item.finished + '</a></div></td><td><div class="btn-group btn-group-xs"><a class="btn btn-zx blueBtnT" data-msg1="' + item.batchTaskId + '" data-msg2="1"  onclick="toOverview(this);">' + item.failed + '</a></div></td><td>'+item.createTime+'</td><td><div class="btn-group btn-group-xs"><a data-msg="' + item.batchTaskId + '"  onclick="toTasks(this);"><img src="../../images/edit.png" title="任务详情" alt="" class="left"></a><a data-msg1="' + item.batchTaskName + '" data-msg2="' + item.batchTaskId + '" onclick="tabDelete(this);"><img src="../../images/delete.png" title="删除" alt=""></a></div></td></tr>' 
                $("#table_flowctrl").append(html)
                k++
            }
            let allnum = d.data.totalPages //总页数
            if(allnum == 2){
                $(".active").eq(1).css({"display":"inline","margin-right":"-4px"})
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
            flowctrl(d.data.recordsTotal)
        }else if (d.data.errCode == 40001) {
            window.location.href = "/view/admin_login/login.html";
        } else {
            createModalTips("初始化失败！" + errorTips(d.data.errMsg));
        }
    })
    initEvents_table()
}