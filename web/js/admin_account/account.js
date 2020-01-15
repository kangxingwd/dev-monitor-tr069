$(function () {
    verifyEventsInit();
    initEvents();
    createInitModal();
});

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}

function initData() {
    $("#opwd, #pwd, #apwd").val("");
}

function initEvents() {
    $(".submit").on("click", OnSubmit);
    $("#oimg").on("click",showPwd)
    $("#img").on("click",showPwd)
    $("#aimg").on("click",showPwd)
}
function showPwd() {
    let id = $(this)[0].id
    let name = ""
    let img_id = ""
    if(id === "oimg"){
        name = "#opwd"
        img_id = "#oimg"
    }else if(id === "img"){
        name = "#pwd"
        img_id = "#img"
    }else{
        name = "#apwd"
        img_id = "#aimg"
    }
    if($(name).prop("type") === "password"){
        $(name).prop("type","text")
        $(img_id).prop("src","../../images/open-eye.png")
    }else{
        $(name).prop("type","password")
        $(img_id).prop("src","../../images/close-eye.png")        
    }
}

function OnSubmit() {
    if (!verification()) return;
    var obj,
        opwd = $("#opwd").val(),
        pwd = $("#pwd").val(),
        apwd = $("#apwd").val();

    if (opwd == pwd) {
        createModalTips("新密码与原密码输入一致，请重新输入！");
        return;
    }

    if (pwd != apwd) {
        createModalTips("新密码输入不一致，请重新输入！");
        return;
    }
    obj = {
        "option":"change_passwd",
        data:{
            "old_passwd": opwd,
            "new_passwd": pwd
        }
    }
    // cgicall.post("account", obj, function (d) {
    //     if (d.status == 0) {
    //         createModalTips("保存成功！");
    //         // $.cookie('md5psw', d.data, {
    //         //     path: "/"
    //         // });
    //         initData();
    //         window.location.href = "/view/admin_login/login.html";
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
            if (d.status == 0) {
                createModalTips("保存成功！");
                // $.cookie('md5psw', d.data, {
                //     path: "/"
                // });
                initData();
                window.location.href = "/view/admin_login/login.html";
            } else {
                createModalTips("保存失败！" + errorTips(d.data.errMsg));
            }
        }
    })
}