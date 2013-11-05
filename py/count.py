import ircconfig
import json
import MySQLdb
from datetime import datetime
from cgi import parse_qs, escape

def application(environ, start_response):
    parameters = parse_qs(environ.get('QUERY_STRING',''))
    if 'channel' in parameters:
	status = '200 OK'
	channel = escape(parameters['channel'][0])
	user = ''
	text = ''
	if 'user' in parameters:
		user = escape(parameters['user'][0])
	if 'text' in parameters:	
		text = escape(parameters['text'][0])
	content = get_count(channel, user, text)
    else:
	status = '204 No Content'
	content = ''

    response_headers = [('Content-type', 'text/plain'),('Content-Length', str(len(content)))]
    start_response(status, response_headers)
    return [content]

def get_count(channel, user, text):
    conn = MySQLdb.connect (host = ircconfig.SQL_HOST, user = ircconfig.SQL_USER, passwd = ircconfig.SQL_PASSWORD, db = ircconfig.SQL_DB, charset='utf8', use_unicode = True)
    cursor = conn.cursor()
    cursor.execute("SELECT DATE(date), COUNT(*) from channel_log WHERE channel = %s AND (%s = '' OR user = %s) AND (%s = '' OR message like %s) GROUP BY DATE(date)", [channel, user, user, text, "%" + text + "%"])

    output = json.dumps([handle(x) for x in cursor.fetchall()], indent=4)
    return output

def handle(input):
	return {
		'date' : input[0].isoformat(),
		'count' : input[1]
	}



