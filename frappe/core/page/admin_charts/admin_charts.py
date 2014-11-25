from __future__ import unicode_literals
import frappe
from frappe import _
import frappe.defaults
import frappe.permissions
from frappe.core.doctype.user.user import get_system_users
from frappe.utils.csvutils import UnicodeWriter, read_csv_content_from_uploaded_file
from frappe.defaults import clear_default
import datetime
from frappe.utils import flt, cstr, nowdate, now, cint

def formated_date(date_str):
	return  datetime.datetime.strptime(date_str , '%d-%m-%Y').strftime('%Y-%m-%d')

@frappe.whitelist()
def get_sales_cond(obj):
	args = eval(obj)
	cond = "1=1"
	if args.get('from_date') and args.get('to_date'):
		cond += """	and s.posting_date between coalesce('%s','1111-09-01 14:49:40') and 
				coalesce('%s','9999-09-01 14:49:40')"""%(formated_date(args.get('from_date')), formated_date(args.get('to_date')))	

	if args.get('branch'):
		cond += """ and si.sales_invoice_branch = '%s' """%(args.get('branch'))

	if args.get('fiscal_year'):
		cond += """	and s.fiscal_year = '%s' """%(args.get('fiscal_year'))

	return cond

@frappe.whitelist()
def get_sales_pie_data(obj):
	cond = get_sales_cond(obj)

	pie_chart_list=[['Item Group', 'Percentage']]
	pie_chart_data_details = frappe.db.sql("""SELECT
					            si.item_group  AS item_group,
					            SUM(si.amount) AS purchase_amount
					        FROM
					            `tabSales Invoice Item` si,
					            `tabSales Invoice` s
					        WHERE
					            si.parent = s.name
					        AND s.docstatus=1
					        AND ifnull(s.outstanding_amount,0) =0
					        AND %s
					        GROUP BY
					            si.item_group"""%(cond), as_list=1)

	for data in pie_chart_data_details:
		pie_chart_list.append([data[0], data[1]])

	return pie_chart_list

@frappe.whitelist()	
def get_sales_column_data(obj):
	cond = get_sales_cond(obj)

	graph_details = []
	item_group_list, item_group_condition = get_item_groups()

	graph_details.append(item_group_list)
	if item_group_condition:
		branch_details=frappe.db.sql("""SELECT CONCAT(branch, ': ', format(sum(purchase_amount),2)) 
				%s FROM
					(SELECT
		            	si.sales_invoice_branch AS branch,
		            	si.amount              AS purchase_amount,
		            	si.item_group
		        	FROM
		            	`tabSales Invoice Item` si,
		            	`tabSales Invoice` s
		        	WHERE
		            	si.docstatus = 1
		        	AND si.parent=s.name
		        	AND ifnull(s.outstanding_amount,0)=0
		        	AND %s
		       		GROUP BY
		            	si.sales_invoice_branch,
		            	si.item_group) AS foo
					GROUP BY branch"""%(item_group_condition, cond),as_list=1)

		for data in branch_details:
			graph_details.append(data)
	return graph_details

@frappe.whitelist()
def get_purchase_cond(obj):
	args = eval(obj)
	cond = "1=1"
	if args.get('from_date') and args.get('to_date'):
		cond += """	and s.posting_date between coalesce('%s','1111-09-01 14:49:40') and 
				coalesce('%s','9999-09-01 14:49:40')"""%(formated_date(args.get('from_date')), formated_date(args.get('to_date')))	

	if args.get('branch'):
		cond += """ and si.invoice_branch = '%s' """%(args.get('branch'))

	if args.get('fiscal_year'):
		cond += """	and s.fiscal_year = '%s' """%(args.get('fiscal_year'))

	return cond


@frappe.whitelist()
def get_purchase_pie_data(obj):
	cond = get_purchase_cond(obj)
	pie_chart_list=[['Item Group', 'Percentage']]
	pie_chart_data_details = frappe.db.sql("""SELECT
					            si.item_group  AS item_group,
					            SUM(si.amount) AS purchase_amount
					        FROM
					            `tabPurchase Invoice Item` si,
					            `tabPurchase Invoice` s
					        WHERE
					            si.parent = s.name
					        AND s.docstatus=1
					        AND ifnull(s.outstanding_amount,0) =0
					        AND %s
					        GROUP BY
					            si.item_group"""%(cond), as_list=1)

	for data in pie_chart_data_details:
		pie_chart_list.append([data[0], data[1]])

	return pie_chart_list

@frappe.whitelist()
def get_purchase_column_data(obj):
	cond = get_purchase_cond(obj)
	graph_details = []
	item_group_list, item_group_condition = get_item_groups()	

	graph_details.append(item_group_list)
	if item_group_condition:
		branch_details=frappe.db.sql("""SELECT CONCAT(branch, ': ', format(sum(purchase_amount),2)) 
				%s FROM
					(SELECT
		            	si.invoice_branch AS branch,
		            	si.amount              AS purchase_amount,
		            	si.item_group
		        	FROM
		            	`tabPurchase Invoice Item` si,
		            	`tabPurchase Invoice` s
		        	WHERE
		            	si.docstatus = 1
		        	AND si.parent=s.name
		        	AND ifnull(s.outstanding_amount,0)=0
		        	AND %s
		       		GROUP BY
		            	si.invoice_branch,
		            	si.item_group) AS foo
					GROUP BY branch"""%(item_group_condition, cond),as_list=1)

		for data in branch_details:
			graph_details.append(data)
	return graph_details

@frappe.whitelist()
def get_activities():
	act_details=frappe.db.sql("""select CONCAT(doc_name, ' ',subject) as subject ,creation from `tabFeed` where  owner='%s' and doc_type not in('GL Entry', 'Stock Ledger Entry') order by creation desc limit 20"""%(frappe.session.user),as_dict=1)
	return act_details	

@frappe.whitelist()
def get_attendance_data(from_date=None):
	cond = "a.att_date = '%s'"%(datetime.datetime.now().strftime('%Y-%m-%d'))
	if from_date:
		cond = "a.att_date = '%s'"%(formated_date(from_date))
	attendance_graphData_list = [['branch','Present', 'Absent', 'Half Day','Unsigned User']]
	attendance_details = frappe.db.sql("""select concat(branch,':',branch_count) as branch_count,present,absent,half_day,(branch_count-total_signed) as unsigned_count 
										  	FROM 
											   (SELECT (b.name) as branch,
											   (select COUNT(*) FROM `tabEmployee` WHERE branch=b.name) as branch_count,
											   (select count(*) from tabAttendance a,tabEmployee e where a.employee=e.name and e.branch=b.name and a.docstatus=1 and  %s ) as total_signed,
											   (select count(*) from tabAttendance a,tabEmployee e where a.employee=e.name and e.branch=b.name and a.docstatus=1 and  a.status='Present' and %s ) as present,
											   (select count(*) from tabAttendance a,tabEmployee e where a.employee=e.name and e.branch=b.name and a.docstatus=1 and  a.status='Absent'  and %s ) as absent,
											   (select count(*) from tabAttendance a,tabEmployee e where a.employee=e.name and e.branch=b.name and a.docstatus=1 and  a.status='Half Day' and %s ) as half_day
											FROM
											   tabBranch b
											   )foo where branch_count > 0"""%(cond, cond, cond, cond), as_list=1)
	if attendance_details:
		for data in attendance_details:
			attendance_graphData_list.append([data[0], cint(data[1]), cint(data[2]), cint(data[3]), cint(data[4])])
	return attendance_graphData_list		

@frappe.whitelist()
def  get_item_groups():
	item_groups = frappe.db.sql("select distinct item_group from `tabItem` where is_sales_item='Yes'", as_list=1)
	item_group_list = ['item_group']
	item_group_condition = ''
	for item_group in item_groups:
		if item_group:
			item_group_list.append(item_group[0])
			item_group_condition += """, SUM(
	        CASE
	            WHEN foo.item_group='%s'
	            THEN purchase_amount
	            ELSE '0'
	        END) AS '%s' """%(item_group[0], item_group[0])
	return item_group_list, item_group_condition