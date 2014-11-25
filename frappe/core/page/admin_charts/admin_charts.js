frappe.pages['admin-charts'].onload = function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Admin Charts'
		// single_column: true
	});

//for the sales chart

$('<div id="head" style="height:20px; width:100%;" ><b>Sales Details</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));


$("<div class='class_overflow' style=' width:100%'><table class='table table-bordered' style='height:150px;table-layout: fixed;width:100%'>\
	<tr ><td ><div class='user-settings' style='min-height: 150px;' id ='sales_column_tab' ></div></td></tr>\
	<tr ><td ><div class='user-settings' style='min-height: 150px;' id ='sales_pie_tab' ></div></td>\
	</tr>\
	</table></div>").appendTo($(wrapper).find(".layout-main-section"));


//for heading
$('<div id="head" style="height:20px;width:100%;" ><b>Purchase Details</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for purchase chart
$("<div class='class_overflow'><table class='table table-bordered' style='height:150px; width:100%;table-layout: fixed;'>\
	<tr width='100%'><td width='100%'><div class='user-settings'  id ='purchase_column_tab'  style='min-height: 150px;'></div></td></tr>\
	<tr width='100%'><td width='100%'><div class='user-settings'  id ='purchase_pie_tab'  style='min-height: 150px;'></div></td>\
	</tr>\
	</table></div>").appendTo($(wrapper).find('.layout-main-section'));

$('<div id="head" style="height:20px; width:800px;" ><b>Attendance Details</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));


//for attendance filters`
$('<div id="attendance" style="height:50px; width:100%" >\
	<table class="table" style="height:5px; width:100%;table-layout: fixed;" >\
	<tr width="100%"><td width="25%" style="min-height:20px;"><div id ="attendancetab" text-align="left" style="min-height: 10px;min-width:200px" ></div></td>\
	<td width="25%"><div id ="attendancetab1" text-align="left" style="min-height: 10px;" ></div></td>\
	<td width="25%"><div id ="attendancetab2" style="min-height: 10px;" ></div></td>\
	</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for attendance chart
$("<div id='attendance2' ><table class='table table-bordered' style='height:150px; width:100%;table-layout: fixed;'>\
	<tr width='100%'><td width='100%'>\
	<div class='class_overflow'  id ='attendance_table_tab'  style='min-height: 0px;'></div></td>\
	</tr>\
	</table></div>").appendTo($(wrapper).find('.layout-main-section'));


// $('<div id="head" style="height:20px; width:800px;" ><b>Chat Tool</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for chat tool
$("	<div class='user-settings'  id ='chat_tab'  style='border:1px solid #ddd; height: 150px;margin-bottom:5px; width:95%;overflow:auto'>\
	<h4 style='margin-left:10px;'>Tools</h4><hr>\
	<a href='#messages/' style='margin-left:10px;'><i class='icon-comments'></i>&nbsp;&nbsp;<b>Chat Tool</a>\
	<br><a href='#Calendar%2FEvent/' style='margin-left:10px;'><i class='icon-calendar'></i>&nbsp;&nbsp;<b>Calendar</a>\
	<br><a href='#mail-ticker-manager/' style='margin-left:10px;'><i class='icon-mail-reply-all'></i>&nbsp;&nbsp;<b>Ticker Tool</a>\
	</div>").appendTo($(wrapper).find('.layout-side-section'));


$("<div style='width:95%;border:1px solid #ddd' id='activity_header'></div><div id='side' class='class_overflow' style='height:500px;overflow:hidden; width:95%; margin-top:10px;border:1px solid #ddd'><table  style='height:100px;  width:95%;table-layout:fixed'><tbody></tbody></table></div>").appendTo($(wrapper).find('.layout-side-section'));

this.wrapper = new frappe.AdminChart(wrapper);	
}

frappe.AdminChart = Class.extend({
	init: function(wrapper) {
	this.wrapper = wrapper;
	this.args={};
	this.body = $(this.wrapper).find(".user-settings");
	this.make_sales_filters();
	this.make_sales_pie_chart();
	this.make_sales_column_chart();
	this.make_purchase_menu();
	this.make_purchase_pie_chart();
	this.make_purchase_column_chart();
	this.make_attendance_filters();
	this.make_attendance_table_chart();
	this.show_activities();
	this.apply_overflow();
	// this.show_chat_tool()
	},
	make_sales_filters: function()
	{
		var me = this;
		this.from_date = this.wrapper.appframe.add_date("From Date");
		this.to_date = this.wrapper.appframe.add_date("To Date");
		this.branch = this.wrapper.appframe.add_field({fieldtype:"Link", label:"Branch",
			fieldname:"branch", options:'Branch', input_css: {"z-index": 3}});
		// $(this.branch.wrapper).find('.link-field').change(function(){ me.apply_filtter_on_sales_dashboard(); })
		this.fiscal_year = this.wrapper.appframe.add_field({fieldtype:"Link", label:"Fiscal Year",
			fieldname:"fiscal_year", options:'Fiscal Year', default:sys_defaults.fiscal_year, input_css: {"z-index": 3}});
		this.search = this.wrapper.appframe.add_field({fieldtype:"Button", label:"Search",
			fieldname:"search", input_css: {"z-index": 3}});
		$(this.search.wrapper).click(function(){ me.apply_filtter_on_dashboard(); })
	},
	apply_filtter_on_dashboard: function(){
		var me = this;
		this.args.from_date = this.from_date.val();
		this.args.to_date = this.to_date.val();
		this.args.branch = this.branch.$input.val();
		this.args.fiscal_year = this.fiscal_year.$input.val();
		this.make_sales_pie_chart();
		this.make_sales_column_chart();
		this.make_purchase_pie_chart();
		this.make_purchase_column_chart();
	},
	make_sales_pie_chart:function(from_date,to_date)
	{	
		var me = this;
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_sales_pie_data",
			args: {
					'obj':me.args
				},
				callback: function(r) {
					console.log(["sdf",r.message])
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {		    
				    	var data = google.visualization.arrayToDataTable(r.message);
				    	var options = {
				      				title: 'Item Group Wise Sales Activities',
				      				width: 400,
			        				height: 200,
			        				legend: { position: 'top', maxLines: 3 },
			       					bar: { groupWidth: '25%' },
			       					isStacked: true,
				    	};
				    var chart = new google.visualization.PieChart(document.getElementById('sales_pie_tab'));
				    chart.draw(data, options);
			        }
		  		}
	    	});
	},
	make_sales_column_chart:function(from_date,to_date)
	{	
		var me = this;
		
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_sales_column_data",
			args: {
					obj:me.args
				},
				callback: function(r) {
					
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {			
				    	var data = google.visualization.arrayToDataTable(r.message);
				    	var options = {
								      	title: 'Branch Wise Sales Activities',
								      	width: 600,
				        				height: 250,
				        				legend: { position: 'top', maxLines: 3 },
				       					bar: { groupWidth: '75%' },
				       					isStacked: true,
				    	};
				    
				    	var chart = new google.visualization.ColumnChart(document.getElementById('sales_column_tab'));
				    	chart.draw(data, options);
			        }
		  		}
	    	});
	},
	make_purchase_menu:function(from_date,to_date,sales_categary)
	{	
		var me = this;
		// this.purchase_from_date=frappe.ui.form.make_control({
		// df: {
		//     "fieldtype": "Date",
		// 	"fieldname": "from_date",
		// 	"placeholder": "From Date"
		// 	},
		// parent:$(me.wrapper).find("#purchasetab"),
		// });
		// this.purchase_from_date.make_input();
		//  // $(this.wrapper).find("#purchasetab").css("width","100%");

		// this.purchase_to_date=frappe.ui.form.make_control({
		// df: {
		//     "fieldtype": "Date",
		// 	// "label": "To Date",
		// 	"fieldname": "to_date",
		// 	"placeholder": "To Date"
		// 	},
		// parent:$(me.wrapper).find("#purchasetab1"),
		// });
		// this.purchase_to_date.make_input();

		// this.purchasetab_branch=frappe.ui.form.make_control({
		// df: {
		//     "fieldtype": "Link",
		// 	"label": "Branch",
		// 	"fieldname": "purchase_branch",
		// 	"options":"Branch"
		// 	},
		// parent:$(me.wrapper).find("#purchasetab_branch"),
		// });
		// this.purchasetab_branch.make_input();
		// this.purchasetab_fiscal_year=frappe.ui.form.make_control({
		// df: {
		//     "fieldtype": "Link",
		// 	"label": "Fiscal Year",
		// 	"fieldname": "purchasetab_fiscal_year",
		// 	"options":"Fiscal Year"
		// 	},
		// parent:$(me.wrapper).find("#purchasetab_fiscal_year"),
		// });

		// this.purchasetab_fiscal_year.make_input()

		// this.purchasetab_button=frappe.ui.form.make_control({
		// df: {
		//     "fieldtype": "Button",
		// 	"label": "Apply",
		// 	"fieldname": "purchasetab_button"
		// 	},
		// parent:$(me.wrapper).find("#purchasetab_branch"),
		// });

		// this.purchasetab_button.make_input()

		// // $(this.wrapper).find("#purchasetab1").css("width","100%");

  //       this.purchase_to_date.$input.on("change", function() {
		// 	    var from_date=me.purchase_from_date.$input.val();
		// 	 	var to_date=$(this).val();
		// 	 	if(from_date < to_date)
		// 	 	{
		// 	 	me.make_purchase_pie_chart(from_date,to_date)
		// 		me.make_purchase_column_chart(from_date,to_date)
		// 		}else{
					
		// 			msgprint(__("To Date should be less than From Date."));
		// 		}
		// });


      	},
	make_purchase_pie_chart:function(from_date,to_date)
	{	
		var me = this;
		
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_purchase_pie_data",
			args: {
					obj:me.args
				},
				callback: function(r) {
					
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {				 
				    	var data = google.visualization.arrayToDataTable(r.message);
				    	var options = {
				      				title: 'Item Group Wise Purchase Activities',
				      				width: 400,
			        				height: 200,
			        				legend: { position: 'top', maxLines: 3 },
			       					bar: { groupWidth: '25%' },
			       					isStacked: true,
				    	};
				    var chart = new google.visualization.PieChart(document.getElementById('purchase_pie_tab'));
				    chart.draw(data, options);
			        }
		  		}
	    	});
	},
	make_purchase_column_chart:function(from_date,to_date)
	{	
		var me = this;
		
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_purchase_column_data",
			args: {
					obj:me.args
				},
				callback: function(r) {
					
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {
				    	var data = google.visualization.arrayToDataTable(r.message);
				    	var options = {
				      					title: 'Branch Wise Sales Activities',
				      					width: 600,
				        				height: 250,
				        				legend: { position: 'top', maxLines: 3 },
				       					bar: { groupWidth: '75%' },
				       					isStacked: true,
				    	};
				    	
				    	var chart = new google.visualization.ColumnChart(document.getElementById('purchase_column_tab'));
				    	chart.draw(data, options);
			        }
		  		}
	    	});
	},
	show_activities: function() 
	{
		var me = this;
		return frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_activities",
			callback: function(r,rt) {
				var $body = $(me.wrapper).find('.layout-side-section').find('#side table tbody');
				$('<h4 style="margin-left:10px;">Activities</h4><a href="#activity" style="margin-left:10px;"><i id="view_all_activity" class="icon-search"></i><b>View All</b></a>\
				').appendTo($(me.wrapper).find('.layout-side-section').find('#activity_header'));
				for(var i in r.message) {
					
					var p = r.message[i];
					p.image = frappe.utils.get_file_link(frappe.user_info(p.name).image);
					
					$(repl('<tr><td>\
						<span style="margin-left:10px;margin-top:5px" class="avatar avatar-small" \
							title="%(status)s"><img src="%(image)s" /></span>\
						<a style="margin-left:10px"> %(subject)s</a></td> </tr>', p))
						.appendTo($body);
				}
			}
		});
	},
	make_attendance_filters:function(from_date,to_date,sales_categary)
	{	
		var me = this;
		this.attendance_from_date=frappe.ui.form.make_control({
		df: {
		    "fieldtype": "Date",
			"label": "Date",
			"fieldname": "attendance_from_date",
			"placeholder": "Date",
			"default":"Today"
			},
		parent:$(me.wrapper).find("#attendancetab"),
		});
		this.attendance_from_date.make_input();
		 $(this.wrapper).find("#attendancetab").css("width","200px");

	    this.attendance_from_date.$input.on("change", function() {
			 	var from_date=$(this).val();
	  		    me.make_attendance_table_chart(from_date)
			});
	},
	make_attendance_table_chart:function(from_date)
	{	
		var me = this;
		
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_attendance_data",
			args: {
					from_date:from_date
					},
				callback: function(r) {
					if(r.message)
					{
						// google.load("visualization", "1", {packages:["table"],callback : drawTable});
						var options = {packages: ['corechart'], callback : drawChart};
					    google.load('visualization', '1', options);
					    function drawChart() {
					    		var data = google.visualization.arrayToDataTable(r.message);
							    	var options = {
							      					title: 'Attendance Details',
							      					width: 600,
							        				height: 250,
							        				legend: { position: 'top', maxLines: 3 },
							       					bar: { groupWidth: '75%' },
							       					isStacked: true,
							    };							   
							    var chart = new google.visualization.ColumnChart(document.getElementById('attendance_table_tab'));
				    			chart.draw(data, options);
				    			google.visualization.events.addListener(chart, 'select', selectHandler);
				    			function selectHandler() {
									window.open('#Report/Attendance','_self')
								}					 
					      }
					}else{
							$('#attendance_table_tab').empty()		
					}
		  		}
	    	});
	},
	show_chat_tool: function() 
	{
		
		var me = this;
		var $body = $(me.wrapper).find('.layout-side-section').find('#side');
				$('<h4>Activities</h4><hr>\
				').appendTo($body);
				
					p.image = frappe.utils.get_file_link(frappe.user_info(p.name).image);
					$(repl('<p>\
						<span class="avatar avatar-small" \
							title="%(status)s"><img src="%(image)s" /></span>\
						<a>%(subject)s</a> </p>', p))
						.appendTo($body);
	},
	apply_overflow: function()
	{
		$(this.wrapper).find(".class_overflow").hover(function(){
                           $(this).css('overflow','auto')
                         }, function(){
                           $(this).css('overflow','hidden')
        })
	}
});