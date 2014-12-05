from __future__ import unicode_literals
import frappe, frappe.utils, os
from frappe import conf
from frappe.model.document import Document
from frappe.utils.file_manager import delete_file_data_content
import base64


@frappe.whitelist()
def save_img(content):
	h=os.path.join(os.path.join("bench_smart","public","files"))
	content = content.split(",")[1]
	fh = open(h+"/imageToSave88.png", "wb")
	fh.write(content.decode('base64'))
	fh.close()
	# frappe.errprint("done")
	# return fh

@frappe.whitelist()
def get_img():
	# frappe.errprint("fname in py")
	img_list=frappe.db.sql("select file_url from `tabFile Data` where attached_to_doctype='Item'",as_list=1)
	# frappe.errprint(img_list)
	return{
		"img_list": img_list
	}

 