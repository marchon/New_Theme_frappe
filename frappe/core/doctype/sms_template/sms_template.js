cur_frm.cscript.subject = function(doc, dt, dn){
	dic = {'Welcome':'(customer), (sales_branch_phone_number)', 
			'Garments ready for delivery': '(customer),(item_name),(order_no)',
			'Home delivery confirmation':'(customer)',
			'Garment ready for trial': '(customer),(Item name)(s),(order_no)',
			'Unsettled invoice amount': '(customer), (outstanding_amount), (order_no)',
			'Garments ready but not delivered': '(customer), (order_no)',
			'Appointment Intimation': '(customer), (order_no)',
			'Appointment reminder': '(customer), (apoointment_time)',
			'Thank you SMS': '(customer)'
		}
	console.log(dic[doc.subject])
	cur_frm.set_value('keys', dic[doc.subject])
	refresh_field('keys')
}