define([], function() {
	return function MessageFormatter() {
		var self = this;

		var formats = {
			"SAY" : function(node) { return self.fixURLs(node.message); },
			"ME" : function(node) { return "* " + self.fixURLs(node.message); },
			"JOIN" : function(node) { return "has joined the channel"; },
			"PART" : function(node) { return "has left the channel"; },
			"QUIT" : function(node) { return "has quit IRC (" + self.fixURLs(node.message) + ")"; },
			"OP" : function(node) { return "gives op to " + node.opped; },
			"DEOP" : function(node) { return "removes op from " + node.deopped; },
			"VOICE" : function(node) { return "gives voice to " + node.voiced; },
			"DEVOICE" : function(node) { return "removes voice from " + node.devoiced; },
			"TOPIC" : function(node) { return "changes topic to: " + self.fixURLs(node.topic); },
			"NICK" : function(node) { return "changes nick to " + node.new_nick; },
			"MODE" : function(node) { return "sets channel mode: " + node.mode; },
			"BAN" : function(node) { return "bans host " + node.banmask; },
			"UNBAN" : function(node) { return "unbans host " + node.banmask; },
			"KICK" : function(node) { return "kicked " + node.user_kicked + " from the channel with the reason: " + node.reason; }
		};

		this.format = function(node) {
			formatting = formats[node.type];
			if (formatting == null) {
				return "*****" + node.type+ "*****";
			}
			return formatting(node);
		}

		this.fixURLs = function(text) {
			var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	  		return text.replace(exp,"<a href='$1'>$1</a>"); 
		}
	};
});
