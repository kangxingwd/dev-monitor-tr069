(function (root, undefined) {

	var lang = {
		//管理页面
		"invalid param": "参数非法",
		"redis error": "数据访问失败",
		"expire fail": "访问权限超时",
		"mysql error": "数据访问失败",
		"invalid ids": "非法ID",
		"invalid id": "非法ID",
		"tcp error": "查询失败",
		"miss password": "数据库错误",
		"invalid oldpassword": "旧密码错误",
		"closed": "通讯失败",
		"download fail": "下载失败",

		"dup username": "账号已存在",
		"invalid uid or dup username": "用户名已存在",
		"invalid version": "配置版本不一致",
		"downloading": "正在下载",

		"sql update fail": "数据库更新失败",
		"cannot upgrade": "请下载升级包后进行升级",
		"timeout": "请求超时",

		//认证
		"no such user": "用户不存在",
		"invalid password": "密码错误",
		"invalid user": "用户不存在",
		"invalid query": "参数不正确",
		"invalid extend": "请使用正常方式登陆"
	}

	var VerifyImplication = {
		"num_length": {
			method: function (val, min, max) {
				min = parseInt(min);
				max = parseInt(max);
				this.message = "只允许输入" + min + "~" + max + "位数字";
				var reg = new RegExp('^[0-9]{' + min + ',' + max + '}$', 'g');
				return reg.test(val);
			},
			message: "非法数字格式。"
		},
		"notspace": {
			method: function (val, num) {
				if (!checkNull(val, this, this.message)) return false;
				if (typeof num != 'object') {
					return ($.trim(val).length <= parseInt(num)) && $.trim(val) != "";
				}
				return $.trim(val) != "" ? true : false;
			},
			message: "非法格式。不能为空。"
		},
		"strlen": {
			method: function (val, from, to) {
				if (arguments.length < 4) {
					this.message = "输入" + from + "位字符";
					return $.trim(val).length == parseInt(from) ? true : false;
				} else {
					this.message = '长度范围' + from + '~' + to + '个字符';
					if ($.trim(val).length >= parseInt(from) && $.trim(val).length <= parseInt(to)) {
						return true;
					} else {
						return false;
					}
				}
			},
			message: "非法格式。"
		},
		"name": {
			method: function (val) {
				if (!checkNull(val, this, this.message)) return false;
				var len = 0;
				for (var i = 0; i < val.length; i++) {
					var c = val.charCodeAt(i);
					//单字节加1
					if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
						len++;
					} else {
						len += 3;
					}
				}
				var reg = /^[a-zA-Z0-9-_.\u4e00-\u9fa5]{1,32}$/;
				//				var mark = (reg.test(val)) ? true : false;
				if (len > 32) {
					this.message = "长度范围1~32个字符，不超过10个中文，一个中文占3个字符。"
					return false;
				} else if (!reg.test(val)) {
					this.message = "只能包含中文、数字、字母、‘-’、‘.’ 和下划线，不允许空格。"
					return false;
				} else {
					return true;
				}
			},
			message: "非法格式。"
		},
		"en_name": {
			method: function (val) {
				if (!checkNull(val, this, this.message)) return false;
				var reg = /^[a-zA-Z0-9-_.]{1,32}$/;
				return (reg.test(val)) ? true : false;
			},
			message: "非法格式。只能包含数字、字母、‘-’、‘.’ 和下划线，不允许空格。长度范围1~32个字符。"
		},


		"pwd": {
			method: function (val) {
				if (!checkNull(val, this, this.message)) return false;
				var reg = /^[0-9a-zA-Z_]{4,32}$/;
				return (reg.test(val)) ? true : false;
			},
			message: "非法格式。只能包含数字、字母和下划线。长度范围4~32个字符。"
		},
		"admin_usr": {
			method: function (val) {
				var reg = /^[0-9A-Za-z]+$/;
				return reg.test(val) ? true : false;
			},
			message: "非法格式。可能包含空格或特殊字符，只能输入数字和字母。"
		},
		"admin_pwd": {
			method: function (val) {
				var reg = /^[0-9a-zA-Z_]{5,16}$/;
				return reg.test(val) ? true : false;
			},
			message: "非法格式。只能包含数字、字母和下划线。长度范围5~16个字符。"
		},
		"account_usr": {
			method: function (val) {
				var reg = /^[a-z0-9A-Z_!@#$&\\\^<>\?\-\/\+\.\,]{1,20}$/;
				return reg.test(val);
			},
			message: "非法格式。输入数字、字母及特定字符（含英文格式下的!@#$&^<>_-\\+.,?/），不允许使用空格，长度1~20个字符。"
		},
		"account_pwd": {
			method: function (val) {
				var reg = /^[a-z0-9A-Z_!@#$&\\\^<>\?\-\/\+\.\,]{5,20}$/;
				return reg.test(val);
			},
			message: "非法格式。输入数字、字母及特定字符（含英文格式下的!@#$&^<>_-\\+.,?/），不允许使用空格，长度5~20个字符。"
		},
		"desc": {
			method: function (val) {
				if (!checkNull(val, this, this.message)) return false;
				var len = 0;
				for (var i = 0; i < val.length; i++) {
					var c = val.charCodeAt(i);
					//单字节加1
					if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
						len++;
					} else {
						len += 3;
					}
				}
				var reg = /^[a-zA-Z0-9-_\.@#!\u4e00-\u9fa5]{0,32}$/;
				if (len > 32) {
					this.message = "长度不超过32个字符或10个中文，一个中文占3个字符。"
					return false;
				} else if (!reg.test(val)) {
					this.message = "格式为中文、字母(大小写)、数字、‘-’、‘.’、‘@’、‘#’、‘！’和下划线，不允许空格"
					return false;
				} else {
					return true;
				}
			},
			message: "非法格式"
		},
		"password": {
			method: function (val) {
				var reg = /^[a-z0-9A-Z]{8,32}$/;
				return (reg.test(val)) ? true : false;
			},
			message: "非法格式。输入数字/字母，长度范围8~32个字符。"
		},
		"upload": {
			method: function () {
				if (!(typeof arguments[0] != "undefined" && arguments[0] != "")) return false;

				var arr = arguments[0].split(".");
				if (arr.length < 2) return false;
				var str = arr[arr.length - 1];
				var mark = false;
				for (var i = 1; i < arguments.length; i++) {
					if (str == arguments[i]) {
						mark = true;
					}
				}

				if (mark == true) {
					return true;
				} else {
					return false;
				}
			},
			message: "上传文件格式非法。"
		},
	}

	function errorTips(en) {
		var key;

		if (!en || typeof en !== "string") return "";
		key = $.trim(en);

		if (lang[key]) {
			return lang[key];
		} else {
			return en;
		}
	}

	function getVerifyObject(key) {
		var obj = VerifyImplication[key];
		if (typeof (obj) == "object" && obj.method) {
			return obj;
		} else {
			return null;
		}
	}

	function getVerfiyPars(doc, fla) {
		var verify = doc.attr('verify');
		if (doc.is(":disabled") && typeof fla == "undefined") {
			doc.closest(".form-group").removeClass('has-error');
			return null;
		}
		if (typeof (verify) != "string") {
			return null;
		}
		return verify.split(' ');
	}

	function rmModaltip(el) {
		var hid = "";
		$("body > .modal").each(function (index, element) {
			if ($(element).is(":visible")) {
				hid = $(element).attr("id");
				return false;
			}
		});

		if (hid != "") {
			var that = $("#" + hid + " .tip");
			if (that.length > 0) {
				var tip = el.closest(".form-group").find("label.control-label").html();
				var tip2 = that.html();
				if (tip2.indexOf(tip) > 0) {
					that.html("");
				}
			}
		}
	}


	function checkNull(v, o, mes) {
		if ($.trim(v) === 'null') {
			o.message = '非法格式，请勿输入"null"。';
			return false;
		} else {
			o.message = mes;
			return true;
		}
	}

	var verifyModalTip = function (h, t) {
		var tips;
		if (typeof h == "undefined") return false;
		if (typeof t != "undefined") {
			tips = h + " " + t;
		} else {
			tips = h;
		}

		var hmark = true;
		var hid = "";
		$("body > .modal").each(function (index, element) {
			if ($(element).is(":visible")) {
				hmark = false;
				hid = $(element).attr("id");
				return false;
			}
		});
		if (hmark && $("body > .modal-backdrop").length == 0 && Object.prototype.toString.call(createModalTips) === "[object Function]") {
			createModalTips(tips);
		} else if (typeof hid != "undefined" && hid != "" && $("#" + hid + " .tip").length > 0) {
			$("#" + hid + " .tip").html("<span title='" + tips + "'><i class='icon-remove-sign'></i> " + tips + "</span>");
		} else {
			alert(tips);
		}
		return false;
	}

	var verification = function (doc) {
		var res = true;
		if (!doc) doc = "body";

		$('input,textarea', doc).each(function () {
			var key,
				pars,
				obj;

			pars = getVerfiyPars($(this));
			if (!pars || pars.length < 1) {
				return true;
			}

			key = pars[0];
			obj = getVerifyObject(key);

			if (obj && obj.method) {
				pars[0] = $(this).val();
				pars.push(this);
				res = obj.method.apply(obj, pars);
				if (res != true) {
					var tips = "",
						mtip = "",
						tab_pane = $(this).closest(".tab-pane"),
						tip = $(this).closest("div").find("label").html() || "";
					// tip = $(this).closest("label").html() || "";
					// tip = $(this).closest(".form-group").find("label.control-label").html() || "";

					if (tab_pane.length > 0 && typeof tab_pane.attr("data-mtip") != "undefined") {
						mtip = tab_pane.attr("data-mtip") + "的";
					}

					$(this).closest(".form-group").addClass('has-error');

					verifyModalTip(mtip + tip + "：", obj.message);
					return false;
				} else {
					$(this).closest(".form-group").removeClass('has-error');
					rmModaltip($(this));
				}
			}
		});

		return res;
	}

	var verifyEventsInit = function (doc) {
		var res = true;
		if (!doc) doc = "body";

		$("input[type='radio'], input[type='checkbox'], select", doc).on("change", function () {
			var that = this;
			setTimeout(function () {
				$(that).closest("form").find("input, textarea").each(function (index, element) {
					if ($(element).is(":disabled") && $(element).closest(".form-group").length > 0 && $(element).closest(".form-group").hasClass("has-error")) {
						$(element).closest(".form-group").removeClass("has-error");
						rmModaltip($(element));
					}
				});
			}, 150);
		});

		$('input, textarea', doc).each(function () {
			var key,
				pars,
				obj,
				that = this;

			pars = getVerfiyPars($(that), true);
			if (!pars || pars.length < 1) {
				return true;
			}

			key = pars[0];
			obj = getVerifyObject(key);
			if (obj && obj.method) {
				$(that).on("blur keyup", function (e) {
					if (e.type == "keyup" && !$(that).closest(".form-group").hasClass("has-error")) return false;
					pars[0] = $(that).val();
					if (pars[pars.length - 1] !== that) {
						pars.push(that);
					}
					res = obj.method.apply(obj, pars);
					if (res != true) {
						$(that).closest(".form-group").addClass('has-error');
					} else {
						$(that).closest(".form-group").removeClass('has-error');
						rmModaltip($(that));
					}
				});
			}
		});
	}

	root.verification = verification; //直接显示调用
	root.verifyEventsInit = verifyEventsInit; //事件绑定触发方式调用
	root.verifyModalTip = verifyModalTip; //alert提示
	root.errorTips = errorTips; //提示中文化
})(this);