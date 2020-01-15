//  var pUser //保存第一个代理商
 $(function () {
     verifyEventsInit();
     initData();
     createInitModal();
     initEvents();
 })

 function createInitModal() {
     $("#modal_spin, #modal_tips,#modal_edit").modal({
         "backdrop": "static",
         "show": false
     });
 }

 function initEvents() {
     $("#file_content").on("change", function () {
         $("#input-cover").html('未选择文件');
         $("#input-cover").html(document.getElementById("file_content").files[0].name);
     })
 }

 function initData() {
     cgicall.get("account/proxy_user", function (d) {
         if (d.status == 0) {
            //  pUser = d.data.proxy_user[0]
             for (var i = 0; i < d.data.proxy_user.length; i++) {
                 var html = '<option value="' + d.data.proxy_user[i] + '">' + d.data.proxy_user[i] + '</option>'
                 $("#proxy_user").append(html);
             }
         } else {
             createModalTips("初始化失败！" + errorTips(d.data.errMsg));
         }
     })
 }

 function fixdata(data) { //文件流转BinaryString
     var o = "",
         l = 0,
         w = 10240;
     for (; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
     o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
     return o;
 }



 function DoSave() {
     if (!verification()) return;
     var selectedFile = document.getElementById("file_content").files[0];
     var reader = new FileReader();
     var account = $("#proxy_user").val();
     //  reader.readAsBinaryString(selectedFile);
     reader.readAsArrayBuffer(selectedFile);
     reader.onload = function (e) {
         var data = e.target.result;
         var workbook = XLSX.read(btoa(fixdata(data)), {
             type: 'base64'
         })
         var json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
         var devices = [];
         for (var i = 0; i < json.length; i++) {
             devices.push(json[i]["dev id（请勿删除此行， 下面填写设备ID）"]);
         }
         var obj = {
             "account": account,
             "devices": devices
         }
        //  cgicall.post('account/dev_alloc', obj,
        //      function (d) {
        //          if (d.status == 0) {
        //              createModalTips("保存成功！");
        //              $("#file_content").val('');
        //              $("#proxy_user").val('admin');
        //          } else {
        //              createModalTips("保存失败！" + errorTips(d.data.errMsg));
        //          }
        //          $("#input-cover").html('未选择文件');
        //      });
        cgicall.ajax({
            url:"account/dev_alloc",
            contentType : "application/json",
            type:"POST",
            data:JSON.stringify(obj),
            success:function(d){
                if(d.status === 0){
                    createModalTips("保存成功！");
                    $("#file_content").val('');
                    $("#input-cover").html("未选择文件")
                    // $("#proxy_user").val(pUser);
                }else{
                    createModalTips("保存失败！" + errorTips(d.data.errMsg));
                }
            }
        })
     };
 }