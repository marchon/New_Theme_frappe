// Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
// MIT License. See license.txt

// new 
$(document).ready(function() {
	frappe.assets.check();
	frappe.provide('frappe.app');
	$.extend(frappe.app, new frappe.Application());
});

frappe.Application = Class.extend({
	init: function() {
		this.load_startup();
	},

	load_startup: function() {
		var me = this;
		if(window.app) {
			return frappe.call({
				method: 'startup',
				callback: function(r, rt) {
					frappe.provide('frappe.boot');
					frappe.boot = r;
					if(frappe.boot.user.name==='Guest' || frappe.boot.user.user_type==="Website User") {
						window.location = 'index';
						return;
					}
					me.startup();
				}
			});
		} else {
			this.startup();
		}
	},
	startup: function() {
		// load boot info
		this.load_bootinfo();

		if(user!="Guest") this.set_user_display_settings();

		// navbar
		this.make_nav_bar();

		// favicon
		this.set_favicon();

		this.setup_keyboard_shortcuts();

		// control panel startup code
		this.run_startup_js();


		if(frappe.boot) {
			if(localStorage.getItem("session_lost_route")) {
				window.location.hash = localStorage.getItem("session_lost_route");
				localStorage.removeItem("session_lost_route");
			}

		}

		// page container
		this.make_page_container();

		// route to home page
		frappe.route();

		// trigger app startup
		$(document).trigger('startup');

		this.start_notification_updates();

		$(document).trigger('app_ready');
	},

	set_user_display_settings: function() {
		frappe.ui.set_user_background(frappe.boot.user.background_image, null,
			frappe.boot.user.background_style);
	},

	load_bootinfo: function() {
		if(frappe.boot) {
			frappe.modules = frappe.boot.modules;
			this.check_metadata_cache_status();
			this.set_globals();
			this.sync_pages();
			if(frappe.boot.timezone_info) {
				moment.tz.add(frappe.boot.timezone_info);
			}
			if(frappe.boot.print_css) {
				frappe.dom.set_style(frappe.boot.print_css)
			}
		} else {
			this.set_as_guest();
		}
	},

	check_metadata_cache_status: function() {
		if(frappe.boot.metadata_version != localStorage.metadata_version) {
			localStorage.clear();
			console.log("Cleared Cache - New Metadata");
			frappe.assets.init_local_storage();
		}
	},

	start_notification_updates: function() {
		var me = this;
		setInterval(function() {
			me.refresh_notifications();
		}, 30000);

		// first time loaded in boot
		$(document).trigger("notification-update");

		// refresh notifications if user is back after sometime
		$(document).on("session_alive", function() {
			me.refresh_notifications();
		})
	},

	refresh_notifications: function() {
		if(frappe.session_alive) {
			return frappe.call({
				method: "frappe.core.doctype.notification_count.notification_count.get_notifications",
				callback: function(r) {
					if(r.message) {
						$.extend(frappe.boot.notification_info, r.message);
						$(document).trigger("notification-update");
					}
				},
				no_spinner: true
			});
		}
	},

	set_globals: function() {
		// for backward compatibility
		user = frappe.boot.user.name;
		user_fullname = frappe.user_info(user).fullname;
		user_defaults = frappe.boot.user.defaults;
		user_roles = frappe.boot.user.roles;
		user_email = frappe.boot.user.email;
		sys_defaults = frappe.boot.sysdefaults;
	},
	sync_pages: function() {
		// clear cached pages if timestamp is not found
		if(localStorage["page_info"]) {
			frappe.boot.allowed_pages = [];
			page_info = JSON.parse(localStorage["page_info"]);
			$.each(frappe.boot.page_info, function(name, p) {
				if(!page_info[name] || (page_info[name].modified != p.modified)) {
					delete localStorage["_page:" + name];
				}
				frappe.boot.allowed_pages.push(name);
			});
		} else {
			frappe.boot.allowed_pages = keys(frappe.boot.page_info);
		}
		localStorage["page_info"] = JSON.stringify(frappe.boot.page_info);
	},
	set_as_guest: function() {
		// for backward compatibility
		user = {name:'Guest'};
		user = 'Guest';
		user_fullname = 'Guest';
		user_defaults = {};
		user_roles = ['Guest'];
		user_email = '';
		sys_defaults = {};
	},
	make_page_container: function() {
		if($("#body_div").length) {
			$(".splash").remove();
			frappe.temp_container = $("<div id='temp-container' style='display: none;'>")
				.appendTo("body");
			frappe.container = new frappe.views.Container();
		}
	},
	make_nav_bar: function() {
		// toolbar
		if(frappe.boot) {
			frappe.frappe_toolbar = new frappe.ui.toolbar.Toolbar();
		}
	},
	logout: function() {
		var me = this;
		me.logged_out = true;
		return frappe.call({
			method:'logout',
			callback: function(r) {
				if(r.exc) {
					console.log(r.exc);
					return;
				}
				me.delete_cookies();
				me.redirect_to_login();
			}
		})
	},
	redirect_to_login: function() {
		window.location.href = '/';
	},
	set_favicon: function() {
		var link = $('link[type="image/x-icon"]').remove().attr("href");
		$('<link rel="shortcut icon" href="' + link + '" type="image/x-icon">').appendTo("head");
		$('<link rel="icon" href="' + link + '" type="image/x-icon">').appendTo("head");
	},

	setup_keyboard_shortcuts: function() {
		$(document)
			.keydown("meta+g ctrl+g", function(e) {
				frappe.ui.toolbar.search.show();
				return false;
			})
			.keydown("meta+s ctrl+s", function(e) {
				e.preventDefault();
				if(cur_frm) {
					cur_frm.save_or_update();
				} else if(frappe.container.page.save_action) {
					frappe.container.page.save_action();
				}
				return false;
			})
			.keydown("esc", function(e) {
				var open_row = $(".grid-row-open");
				if(open_row.length) {
					var grid_row = open_row.data("grid_row");
					grid_row.toggle_view(false);
				}
				return false;
			})
			.keydown("ctrl+down meta+down", function(e) {
				var open_row = $(".grid-row-open");
				if(open_row.length) {
					var grid_row = open_row.data("grid_row");
					grid_row.toggle_view(false, function() { grid_row.open_next() });
					return false;
				}
			})
			.keydown("ctrl+up meta+up", function(e) {
				var open_row = $(".grid-row-open");
				if(open_row.length) {
					var grid_row = open_row.data("grid_row");
					grid_row.toggle_view(false, function() { grid_row.open_prev() });
					return false;
				}
			})
			.keydown("ctrl+n meta+n", function(e) {
				var open_row = $(".grid-row-open");
				if(open_row.length) {
					var grid_row = open_row.data("grid_row");
					grid_row.toggle_view(false, function() { grid_row.grid.add_new_row(grid_row.doc.idx, null, true); });
					return false;
				}
			})

	},
	delete_cookies: function(){
      document.cookie = 'module' + 'Admin Module';
      document.cookie = 'toggler_close' + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
	},

	run_startup_js: function() {
		if(frappe.boot.startup_js)
			eval(frappe.boot.startup_js);
	}
})

window.mobilecheck = function() {
  var check = false;
  (function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

// We need to resize navbar and sidebar everytime screen changes
// $(window).resize(function() {
//  if(window.mobilecheck()){
//    frappe.ui.set_container_width()
//  }else{
//    frappe.ui.web_toggler()
//    frappe.ui.set_container_width()
//  }
// });