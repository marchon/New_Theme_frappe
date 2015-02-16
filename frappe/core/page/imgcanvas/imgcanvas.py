from __future__ import unicode_literals
import frappe, frappe.utils, os
from frappe import conf
from frappe.model.document import Document
from frappe.utils.file_manager import delete_file_data_content
from frappe.utils.file_manager import save_file
import base64
import random
import string


@frappe.whitelist()
def save_img(content, work_order):
	content = get_uploadedImage_content(content, work_order)
	fname = get_RandomString()
	fname = fname+'.jpg' 
	if content:
		image = save_file(fname, content, 'Work Order', work_order)
	return "Done"

def get_RandomString():
	char_set = string.ascii_uppercase + string.digits
	return ''.join(random.sample(char_set*6, 6))

@frappe.whitelist()
def get_uploadedImage_content(filedata, filename):
	filedata = filedata.rsplit(",", 1)[1]
	uploaded_content = base64.b64decode(filedata)
	return uploaded_content

@frappe.whitelist()
def get_img(work_order):
	if work_order:
		item = frappe.db.get_value('Work Order', work_order, 'item_code')
		img_list=frappe.db.sql("select file_url from `tabFile Data` where attached_to_doctype='Item' and attached_to_name='%s' and file_url not in(select add_image from `tabStyle Item` where parent='%s')"%(item, item),as_list=1)
		frappe.errprint([img_list])
	if img_list:	
		return{
			"img_list": img_list
		}