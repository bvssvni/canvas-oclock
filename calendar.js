/*
 calendar.js - Calendar html app using canvas.
 BSD license.
 by Sven Nilsen, 2012
 http://www.cutoutpro.com
 
 Version: 0.000 in angular degrees version notation
 http://isprogrammingeasy.blogspot.no/2012/08/angular-degrees-versioning-notation.html
 */

/*
 
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 
 1. Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 
 The views and conclusions contained in the software and documentation are those
 of the authors and should not be interpreted as representing official policies,
 either expressed or implied, of the FreeBSD Project.
 
 */

// Formats a date.
function formatDate(date) {
	var d = date.getDate()
	var m = date.getMonth();
	var y = date.getFullYear();
	var str_2 = "00";
	var d_str = "" + d;
	var m_str = "" + (m+1);
	var y_str = "" + y;
	d_str = str_2.substring(d_str.length) + d_str;
	m_str = str_2.substring(m_str.length) + m_str;
	return d_str + "." + m_str + "." + y_str;
}

// Parses a string into a date.
function parseDate(strDate) {
	var dateParts = strDate.split(".");
	return new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
}

var quotes = [
"Today, I am planning to be impulsive.",
"Waiting for something to happen, is 100% waste of time.",
"Failing to plan equals planning to fail.",
"Focus is a matter of deciding what things you're not going to do.",
"You can click the link 'Manual' if you get stuck.",
"Tip: Use short descriptions, they are easier to remember.",
"Heard of milestones? Read about them in the 'Manual'.",
"<--- There, there 'Manual', it's there!",
"Select multiple days to insert repeating tasks.",
"The color of task changes dependent on the description.",
"Give a milestone same name as tasks to sum hours.",
"Use 'backspace' to delete.",
"Insert task by selecting, type description and then 'enter'.",
"You can expand the view on the right or bottom edge.",
"The settings under the calendar controls the view.",
"Click 'Update Url' before you bookmark.",
"Share with other people, by clicking 'Update Url' and copy the web address."
];

var background_style = "#303030";
var header_height = 20;
var header_fill_style = "#333333";
var left_column_width = 150;
var left_column_style = "#333333";
var right_column_width = 80;
var line_height = header_height;
var line_width = 1;
var line_week_width = 2;
var line_style = "#888888";
var date_font = "17px Georgia";
var date_font_style = "#888888";
var date_font_selected_style = "#bbbbbb";
var date_offset = -3;
var hour_font = "17px Georgia";
var hour_font_style = "#888888";
var hour_font_selected_style = "#bbbbbb";
var hour_offset = date_offset;
var title_font = "17px Georgia";
var title_font_style = "rgba(80, 147, 161, 1)";
var box_width, box_height;
var ctx;
var now = new Date();
var date_format = "dd.mm.yy";
var start_hour = 6;
var end_hour = 22;
var from_date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var selected_quarter_start = dateInQuarters(from_date) + start_hour * 4;
var selected_quarter_end = selected_quarter_start + 8;
var selected_quarter_style = "#FFFFFF";
var selected_quarter_line_width = 3;
var selected_description = "";
var selected_quarter_font = "17px Georgia";
var default_quarter_font = "17px Georgia";
var default_quarter_style = "rgba(204, 204, 204, 1)";
var milestone_style = "#cccccc";
var selected_milestone_style = "#00FFFF";
var default_quarter_background = "rgba(0, 0, 150, 0.5)";
var default_quarter_line_width = 2;
var description_offset = date_offset;
var tasks = [];
var colors = [
			  "rgba(110, 73, 0, 0.5)",
			  "rgba(186, 124, 0, 0.5)",
			  "rgba(18, 52, 59, 0.5)",
			  "rgba(80, 147, 161, 0.5)",
			  "rgba(145, 145, 145, 0.5)",
			  "rgba(110, 110, 110, 0.5)"
			  ];

$(function() {
  $( "#fromDate" ).datepicker({ dateFormat: date_format,
							  onSelect: onSelectFromDate });
  $( "#toDate" ).datepicker({ dateFormat: date_format });
  });

function newTask(quarterStart,
				 quarterEnd,
				 description) {
	var task = new Object();
	task.quarterStart = quarterStart;
	task.quarterEnd = quarterEnd;
	task.description = description;
	return task;
}

function subtractMilestone(quarterStart, quarterEnd) {
	for (var i = tasks.length-1; i >= 0; i--) {
		var t = tasks[i];
		if (t.quarterStart != t.quarterEnd) {
			continue;
		}
		if (t.quarterEnd != quarterStart && t.quarterEnd != quarterEnd) {
			continue;
		}
		
		tasks.splice(i, 1);
	}
}

function subtractTask(quarterStart, quarterEnd) {
	if (quarterEnd == quarterStart) {
		subtractMilestone(quarterStart, quarterEnd);
		return;
	}
	
	for (var i = tasks.length-1; i >= 0; i--) {
		var t = tasks[i];
		if (t.quarterEnd == t.quarterStart) {
			// Skip milestones.
			continue;
		}
		if (quarterStart < t.quarterEnd && quarterEnd >= t.quarterStart) {
			// 3 cases, clip first, last and split.
			if (quarterStart <= t.quarterStart) {
				t.quarterStart = quarterEnd;
				
			} else if (quarterEnd >= t.quarterEnd) {
				t.quarterEnd = quarterStart;
				
			} else {
				// Split.
				var a = newTask(t.quarterStart,
								quarterStart,
								t.description);
				var b = newTask(quarterEnd,
								t.quarterEnd,
								t.description);
				tasks.splice(i, 1, a, b);
			}
			
			if (t.quarterEnd <= t.quarterStart) {
				tasks.splice(i, 1);
			}
		}
	}
}

function renderLine(ctx, x1, y1, x2, y2) {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

function visibleWidth() {
	return box_width - left_column_width - right_column_width;
}

function visibleDays() {
	return Math.floor((box_height - header_height) / line_height - 1);
}

function visibleDaysHeight() {
	return visibleDays() * line_height;
}

function dateInQuarters(dt) {
	return Math.floor(dt.getTime() / 1000 / 60 / 15);
}

function quarterToDate(q) {
	return new Date(q * 1000 * 60 * 15);
}

function quartersStride() {
	return 24 * 4;
}

function posToQuarters(x, y) {
	var qx = 0;
	if (x >= left_column_width + visibleWidth()) {
		qx = (end_hour - start_hour) * 4;
	} else if (x <= left_column_width) {
		qx = 0;
	} else {
		var hours = end_hour - start_hour;
		qx = Math.round(4 * (x - left_column_width) * hours / visibleWidth());
	}
	
	var line = 0;
	if (y <= header_height) {
		line = 0;
	} else if (y >= header_height + visibleDaysHeight()) {
		line = visibleDays() - 1;
	} else {
		line = Math.floor((y - header_height) / line_height);
	}
	
	return dateInQuarters(from_date) +
	start_hour * 4 + qx + quartersStride() * line;
}

function quarterIntervalToRect(q1, q2) {
	min = Math.min(q1, q2);
	max = Math.max(q1, q2);
	
	var hours = quarterIntervalHours(min, max);
	var hour1 = hours[0];
	var hour2 = hours[1];
	
	var lines = quarterIntervalLines(min, max);
	var line1 = lines[0];
	var line2 = lines[1];
	
	if (hour2 < hour1) {
		var tmp = hour2;
		hour2 = hour1;
		hour1 = tmp;
	}
	if (line2 < line1) {
		var tmp = line2;
		line2 = line1;
		line1 = tmp;
	}
	
	var hourWidth = visibleWidth() / (end_hour - start_hour);
	var x = (hour1 - start_hour) * hourWidth + left_column_width;
	var y = line1 * line_height + header_height;
	var w = (hour2 - hour1) * hourWidth;
	var h = (line2 - line1) * line_height + line_height;
	
	return [x, y, w, h];
}

function quarterIntervalFix(q1, q2) {
	min = Math.min(q1, q2);
	max = Math.max(q1, q2);
	
	var hours = quarterIntervalHours(min, max);
	var hour1 = hours[0];
	var hour2 = hours[1];
	
	var lines = quarterIntervalLines(min, max);
	var line1 = lines[0];
	var line2 = lines[1];
	
	if (hour2 < hour1) {
		var tmp = hour2;
		hour2 = hour1;
		hour1 = tmp;
	}
	if (line2 < line1) {
		var tmp = line2;
		line2 = line1;
		line1 = tmp;
	}
	
	var start = dateInQuarters(from_date);
	var stride = quartersStride();
	return [start + hour1 * 4 + line1 * stride,
			start + hour2 * 4 + line2 * stride];
}

function quarterIntervalHours(q1, q2) {
	var start_quarter = dateInQuarters(from_date);
	var d1 = q1 - start_quarter;
	var d2 = q2 - start_quarter;
	var stride = quartersStride();
	var hour1 = (d1 % stride) / 4;
	var hour2 = (d2 % stride) / 4;
	var after = hour2 > (end_hour - start_hour) * 0.5 ||
				hour1 > (end_hour - start_hour) * 0.5;
	
	if (q1 == q2) {
		var hour = (d1 % stride) / 4;
		if (hour == 0 && after) {
			// Milestones at 0 o'clock are moved to mid-night.
			return [24, 24];
		} else {
			return [hour, hour];
		}
	} else {
		var hour1 = (d1 % stride) / 4;
		var hour2 = (d2 % stride) / 4;
		var line1 = Math.floor(d1 / stride);
		var line2 = Math.floor(d2 / stride);
		
		if (hour2 == 0 && after) {
			return [hour1, 24];
		} else if (hour1 == 0 && after) {
			return [24, hour2];
		} else {
			return [hour1, hour2];
		}
	}
}

function quarterIntervalLines(q1, q2) {
	var start_quarter = dateInQuarters(from_date);
	var d1 = q1 - start_quarter;
	var d2 = q2 - start_quarter;
	var stride = quartersStride();
	var hour1 = (d1 % stride) / 4;
	var hour2 = (d2 % stride) / 4;
	var after = hour2 > (end_hour - start_hour) * 0.5 ||
				hour1 > (end_hour - start_hour) * 0.5;
	
	if (q1 == q2) {
		var line = Math.floor(d1 / stride);
		var hour = (d1 % stride) / 4;
		if (hour == 0 && after) {
			// Milestones at 0'clock are moved to mid-night.
			return [line - 1, line - 1];
		} else {
			return [line, line];
		}
	} else {
		var line1 = Math.floor(d1 / stride);
		var line2 = Math.floor(d2 / stride);
		var hour1 = (d1 % stride) / 4;
		var hour2 = (d2 % stride) / 4;
		
		if (hour2 == 0 && after) {
			return [line1, line2 - 1];
		} else if (hour1 == 0 && after) {
			return [line1 - 1, line2];
		} else {
			return [line1, line2];
		}
	}
}

String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (var i = 0; i < this.length; i++) {
		var char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		// hash = hash & hash; // Convert to 32bit integer
		hash %= 1 << 10;
	}
	return hash;
};

function renderQuarterInterval(quarter_start,
							   quarter_end,
							   description,
							   selected) {
	var isMilestone = quarter_start == quarter_end;
	var rect = quarterIntervalToRect(quarter_start, quarter_end);
	if (rect == null) {
		return;
	}
	
	var minX = rect[0];
	var minY = rect[1];
	var maxX = rect[0] + rect[2];
	var maxY = rect[1] + rect[3];
	
	var endX = visibleWidth() + left_column_width;
	var endY = visibleDaysHeight() + header_height;
	minX = minX < left_column_width ? left_column_width : minX;
	minY = minY < header_height ? header_height : minY;
	maxX = maxX > endX ? endX : maxX;
	maxY = maxY > endY ? endY : maxY;
	
	if (maxX < minX) return;
	if (maxY < minY) return;
	if (minX > maxX) return;
	if (minY > maxY) return;
	
	if (selected) {
		ctx.lineWidth = selected_quarter_line_width;
		ctx.font = selected_quarter_font;
		ctx.strokeStyle = selected_quarter_style;
		ctx.fillStyle = selected_quarter_style;
	} else {
		ctx.lineWidth = default_quarter_line_width;
		ctx.font = default_quarter_font;
		ctx.strokeStyle = default_quarter_style;
		
		// Task background.
		if (description == "") {
			ctx.fillStyle = default_quarter_background;
		} else {
			ctx.fillStyle = colors[description.hashCode()%colors.length];
		}
		if (!isMilestone) {
			ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
		}
		
		ctx.fillStyle = default_quarter_style;
		
	}
	
	if (isMilestone) {
		// Milestone.
		ctx.save();
		
		// Task background.
		if (description == "") {
			ctx.fillStyle = default_quarter_background;
		} else {
			ctx.fillStyle = colors[description.hashCode()%colors.length];
		}
		if (selected) {
			ctx.strokeStyle = selected_milestone_style;
		} else {
			ctx.strokeStyle = milestone_style;
		}
		
		ctx.beginPath();
		var rad = 0.2 * line_height;
		var cx = minX;
		var cy = minY + 0.5 * line_height;
		ctx.moveTo(cx, cy - rad);
		ctx.lineTo(cx + rad, cy);
		ctx.lineTo(cx, cy + rad);
		ctx.lineTo(cx - rad, cy);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
		
		var off = 0;
		if (selected) {
			off = 1;
		}
		ctx.fillStyle = "black";
		ctx.fillText(" " + description,
					 minX - description_offset + 2 + off,
					 minY + line_height + description_offset - 1 - off);
		if (selected) {
			ctx.fillStyle = selected_milestone_style;
		} else {
			ctx.fillStyle = milestone_style;
		}
		ctx.fillText(" " + description,
					 minX - description_offset,
					 minY + line_height + description_offset);
	} else {
		// Task.
		ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
		
		if (description != "") {
			if (selected) {
				ctx.fillText(description,
							 minX - description_offset,
							 minY + line_height + description_offset);
			} else {
				// Clip the text within area.
				ctx.save();
				ctx.beginPath();
				ctx.rect(minX, minY, maxX - minX, maxY - minY);
				ctx.clip();
				ctx.fillText(description,
							 minX - description_offset,
							 minY + line_height + description_offset);
				ctx.restore();
			}
		}
	}
}

function stoneSum(task, stone, q) {
	if (task.quarterStart >= stone.quarterStart) {
		return 0;
	} else if (task.quarterEnd <= stone.quarterStart) {
		return (task.quarterEnd - q) / 4;
	} else {
		// Add parts of the work.
		return (stone.quarterStart - q) / 4;
	}
}

function renderTasks() {
	var selected = false;
	
	var milestones = new Object();
	for (var i = 0; i < tasks.length; i++) {
		var task = tasks[i];
		if (task.quarterStart != task.quarterEnd) {
			continue;
		}
		if (task.description == "") {
			continue;
		}
		
		task.sum = 0;
		if (milestones[task.description] == null) {
			milestones[task.description] = [task];
		} else {
			var stones = milestones[task.description];
			var inserted = false;
			for (var j = 0; j < stones.length; j++) {
				if (task.quarterStart < stones[j].quarterStart) {
					stones.splice(j, 0, task);
					inserted = true;
					break;
				}
			}
			if (!inserted) {
				stones.push(task);
			}
		}
	}
	
	// Draw tasks that are not milestones.
	for (var i = 0; i < tasks.length; i++) {
		var task = tasks[i];
		if (task.quarterStart == task.quarterEnd) {
			continue;
		}
		if (task.description != "") {
			// Add hours to every milestone with same name.
			var stones = milestones[task.description];
			if (stones != null) {
				var q = task.quarterStart;
				for (var j = 0; j < stones.length; j++) {
					var stone = stones[j];
					var ss = stoneSum(task, stone, q);
					stone.sum += ss;
					
					if (stone.quarterStart <= task.quarterEnd &&
						stone.quarterStart >= task.quarterStart) {
						q = stone.quarterStart;
					} else if (stone.quarterStart > task.quarterEnd) {
						q = task.quarterEnd;
					}
					if (q >= task.quarterEnd) {
						break;
					}
				}
			}
			
		}
		
		renderQuarterInterval(task.quarterStart,
							  task.quarterEnd,
							  task.description,
							  selected);
	}
	// Draw tasks that are milestones.
	for (var i = 0; i < tasks.length; i++) {
		var task = tasks[i];
		if (task.quarterStart != task.quarterEnd) {
			continue;
		}
		
		var sumStr = "";
		if (task.description != "" && task.sum > 0) {
			sumStr = task.sum + " ";
		}
				
		renderQuarterInterval(task.quarterStart,
							  task.quarterEnd,
							  sumStr + task.description,
							  selected);
	}
}

function renderSelectedQuarter() {
	var sq = selected_quarter_start;
	var eq = selected_quarter_end;
	var selected = true;
	renderQuarterInterval(sq,
						  eq,
						  selected_description,
						  selected);
}

function renderLines() {
	ctx.strokeStyle = line_style;
	
	var startDay = from_date.getDay();
	var start = 0;
	var end = visibleDays();
	var w = visibleWidth() + left_column_width;
	for (var i = start; i < end; i++) {
		var isSunday = (startDay + i + 6) % 7 == 0;
		if (isSunday) {
			ctx.lineWidth = line_week_width;
		} else {
			ctx.lineWidth = line_width;
		}
		
		var y = header_height + i * line_height;
		renderLine(ctx, 0, y, w, y);
	}
}

function renderDates() {
	ctx.font = date_font;
	
	var dt = new Date(from_date.getTime());
	var start = 0;
	var end = visibleDays();
	var lines = quarterIntervalLines(selected_quarter_start,
									 selected_quarter_end);
	var sq_start_line = lines[0];
	var sq_end_line = lines[1];
	var sq_min = Math.min(sq_start_line, sq_end_line);
	var sq_max = Math.max(sq_start_line, sq_end_line) + 1;
	for (var i = start; i < end; i++) {
		if (i >= sq_min && i < sq_max) {
			ctx.fillStyle = date_font_selected_style;
		} else {
			ctx.fillStyle = date_font_style;
		}
		
		var y = header_height + i * line_height;
		var str = formatDate(dt) + " " + weekdays[dt.getDay()];
		ctx.fillText(str, 0, y + line_height + date_offset);
		dt.setDate(dt.getDate() + 1);
	}
}

function renderHourLines() {
	var hour_width = visibleWidth() /
	(end_hour - start_hour);
	var h = header_height + visibleDaysHeight();
	var y = header_height;
	var start = 0;
	var end = end_hour - start_hour;
	for (var i = start; i < end; i++) {
		var x = left_column_width + i * hour_width;
		renderLine(ctx, x, y, x, h);
	}
}

function renderHours() {
	ctx.font = hour_font;
	
	var hour_width = visibleWidth() /
	(end_hour - start_hour);
	var h = header_height + visibleDaysHeight();
	var y = header_height;
	var start = 0;
	var end = end_hour - start_hour;
	var hours = quarterIntervalHours(selected_quarter_start,
									 selected_quarter_end);
	var sq_start_hour = hours[0];
	var sq_end_hour = hours[1];
	var sq_min = Math.min(sq_start_hour, sq_end_hour);
	var sq_max = Math.max(sq_start_hour, sq_end_hour);
	for (var i = start; i < end; i++) {
		var x = left_column_width + i * hour_width;
		var hour = i + start_hour;
		if (hour >= sq_min && hour < sq_max) {
			ctx.fillStyle = hour_font_selected_style;
		} else {
			ctx.fillStyle = hour_font_style;
		}
		ctx.fillText("" + hour, x, header_height + hour_offset);
	}
}

function renderCalendar() {
	var box = document.getElementById("calendar");
	ctx = box.getContext("2d");
	box_width = box.width;
	box_height = box.height;
	ctx.fillStyle = background_style;
	ctx.fillRect(0, 0, box_width, box_height);
	
	ctx.fillStyle = "black";
	ctx.fillRect(left_column_width,
				 header_height,
				 visibleWidth(),
				 visibleDaysHeight());
	
	ctx.fillStyle = header_fill_style;
	ctx.fillRect(0, 0, visibleWidth() + left_column_width, header_height);
	
	ctx.fillStyle = left_column_style;
	ctx.fillRect(0, header_height, left_column_width, visibleDaysHeight());
	
	renderLines();
	renderHourLines();
	renderHours();
	renderDates();
	renderTasks();
	renderSelectedQuarter();
	
	ctx.fillStyle = title_font_style;
	ctx.font = title_font;
	ctx.fillText("o-clock.no (beta)", 0, header_height + hour_offset);
}

function refreshLink() {
	var text = document.getElementById("linkText");
	text.value = "http://www.o-clock.no/" + createUrlData();
}

function refreshHours() {
	var start_hour_control = document.getElementById("startHour");
	var end_hour_control = document.getElementById("endHour");
	start_hour_control.value = start_hour;
	end_hour_control.value = end_hour;
}

function refreshFromDate() {
	var from_date_control = document.getElementById("fromDate");
	from_date_control.value = formatDate(from_date);
}

function splitSelected() {
	var tsk = [];
	// Split the area into tasks for each day.
	var sq = selected_quarter_start;
	var eq = selected_quarter_end;
	
	var fix = quarterIntervalFix(sq, eq);
	
	var min_sq = fix[0];
	var max_sq = fix[1];
	
	var min_dt = quarterToDate(min_sq);
	var max_dt = quarterToDate(max_sq);
	var stride = quartersStride();
	var min_sq_hour = min_dt.getHours();
	var max_sq_hour = max_dt.getHours();
	if (max_sq_hour < min_sq_hour) {
		max_sq_hour += 24;
	}
	var mod_min_sq = min_sq_hour * 4 +
	Math.floor(min_dt.getMinutes() / 15);
	var mod_max_sq = max_sq_hour * 4 +
	Math.floor(max_dt.getMinutes() / 15);
	
	var diffHours = mod_max_sq - mod_min_sq;
	var n = ((max_sq - mod_max_sq) -
			 (min_sq - mod_min_sq)) / stride + 1;
	for (var i = 0; i < n; i++) {
		var nt = newTask(min_sq + i * stride,
						 min_sq + i * stride + diffHours,
						 selected_description);
		
		tsk.push(nt);
	}
	return tsk;
}

function makeAddTask(id) {
	var box = document.getElementById(id);
	box.onkeydown = function (event) {
		event = event || window.event;
		var key = event.keyCode;
		if (key == 13) {
			if (selected_quarter_end == selected_quarter_start &&
				selected_description == "") {
				return false;
			}
			var tsk = splitSelected();
			for (var i = 0; i < tsk.length; i++) {
				var task = tsk[i];
				if (task.quarterStart == task.quarterEnd &&
					task.description == "") {
					continue;
				}
				subtractTask(task.quarterStart, task.quarterEnd);
			}
			for (var i = 0; i < tsk.length; i++) {
				if (task.quarterStart == task.quarterEnd &&
					task.description == "") {
					continue;
				}
				tasks.push(tsk[i]);
			}
			
			selected_quarter_start = 0;
			selected_quarter_end = 0;
			selected_description = "";
			
			renderCalendar();
			refreshLink();
			return false;
		}
		else if (key == 8) {
			if (selected_description != "") {
				selected_description = "";
			} else {
				// Subtract task.
				var tsk = splitSelected();
				for (var i = 0; i < tsk.length; i++) {
					var task = tsk[i];
					subtractTask(task.quarterStart, task.quarterEnd);
				}
				
				selected_quarter_start = 0;
				selected_quarter_end = 0;
				selected_description = "";
			}
			
			renderCalendar();
			refreshLink();
			return false;
		} else if (key >= 65 && key <= 90 ||
				  key >= 48 && key <= 57) {
			selected_description += String.fromCharCode(key);
			
			renderCalendar();
			refreshLink();
			return false;
		} else if (key == 32) {
			selected_description += " ";
			
			renderCalendar();
			refreshLink();
			return false;
		}
	}
}

function makeSelectQuarterInterval(id) {
	var box = document.getElementById(id);
	var selectInterval = false;
	box.addEventListener
	("mousedown",
	 function (event) {
		 event = event || window.event;
		 var x = event.pageX - box.offsetLeft;
		 var y = event.pageY - box.offsetTop;
		 
		 var q = posToQuarters(x, y);
		 var h = quarterIntervalHours(q, q+1)[0];
		 var line = quarterIntervalLines(q, q+1)[0];
		 if (h >= end_hour ||
			 h < start_hour ||
			 line < 0 ||
			 line >= visibleDays() - 1) {
			return true;
		 }
		 
		 selected_quarter_start = q;
		 selected_quarter_end = q;
		 selectInterval = true;
		 selected_description = "";
		 
		 renderCalendar();
	 return false;
	 }, true);
	box.addEventListener
	("mousemove",
	 function (event) {
		 event = event || window.event;
		 var x = event.pageX - box.offsetLeft;
		 var y = event.pageY - box.offsetTop;
		 
		 if (selectInterval) {
			selected_quarter_end = posToQuarters(x, y);
		 }
		 
		 renderCalendar();
	 }, true);
	box.addEventListener
	("mouseup",
	 function (event) {
		 event = event || window.event;
		 var x = event.pageX - box.offsetLeft;
		 var y = event.pageY - box.offsetTop;
		 
		 selectInterval = false;
		 
		 renderCalendar();
	 }, true);
}

function makeResizeable(id, margin, minWidth, minHeight, refreshFunc) {
	var box = document.getElementById(id);
	var expandRight = false;
	var expandDown = false;
	var downX = 0;
	var downY = 0;
	var downWidth = 0;
	var downHeight = 0;
	
	var refreshCursor = function (event) {
		var x = event.pageX - box.offsetLeft;
		var y = event.pageY - box.offsetTop;
		
		if (expandRight || expandDown) {
			box.style.cursor = "crosshair";
			return;
		}
		
		if (x > box.width - margin) {
			box.style.cursor = "e-resize";
		}else if (y > box.height - margin) {
			box.style.cursor = "s-resize";
		} else {
			box.style.cursor = "default";
		}
	}
	
	document.addEventListener
	("mousemove",
	 function (event) {
		 var x = event.pageX - box.offsetLeft;
		 var y = event.pageY - box.offsetTop;
		 
		 if (expandRight) {
			 var w = downWidth + (x - downX);
			 w = w < minWidth ? minWidth : w;
			 box.width = w;
			 
			 refreshFunc();
		 }
		 if (expandDown) {
			 var h = downHeight + (y - downY);
			 h = h < minHeight ? minHeight : h;
			 box.height = h;
			 
			 refreshFunc();
		 }
		 refreshCursor(event);
	 }, true);
	document.addEventListener
	("mouseup",
	 function (event) {
		 if (expandRight || expandDown) {
			 expandRight = false;
			 expandDown = false;
			 return false;
		 }
	 }, true);
	box.addEventListener
	("mousedown",
	 function (event) {
		 if (expandRight || expandDown) {
			 expandRight = false;
			 expandDown = false;
		 }
	 
		 event = event || window.event;
		 
		 var x = event.pageX - box.offsetLeft;
		 var y = event.pageY - box.offsetTop;
		 
		 if (x > box.width - margin) {
			expandRight = true;
		 } else if (y > box.height - margin) {
			expandDown = true;
		 }
		 
		 downX = x;
		 downY = y;
		 downWidth = box.width;
		 downHeight = box.height;
		 
		 refreshCursor(event);
	 
		 if (expandRight || expandDown) {
			return false;
		 }
	 }, true);
}

function makeTaskTooltipOnMouseOver(id) {
	var box = document.getElementById(id);
	var mousemove = function (event) {
		event = event || window.event;
		
		var x = event.pageX - box.offsetLeft;
		var y = event.pageY - box.offsetTop;
		
		var q = posToQuarters(x, y);
		var found = false;
		for (var i = 0; i < tasks.length; i++) {
			var task = tasks[i];
			if (task.quarterStart <= q && task.quarterEnd > q) {
				box.title = task.description;
				found = true;
				break;
			}
		}
		
		if (!found) {
			box.title = "";
		}
	}
	box.addEventListener("mousemove", mousemove, true);
}

function refreshSelection() {
	selected_quarter_start = dateInQuarters(from_date) + start_hour * 4;
	selected_quarter_end = selected_quarter_start + 8;
}

function onLoad() {
	var quote = document.getElementById("quote");
	var rnd = Math.floor(Math.random() * quotes.length);
	quote.textContent = "\"" + quotes[rnd % quotes.length] + "\"";
	
	readTasks();
	refreshSelection();
	
	var calendar = "calendar";
	makeResizeable(calendar, // id of box.
				   line_height, // the margin relative to edge.
				   400, // min width.
				   200, // min height.
				   renderCalendar); // function to render graphics.
	makeSelectQuarterInterval(calendar);
	makeAddTask(calendar);
	makeTaskTooltipOnMouseOver(calendar);
	
	refreshHours();
	refreshFromDate();
	renderCalendar();
	refreshLink();
}

function onSelectFromDate() {
	var from_date_control = document.getElementById("fromDate");
	from_date = parseDate(from_date_control.value);
	
	renderCalendar();
}

function onChangeHour() {
	var start_hour_control = document.getElementById("startHour");
	var end_hour_control = document.getElementById("endHour");
	var sh = parseInt(start_hour_control.value);
	var eh = parseInt(end_hour_control.value);
	if (sh >= 0 && sh < 24 && sh < end_hour) {
		start_hour = sh;
	}
	if (eh >= 0 && eh <= 24 && eh > start_hour) {
		end_hour = eh;
	}
	
	renderCalendar();
}

function readTasks() {
	var str = window.location.search;
	if (str.length == 0 || str.indexOf("?data") != 0) {
		return;
	}
	
	str = decodeURIComponent(str);
	
	var box = document.getElementById("calendar");
	var valStr = str.substring(str.indexOf("=")+1, str.indexOf(":"));
	var vals = valStr.split(",");
	from_date = quarterToDate(parseInt(vals[0]));
	start_hour = parseInt(vals[1]);
	end_hour = parseInt(vals[2]);
	box.width = parseInt(vals[3]);
	box.height = parseInt(vals[4]);
	var nStr = vals[5];
	var n = parseInt(nStr);
	var restStr = str.substring(str.indexOf(":") + 1);
	var rest = restStr.split(',');
	for (var i = 0; i < n; i++) {
		var sq = parseInt(rest[3*i]);
		var eq = parseInt(rest[3*i+1]);
		var description = rest[3*i+2];
		tasks.push(newTask(sq, eq, description));
	}
}

function createUrlData() {
	var box = document.getElementById("calendar");
	var str = "" + dateInQuarters(from_date) + "," +
	start_hour + "," +
	end_hour + "," +
	box.width + "," +
	box.height + "," +
	+ tasks.length + ":";
	for (var i = 0; i < tasks.length; i++) {
		var task = tasks[i];
		str += task.quarterStart + ",";
		str += task.quarterEnd + ",";
		str += task.description + ",";
	}
	return "?data=" + encodeURIComponent(str);
}

function onLink() {
	window.location.href = createUrlData();
}

function onClear() {
	window.location.href = "?";
}
