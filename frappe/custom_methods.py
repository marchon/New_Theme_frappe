from __future__ import unicode_literals
import frappe
from frappe.widgets.reportview import get_match_cond
from frappe.utils import add_days, cint, cstr, date_diff, rounded, flt, getdate, nowdate, \
	get_first_day, get_last_day,money_in_words, now
from frappe import _
from frappe.model.db_query import DatabaseQuery
import smtplib
from email.MIMEMultipart import MIMEMultipart
from email.MIMEBase import MIMEBase
from email.MIMEText import MIMEText
from email.Utils import COMMASPACE, formatdate
from email import Encoders
import os,datetime

def appintment_notification(doc, method):
	CRLF = "\r\n"
	login = frappe.db.get_value('Outgoing Email Settings',None,'mail_login')
	password = frappe.db.get_value('Outgoing Email Settings',None,'mail_password')
	organizer = "ORGANIZER;CN=organiser:mailto:first"+CRLF+" @gmail.com"
	fro = "Administrator <first@gmail.com>"

	if login and password and doc.get('appointment_list'):
		dtstamp = datetime.datetime.now()
		frappe.errprint(doc.starts_on)
		dtstart = datetime.datetime.strptime(doc.starts_on,'%Y-%m-%d %H:%M:%S').strftime("%Y%m%dT%H%M%S")
		dtend = datetime.datetime.strptime(doc.ends_on,'%Y-%m-%d %H:%M:%S').strftime("%Y%m%dT%H%M%S")

		description = doc.description+CRLF
		attendee = "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-    PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE"+CRLF+" ;CN="+login+";X-NUM-GUESTS=0:"+CRLF+" mailto:"+login+CRLF
		attendees =[login]
		for att in doc.get('appointment_list'):
			email_id =  frappe.db.get_value('Contact',{'customer':att.customer},'email_id') or frappe.db.get_value('Address',{'customer':att.customer},'email_id')
			if email_id:
				attendees.append(email_id)
				attendee += "ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-    PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE"+CRLF+" ;CN="+email_id+";X-NUM-GUESTS=0:"+CRLF+" mailto:"+email_id+CRLF
		if attendee:
			ical = "BEGIN:VCALENDAR"+CRLF+"PRODID:pyICSParser"+CRLF+"VERSION:2.0"+CRLF+"CALSCALE:GREGORIAN"+CRLF
			ical+="METHOD:REQUEST"+CRLF+"BEGIN:VEVENT"+CRLF+"DTSTART:"+dtstart+CRLF+"DTEND:"+dtend+CRLF+"DTSTAMP:"+dtstamp.strftime("%Y%m%dT%H%M%SZ")+CRLF+organizer+CRLF
			ical+= "UID:FIXMEUID"+dtstamp.strftime("%Y%m%dT%H%M%SZ")+CRLF
			ical+= attendee+"CREATED:"+dtstamp.strftime("%Y%m%dT%H%M%SZ")+CRLF+description+"LAST-MODIFIED:"+dtstamp.strftime("%Y%m%dT%H%M%SZ")+CRLF+"LOCATION:"+CRLF+"SEQUENCE:0"+CRLF+"STATUS:CONFIRMED"+CRLF
			ical+= "SUMMARY:Appointment "+dtstamp.strftime("%d/%m/%Y @ %H:%M")+CRLF+"TRANSP:OPAQUE"+CRLF+"END:VEVENT"+CRLF+"END:VCALENDAR"+CRLF

			eml_body = doc.description
			eml_body_bin = "This is the email body in binary - two steps"
			msg = MIMEMultipart('mixed')
			msg['Reply-To']=fro
			msg['Date'] = formatdate(localtime=True)
			msg['Subject'] = doc.subject #subject
			msg['From'] = fro # from - erp outgoin mail id
			msg['To'] = ",".join(attendees) # customer mail id

			part_email = MIMEText(eml_body,"html")
			part_cal = MIMEText(ical,'calendar;method=REQUEST')

			msgAlternative = MIMEMultipart('alternative')
			msg.attach(msgAlternative)

			ical_atch = MIMEBase('application/ics',' ;name="%s"'%("invite.ics"))
			ical_atch.set_payload(ical)
			Encoders.encode_base64(ical_atch)
			ical_atch.add_header('Content-Disposition', 'attachment; filename="%s"'%("invite.ics"))

			eml_atch = MIMEBase('text/plain','')
			Encoders.encode_base64(eml_atch)
			eml_atch.add_header('Content-Transfer-Encoding', "")

			msgAlternative.attach(part_email)
			msgAlternative.attach(part_cal)

			mailServer = smtplib.SMTP('smtp.gmail.com', 587)
			mailServer.ehlo()
			mailServer.starttls()
			mailServer.ehlo()
			mailServer.login(login, password)
			mailServer.sendmail(fro, attendees, msg.as_string())
			mailServer.close()	
