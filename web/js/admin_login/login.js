$(function () {
    getCookies();
    initEvents();
    verifyEventsInit();
    createInitModal();
})

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}

function initEvents() {
    $(".submit").on("click", onSubmit);
    $("#password").keypress(function (event) {
        if (event.which === 13) {
            onSubmit();
        }
    });
}

function getCookies() {
    var user = $.cookie("login_user");
    if (typeof user != "undefined") {
        $("#username").val(user);
    }
}

function onSubmit() {
    if (!verification()) return;
    var username = $("#username").val(),
        password = $("#password").val(),
        obj = {
            username: username,
            password: password
        };
    cgicall.post("account/login", obj, function (d) {
        if (d.status == 0) {
            //d.status == 0 && typeof d.data == "object" && typeof d.data.token != "undefined" && typeof d.data.refresh != "undefined"
            $.cookie('token', d.data.token, {
                path: "/"
            });
            $.cookie('level', d.data.level, {
                path: "/"
            });
            // $.cookie('refresh', d.data.refresh, {
            //     path: "/"
            // });

            $.cookie('login_user', username, {
                expires: 7,
                path: "/"
            });
            $.cookie('login_pwd', '', {
                expires: -1,
                path: "/"
            });
            window.location.href = '../../view/admin_status/index.html';
        } else {
            createModalTips("登录失败！" + errorTips(d.data.errMsg));
        }
    });
}