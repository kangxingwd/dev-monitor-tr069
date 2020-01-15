       $(function () {
           initData();
           createInitModal();
       })


       function createInitModal() {
           $("#modal_spin, #modal_tips,#modal_edit").modal({
               "backdrop": "static",
               "show": false
           });
       }

       function initData() {
           cgicall.get("devices/dev_num", {}, function (d) {
               if (d.status == 0) {
                   pie(d.data.dev_info);
               } else {
                   createModalTips("初始化失败！" + errorTips(d.data.errMsg));
               }
           })
       }

       function pie(data) {
           var dom = document.getElementById("container");
           var myChart = echarts.init(dom);
           var option = null;
           myChart.on('click', function (params) {
               var online;
               if (params.name == '在线') {
                   online = 1;
               } else if (params.name == '离线') {
                   online = 0;
               }
               window.location.href = '/view/admin_status/overview.html?pageNumber=1&pageSize=10&query={"status":'+online+'}';
           });
           option = {
               title: {
                   text: '全部设备',
                   x: 'center',
               },
               tooltip: {
                   trigger: 'item',
                   formatter: "{a} <br/>{b} : {c} ({d}%)"
               },
               legend: {
                   top: 70,
                   itemWidth: 40,
                   itemHeight: 18,
                   itemGap: 65,
                   data: ['在线', '离线']
               },
               series: [{
                   name: '设备',
                   type: 'pie',
                   radius: '55%',
                   center: ['50%', '52%'],
                   label: {
                       normal: {
                           show: false
                       },
                       emphasis: {
                           show: false
                       }
                   },
                   data: [{
                           value: data.online,
                           name: '在线'
                       },
                       {
                           value: data.offline,
                           name: '离线'
                       }
                   ],
                   color: ['#20DB86', '#D2E7DF'],
                   itemStyle: {
                       emphasis: {
                           shadowBlur: 10,
                           shadowOffsetX: 0,
                           shadowColor: 'rgba(0, 0, 0, 0.5)'
                       },
                       normal: {
                           label: {
                               show: false //隐藏标示文字
                           },
                           labelLine: {
                               show: false //隐藏标示线
                           }
                       }
                   },
               }]
           };
           if (option && typeof option === "object") {
               myChart.setOption(option, true);
           }
       }