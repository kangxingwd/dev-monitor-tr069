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
           //    $("#modal_spin .modal-body p").html("数据正在加载！<br>请稍候...");
           //    $("#modal_spin").modal("show");
           cgicall.get("devMap", function (d) {
               if (d.status == 0) {
                   map(d.data.address);
               } else {
                   createModalTips("初始化失败！" + errorTips(d.data.errMsg));
               }
           })
       }

       function map(data) {

           var lbsdata = [];
           var geoCoordMap = {};
           var len = data.length;
           for (var i = 0; i < len; i++) {
               var data_item = {
                   name: data[i].dev_site,
                   value: data[i].dev_count
               };
               lbsdata.push(data_item);
               geoCoordMap[data[i].dev_site] = [data[i].lng, data[i].lat];
           }

           var myChart = echarts.init(document.getElementById('container'));

           var convertData = function (data) {
               var res = [];
               for (var i = 0; i < data.length; i++) {
                   var geoCoord = geoCoordMap[data[i].name];
                   if (geoCoord) {
                       res.push({
                           "name": data[i].name,
                           "value": geoCoord.concat(data[i].value)
                       });
                   }
               }
               return res;
           };
           option = {
               backgroundColor: '#404a59',
               title: {
                   text: '设备分布图',
                   subtext: '',
                   left: 'center',
                   textStyle: {
                       color: '#fff'
                   }
               },
               tooltip: {
                   trigger: 'item',
                   formatter: function (params) {
                       return params.name + ' : ' + params.value[2];
                   }
                   //    formatter: '{a0}<br />{b0}: {c0}'
               },
               legend: {
                   orient: 'vertical',
                   y: 'bottom',
                   x: 'right',
                   data: ['设备分布'],
                   textStyle: {
                       color: '#fff'
                   }
               },
               geo: {
                   map: 'china',
                   label: {
                       emphasis: {
                           show: false
                       }
                   },
                   roam: true,
                   itemStyle: {
                       normal: {
                           areaColor: '#323c48',
                           borderColor: '#111'
                       },
                       emphasis: {
                           areaColor: '#2a333d'
                       }
                   }
               },
               //    bmap: {
               //        center: [104.114129, 37.550339],
               //        zoom: 5,
               //        roam: true,
               //        mapStyle: {
               //            styleJson: [{
               //                    "featureType": "water",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "color": "#044161"
               //                    }
               //                },
               //                {
               //                    "featureType": "land",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "color": "#004981"
               //                    }
               //                },
               //                {
               //                    "featureType": "boundary",
               //                    "elementType": "geometry",
               //                    "stylers": {
               //                        "color": "#064f85"
               //                    }
               //                },
               //                {
               //                    "featureType": "railway",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "highway",
               //                    "elementType": "geometry",
               //                    "stylers": {
               //                        "color": "#004981"
               //                    }
               //                },
               //                {
               //                    "featureType": "highway",
               //                    "elementType": "geometry.fill",
               //                    "stylers": {
               //                        "color": "#005b96",
               //                        "lightness": 1
               //                    }
               //                },
               //                {
               //                    "featureType": "highway",
               //                    "elementType": "labels",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "arterial",
               //                    "elementType": "geometry",
               //                    "stylers": {
               //                        "color": "#004981"
               //                    }
               //                },
               //                {
               //                    "featureType": "arterial",
               //                    "elementType": "geometry.fill",
               //                    "stylers": {
               //                        "color": "#00508b"
               //                    }
               //                },
               //                {
               //                    "featureType": "poi",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "green",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "color": "#056197",
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "subway",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "manmade",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "local",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "arterial",
               //                    "elementType": "labels",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                },
               //                {
               //                    "featureType": "boundary",
               //                    "elementType": "geometry.fill",
               //                    "stylers": {
               //                        "color": "#029fd4"
               //                    }
               //                },
               //                {
               //                    "featureType": "building",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "color": "#1a5787"
               //                    }
               //                },
               //                {
               //                    "featureType": "label",
               //                    "elementType": "all",
               //                    "stylers": {
               //                        "visibility": "off"
               //                    }
               //                }
               //            ]
               //        }
               //    },
               series: [{
                       name: '设备分布',
                       type: 'scatter',
                       coordinateSystem: 'geo',
                       data: convertData(lbsdata),
                       symbolSize: function () {
                           return 6;
                       },
                       label: {
                           normal: {
                               formatter: '{b}',
                               position: 'right',
                               show: false
                           },
                           emphasis: {
                               show: true
                           }
                       },
                       itemStyle: {
                           normal: {
                               color: '#ddb926'
                           }
                       }
                   },
                   {
                       name: 'TOP5',
                       type: 'effectScatter',
                       coordinateSystem: 'geo',
                       data: convertData(lbsdata.sort(function (a, b) {
                           return b.value - a.value;
                       }).slice(0, 5)),
                       symbolSize: function () {
                           return 8
                       },
                       showEffectOn: 'render',
                       rippleEffect: {
                           brushType: 'stroke'
                       },
                       hoverAnimation: true,
                       label: {
                           normal: {
                               formatter: '{b}',
                               position: 'right',
                               show: true
                           }
                       },
                       itemStyle: {
                           normal: {
                               color: '#f4e925',
                               shadowBlur: 10,
                               shadowColor: '#333'
                           }
                       },
                       zlevel: 1
                   }
               ]
           };

           if (option && typeof option === "object") {
               myChart.setOption(option, true);
               //    $("#modal_spin").modal("hide");
           }
       }