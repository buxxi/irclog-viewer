import ircconfig
import json
import MySQLdb
from datetime import datetime
from cgi import parse_qs, escape

def application(environ, start_response):
    parameters = parse_qs(environ.get('QUERY_STRING',''))
    if 'channel' in parameters and 'range' in parameters:
	status = '200 OK'
	channel = escape(parameters['channel'][0])
	fromid, toid = parameters['range'][0].split(':')
	content = get_log(channel, int(fromid), int(toid))
    elif 'channel' in parameters:
	status = '200 OK'
	channel = escape(parameters['channel'][0])
	text = ''
	fromdate = ''
	todate = ''
	user = ''
	if 'user' in parameters:
		user = escape(parameters['user'][0])
	if 'text' in parameters:	
		text = escape(parameters['text'][0])
	if 'daterange' in parameters:
		fromdate, todate = parameters['daterange'][0].split(':')
	content = search_log(channel, text, fromdate, todate, user)
    else:
	status = '204 No Content'
	content = ''

    response_headers = [('Content-type', 'text/plain'),('Content-Length', str(len(content)))]
    start_response(status, response_headers)
    return [content]

def get_log(channel, fromid, toid):
    conn = MySQLdb.connect (host = ircconfig.SQL_HOST, user = ircconfig.SQL_USER, passwd = ircconfig.SQL_PASSWORD, db = ircconfig.SQL_DB, charset='utf8', use_unicode = True)
    cursor = conn.cursor()
    if fromid != 0 and toid != 0:
    	cursor.execute("SELECT id,code,user,host,user_mode,target_user,message,date FROM channel_log WHERE channel = %s AND id > %s AND id < %s ORDER BY id DESC LIMIT 200", [channel,fromid,toid])
    elif fromid == 0 and toid != 0:
	cursor.execute("SELECT id,code,user,host,user_mode,target_user,message,date FROM channel_log WHERE channel = %s AND id < %s ORDER BY id DESC LIMIT 200", [channel,toid])
    elif fromid != 0 and toid == 0:
	cursor.execute("SELECT id,code,user,host,user_mode,target_user,message,date FROM channel_log WHERE channel = %s AND id > %s ORDER BY id ASC LIMIT 200", [channel,fromid])
    else:
	cursor.execute("SELECT id,code,user,host,user_mode,target_user,message,date FROM channel_log WHERE channel = %s ORDER BY id DESC LIMIT 200", [channel])
    result = cursor.fetchall()
    if fromid == 0 or toid != 0:
	result = reversed(result)

    output = json.dumps([handle(x) for x in make_dict_list(result, cursor)], indent=4)
    return output

def search_log(channel, text, fromdate, todate, user):
    conn = MySQLdb.connect (host = ircconfig.SQL_HOST, user = ircconfig.SQL_USER, passwd = ircconfig.SQL_PASSWORD, db = ircconfig.SQL_DB, charset='utf8', use_unicode = True)
    cursor = conn.cursor()
    cursor.execute("select result.*,IF(result.id = search.id, 1, 0) as exact from (select channel_log.* from channel_log where (code = 'SAY' OR code = 'ME') AND channel = %s AND (%s = '' OR message like %s) AND (%s = '' OR date >= %s) AND (%s = '' OR date <= %s) AND (%s = '' OR %s = user) LIMIT 20) search, (select channel_log.* from channel_log where channel = %s) as result where result.date between (search.date - interval 10 minute) and (search.date + interval 10 minute) group by result.id order by result.id", [channel, text, "%" + text + "%", fromdate, fromdate, todate, todate, user, user, channel])
    result = cursor.fetchall()

    return json.dumps([handle(x) for x in make_dict_list(result, cursor)], indent=4) 

def handle(input):
	fix_timestamp(input)
	group_user(input)
	remove_nulls(input)
	rename_key(input, "code", "type")

	renames = {
		"OP" : [("target_user", "opped")],
		"DEOP" : [("target_user", "deopped")],
		"VOICE" : [("target_user", "voiced")],
		"DEVOICE" : [("target_user", "devoiced")],
		"NICK" : [("target_user", "new_nick")],
		"KICK" : [("target_user", "kicked")],
		"TOPIC" : [("message", "topic")],
		"MODE" : [("message", "mode")],
		"BAN" : [("message", "banmask")],
		"UNBAN" : [("message", "banmask")],
		"KICK" : [("message", "reason"), ("target_user", "user_kicked")]
	}
	if input["type"] in renames:
		for x in renames[input["type"]]:
			rename_key(input, x[0], x[1])

	return input

def rename_key(input, name, to):
	input[to] = input[name]
	del input[name]

def fix_timestamp(dict):
	dict["timestamp"] = dict["date"].isoformat()
	del dict["date"]

def group_user(dict):
	out = {}
	modes = {"@" : "operator", "+" : "voice"}
	out["nick"] = dict["user"]
	out["host"] = dict["host"]
	out["type"] = modes.get(dict["user_mode"], "normal")
	del dict["user"]
	del dict["host"]
	del dict["user_mode"]
	dict["user"] = out

def make_dict_list(result, cursor):
	out = []
	for x in result:
		out.append(make_dict(x, cursor))
	return out

def make_dict(row, cursor):
    d = {}
    for idx, col in enumerate(cursor.description):
	d[col[0]] = row[idx]
    return d

def remove_nulls(d):
	for key, value in d.items():
		if value is None:
			del d[key]
		elif isinstance(value, dict):
			remove_nulls(value)
