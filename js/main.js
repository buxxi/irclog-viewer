require.config({
	baseUrl: 'js',
	paths: {
		flotselect: 'ext/jquery.flot.selection.min',
		flot: 'ext/jquery.flot.min',
		jquery: 'ext/jquery-1.4.2.min'
	},
	shim: {
		'flotselect': ['flot'],
		'flot': ['jquery']
	}
});

	function currentChannel() {
		var loc = window.location.toString();
		var i = loc.lastIndexOf("/") + 1;
		var channel = loc.substring(i);
		return channel;
	}

require(["logviewer", "dategraph"], function(LogViewer, DateGraph) {	
	function menuItem(href) {
                var li = $("<li>");                
                var link = $("<a>");
                link.text(href);
                link.attr("href", href);
                li.append(link);
		if (href == currentChannel()) {
			li.addClass("active");
		}
                return li;
        }	
	
	function initChannels() {
		var channels = localStorage.getItem("channels");
		channels = channels ? channels.split(",") : [];

		if (channels.indexOf(currentChannel()) == -1) {
			channels.push(currentChannel());
		}

		for (var i in channels) {
			var m = menuItem(channels[i]);
			$("#channels ul").append(m);
		}

		localStorage.setItem("channels", channels.join(","));	
	}

	var messageLog = new LogViewer.Normal();

	$(document).scroll(function() {
		var scrollPos = $(document).scrollTop();
		if (scrollPos < 10) {
			messageLog.scrollUp();
		} else if (scrollPos + $(window).height() > $(document).height() - 10) {
			messageLog.scrollDown();
		}
	});
	$(document).ready(function() {
		var graph = new DateGraph();
		var originalTopValue = $("#channels").css("top");
		var originalRightValue = $("#search").css("right");

		$("#channels").hover(function() { $(this).animate({top:'0'},{queue:false,duration:500});}, function() { $(this).animate({top:originalTopValue},{queue:false,duration:500});});
		$("#search").hover(function() { $(this).animate({right:'0'},500, graph.init); }, function() { $(this).animate({right:originalRightValue},{queue:false,duration:500});});
		$("#search_actions input").click(function() {
			messageLog = new LogViewer.Search();
			messageLog.list(0,0,function() {});
		});

		initChannels();
		messageLog = new LogViewer.Normal();
		messageLog.list(0, 0, function(result) {
			$("#log").append(result);
			window.scrollTo(0, document.body.scrollHeight - $(window).height() - 90);
		});				
	});
});
