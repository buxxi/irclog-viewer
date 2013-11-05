define(["jquery", "flotselect"], function() {
	return function DateGraph() {
		var self = this;
		var stats = $("#stats");
		var chart = $("#chart");
		var fromDate = $("#from_date");
		var toDate = $("#to_date");
		var text = $("#text");
		var user = $("#user");

		var options = {
			grid: {
				hoverable : true,
				labelMargin : 0,
			},
			series: {
				bars: {show: true, barWidth: 0.9, align: 'center'},
				points : { show : true, radius : 0 },
				color : '#6DAB14',
			},
			xaxis: { 
				ticks : 0,
				mode : "time",
				timeformat : "%y-%0m-%0d"
			},
			yaxis: { 
				min: 0,
				ticks : 0
			},
			selection: { mode: "x" }
		};
		var list = [];

		this.init = function() {
			self.update();
			self.init = function() {};
		}

		this.update = function() {
			$.getJSON("py/count.py", { 
				channel : currentChannel(),
				user : user.val(),
				text : text.val()
			}, function(data) {
				list = [];
				$.each(data, function (i, item) {
					list.push([Date.parse(item['date']),item['count']]);
				});	
				self.plot();		
			});

			$.getJSON("py/stats.py", {
				channel : currentChannel(),
				text : text.val(),
				daterange : fromDate.val() + ":" + toDate.val()
			}, function (data) {
				stats.empty();
				var dl = $("<dl>");
				$.each(data, function (i, item) {
					dl.append($("<dt class='user'>").text(item['user']));
					dl.append($("<dd>").text(item['count']));
				});
				stats.append(dl);
			});

			chart.unbind("plotselected");
			chart.unbind("plotunselected");
			fromDate.unbind("blur");
			toDate.unbind("blur");
			user.unbind("blur");
			text.unbind("blur");

			user.bind("blur", self.update);
			text.bind("blur", self.update);

			chart.bind("plothover", function(event, pos, item) {
				$("#tooltip").remove();

				if (item) {
					var content = $.plot.formatDate(new Date(item.datapoint[0]), options.xaxis.timeformat) + ' = ' + Math.round(item.datapoint[1]);
					$('<div id="tooltip">' + content + '</div>').css({ left: pos.pageX + 5, top: pos.pageY + 5}).appendTo("body").fadeIn(200);	
				}
			});

			chart.bind("plotselected", function (event, ranges) {
				options.xaxis.min = ranges.xaxis.from;
				options.xaxis.max = ranges.xaxis.to;

				self.plot();
			});
			chart.bind("plotunselected", function (event) {
				delete options.xaxis.min;
				delete options.xaxis.max;

				self.plot();
			});

			fromDate.bind("blur", function() {
				options.xaxis.min = this.value ? Date.parse(this.value) : undefined;
				self.update();
			});
			toDate.bind("blur", function() {
				options.xaxis.max = this.value ? Date.parse(this.value) : undefined;
				self.update();
			});
		}

		this.plot = function() {
			$.plot(chart, [list], options);
			fromDate.val($.plot.formatDate(options.xaxis.min ? new Date(options.xaxis.min) : new Date(list[0][0]), options.xaxis.timeformat));
			toDate.val($.plot.formatDate(options.xaxis.max ? new Date(options.xaxis.max) : new Date(list[list.length -1][0]), options.xaxis.timeformat));
		}
	};
});
