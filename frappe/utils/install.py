# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals

import frappe

def before_install():
	frappe.reload_doc("core", "doctype", "docfield")
	frappe.reload_doc("core", "doctype", "docperm")
	frappe.reload_doc("core", "doctype", "doctype")

def after_install():
	# reset installed apps for re-install
	frappe.db.set_global("installed_apps", '["frappe"]')

	# core users / roles
	# gangadhar replaced role of guest to administrator
	install_docs = [
		{'doctype':'User', 'name':'Administrator', 'first_name':'Administrator',
			'email':'admin@example.com', 'enabled':1},
		{'doctype':'User', 'name':'apiuser', 'first_name':'apiuser',
			'email':'apiuser@example.com', 'enabled':1},
		{'doctype':'UserRole', 'parent': 'Administrator', 'role': 'Administrator',
			'parenttype':'User', 'parentfield':'user_roles'},
		{'doctype':'UserRole', 'parent': 'apiuser', 'role': 'Administrator',
			'parenttype':'User', 'parentfield':'user_roles'},
		{'doctype': "Role", "role_name": "Report Manager"},
		{'doctype': "Workflow State", "workflow_state_name": "Pending",
			"icon": "question-sign", "style": ""},
		{'doctype': "Workflow State", "workflow_state_name": "Approved",
			"icon": "ok-sign", "style": "Success"},
		{'doctype': "Workflow State", "workflow_state_name": "Rejected",
			"icon": "remove", "style": "Danger"},
		{'doctype': "Workflow Action", "workflow_action_name": "Approve"},
		{'doctype': "Workflow Action", "workflow_action_name": "Reject"},
		{'doctype': "Workflow Action", "workflow_action_name": "Review"}
	]

	for d in install_docs:
		try:
			frappe.get_doc(d).insert()
		except frappe.NameError:
			pass

	# all roles to admin
	frappe.get_doc("User", "Administrator").add_roles(*frappe.db.sql_list("""select name from tabRole"""))
	#added by gangadhar for add all roles to guest
	frappe.get_doc("User", "apiuser").add_roles(*frappe.db.sql_list("""select name from tabRole"""))
	print "added all roles to apiuser"
	print frappe.db.sql_list("""select name from tabRole""")
	# update admin password
	from frappe.auth import _update_password
	_update_password("Administrator", frappe.conf.get("admin_password"))
	# gangadhar set password of guest
	_update_password("apiuser", "apiuser")
	print "updated password of apiuser"

	frappe.db.commit()

def before_tests():
	frappe.db.sql("delete from `tabCustom Field`")
	frappe.db.sql("delete from `tabEvent`")
	frappe.db.commit()
	frappe.clear_cache()
