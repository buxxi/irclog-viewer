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
	text = ''
	fromdate = ''
	todate = ''
	if 'text' in parameters:	
		text = escape(parameters['text'][0])
	if 'daterange' in parameters:
		fromdate, todate = parameters['daterange'][0].split(':')
	content = get_count(channel, text, fromdate, todate)
    else:
	status = '204 No Content'
	content = ''

    response_headers = [('Content-type', 'text/plain'),('Content-Length', str(len(content)))]
    start_response(status, response_headers)
    return [content]

def get_count(channel, text, fromdate, todate):
    conn = MySQLdb.connect (host = ircconfig.SQL_HOST, user = ircconfig.SQL_USER, passwd = ircconfig.SQL_PASSWORD, db = ircconfig.SQL_DB, charset='utf8', use_unicode = True)
    cursor = conn.cursor()
    cursor.execute("SELECT user, COUNT(*) from channel_log WHERE channel = %s AND (%s = '' OR message like %s) AND (%s = '' OR date >= %s) AND (%s = '' OR date <= %s) GROUP BY user ORDER BY COUNT(*) DESC LIMIT 20", [channel, text, "%" + text + "%", fromdate, fromdate, todate, todate])

    output = json.dumps([handle(x) for x in cursor.fetchall()], indent=4)
    return output

def handle(input):
	return {
		'user' : input[0],
		'count' : input[1]
	}



