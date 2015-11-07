var execFile = require('child_process').execFile;
var pngquant = require('pngquant-bin');

execFile(pngquant, ['-o', 'images/bg_fall-min.png', 'images/bg_fall.png'], function(err) {
	console.log(err, 'Image minified!');
});