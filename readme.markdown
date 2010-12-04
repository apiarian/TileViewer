TileViewer
==========

A jQuery plugin (TileViewer) and supporting script (make_tiles.sh).

make_tiles.sh
-------------

A bash script which uses [ImageMagick][im] to split a large image into
a number of tiles at various zoom levels. These images are saved along
with a setting.json file in the output directory. The tile size of 256
pixels was chose somewhat at random, though smaller sizes tend to cause
a computational hit, while larger sizes take longer to load. For most
photos jpg is the more compact output form. [Python][py], /usr/bin/bc,
and simple bash math is used in computations.

*Please note* that the output directory will be deleted by the script
before it creates any images.

---
    usage ./make_tiles.sh options

    This script will convert the submitted file into a collection of tiles for use with the TileViewer jQuery plugin.

    Options:
    	-h	Shows this message
    	-i	Source file name (required)
    	-o	Output directory (required). This directory will be irrevocably removed if it already exists!
    	-t	Output file type, "jpg" by default.  May be anything ImageMagick supports as an image output file (jpg, png, gif)
    	-b	Background color, "#444" by default.
    	-s	Tile size in pixels, 256 by default

---

[im]: http://www.imagemagick.org/script/index.php
[py]: http://python.org/

jquery.tileviewer.js
--------------------

The [jQuery][jq] Plugin. In general it simply requires a div with
relative or absolute positioning and a set height and width. An example
of how to use this plugin can be found in the index.html code. The
imagedir is a *required* parameter. This should point to the directory
which contains the output of the make_tiles.sh script. Do not include a
trailing slash in the imagedir.

[jq]: http://jquery.com/

Licensing
---------

This project is distributed under the Apache License version 2.
