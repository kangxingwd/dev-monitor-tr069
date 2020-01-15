(function (root, undefined) {
    var cgicall = (function () {
        var version = "/api/v1/",
            token = $.cookie("token") ? "?token=" + $.cookie("token") : "?";

        function get() {
            var obj,
                url,
                objstr = "",
                argc = arguments.length,
                callfn = function (d, x, s) {};

            if (typeof (arguments[argc - 1]) === "function") {
                argc = argc - 1;
                callfn = arguments[argc];
            }

            if (argc == 2 && Object.prototype.toString.call(arguments[1]) === '[object Object]') {
                for (var k in arguments[1]) {
                    objstr += "&" + k + "=" + arguments[1][k];
                }
            }
            if(arguments[0].indexOf("?") > -1){
                url = version + arguments[0] 
            }else{
                url = version + arguments[0] + token + "&_=" + new Date().getTime() + objstr;
            }

            $.get(url, function (d, x, s) {
                d = initBackDatas(d);
                if (typeof d != "undefined" && typeof d.status != "undefined" && typeof d.data != "undefined" && d.status == 1 && d.data.errCode == 40001) {
                    window.location.href = "/view/admin_login/login.html";
                }
                callfn(d, x, s);
            }, "json");
        }

        function post() {
            var obj,
                url,
                argc = arguments.length,
                callfn = function (d, x, s) {};


            if (typeof (arguments[argc - 1]) === "function") {
                argc = argc - 1;
                callfn = arguments[argc];
            }

            if (argc == 2 && typeof arguments[1] === "object") {
                obj = arguments[1]
            } else {
                obj = {}
            }

            var sobj = {};
            for (var k in obj) {
                if (typeof obj[k] === "object") {
                    sobj[k] = JSON.stringify(obj[k]);
                } else {
                    sobj[k] = obj[k];
                }
            }

            url = version + arguments[0] + token;

            $.post(url, sobj, function (d, x, s) {
                d = initBackDatas(d);
                if (typeof d != "undefined" && typeof d.status != "undefined" && typeof d.data != "undefined" && d.status == 1 && d.data.errCode == 40001) {
                    window.location.href = "/view/admin_login/login.html";
                }
                callfn(d, x, s);
            }, "json");
        }

        function ajax() {
            var obj,
                url,
                argc = arguments.length,
                callfn = function (d, x, s) {};

            callfn = arguments[0].success;
            arguments[0].url = version + arguments[0].url + token;
            arguments[0].success = function (d, x, s) {
                d = initBackDatas(d);
                if (typeof d != "undefined" && typeof d.status != "undefined" && typeof d.data != "undefined" && d.status == 1 && d.data.errCode== 40001) {
                    window.location.href = "/view/admin_login/login.html";
                }
                callfn(d, x, s);
            }

            $.ajax(arguments[0]);
        }

        return {
            "get": get,
            "post": post,
            "ajax": ajax
        }
    }());

    function cgiDtUrl(str, obj) {
        var version = "/api/v1/",
            token = $.cookie("token") ? "&token=" + $.cookie("token") : "";

        if(str.indexOf("?")> -1){
            var url = version + (str || "") + "&_=" + new Date().getTime() + token;            
        }else{
            var url = version + (str || "") + "?_=" + new Date().getTime() + token;
        }
        return addUrlParam(url, obj);
    }

    function cgicallBack(d, success, fail) {
        var editModal,
            modal_true = false,
            modalId = "modal_tips",
            sfunc = success || function () {},
            ffunc = fail || function () {};

        $(".modal.in").each(function (index, element) {
            var id = $(element).attr("id");
            if (typeof id != "undefined") {
                modalId = id;
                modal_true = true;
                return false;
            }
        });

        editModal = $("#" + modalId);
        if (d.status == 0) {
            if (modal_true) {
                editModal.one("hidden.bs.modal", sfunc);
                editModal.modal("hide");
            } else {
                sfunc();
            }
        } else {
            if (modal_true) {
                editModal.one("hidden.bs.modal", ffunc);
                editModal.modal("hide");
            } else {
                ffunc();
            }
        }
    }

    function initBackDatas(obj) {
        var sobj = {};
        if (Object.prototype.toString.call(obj) === '[object Object]') {
            for (var k in obj) {
                var o;
                try {
                    if (typeof obj[k] === "object") {
                        throw new Error("");
                    } else if (!isNaN(obj[k])) {
                        throw new Error("");
                    } else {
                        o = JSON.parse(obj[k]);
                    }
                } catch (e) {
                    o = obj[k];
                    if (typeof o === "object") o = initBackDatas(o);
                }
                sobj[k] = o;
            }
        } else if (Object.prototype.toString.call(obj) === '[object Array]') {
            sobj = [];
            for (var i = 0, ien = obj.length; i < ien; i++) {
                var o;
                try {
                    if (typeof obj[i] === "object") {
                        throw new Error("");
                    } else if (!isNaN(obj[k])) {
                        throw new Error("");
                    } else {
                        o = JSON.parse(obj[i]);
                    }
                } catch (e) {
                    o = obj[i];
                    if (typeof o === "object") o = initBackDatas(o);
                }
                sobj.push(o)
            }
        } else {
            return obj;
        }
        return sobj;
    }

    function jsonTraversal(obj, func) {
        var oset = ObjClone(obj);
        for (var k in oset) {
            if (typeof (oset[k]) == 'object') {
                oset[k] = recurseTravSubNode(oset[k], k, func);
            } else {
                var fp = k;
                oset[k] = func(fp, oset[k]);
            }
        }
        return oset;
    }

    //遍历所有节点
    function recurseTravSubNode(o, parent, func) {
        var oset = ObjClone(o);
        for (var k in o) {
            var fp = parent + '__' + k;
            if (typeof (o[k]) == 'object') {
                //还有子节点.
                oset[k] = recurseTravSubNode(o[k], fp, func);

            } else {
                oset[k] = func(fp, o[k]);
            }
        }
        return oset;
    }

    /*
    	********
    	需要特殊处理的控件:checkbox, radio
    	不需要特殊处理的:text, texterea, select,
    	*********
    */
    function jsTravSet(fp, v) {
        var doc = getControlByIdMisc(fp),
            type = doc.attr('type');

        switch (type) {
            case "checkbox":
                var arr = doc.val().split(" ");
                var str = v.toString();

                if (str == arr[0]) {
                    doc.prop("checked", true);
                } else {
                    doc.prop("checked", false);
                }
                break;

            case "radio":
                var that = doc.attr("name");
                $('input:radio[name="' + that + '"]').each(function (index, element) {
                    if ($(element).val() == v) {
                        $(element).prop("checked", true);
                    } else {
                        $(element).prop("checked", false);
                    }
                });
                break;

            default:
                doc.val(v);
                break;
        }
        return v;
    }

    function jsTravGet(fp, v) {
        var nv,
            doc = getControlByIdMisc(fp),
            type = doc.attr('type'),
            dataType = doc.attr('data-type');

        switch (type) {
            case 'checkbox':
                var arr = doc.val().split(" ");
                var str = v.toString();


                if (arr.length == 1) {
                    if (arr[0] == "1") {
                        arr[1] = "0";
                    } else if (arr[0] == "true") {
                        arr[1] = "false";
                    } else {
                        console.log(fp + 'checkbox value fail');
                    }
                }

                if (typeof v == "boolean") {
                    arr[0] = true;
                    arr[1] = false;
                } else if (typeof v == "number") {
                    arr[0] = parseInt(arr[0]);
                    arr[1] = parseInt(arr[1]);
                }

                nv = doc.is(":checked") ? arr[0] : arr[1];
                break;

            case 'radio':
                var that = doc.attr("name");
                nv = $('input:radio[name="' + that + '"]:checked').val();
                if (typeof v == "number") {
                    nv = parseInt(nv);
                }
                break;

            default:
                if (dataType) {
                    nv = _IP.ipFormat(doc.val());
                } else {
                    nv = doc.val();
                }
                break;
        }

        nv = (typeof (nv) == 'undefined' ? v : nv);

        if (typeof (v) == 'number') {
            nv = parseInt(nv);
        };
        return nv;
    }


    function getControlByIdMisc(id) {
        //优先尝试input类型,其次select,再次ID.
        var id = id.replace(/\//g, '-'),
            id = id.replace(/\:/g, '_');
        res = $('input#' + id);

        if (res.length < 1) {
            res = $('select#' + id);
        }
        if (res.length < 1) {
            res = $('#' + id);
        };
        return res;
    }

    function ObjCountLength(o) {
        var t = typeof o;
        if (t == 'string') {
            return o.length;
        } else if (t == 'object') {
            var n = 0;
            for (var i in o) {
                n++;
            }
            return n;
        }
        return false;
    }

    function ObjClone(obj) {
        var o;
        if (typeof obj == "object") {
            if (obj === null) {
                o = null;
            } else {
                if (obj instanceof Array) {
                    o = [];
                    for (var i = 0, len = obj.length; i < len; i++) {
                        o.push(ObjClone(obj[i]));
                    }
                } else {
                    o = {};
                    for (var j in obj) {
                        o[j] = ObjClone(obj[j]);
                    }
                }
            }
        } else {
            o = obj;
        }
        return o;
    }

    function dtObjToArray(o) {
        var arr = [],
            obj = ObjClone(o);

        if (typeof obj == 'object') {
            if (Object.prototype.toString.call(obj) === '[object Array]') {
                arr = obj;
            } else if (Object.prototype.toString.call(obj) === '[object Object]') {
                for (key in obj) {
                    arr.push(obj[key]);
                }
            } else {
                arr.push(obj);
            }
        } else {
            arr.push(obj);
        }
        return arr;
    }

    function dtReloadData(table, bool, func) {
        var callback = null;
        if (typeof func == "function") {
            callback = func;
        }
        table.api().ajax.reload(callback, bool); //false 保存分页
    }

    function dtRrawData(table, data) {
        table.api().clear().draw();
        if (ObjCountLength(data) == 0) return;
        table.api().rows.add(dtObjToArray(data)).draw();
    }

    function dtHideColumn(table, hd) {
        table.api().columns().visible(true);
        for (var i = 0; i < hd.length; i++) {
            var num = parseInt(hd[i]);
            if (num < 0) continue;
            var column = table.api().column(num);
            column.visible(false);
        }
    }

    function dtGetSelected(table) {
        var arr = [];
        var drows = table.api().rows(".row_selected").data();
        for (var i = 0; i < drows.length; i++) {
            arr.push(drows[i])
        }
        return arr;
    }

    function dtSelectAll(that, table, currentPage) {
        var check = $(that).is(":checked");
        if (currentPage) {
            var drows = table.api().rows().nodes();
            for (var i = 0; i < drows.length; i++) {
                var _this = $(drows[i]);
                if (_this.find('td input[type="checkbox"]').is(":disabled")) continue;
                _this.find('td input[type="checkbox"]').prop("checked", check);
                row_select_event(_this);
            };
        } else {
            //默认只选中当前显示部分，后台分页时无法获取数据
            table.find('tbody tr').each(function (index, element) {
                var row = $(element);
                if (row.find('td input[type="checkbox"]').is(":disabled")) return true;
                row.find('td input[type="checkbox"]').prop("checked", check);
                row_select_event(row);
            });
        }
    }

    function dtDataCallback(d) {
        var data = initBackDatas(d);
        if (data.status == 0 && data.data != "undefined") {
            return dtObjToArray(data.data);

        } else if (data.data.errCode == 40001) {
            window.location.href = "/view/admin_login/login.html";

        }
        return [];

    }

    function dtBindRowSelectEvents(row) {
        var that = $(row);
        that.find('td input[type="checkbox"]').off('click', function () {
            row_select_event(that)
        });
        that.find('td input[type="checkbox"]').on('click', function () {
            row_select_event(that)
        });
    }

    function row_select_event(that) {
        if (that.find('td input[type="checkbox"]').is(":checked")) {
            that.addClass("row_selected");
        } else {
            that.removeClass("row_selected");
        }
    }

    function createModalTips(tip, e) {
        $("#modal_tips .modal-p span").html(tip);
        $("#modal_tips .modal-footer .btn-modal").remove();

        if (typeof (e) != "undefined") {
            var input = '<input type="button" class="btn btn-zx btn-modal" onclick="' + e + '()" value="确定" />';
            $("#modal_tips .modal-footer").append(input);
        }
        $("#modal_tips").modal("show");
    }

    function addUrlParam(src, obj) {
        if (Object.prototype.toString.call(obj) === '[object Object]') {
            var str = "";
            for (var k in obj) {
                str += "&" + k + "=" + obj[k];
            }
            if (src.indexOf("?") > -1) {
                src += str;
            } else {
                src += "?" + str.substring(1);
            }
        }

        return src;
    }

    function setUrlParam(src, key, val) {
        var reg = eval('/(' + key + '=)([^&]*)/gi');
        var nUrl = src.replace(reg, key + '=' + val);
        return nUrl;
    }

    function getUrlParam(src, val) {
        var reg = new RegExp("(^|\\?|&)" + val + "=([^&#]*)(\\s|&|$|#)", "i");
        if (reg.test(src)) return unescape(RegExp.$2);
        return "";
    }

    function LWsort(arr) {
        var lan = [],
            wan = [],
            newarr = [],
            lanN = [],
            wanN = [],
            longstr = {};
        for (var k in arr) {
            if (arr[k].length > 5) {
                if (longstr[arr[k].length] == undefined) {
                    longstr[arr[k].length] = [arr[k]];
                } else {
                    longstr[arr[k].lenght].push(arr[k]);
                }
            } else {
                if (arr[k].indexOf('lan') > -1) {
                    if (arr[k] == 'lan') {
                        lanN.push(arr[k]);
                    } else {
                        lan.push(arr[k].split('lan')[1]);
                    }
                } else {
                    if (arr[k] == 'wan') {
                        wanN.push(arr[k]);
                    } else {
                        wan.push(arr[k].split('wan')[1]);
                    }
                }
            }
        }
        lan.sort(numsort);
        wan.sort(numsort);
        if (lanN.length > 0) {
            newarr.push(lanN[0]);
        }
        for (var m in lan) {
            var str = 'lan' + lan[m];
            newarr.push(str);
        }
        if (wanN.length > 0) {
            newarr.push(wanN[0]);
        }
        for (var n in wan) {
            var str = 'wan' + wan[n];
            newarr.push(str);
        }
        if (!$.isEmptyObject(longstr)) {
            for (var j in longstr) {
                longstr[j].sort(numsort);
                for (var l in longstr[j]) {
                    newarr.push(longstr[j][l]);
                }
            }
        }
        return newarr;
    }

    function numsort(a, b) {
        return a - b;
    }

    function arraySortObj(arr, property, str) {
        var sortArr = arr.sort(compareArrObj(property, str));
        return sortArr;
    }

    function compareArrObj(property, str) {
        return function (obj1, obj2) {
            var value1 = parseInt(obj1[property]) || parseInt(obj1[property].split(str)[1]);
            var value2 = parseInt(obj2[property]) || parseInt(obj2[property].split(str)[1]);
            if (!(value1 >= 0)) value1 = -1;
            if (!(value2 >= 0)) value2 = -1;
            return value1 - value2; // 升序
        }
    }

    function compareObjArr(first, second) {
        if (typeof first !== 'object' && typeof second !== 'object')
            return false;
        if (Object.prototype.toString.call(first) === '[object Array]' && Object.prototype.toString.call(second) === '[object Array]') {
            if (first.length !== second.length) {
                return false;
            }
        }
        for (var k in first) {
            if (second[k] == undefined)
                return false;
            if (typeof first[k] == 'object' && typeof second[k] == 'object') {
                if (!compareObjArr(first[k], second[k])) {
                    return false;
                }
            } else {
                if (first[k] !== second[k]) {
                    return false
                };
            }
        }
        return true;
    }

    function stopDefault(e) {
        if (e && e.preventDefault)
            e.preventDefault();
        else
            window.event.returnValue = false;

        return false;
    }

    Date.prototype.format = function (format) {
        var date = {
            "M+": this.getMonth() + 1,
            "d+": this.getDate(),
            "h+": this.getHours(),
            "m+": this.getMinutes(),
            "s+": this.getSeconds(),
            "q+": Math.floor((this.getMonth() + 3) / 3),
            "S+": this.getMilliseconds()
        };
        if (/(y+)/i.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
        for (var k in date) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
            }
        }
        return format;
    }

    /* cgi */
    root.cgicall = cgicall; //cgi
    root.cgiDtUrl = cgiDtUrl; //datatable的ajax的URL
    root.cgicallBack = cgicallBack; //回调
    root.initBackDatas = initBackDatas; //初始化回调数据
    root.jsonTraversal = jsonTraversal; //取值赋值入口
    root.jsTravGet = jsTravGet; //取值
    root.jsTravSet = jsTravSet; //赋值

    /* object */
    root.ObjCountLength = ObjCountLength; //对象长度
    root.ObjClone = ObjClone; //对象克隆
    root.createModalTips = createModalTips; //创建提示模态框
    root.addUrlParam = addUrlParam; //URL添加参数
    root.setUrlParam = setUrlParam; //URL设置参数
    root.getUrlParam = getUrlParam; //URL获取参数

    /* datatable */
    root.dtObjToArray = dtObjToArray; //对象强制转数组 去适应datatable
    root.dtReloadData = dtReloadData; //刷新datatable
    root.dtRrawData = dtRrawData; //重绘datatable
    root.dtHideColumn = dtHideColumn; //隐藏datatable列
    root.dtGetSelected = dtGetSelected; //获取datatable选中的列
    root.dtSelectAll = dtSelectAll; //选中所有datatable列
    root.dtBindRowSelectEvents = dtBindRowSelectEvents; //绑定选择事件
    root.dtDataCallback = dtDataCallback; //表格ajax回调

    /* sort*/
    root.LWsort = LWsort //lan和wan组合数组排序
    root.arraySortObj = arraySortObj //以数组内对象的某个属性排序
    /* 比较对象数组 */
    root.compareObjArr = compareObjArr //比较对象,数组的值是否相等
    /* 阻止a标签的跳转 */
    root.stopDefault = stopDefault
})(this);