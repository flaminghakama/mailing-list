/*
    Display messages in the show-alert area on the page.
*/
function show_alert(message) { 
    $('#show-alert').html(message) ; 
}
    
/*
    Add an additional message to the show-alert area on the page.
*/
function add_alert(message) { 
    var current_message = $('#show-alert').html() ; 
    $('#show-alert').html(current_message + "\n<p>" + message + "</p>\n") ; 
}
    

// In the regular usage, a list of email addresses
// In the merged usage, a list of name/email pairs, separated by whitespace
var queued_recipients = [] ;  

// Used in both regular usage and merge usage to contain an email address
var in_process_recipient = '' ; 

//Used only for regular usage, in addition to in_process_recipient
var in_process_name = '' ; 

var completed_total = 0 ; 
var completed_recipients = [] ; 

/*
    Uses the class variable queued_recipients
    and populates the visible list.
*/
function populate_queued_recipients() { 
    var recipients_list = "<ul>\n<li>" + queued_recipients.join("</li>\n<li>") + "</li>\n</ul>\n" ;
    $('#recipients-queued').html(recipients_list) ; 
    $('#queued-total').html(queued_recipients.length) ; 
}


/*
    Uses the class variable in_process_recipient
    and populates the in-process recipient.
*/
function populate_in_process_recipient() { 
    $('#recipients-processing').html("<ul>\n<li>" + in_process_recipient + "</li>\n</ul>\n") ; 
}


/*
    Uses the class variable in_process_name
    and populates the in-process recipient.
*/
function populate_in_process_name() { 
    $('#recipients-processing-name').html("<ul>\n<li>" + in_process_name + "</li>\n</ul>\n") ; 
}


/*
    Uses the class variable completed_recipients
    and populates the visible list.
*/
function populate_completed_recipients() { 
    //alert("In populate_completed_recipients") ; 
    var recipients_list = "<ul>\n<li>" + completed_recipients.join("</li>\n<li>") + "</li>\n</ul>\n" ;
    $('#recipients-completed').html(recipients_list) ; 
    $('#completed-total').html(completed_recipients.length) ; 
}


/*
    Get the email addresses defined in the recipients textarea
    Parse them (split on spaces or commas)
    Populate the queued recipients array
    Populate the visible list of queued recipients
*/
function parse_recipients() {

    var defined_recipients = $('#recipients-all').val() ; 
    queued_recipients = defined_recipients.split(/[\s,]+/) ; 
    populate_queued_recipients() ; 
}

/*
    Get the name/email address pairs defined in the recipients textarea
    Parse them (split on commas)
    Populate the queued recipients array
    Populate the visible list of queued recipients
*/
function parse_merge_recipients() {

    var defined_recipients = $('#recipients-all').val() ; 
    defined_recipients = defined_recipients.replace(/(^\s+|\s+$)/g, '');
    queued_recipients = defined_recipients.split(/[,]+/) ; 
    populate_queued_recipients() ; 
}

/*
    Dispatch to the correct function, based on the state of the what-to-do selection.
*/
function perform_action(select_id) { 

    var selector = '#' + select_id ; 
    var what_to_do = $(selector).val() ; 
    
    if (what_to_do === 'no-action-selected') { 
	show_alert ('You much choose an action') ; 
	$('#what-to-do').focus() ; 
	return ;
    }

    if (what_to_do === 'send-one') { 	
	ajax_mail('send-one') ; 
	return ;
    }

    if (what_to_do === 'parse-recipients') { 
	parse_recipients() ; 
	return ;
    }

    if (what_to_do === 'parse-merge-recipients') { 
	parse_merge_recipients() ; 
	return ;
    }

    if (what_to_do === 'throttle-bcc') { 
	if (set_in_process_recipient('email-bcc')) { 
	    ajax_mail('throttle-bcc') ;  	
	} else { 	
	    show_alert('There are no queued recipients.') ; 
	}
	return ;
    }

    if (what_to_do === 'throttle-to') { 
	if (set_in_process_recipient('email-to')) { 
	    ajax_mail('throttle-to') ;  	
	} else { 	
	    show_alert('There are no queued recipients.') ; 
	}
	return ;
    }

    if (what_to_do === 'throttle-merge-to') { 
	if (set_in_process_merge_recipient('email-to')) { 
	    ajax_mail('throttle-merge-to') ;  	
	} else { 	
	    show_alert('There are no queued recipients.') ; 
	}
	return ;
    }

    if (what_to_do === 'clear-queue') { 
	clear_queue() ; 
	return ;
    }

    if (what_to_do === 'clear-all') { 
	clear_queue() ; 
	clear_completed() ; 
	clear_in_process() ; 
	return ;
    }

    if (what_to_do === 'clear-all-merge') { 
	clear_queue() ; 
	clear_completed() ; 
	clear_in_process_merge() ; 
	return ;
    }

    show_alert('Did not understand the selected action: ' + what_to_do) ; 
}

/*
    Escape ampersands since AJAX is cutting off everything after them.
*/
function escape_ampersands(content) {
    var escaped = content.replace(/[&]/g, '%26') ; 
    return escaped ; 
}

/*
    Return a formatted string of the to, cc and bcc fields.
*/
function show_recipients() {

    var recipients = [] ;     

    if ( $('#email-to').val() != '' ) { 
	recipients.push($('#email-to').val()) ; 
    } 
    if ( $('#email-cc').val() != '' ) { 
	recipients.push($('#email-cc').val()) ; 
    } 
    if ( $('#email-bcc').val() != '' ) { 
	recipients.push($('#email-bcc').val()) ; 
    }

    return recipients.join(", ") ; 
}

/*
    Process an AJAX request to the mailing list program, 
    including supplying the "verb" parameter in the query string, 
    based on whether the "test-only" checkbox is checked.

    The callback function used depends on the supplied parameter, 
    either 'throttle-to', 'throttle-bcc', 'throttle-merge-to' or 'send-one'.  
  
    Default is 'send-one'
*/
function ajax_mail(how_many){    

    var ajax_request = newXMLHttpRequest();
    var callbackHandler ;     

    if (how_many === 'throttle-to') { 
	callbackHandler = getReadyStateHandler(ajax_request, update_throttle_to);
    } else {
      if (how_many === 'throttle-bcc') { 
  	callbackHandler = getReadyStateHandler(ajax_request, update_throttle_bcc);
      } else {
        if (how_many === 'throttle-merge-to') { 
    	   callbackHandler = getReadyStateHandler(ajax_request, update_throttle_merge_to);
        } else { 
  	   callbackHandler = getReadyStateHandler(ajax_request, update_send_one);
        }
      }
    }    

    ajax_request.onreadystatechange = callbackHandler;
    ajax_request.open("POST", "mailing-list.php", true);
    ajax_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    var verb = 'no-specified-action' ; 
    if ( $('#test-only').is(':checked') ) { 
	verb = 'check-draft' ; 
	show_alert('Checking draft of mail for ' + show_recipients()) ; 
    } else { 
	verb = 'send-mail' ; 
	show_alert('Sending mail to ' + show_recipients()) ; 
    }

    var query_string = "verb=" + verb ; 
    query_string += "&email-to=" + $('#email-to').val() ; 
    query_string += "&email-cc=" + $('#email-cc').val() ; 
    query_string += "&email-bcc=" + $('#email-bcc').val() ; 
    query_string += "&email-from=" + $('#email-from').val() ; 
    query_string += "&email-from-name=" + $('#email-from-name').val() ; 
    query_string += "&email-reply=" + $('#email-reply').val() ; 
    query_string += "&email-return=" + $('#email-return').val() ; 
    query_string += "&email-subject=" + escape_ampersands($('#email-subject').val()) ; 
    query_string += "&email-body=" + escape_ampersands($('#email-body').val()) ; 

    //alert('Sending query string: ' + query_string) ;    
    //alert("In ajax_mail, sending query string " + query_string) ; 
    ajax_request.send(query_string) ; 
}


var lastPing = 0;

/*
    A callback function for the check-draft action.
    Also called by the other callback function, for the send-mail action.

    receives XML response data from mailing-list.php

    Populates the results section of the page 
    with the actual email that was/would have been sent.

*/
function show_draft(xml_result) {
    
    //alert('Fielding the results in show_draft: ' + xml_result) ; 

    var mail = xml_result.getElementsByTagName("mail")[0];
    //alert('mail: "' + mail + '"') ; 
    var timestamp = mail.getAttribute("timestamp");
    //alert('timestamp: "' + timestamp + '"') ; 
    var to = xml_result.getElementsByTagName("to")[0];
    //alert('to: "' + to + '"') ; 
    var from = xml_result.getElementsByTagName("from")[0];
    //alert('from: "' + from + '"') ; 
    var from_name = xml_result.getElementsByTagName("from_name")[0];
    //alert('from_name: "' + from_name + '"') ; 
    //var from_all = xml_result.getElementsByTagName("from_all")[0];
    var subject = xml_result.getElementsByTagName("subject")[0];
    //alert('subject: "' + subject + '"') ; 
    var headers = xml_result.getElementsByTagName("headers")[0];
    //alert('headers: "' + headers + '"') ; 
    var additional = xml_result.getElementsByTagName("additional")[0];
    //alert('additional: "' + additional + '"') ; 
    var email_body = xml_result.getElementsByTagName("body")[0];
    //alert('email_body: "' + email_body + '"') ; 
    var result = xml_result.getElementsByTagName("result")[0];
    //alert('result: "' + result + '"') ; 
    var return_code = xml_result.getElementsByTagName("return_code")[0];
    //alert('return_code: "' + return_code + '"') ; 

    if (timestamp > lastPing) {
	lastPing = timestamp;
	
	var to_value = to.firstChild.nodeValue;
        //alert('to_value: "' + to_value + '"') ; 
	var from_value = from.firstChild.nodeValue;
        //alert('from_value: "' + from_value + '"') ; 
	//var from_all_value = from_all.firstChild.nodeValue;
	var from_name_value = from_name.firstChild.nodeValue;
        //alert('from_name_value: "' + from_name_value + '"') ; 
	var subject_value = subject.firstChild.nodeValue;
        //alert('subject_value: "' + subject_value + '"') ; 
	var headers_value = headers.firstChild.nodeValue;
        //alert('headers_value: "' + headers_value + '"') ; 
	var additional_value = additional.firstChild.nodeValue;
        //alert('additional_value: "' + additional_value + '"') ; 
	var body_value = email_body.firstChild.nodeValue;
        //alert('body_value: "' + body_value + '"') ; 
	var result_value = result.firstChild.nodeValue;
        //alert('result_value: "' + result_value + '"') ; 
	var return_code_value = return_code.firstChild.nodeValue;
        //alert('return_code_value: "' + return_code_value + '"') ; 

	$('#draft').html("<dl>\n" + 
			 "<dt>Result</dt>\n<dd>" + return_code_value + ": " + result_value + "</dd>\n" + 
			 "<dt>To</dt>\n<dd>" + to_value + "</dd>\n" + 
			 "<dt>From Name</dt>\n<dd>" + from_name_value + "</dd>\n" + 
			 "<dt>From Email</dt>\n<dd>" + from_value + "</dd>\n" + 
			 //"<dt>From All</dt>\n<dd>" + from_all_value + "</dd>\n" + 
			 "<dt class='headers'>Headers</dt>\n<dd>\n<pre>" + headers_value + "</pre>\n</dd>\n" + 
			 "<dt>Additional</dt>\n<dd>\n<pre>" + additional_value + "</pre>\n</dd>\n" + 
			 "<dt>Subject</dt>\n<dd>" + subject_value + "</dd>\n" + 
			 "<dt>Body</dt>\n<dd>\n<pre>" + body_value + "</pre>\n</dd>\n" + 
			 "</dl>\n") ; 
    }
}


/*
    Removes any data in the queued_recipients list
*/
function clear_queue() {
    queued_recipients = [] ; 
    populate_queued_recipients() ; 
}


/*
    Removes any data in the in_process_recipient variable
*/
function clear_in_process() {
    in_process_recipient = '' ; 
    $('#recipients-processing').html('') ; 
}


/*
    Removes any data in the in_process_recipient variable
*/
function clear_in_process_merge() {
    in_process_recipient = '' ; 
    $('#recipients-processing').html('') ; 
    $('#recipients-processing-name').html('') ; 
}


/*
    Removes any data in the queued_recipients list
*/
function clear_completed() {
    completed_recipients = [] ; 
    populate_completed_recipients() ; 
}


/*
    A callback function for the send-mail action.
    receives XML response data from mailing-list.php

    Calls show_draft to display the email and the results of the post submission.

    Adds the in_process_email to the list of completed emails and updates: 
      the list of completed emails
      the count of total emails sent
      the duration of the last transaction
      the overall time of the batch

    Removes the email address from the in-process variable and the bcc field

    makes another call to ajax_mail() after the specified wait time.
    
*/
function update_throttle_bcc(xml_result) {

    var verb = xml_result.getElementsByTagName("verb")[0];
    var verb_value = verb.firstChild.nodeValue;
    var old_phrase = '' ; 
    var new_phrase = '' ; 
    if (verb_value === 'check-draft') { 
	old_phrase = 'Checked draft of email to ' ; 
	new_phrase = ' checking draft of ' ; 
    } else if (verb_value === 'send-mail') { 
	old_phrase = 'Sent mail to ' ; 
	new_phrase = ' sending ' ; 
    } else { 
	old_phrase = 'Not sure what went down with submission to ' ;
	new_phrase = ' doing not sure what (' + verb_value + ') with ' ; 
    }

    var how_many = 'throttle-bcc' ; 

    show_alert(old_phrase + in_process_recipient) ; 
    show_draft(xml_result) ; 

    completed_recipients.unshift(in_process_recipient) ; 
    completed_total++ ; 
    populate_completed_recipients() ;     

    var wait_time = $('#wait-time').val() ; 

    if (set_in_process_recipient('email-bcc')) { 
	add_alert('Waiting ' + wait_time + 'ms before ' + 
		  new_phrase + ' email to ' + $('#email-bcc').val()) ;
	setTimeout('ajax_mail("' + how_many + '")', wait_time) ; 
    }
    else { 	
	add_alert('No more queued recipients.') ; 
    }
}

/*
    A callback function for the send-mail action.
    receives XML response data from mailing-list.php

    Calls show_draft to display the email and the results of the post submission.

    Adds the in_process_email to the list of completed emails and updates: 
      the list of completed emails
      the count of total emails sent
      the duration of the last transaction
      the overall time of the batch

    Removes the email address from the in-process variable and the bcc field

    makes another call to ajax_mail() after the specified wait time.

    Just like throttle_update_bcc but changes the to: recipient, rather than the bcc recipient.
    
*/
function update_throttle_to(xml_result) {

    var verb = xml_result.getElementsByTagName("verb")[0];
    var verb_value = verb.firstChild.nodeValue;
    var old_phrase = '' ; 
    var new_phrase = '' ; 
    if (verb_value === 'check-draft') { 
	old_phrase = 'Checked draft of email to ' ; 
	new_phrase = ' checking draft of ' ; 
    } else if (verb_value === 'send-mail') { 
	old_phrase = 'Sent mail to ' ; 
	new_phrase = ' sending ' ; 
    } else { 
	old_phrase = 'Not sure what went down with submission to ' ;
	new_phrase = ' doing not sure what (' + verb_value + ') with ' ; 
    }

    var how_many = 'throttle-to' ; 

    show_alert(old_phrase + in_process_recipient) ; 
    show_draft(xml_result) ; 

    completed_recipients.unshift(in_process_recipient) ; 
    completed_total++ ; 
    populate_completed_recipients() ;     

    var wait_time = $('#wait-time').val() ; 

    if (set_in_process_recipient('email-to')) { 
	add_alert('Waiting ' + wait_time + 'ms before ' + 
		  new_phrase + ' email to ' + $('#email-to').val()) ;
	setTimeout('ajax_mail("' + how_many + '")', wait_time) ; 
    }
    else { 	
	add_alert('No more queued recipients.') ; 
    }
}

/*
    A callback function for the send-mail action.
    receives XML response data from mailing-list.php

    Calls show_draft to display the email and the results of the post submission.

    Adds the in_process_name + in_process_recipient to the list of completed emails and updates: 
      the list of completed emails
      the count of total emails sent
      the duration of the last transaction
      the overall time of the batch

    Removes the name & email address from the in-process variables and the to field

    makes another call to ajax_mail() after the specified wait time.

    Similar to throttle_update_bcc but changes the to: recipient, rather than the bcc recipient, and the handling of the two in_process variables rather than one.
    
*/
function update_throttle_merge_to(xml_result) {

    //alert("Must have gotten response: in update_throttle_merge_to") ; 
    var verb = xml_result.getElementsByTagName("verb")[0];
    var verb_value = verb.firstChild.nodeValue;
    var old_phrase = '' ; 
    var new_phrase = '' ; 
    if (verb_value === 'check-draft') { 
	old_phrase = 'Checked draft of email to ' ; 
	new_phrase = ' checking draft of ' ; 
    } else if (verb_value === 'send-mail') { 
	old_phrase = 'Sent mail to ' ; 
	new_phrase = ' sending ' ; 
    } else { 
	old_phrase = 'Not sure what went down with submission to ' ;
	new_phrase = ' doing not sure what (' + verb_value + ') with ' ; 
    }

    var how_many = 'throttle-merge-to' ; 

    show_alert(old_phrase + in_process_name + ' ' + in_process_recipient) ; 

    //alert("In update_throttle_merge_to, the old in_process_name is '" + in_process_name + "' and in_process_recipient is '" + in_process_recipient) ; 
    //alert("In update_throttle_merge_to, showing draft of xml results: " + xml_result) ; 
    show_draft(xml_result) ;
 
    //alert("In update_throttle_merge_to, unshifting from completed_recipients"); 
    completed_recipients.unshift(in_process_name + ' ' + in_process_recipient) ; 
    completed_total++ ; 
    populate_completed_recipients() ;     

    //alert("Updating wait time") ; 
    var wait_time = $('#wait-time').val() ; 

    if (set_in_process_merge_recipient('email-to')) { 
	add_alert('Waiting ' + wait_time + 'ms before ' + 
		  new_phrase + ' email to ' + $('#email-to').val()) ;
	setTimeout('ajax_mail("' + how_many + '")', wait_time) ; 
    }
    else { 	
	add_alert('No more queued recipients.') ; 
    }
}

/*
    A callback function for the send-one action.
    receives XML response data from mailing-list.php

    Calls show_draft to display the email and the results of the post submission.
*/
function update_send_one(xml_result) {

    var verb = xml_result.getElementsByTagName("verb")[0];
    var verb_value = verb.firstChild.nodeValue;


    var phrase = '' ;
    if (verb_value === 'check-draft') { 
	phrase = 'Checked draft of email to ' ; 
    } else if (verb_value === 'send-mail') { 
	phrase = 'Sent mail to ' ; 
    } else { 
	phrase = 'Not sure what went down with submission to ' ;
    }

    show_alert(phrase + show_recipients()) ; 
    show_draft(xml_result) ; 
}

/*
    Moves the first email address from the queued_recipients list
    into the Bcc field and the in_process_recipient field.

    Returns true if there are queued addresses.
    Returns false if there are no queued addresses.
*/
function set_in_process_recipient(field_name) {

    var selector = '#' + field_name ; 

    //alert('in set_in_process_recipient') ; 
    
    if (queued_recipients.length > 0 ) { 
	
	in_process_recipient = queued_recipients[0] ; 
        //alert('in_process_recipient is "' + in_process_recipient + '"')
        in_process_recipient = in_process_recipient.replace(/(^\s+|\s+$)/g, '');
        //alert('in_process_recipient is "' + in_process_recipient + '"')
	$(selector).val(in_process_recipient) ; 
	populate_in_process_recipient() ;	
	
	queued_recipients.splice(0,1) ;
	populate_queued_recipients() ; 
	
	return true ; 
    } 
    else { 
	in_process_recipient = '' ; 
	$(selector).val('') ; 
	$('#recipients-processing').html('') ; 
	return false ; 
    }
}


/*
    Parse the first name/email combination from the queued_recipients list
    into a name and email address.  

    Populates the variables in_process_recipient and in_process_name
    Populates the specified field (eg, To:) with the email address
    This includes the body field, which is done by way of the merge_message() function.

    There can be multiple names (first, last, etc.)
    but only the first name is used and any others are ignored.

    Returns true if there are queued name/addresses
    Returns false if there are no queued name/addresses
*/
function set_in_process_merge_recipient(field_name) {

    var selector = '#' + field_name ; 

    //alert('in set_in_process_merge_recipient') ; 
    
    if (queued_recipients.length > 0 ) { 

        var in_process = [] ;  
        var next_recipient = queued_recipients[0] ; 
        next_recipient = next_recipient.replace(/^(\s*)|(\s*)$/g, '')
        in_process = next_recipient.split(" ") ; 
        
        //alert("New in_process recipient is '" + in_process + "'") ; 

        if (in_process.length < 2) {
   	   in_process_recipient = '' ; 
   	   in_process_name = '' ; 
	   $(selector).val('') ; 
	   $('#recipients-processing').html('') ; 
           //alert("After splitting in_process, it had less than 2 parts.  Done.") ; 
	   return false ; 
        }

        in_process_recipient = in_process.pop() ;
        in_process_name = in_process[0] ; 
        //alert("In set_in_process_merge_recipient with new in_process_name '" + in_process_name +"' and in_process_recipient '" + in_process_recipient + "'") ; 

	$(selector).val(in_process_recipient) ; 
	populate_in_process_recipient() ;	
	populate_in_process_name() ;	
        merge_message() ; 
	
	queued_recipients.splice(0,1) ;
	populate_queued_recipients() ; 
	
	return true ; 
    } 
    else { 
	in_process_recipient = '' ; 
	$(selector).val('') ; 
	$('#recipients-processing').html('') ; 
	return false ; 
    }
}

/*
    Get the contents of message-template

    Replace the placeholder XXX_NAME_XXX with the vaue of in_process_name
    in the message 

    Populate the email-body with the merged message
*/
function merge_message() {

    var template = $('#message-template').val() ; 
    //alert("in merge_message with template: " + template) ; 
    $('#email-body').val(template.split("XXX_NAME_XXX").join(in_process_name)) ; 
}

/*
    Create an XMLHTTPRequest.
*/
function newXMLHttpRequest() {
    var xml_request = false;
    if (window.XMLHttpRequest) {
	xml_request = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
    	// Try ActiveX
	try { 
	    xml_request = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (e1) { 
	    // first method failed 
	    try {
		xml_request = new ActiveXObject("Microsoft.XMLHTTP");
	    } catch (e2) {		
		// both methods failed 
		show_alert('Could not create a valid XML HTTP Request or an ActiveX object.') ;
	    } 
	}
    }
    return xml_request;
} 

/*
    Provides a function to handle the AJAX callback.
*/
function getReadyStateHandler(ajax_request, responseXmlHandler) {
    return function () {
	if (ajax_request.readyState == 4) {
	    if (ajax_request.status == 200) {
        	responseXmlHandler(ajax_request.responseXML);
	    } else {
		show_alert('AJAX request ready state was not 4.  Status is: ' + 
			   ajax_request.status) ; 
      	    }
    	}
    }
}
