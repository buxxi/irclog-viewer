define(["linebuilder", "jquery", "flot"], function(LineBuilder) {
	function NormalMessageViewer() {
			var self = this;	
			clear();

			this.scrollUp = function() {
				var firstLine = $(".line:first");
				self.list(0, firstLine.attr("id"), function(result) {
					$("#log").prepend(result);
					window.scrollTo(0, firstLine.offset().top - 140);	
				});
			}

			this.scrollDown = function() {
				var lastLine = $(".line:last");
				self.list(lastLine.attr("id"), 0, function(result) {
					$("#log").append(result);					
				});
			}

			this.list = function (from, to, callback) {
				var params = { channel : currentChannel(), range : from + ":" + to };
				$.getJSON("py/messages.py", params, function(data) {		
					var result = $("<ul class='page'>");		
					self.display(data, result);
					callback(result);
				});
			}

			this.display = function(data, result) {
				var lines = [];
				var previousDate = new Date(0);
				for (index in data) {
					var node = data[index];
					node.timestamp = new Date(Date.parse(node.timestamp));	
					if (node.timestamp.toLocaleDateString() != previousDate.toLocaleDateString()) {
						build(result, lines);
						lines = [];
						var dateNode = $("<h3>");
						dateNode.text($.plot.formatDate(node.timestamp, "%y-%0m-%0d")); //TODO: get rid of flot-dependency for date format
						result.append(dateNode);	
					}

					previousDate = node.timestamp;

					if (isGroupedType(node)) {
						lines.push(node);
						continue;
					}
					build(result, lines);
					build(result, [node]);
					lines = [];
				}
				build(result, lines);
			}

			function build(result, lines) {
				if (lines.length == 0) {
					return;
				}
				var builder = new LineBuilder.Single();		
				if (lines.length > 1) {
					builder = new LineBuilder.Grouped(builder);
				}
				builder.build(lines, result);
			}

			function isGroupedType(node) {
				if (["JOIN", "PART", "QUIT", "OP", "VOICE", "DEOP", "DEVOICE", "NICK"].indexOf(node.type) == -1) {
					return false;
				}
				return true;
			}

			function clear() {
				$("#log").empty();
			}
	}

	function SearchMessageViewer() {
		var self = this;

		this.scrollUp = function() {};

		this.scrollDown = function() {};

		this.list = function (from, to, callback) {
			var params = { 
				channel : currentChannel(),
				user : $("#user").val(),
				text : $("#text").val(),
				daterange : $("#from_date").val() + ":" + $("#to_date").val()
			};
			$.getJSON("py/messages.py", params, function(data) {		
				var result = $("<ul class='page'>");		
				new NormalMessageViewer().display(data, result);
				$("#log").append(result);
				callback(result);
			});
		}
	}

	return {	
		Normal: NormalMessageViewer,
		Search: SearchMessageViewer
	}
});
