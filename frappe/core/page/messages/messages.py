# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# MIT License. See license.txt

from __future__ import unicode_literals
import frappe
from frappe.core.doctype.notification_count.notification_count import delete_notification_count_for
from frappe.core.doctype.user.user import STANDARD_USERS
from frappe.utils import cint

@frappe.whitelist()
def get_list(arg=None):
	if frappe.local.site_path.split('/')[1] == 'demo.tailorpad.com':
		return None
	"""get list of messages"""
	frappe.form_dict['limit_start'] = int(frappe.form_dict['limit_start'])
	frappe.form_dict['limit_page_length'] = int(frappe.form_dict['limit_page_length'])
	frappe.form_dict['user'] = frappe.session['user']

	# set all messages as read
	frappe.db.begin()
	frappe.db.sql("""UPDATE `tabComment`
	set docstatus = 1 where comment_doctype in ('My Company', 'Message')
	and comment_docname = %s
	""", frappe.user.name)

	delete_notification_count_for("Messages")

	frappe.db.commit()

	if frappe.form_dict['contact'] == frappe.session['user']:
		# return messages
		return frappe.db.sql("""select * from `tabComment`
		where (owner=%(contact)s
			or comment_docname=%(user)s
			or (owner=comment_docname and ifnull(parenttype, "")!="Assignment"))
		and comment_doctype ='Message'
		order by creation desc
		limit %(limit_start)s, %(limit_page_length)s""", frappe.local.form_dict, as_dict=1)
	else:
		return frappe.db.sql("""select * from `tabComment`
		where (owner=%(contact)s and comment_docname=%(user)s)
		or (owner=%(user)s and comment_docname=%(contact)s)
		or (owner=%(contact)s and comment_docname=%(contact)s)
		and comment_doctype ='Message'
		order by creation desc
		limit %(limit_start)s, %(limit_page_length)s""", frappe.local.form_dict, as_dict=1)


@frappe.whitelist()
def get_active_users():
	if frappe.local.site_path.split('/')[1] == 'demo.tailorpad.com':
		return None
	return frappe.db.sql("""select name,
		(select count(*) from tabSessions where user=tabUser.name
			and timediff(now(), lastupdate) < time("01:00:00")) as has_session
	 	from tabUser
		where ifnull(enabled,0)=1 and
		ifnull(user_type, '')!='Website User' and
		name not in ({})
		order by first_name""".format(", ".join(["%s"]*len(STANDARD_USERS))), STANDARD_USERS, as_dict=1)

@frappe.whitelist()
def post(txt, contact, parenttype=None, notify=False, subject=None):
	import frappe
	"""post message"""

	d = frappe.new_doc('Comment')
	d.parenttype = parenttype
	d.comment = txt
	d.comment_docname = contact
	d.comment_doctype = 'Message'
	d.insert(ignore_permissions=True)

	delete_notification_count_for("Messages")

	if notify and cint(notify):
		if contact==frappe.session.user:
			_notify([user.name for user in frappe.get_list("User",
				{"user_type":"System User", "enabled": 1}) \
					if user.name not in ("Guest", "Administrator")], txt)
		else:
			_notify(contact, txt, subject)

@frappe.whitelist()
def delete(arg=None):
	frappe.db.sql("""delete from `tabComment` where name=%s""",
		frappe.form_dict['name']);

def _notify(contact, txt, subject=None):
	from frappe.utils import get_fullname, get_url

	try:
		if not isinstance(contact, list):
			contact = [frappe.db.get_value("User", contact, "email") or contact]
		frappe.sendmail(\
			recipients=contact,
			sender= frappe.db.get_value("User", frappe.session.user, "email"),
			subject=subject or "New Message from " + get_fullname(frappe.user.name),
			message=frappe.get_template("templates/emails/new_message.html").render({
				"from": get_fullname(frappe.user.name),
				"message": txt,
				"link": get_url()
			}),
			bulk=True)
	except frappe.OutgoingEmailError:
		pass
