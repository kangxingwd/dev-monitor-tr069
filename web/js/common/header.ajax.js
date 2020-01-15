$.ajax("../admin_header/sidebar.html", {
    type: "GET",
    dataType: "html",
    async: false,
    cache: false,
    error: function () {
        console.log("error ajax sidebar.html!")
    },
    success: function (data, textStatus, jqXHR) {
        $("#header").html(data);
    },
    complete: function (jqXHR, textStatus) {}
});