define(["formatter", "jquery"], function(MessageFormatter) {
	return {
		Grouped: function(delegate) {
			var delegate = delegate;

			this.build = function(lines, parent) {
				var node = $("<li class='group'>");
				node.click(function() {
					node.toggleClass("group");
					node.toggleClass("expandedgroup");
				});
				var groupNode = $("<ul>");
				var text = $("<span class='groupsummary'>");
				text.text("grouped " + lines.length + " lines, click to show.");
				node.append(text);
				node.append(groupNode);
				parent.append(node);
				for (var i in lines) {
					delegate.build([lines[i]], groupNode);
				}
			}
		},
		Single: function() {
			this.build = function(lines, parent) {
				var line = lines[0];
				var node = $("<li class='line'>");
				var timenode = $("<div class='timestamp'>");
				var nicknode = $("<h5 class='user'>");
				var textnode = $("<p class='message'>");
	
				node.attr("id",line.id);
				node.addClass(line.type.toLowerCase());		
				timenode.text(line.timestamp.toTimeString().substring(0,8));
				nicknode.text(line.user.nick);
				nicknode.attr('title',line.user.host);
				if (line.user.type) {
					nicknode.addClass(line.user.type);
				}
				if (line.exact) {
					node.addClass("match");
				}	
				textnode.html(new MessageFormatter().format(line));
				node.append(timenode);
				node.append(nicknode);
				node.append(textnode);
				parent.append(node);
			}
		}
	};
});
