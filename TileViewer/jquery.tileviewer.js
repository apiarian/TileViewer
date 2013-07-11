// jquery.tileviewer.js
// Copyright 2010 Aleksandr Pasechnik
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// 	http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Chris Barr's No Select Plugin
// http://chris-barr.com/entry/disable_text_selection_with_jquery/
$(function(){
	$.extend($.fn.disableTextSelect = function() {
		return this.each(function(){
			if($.browser.mozilla){//Firefox
				$(this).css('MozUserSelect','none');
			}else if($.browser.msie){//IE
				$(this).bind('selectstart',function(){return false;});
			}else{//Opera, etc.
				$(this).mousedown(function(){return false;});
			}
		});
	});
});

// Tile Viewer Plugin follows.
jQuery.fn.tileviewer = function(options) {
	var thisDiv = $(this);
	thisDiv.disableTextSelect();
	var settings = $.extend({
		zoomwidth:23,
		zoomheight:100,
		width:thisDiv.width(),
		height:thisDiv.height()
		},options);
	if (!(settings['imagedir'])) {
		alert('ERROR: no image directory!');
		return;
	}
	$.getJSON(settings['settings'], function(data) {
		settings = $.extend(settings,data)
		// global indexes
		var ROW=0; var COL=1;
		
		// set up canvas elements
		var canvas = $('<canvas width="'+settings['width']+'" height="'+settings['height']+'" style="position:absolute; top:0; left:0;"></canvas>');
		var zoomincanvas = $('<canvas width="'+settings['zoomwidth']+'" height="'+settings['zoomwidth']+'" style="position:absolute; top:0; left:0; cursor:pointer;"></canvas>');
		var zoomcanvas = $('<canvas width="'+settings['zoomwidth']+'" height="'+settings['zoomheight']+'" style="position:absolute; top:'+settings['zoomwidth']+'px; left:0;"></canvas>');
		var zoomoutcanvas = $('<canvas width="'+settings['zoomwidth']+'" height="'+settings['zoomwidth']+'" style="position:absolute; top:'+(settings['zoomwidth']+settings['zoomheight'])+'px; left:0; cursor:pointer"></canvas>')
		thisDiv.append(canvas).append(zoomincanvas).append(zoomcanvas).append(zoomoutcanvas);
		
		// get contexts
		var ctx = canvas.get(0).getContext('2d'); 
		var zictx = zoomincanvas.get(0).getContext('2d'); 
		var zctx = zoomcanvas.get(0).getContext('2d'); 
		var zoctx = zoomoutcanvas.get(0).getContext('2d');
		
		// current level
		cl = settings['levels'] - 1
		
		// various coordinates
		ox = settings['width']/2 - settings['cols_in_level'][cl]*settings['tile_size']/2;
		oy = settings['height']/2 - settings['rows_in_level'][cl]*settings['tile_size']/2;
		var startx, starty; var dragging = false;
		
		// blank image
		blank='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
		
		// all images
		var images = new Array(settings['levels']); var filenames = new Array(settings['levels']); var loaded = new Array(settings['levels']);
		for (var l=0; l<settings['levels']; l++) {
			var tiles = settings['tiles_in_level'][l];
			images[l] = new Array(tiles); filenames[l] = new Array(tiles); loaded[l] = new Array(tiles);
			for (var i=0; i<tiles; i++) {
				images[l][i] = new Image(); images[l][i].src=blank; images[l][i].level = l; images[l][i].index = i;
				images[l][i].onload = function() {loaded[this.level][this.index] = true; if (this.src!=blank) draw_images(); };
				filenames[l][i] = settings['imagedir']+'/level'+l+'/tile-'+i+'.'+settings['filetype'];
			}//endfor tiles
		}//endfor levels
		
		// visible images
		var visibles = new Array(settings['levels']);
		for (var l=0; l<settings['levels']; l++) {
			visibles[l] = new Array(2);
			visibles[l][ROW] = new Array(settings['rows_in_level'][l]);
			visibles[l][COL] = new Array(settings['cols_in_level'][l]);
			for (var i=0; i<settings['rows_in_level'][l]; i++) visibles[l][ROW][i] = false;
			for (var i=0; i<settings['cols_in_level'][l]; i++) visibles[l][COL][i] = false;
		}//endfor levels
		
		// draw the images
		function draw_images() {
			ctx.fillStyle = settings['background_color'];
			ctx.fillRect(0,0,settings['width'],settings['height']);
			for (var r=0; r<settings['rows_in_level'][cl]; r++) {
				for (var c=0; c<settings['cols_in_level'][cl]; c++) {
					if (visibles[cl][ROW][r] && visibles[cl][COL][c]) {
						var i = r*settings['cols_in_level'][cl]+c;
						if (loaded[cl][i]) {
							ctx.drawImage(images[cl][i], c*settings['tile_size']+ox-0.5, r*settings['tile_size']+oy-0.5, settings['tile_size']+1, settings['tile_size']+1);
						}//endif loaded
					}//endif visible
				}//endfor columns
			}//endfor rows
		}//end draw images
		
		// update the visible and invisible images 
		function update_visibles() {
			rows = settings['rows_in_level'][cl]; cols = settings['cols_in_level'][cl];
			for (var r=0; r<rows; r++) visibles[cl][ROW][r] = ((0<r*settings['tile_size']+settings['tile_size']+oy) && (r*settings['tile_size']+oy<settings['height']));
			for (var c=0; c<cols; c++) visibles[cl][COL][c] = ((0<c*settings['tile_size']+settings['tile_size']+ox) && (c*settings['tile_size']+ox<settings['width']));
			for (var r=0; r<rows; r++) {
				for (var c=0; c<cols; c++) {
					var i = r*cols+c;
					if (visibles[cl][ROW][r] && visibles[cl][COL][c]) {
						if (images[cl][i].src == blank) {
							images[cl][i].src = filenames[cl][i];
							loaded[cl][i] = false;
						}//endif blank
					}//endif visible
					else {
						if (images[cl][i].src != blank) {
							images[cl][i].src = blank;
							loaded[cl][i] = false;
						}//endif not blank
					}//endelse not visible
				}//endfor cols
			}//endfor rows
			draw_images();
		}//end update visibles
		
		update_visibles();
		
		// zoom functions
		thisDiv.zoomout = function(x,y) {
			cl++;
			if(cl>settings['levels']-1) {
				cl = settings['levels'] -1;
			} else {
				ox = ox/2 + settings['tile_size']*(settings['cols_in_level'][cl-1]/4 - settings['cols_in_level'][cl]/2) + x/2;
				oy = oy/2 + settings['tile_size']*(settings['rows_in_level'][cl-1]/4 - settings['rows_in_level'][cl]/2) + y/2;
			}
			update_visibles(); zoomcanvas.draw();
		}//end zoomout function
		
		thisDiv.zoomin = function(x,y) {
			cl--;
			if(cl<0) {
				cl = 0;
			} else { 
				ox = 2*ox + settings['tile_size']*(settings['cols_in_level'][cl+1] - settings['cols_in_level'][cl]/2) - x;
				oy = 2*oy + settings['tile_size']*(settings['rows_in_level'][cl+1] - settings['rows_in_level'][cl]/2) - y;
			}
			update_visibles(); zoomcanvas.draw();
		}//end zoomin function
		
		// zoom control views
		zoomincanvas.draw = function(fill) {
			zictx.clearRect(0,0,settings['zoomwidth'],settings['zoomwidth']);
			zictx.strokeStyle = "#fff"; 
			zictx.fillStyle=fill;
			zictx.strokeRect(4,settings['zoomwidth']/2-2,settings['zoomwidth']-8,4);
			zictx.fillRect(4,settings['zoomwidth']/2-2,settings['zoomwidth']-8,4);
			zictx.strokeRect(settings['zoomwidth']/2-2,4,4,settings['zoomwidth']-8);
			zictx.fillRect(settings['zoomwidth']/2-2,4,4,settings['zoomwidth']-8);
			zictx.fillRect(settings['zoomwidth']/2-3,settings['zoomwidth']/2-2,6,3);
		}//end zoomin canvas draw function
		zoomoutcanvas.draw = function(fill) {
			zoctx.clearRect(0,0,settings['zoomwidth'],settings['zoomwidth']);
			zoctx.strokeStyle = "#fff";
			zoctx.fillStyle=fill;
			zoctx.strokeRect(4,settings['zoomwidth']/2-2,settings['zoomwidth']-8,4);
			zoctx.fillRect(4,settings['zoomwidth']/2-2,settings['zoomwidth']-8,4);
		}//end zoomout canvas draw function
		zoomcanvas.draw = function() {
			zctx.clearRect(0,0,settings['zoomwidth'],settings['zoomheight']);
			zctx.strokeStyle = "#fff";
			zctx.moveTo(settings['zoomwidth']/2,2); zctx.lineTo(settings['zoomwidth']/2,settings['zoomheight']-2);
			zctx.stroke();
			for(var i=0; i<settings['levels']; i++) {
				y = ((i+1)/(settings['levels']+1) * settings['zoomheight']);
				zctx.strokeRect(4,y-2,settings['zoomwidth']-8,4);
				zctx.fillStyle=settings['background_color'];
				zctx.fillRect(4,y-2,settings['zoomwidth']-8,4);
				if (i == cl) {
					zctx.fillStyle="#000";
					zctx.fillRect(4,y-2,settings['zoomwidth']-8,4);
				}
			}
		}
		zoomincanvas.draw(settings['background_color']); zoomcanvas.draw(); zoomoutcanvas.draw(settings['background_color']);
		zoomincanvas.hover(function(){zoomincanvas.draw('#fff')}, function(){zoomincanvas.draw(settings['background_color'])});
		zoomoutcanvas.hover(function(){zoomoutcanvas.draw('#fff')}, function(){zoomoutcanvas.draw(settings['background_color'])});
		zoomincanvas.mousedown(function(){zoomincanvas.draw('#000')});
		zoomincanvas.mouseup(function(){zoomincanvas.draw('#fff'); thisDiv.zoomin(settings['width']/2, settings['height']/2);});
		zoomoutcanvas.mousedown(function(){zoomoutcanvas.draw('#000')});
		zoomoutcanvas.mouseup(function(){zoomoutcanvas.draw('#fff'); thisDiv.zoomout(settings['width']/2, settings['height']/2);});
		
		// double click to zoom
		canvas.dblclick(function(e) {
			o = canvas.offset();
			if (e.metaKey || e.ctrlKey) {
				thisDiv.zoomout(e.pageX - o.left, e.pageY - o.top);
			} else {
				thisDiv.zoomin(e.pageX - o.left, e.pageY - o.top);
			}
		});
		
		// drag to pan
		canvas.mousedown(function(e) {
			dragging = true;
			startx = e.pageX; starty = e.pageY;
		});
		canvas.mouseup(function(e) {
			dragging = false;
		});
		canvas.mouseleave(function(e) {
			dragging = false;
		})
		canvas.mousemove(function(e) {
			if (dragging) {
				nowx = e.pageX; nowy = e.pageY;
				dx = nowx - startx; dy = nowy - starty;
				startx = nowx; starty = nowy;
				ox += dx; oy += dy;
				update_visibles();
			}
		});
	});
}
