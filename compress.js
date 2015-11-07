var fs = require('fs');
var fsExtra = require('fs-extra');
var path = require('path');
var execFile = require('child_process').execFile;
var pngquant = require('pngquant-bin');

var utils = require('./utils');


var fileType = '**/*.jpg';
var imgDir = '/Users/arsenghazaryan/Documents/aofl/member.abcmouse.com/abcmouse_classroom/';
var tmpDir = './tmp';

var currentFileIndex, dirData;

var origSize, optimizedSize;

utils.getSizeInfo(imgDir + fileType, function(err, result) {
	dirData = result;
	console.log('### Before optimizing ###');
	console.log('Files: ' + result.files);
	console.log('Total Size: ' + Math.round(result.size / 1024) + 'kb');
	console.log('#########################');
	process.exit();
	origSize = result.size;

	for (var i = 0; i < result.files.length; i++) {
		var dir = tmpDir + path.dirname(result.files[i]);
		fsExtra.mkdirsSync(dir);
	}
	
	currentFileIndex = 0;
	resursiveOptimize(result.files[currentFileIndex], tmpDir + result.files[currentFileIndex]);
});


var currentFileIndex = 0;
var resursiveOptimize = function(src, dest) {
	process.stdout.write(currentFileIndex + ". Convert file: " + src+' ... ');
	execFile(pngquant, ['-o', dest, src, '--nofs'], function(err) {
		if (err) {
			console.log(err);
			process.exit();
		}
		var sizeBefore = Math.round(fs.statSync(src).size / 1024);
		var sizeAfter = Math.round(fs.statSync(dest).size / 1024);
		var changePercent = 100 - Math.round(sizeAfter / sizeBefore * 100);
		changePercent = Math.max(0, changePercent);
		console.log('done! ('+changePercent+'%)');
		currentFileIndex++;
		if (currentFileIndex < dirData.files.length) {
			resursiveOptimize(dirData.files[currentFileIndex], tmpDir + dirData.files[currentFileIndex]);
		} else {
			utils.getSizeInfo(tmpDir + imgDir + fileType, function(err, result) {
				optimizedSize = result.size;

				console.log('### After optimizing ###');
				console.log('Files: ' + result.files.length);
				console.log('Total Size: ' + Math.round(result.size / 1024) + 'kb');
				var totalSizeReduced = Math.round((origSize - optimizedSize) / 1024);
				var totalSizeReducedPercent = 100 - Math.round(optimizedSize / origSize * 100);
				console.log('Total size reduced by: '+totalSizeReduced+'kb ('+totalSizeReducedPercent+'%)');
				console.log('#########################');
				


				var copyOptions = {
					clobber: true
				};
				fsExtra.copy(tmpDir + imgDir, imgDir, copyOptions, function(err) {
					if (err) {
						console.log('Error copying files back to original location');
					} else {
						console.log('Done copying files back to original location');
						fsExtra.remove(tmpDir, function(err) {
							if (err) {
								console.log('error cleaning tmp files');
							}
							else {
								console.log('Done cleaning TMP files');
							}
							process.exit();
						});
					}
				});
			});
		}
	});
};