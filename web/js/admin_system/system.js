$(function () {
    initData();
    createInitModal();
});

function createInitModal() {
    $("#modal_spin, #modal_tips,#modal_edit").modal({
        "backdrop": "static",
        "show": false
    });
}

function initData() {
    cgicall.get("system", function (d) {
        if (d.status == 0) {
            $("#version").html(d.data.system_info.soft_version);
            $("#cpu").html(d.data.system_info.cpu);
            $("#mem").html(d.data.system_info.mem);
        } else {
            createModalTips("初始化失败！" + errorTips(d.data.errMsg));
        }
    })
}