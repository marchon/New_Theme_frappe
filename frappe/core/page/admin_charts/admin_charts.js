frappe.pages['admin-charts'].onload = function(wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Admin Charts'
		// single_column: true
	});

//for the sales chart
$('<div id="head" style="height:20px; width:85%;" ><b>Sales Details</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));


$("<table class='table table-bordered' style='height:150px; width:85%;'>\
	<tr width='100%'>\
	<td width='50%'><div class='user-settings' style='min-height: 150px;' id ='sales_pie_tab' ></div>\
	</td><td width='50%'><div class='user-settings' style='min-height: 150px;' id ='sales_column_tab' ></div></td>\
	</tr>\
	</table>").appendTo($(wrapper).find(".layout-main-section"));


//for heading
$('<div id="head" style="height:20px;width:85%;" ><b>Purchase Details</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for purchase filters`
$('<div id="purchase" style="height:50px; width:85%;" >\
	<table class="table" style="height:5px;width:85%;" >\
	<tr width="100%"><td width="25%" style="min-height:20px;"><div id ="purchasetab" text-align="left" style="min-height: 10px;min-width:200px" ></div></td>\
	<td width="25%"><div id ="purchasetab1" text-align="left" style="min-height: 10px;" ></div></td>\
	<td width="25%"><div id ="purchasetab2" style="min-height: 10px;" ></div></td>\
	</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for purchase chart
$("<table class='table table-bordered' style='height:150px; width:85%;'>\
	<tr width='100%'><td width='50%'>\
	<div class='user-settings'  id ='purchase_pie_tab'  style='min-height: 150px;'></div></td>\
	<td width='50%'><div class='user-settings'  id ='purchase_column_tab'  style='min-height: 150px;'></div></td>\
	</tr>\
	</table>").appendTo($(wrapper).find('.layout-main-section'));

$('<div id="head" style="height:20px; width:800px;" ><b>Attendance Details</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));


//for attendance filters`
$('<div id="attendance" style="height:50px; width:85%" >\
	<table class="table" style="height:5px; width:85%" >\
	<tr width="100%"><td width="25%" style="min-height:20px;"><div id ="attendancetab" text-align="left" style="min-height: 10px;min-width:200px" ></div></td>\
	<td width="25%"><div id ="attendancetab1" text-align="left" style="min-height: 10px;" ></div></td>\
	<td width="25%"><div id ="attendancetab2" style="min-height: 10px;" ></div></td>\
	</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for attendance chart
$("<div id='attendance2' ><table class='table table-bordered' style='height:150px; width:85%;'>\
	<tr width='100%'><td width='100%'>\
	<div class='user-settings'  id ='attendance_table_tab'  style='min-height: 0px; overflow-y:scroll'></div></td>\
	</tr>\
	</table></div>").appendTo($(wrapper).find('.layout-main-section'));


// $('<div id="head" style="height:20px; width:800px;" ><b>Chat Tool</tr></table></div>').appendTo($(wrapper).find('.layout-main-section'));

//for chat tool
$("	<div class='user-settings'  id ='chat_tab'  style='min-height: 0px; width:85%;'>\
	<a href='#messages/'><b>Click For Chat Tool</a>\
	</div>").appendTo($(wrapper).find('.layout-main-section'));


$("<div id='side' style='min-height: 0px;width:100% '></div>").appendTo($(wrapper).find('.layout-side-section'));

wrapper.this = new frappe.AdminChart(wrapper);	
}

frappe.AdminChart = Class.extend({
	init: function(wrapper) {
	this.wrapper = wrapper;
	this.body = $(this.wrapper).find(".user-settings");
	this.make_sales_filters();
	this.make_sales_pie_chart();
	this.make_sales_column_chart();
	this.make_purchase_menu();
	this.make_purchase_pie_chart();
	this.make_purchase_column_chart();
	this.make_attendance_filters();
	this.make_attendance_table_chart();
	this.show_activities()
	// this.show_chat_tool()
	},
	make_sales_filters: function()
	{
		var me = this;
		this.from_date = this.wrapper.appframe.add_date("From Date");
		this.to_date = this.wrapper.appframe.add_date("To Date")
		.change(function()
			{
				var from_date=me.from_date.val();
			 	var to_date=$(this).val();
			 	if(from_date < to_date)
			 	{
			 	console.log("in same ");
			 	me.make_sales_pie_chart(from_date,to_date)
				me.make_sales_column_chart(from_date,to_date)
				}else{
					
					msgprint(__("To Date should be less than From Date."));
				}
			});
	},
	make_sales_pie_chart:function(from_date,to_date)
	{	
		var me = this;
		console.log("in the fun");
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_sales_pie_data",
			args: {
					from_date:from_date,
					to_date:to_date,
				},
				callback: function(r) {
					console.log(r.message);
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {
				    	mydata=[['sales','Expenses']];
				    	for(var x in r.message.sales_order_total)
				    		{
				    		mydata.push(r.message.sales_order_total[x]);
		            		}
				    	var data = google.visualization.arrayToDataTable(mydata);
				    	var options = {
				      	title: 'Sales Activities'
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
		console.log("in the fun");
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_sales_column_data",
			args: {
					from_date:from_date,
					to_date:to_date
					},
				callback: function(r) {
					console.log(r.message);
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {
				    	mydata=[['sales','Merchandise','Fabric','Tailoring']];
				    	for(var x in r.message.sales_order_total)
				    		{
				    		mydata.push(r.message.sales_order_total[x]);
		            		}
		            	console.log(mydata)	
		      
				    	var data = google.visualization.arrayToDataTable(mydata);
				    	var options = {
				      	title: 'Sales Activities',
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
		this.purchase_from_date=frappe.ui.form.make_control({
		df: {
		    "fieldtype": "Date",
			"fieldname": "from_date",
			"placeholder": "From Date"
			},
		parent:$(me.wrapper).find("#purchasetab"),
		});
		this.purchase_from_date.make_input();
		 $(this.wrapper).find("#purchasetab").css("width","100%");

		this.purchase_to_date=frappe.ui.form.make_control({
		df: {
		    "fieldtype": "Date",
			// "label": "To Date",
			"fieldname": "to_date",
			"placeholder": "To Date"
			},
		parent:$(me.wrapper).find("#purchasetab1"),
		});
		this.purchase_to_date.make_input();
		$(this.wrapper).find("#purchasetab1").css("width","100%");


        this.purchase_to_date.$input.on("change", function() {
			    var from_date=me.purchase_from_date.$input.val();
			 	var to_date=$(this).val();
			 	if(from_date < to_date)
			 	{
			 	me.make_purchase_pie_chart(from_date,to_date)
				me.make_purchase_column_chart(from_date,to_date)
				}else{
					
					msgprint(__("To Date should be less than From Date."));
				}
		});


      	},
	make_purchase_pie_chart:function(from_date,to_date)
	{	
		var me = this;
		console.log("in the PieChart fun");
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_purchase_pie_data",
			args: {
					from_date:from_date,
					to_date:to_date,
				},
				callback: function(r) {
					console.log(r.message);
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {
				    	mydata=[['sales','Expenses']];
				    	for(var x in r.message.sales_order_total)
				    		{
				    		mydata.push(r.message.sales_order_total[x]);
		            		}
		               // console.log(mydata)
				    	var data = google.visualization.arrayToDataTable(mydata);
				    	var options = {
				      	title: 'Sales Activities'
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
		console.log("in the fun");
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_purchase_column_data",
			args: {
					from_date:from_date,
					to_date:to_date,
				},
				callback: function(r) {
					console.log(r.message);
					var options = {packages: ['corechart'], callback : drawChart};
				    google.load('visualization', '1', options);
				    function drawChart()
				    {
				    	mydata=[['sales','Merchandise','Fabric','Tailoring']];
				    	for(var x in r.message.sales_order_total)
				    		{
				    		mydata.push(r.message.sales_order_total[x]);
		            		}
		               // console.log(mydata)
				    	var data = google.visualization.arrayToDataTable(mydata);
				    	var options = {
				      	title: 'Purchase Activities',
				      	isStacked: true
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
				var $body = $(me.wrapper).find('.layout-side-section');
				$('<h4>Activities</h4><hr>\
				').appendTo($body);
				for(var i in r.message) {
					// console.log(r.message)
					var p = r.message[i];
					p.image = frappe.utils.get_file_link(frappe.user_info(p.name).image);
					console.log(p.image)
					$(repl('<p>\
						<span class="avatar avatar-small" \
							title="%(status)s"><img src="%(image)s" /></span>\
						<a>%(subject)s</a> </p>', p))
						.appendTo($body);
					// }
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
			"placeholder": "Date"
			},
		parent:$(me.wrapper).find("#attendancetab"),
		});
		this.attendance_from_date.make_input();
		 $(this.wrapper).find("#attendancetab").css("width","200px");

		// this.attendance_to_date=frappe.ui.form.make_control({
		// df: {
		//     "fieldtype": "Date",
		// 	"label": "To Date",
		// 	"fieldname": "attendance_to_date",
		// 	"placeholder": "To Date"
		// 	},
		// parent:$(me.wrapper).find("#attendancetab1"),
		// });
		// this.attendance_to_date.make_input();
		// $(this.wrapper).find("#attendancetab1").css("width","200px");

	    this.attendance_from_date.$input.on("change", function() {
	    		    		// var from_date=me.attendance_from_date.$input.val();
			 	var from_date=$(this).val();
	    // 		if(from_date < to_date)
			 	// {
			    me.make_attendance_table_chart(from_date,to_date)
				// }else{
					
				// 	msgprint(__("To Date should be less than From Date."));
				// }
			});
	},
	make_attendance_table_chart:function(from_date,to_date)
	{	
		var me = this;
		console.log(from_date);
		frappe.call({
			method:"frappe.core.page.admin_charts.admin_charts.get_attendance_data",
			args: {
					from_date:from_date,
					to_date:to_date
					},
				callback: function(r) {
					console.log(r.message);
					google.load("visualization", "1", {packages:["table"],callback : drawTable});
				    function drawTable() {
				    	mydata=[['Name','status']];
				    	for(var x in r.message.sales_order_total)
				    		{
				    		mydata.push(r.message.sales_order_total[x]);
		            		}
		            	console.log(mydata)
				        var data = google.visualization.arrayToDataTable(mydata);
				        var table = new google.visualization.Table(document.getElementById('attendance_table_tab'));
				        table.draw(data, {showRowNumber: true});
				        // $('#attendance_table_tab').gChartScroller();
				      }
		  		}
	    	});
	},
	show_chat_tool: function() 
	{
		console.log("in the show_chat_tool ")
		var me = this;
		var $body = $(me.wrapper).find('.layout-main-section');
				$('<h4>Activities</h4><hr>\
				').appendTo($body);
				// var p = r.message[i];
					p.image = frappe.utils.get_file_link(frappe.user_info(p.name).image);
					$(repl('<p>\
						<span class="avatar avatar-small" \
							title="%(status)s"><img src="%(image)s" /></span>\
						<a>%(subject)s</a> </p>', p))
						.appendTo($body);
	},
});