from __future__ import unicode_literals
import frappe
from frappe import _
import frappe.defaults
import frappe.permissions
from frappe.core.doctype.user.user import get_system_users
from frappe.utils.csvutils import UnicodeWriter, read_csv_content_from_uploaded_file
from frappe.defaults import clear_default
import datetime
from frappe.utils import flt, cstr

def formated_date(date_str):
	return  datetime.datetime.strptime(date_str , '%d-%m-%Y').strftime('%Y-%m-%d')
	 
@frappe.whitelist()
def get_sales_pie_data(from_date=None,to_date=None):
	stmt=''
	if from_date and to_date:
		from_date="'"+formated_date(from_date)+"'"
		to_date="'"+formated_date(to_date)+"'"
		stmt="select item_category,(sales_amount/total_sales_amount)*100 as sales_perc from(select i.item_category,sum(amount) as sales_amount,(select sum(amount) from `tabSales Invoice Item` sii_ inner join tabItem i_ on sii_.item_code=i_.item_code and sii_.docstatus=1 and  i_.item_category in(select distinct item_category from `tabItem`) and sii_.creation between coalesce("+cstr(from_date)+",'1111-09-01 14:49:40') and coalesce("+cstr(to_date)+",'9999-09-01 14:49:40') ) as total_sales_amount from `tabSales Invoice Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem`) and sii.creation between coalesce("+cstr(from_date)+",'1111-09-01 14:49:40') and coalesce("+cstr(to_date)+",'9999-09-01 14:49:40') group by i.item_category,total_sales_amount)foo"
		frappe.errprint(stmt)
	else:
		stmt=stmt="select item_category,(sales_amount/total_sales_amount)*100 as sales_perc from(select i.item_category,sum(amount) as sales_amount,(select sum(amount) from `tabSales Invoice Item` sii_ inner join tabItem i_ on sii_.item_code=i_.item_code and sii_.docstatus=1 and  i_.item_category in(select distinct item_category from `tabItem`) and sii_.creation between coalesce(null,'1111-09-01 14:49:40') and coalesce(null,'9999-09-01 14:49:40') ) as total_sales_amount from `tabSales Invoice Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem`) and sii.creation between coalesce(null,'1111-09-01 14:49:40') and coalesce(null,'9999-09-01 14:49:40') group by i.item_category,total_sales_amount)foo"	
	data_dict = frappe.db.sql(stmt,debug=1)
	return{
		"sales_order_total": data_dict
	}

@frappe.whitelist()	
def get_sales_column_data(from_date=None,to_date=None):
	stmt=''
	if from_date and to_date:
		from_date="'"+formated_date(from_date)+"'"
		to_date="'"+formated_date(to_date)+"'"
		stmt="select month,sum(case when item_category='Merchandise' then sales_amount else '0' end) as 'Consumable' ,sum(case when item_category='Fabric' then sales_amount else '0' end) as 'Services',sum(case when item_category='Tailoring' then sales_amount else '0' end )as 'Products' from (select i.item_category,substring(date_format(sii.creation,'%Y-%M'),1,8)as month,sum(amount) as sales_amount from `tabSales Invoice Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem`) and sii.creation between coalesce("+cstr(from_date)+",'1111-09-01 14:49:40') and coalesce("+cstr(to_date)+",'9999-09-01 14:49:40') group by i.item_category,month )foo group by month"
		frappe.errprint(stmt)
	else:
		stmt="select month,sum(case when item_category='Merchandise' then sales_amount else '0' end) as 'Consumable' ,sum(case when item_category='Fabric' then sales_amount else '0' end) as 'Services',sum(case when item_category='Tailoring' then sales_amount else '0' end )as 'Products' from (select i.item_category,substring(date_format(sii.creation,'%Y-%M'),1,8)as month,sum(amount) as sales_amount from `tabSales Invoice Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem`) and sii.creation between coalesce(null,'1111-09-01 14:49:40') and coalesce(null,'9999-09-01 14:49:40') group by i.item_category,month )foo group by month"
	data_dict = frappe.db.sql(stmt,debug=1)
	return{
		"sales_order_total": data_dict
	}

@frappe.whitelist()
def get_purchase_pie_data(from_date=None,to_date=None):
	stmt=''
	if from_date and to_date:
		from_date="'"+formated_date(from_date)+"'"
		to_date="'"+formated_date(to_date)+"'"
		stmt="select item_category,(purchase_amount/total_purchase_amount)*100 as purchase_perc from ( select i.item_category,sum(amount) as purchase_amount,(select sum(amount) from `tabPurchase Receipt Item` sii_ inner join tabItem i_ on sii_.item_code=i_.item_code and sii_.docstatus=1 and  i_.item_category in(select distinct item_category from `tabItem`) and sii_.creation between coalesce("+cstr(from_date)+",'1111-09-01 14:49:40') and coalesce("+cstr(to_date)+",'9999-09-01 14:49:40') ) as total_purchase_amount from `tabPurchase Receipt Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem` ) and sii.creation between coalesce("+cstr(from_date)+",'1111-09-01 14:49:40') and coalesce("+cstr(to_date)+",'9999-09-01 14:49:40') group by i.item_category,total_purchase_amount)foo"
		frappe.errprint(stmt)
	else:
		stmt="select item_category,(purchase_amount/total_purchase_amount)*100 as purchase_perc from ( select i.item_category,sum(amount) as purchase_amount,(select sum(amount) from `tabPurchase Receipt Item` sii_ inner join tabItem i_ on sii_.item_code=i_.item_code and sii_.docstatus=1 and  i_.item_category in(select distinct item_category from `tabItem`) and sii_.creation between coalesce(null,'1111-09-01 14:49:40') and coalesce(null,'9999-09-01 14:49:40') ) as total_purchase_amount from `tabPurchase Receipt Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem` ) and sii.creation between coalesce(null,'1111-09-01 14:49:40') and coalesce(null,'9999-09-01 14:49:40') group by i.item_category,total_purchase_amount)foo"
	data_dict = frappe.db.sql(stmt,debug=1)
	return{
		"sales_order_total": data_dict
	}

@frappe.whitelist()
def get_purchase_column_data(from_date=None,to_date=None):
	stmt=''
	if from_date and to_date:
		from_date="'"+formated_date(from_date)+"'"
		to_date="'"+formated_date(to_date)+"'"
		stmt="select month,sum(case when item_category='Merchandise' then purchase_amount else '0' end) as 'Merchandise' ,sum(case when item_category='Fabric' then purchase_amount else '0' end) as 'Fabric',sum(case when item_category='Tailoring' then purchase_amount else '0' end )as 'Tailoring' from ( select i.item_category,substring(date_format(sii.creation,'%Y-%M'),1,8)as month,sum(amount) as purchase_amount from `tabPurchase Receipt Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem`) and sii.creation between coalesce("+cstr(from_date)+",'1111-09-01 14:49:40') and coalesce("+cstr(to_date)+",'9999-09-01 14:49:40') group by i.item_category,month)foo group by month"
		frappe.errprint(stmt)
	else:
		stmt="select month,sum(case when item_category='Merchandise' then purchase_amount else '0' end) as 'Merchandise' ,sum(case when item_category='Fabric' then purchase_amount else '0' end) as 'Fabric',sum(case when item_category='Tailoring' then purchase_amount else '0' end )as 'Tailoring' from ( select i.item_category,substring(date_format(sii.creation,'%Y-%M'),1,8)as month,sum(amount) as purchase_amount from `tabPurchase Receipt Item` sii inner join `tabItem` i on sii.item_code=i.item_code where sii.docstatus=1 and i.item_category in(select distinct item_category from `tabItem`) and sii.creation between coalesce(null,'1111-09-01 14:49:40') and coalesce(null,'9999-09-01 14:49:40') group by i.item_category,month)foo group by month"
	data_dict = frappe.db.sql(stmt,debug=1)
	frappe.errprint(data_dict)
	return{
		"sales_order_total": data_dict
	}

@frappe.whitelist()
def get_activities():
	act_details=frappe.db.sql("""select subject ,creation from `tabFeed` where  doc_name='Administrator' order by creation desc limit 5""",as_dict=1,debug=1)
	return act_details	

@frappe.whitelist()
def get_attendance_data(from_date=None,to_date=None):
	frappe.errprint(from_date)
	if from_date:
		from_date="'"+formated_date(from_date)+"'"
		stmt="select employee_name,status from `tabAttendance` where att_date="+cstr(from_date)+""
	else:
		stmt="select employee_name,status from `tabAttendance`"
	data_dict = frappe.db.sql(stmt,debug=1)
	frappe.errprint(data_dict)	
	return{
		"sales_order_total": data_dict
	}

