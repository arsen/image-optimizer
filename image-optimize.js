#!/usr/bin/env node

var program = require('commander');
var fs = require('fs');
var fsExtra = require('fs-extra');
var path = require('path');
var execFile = require('child_process').execFile;
var pngquant = require('pngquant-bin');

var utils = require('./utils');

var fileTypes = {
	png: '**/*.png'
};

var fileType, imgDir, tmpDir = './tmp';

program
  .version('0.0.1')
  .option('-t, --type [IMGTYPE]', 'File type (for now only .PNG is supported) [PNG]', 'png')
  .option('-p, --path [PATH]', 'Path to image file or folder', '')
  .parse(process.argv);

if (typeof fileTypes[program.type] === 'undefined') {
	console.log('Invalid FILE TYPE');
	process.exit();
}


try {
	program.path = path.normalize(program.path);
	var pathStats = fs.statSync(program.path);

	if (pathStats.isDirectory()) {
		if (program.path[program.path.length-1] !== '/')
			program.path = program.path + '/';

		fileType = fileTypes[program.type];
		imgDir = program.path;
	}
	if (pathStats.isFile()) {
		imgDir = path.dirname(program.path) + '/';
		fileType = path.basename(program.path);
	}
}
catch(e) {
	console.log('Invalid PATH');
	process.exit();
}



var currentFileIndex, dirData;

var origSize, optimizedSize;

utils.getSizeInfo(imgDir + fileType, function(err, result) {
	dirData = result;
	console.log('### Before optimizing ###');
	console.log('Files: ' + result.files.length);
	console.log('Total Size: ' + Math.round(result.size / 1024) + 'kb');
	console.log('#########################');
	origSize = result.size;

	fsExtra.mkdirsSync(tmpDir);
	
	currentFileIndex = 0;
	resursiveOptimize(result.files[currentFileIndex], tmpDir + '/' + path.basename(dirData.files[currentFileIndex]));
});


var currentFileIndex = 0;

function cleanUpTempFolder(){
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

var resursiveOptimize = function(src, dest) {
	process.stdout.write(currentFileIndex + ". Processing file: " + src+' ... ');
	execFile(pngquant, ['-o', dest, src], function(err) {
		if (err) {
			console.log(err);
			cleanUpTempFolder();
		}
		var sizeBefore = Math.round(fs.statSync(src).size / 1024);
		var sizeAfter = Math.round(fs.statSync(dest).size / 1024);
		var changePercent = 100 - Math.round(sizeAfter / sizeBefore * 100);
		changePercent = Math.max(0, changePercent);
		console.log('done! ('+changePercent+'%)');
		currentFileIndex++;
		if (currentFileIndex < dirData.files.length) {
			resursiveOptimize(dirData.files[currentFileIndex], tmpDir + '/' + path.basename(dirData.files[currentFileIndex]));
		} else {
			utils.getSizeInfo(tmpDir + '/' + fileType, function(err, result) {
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
				fsExtra.copy(tmpDir, imgDir, copyOptions, function(err) {
					if (err) {
						console.log('Error copying files back to original location');
					} else {
						console.log('Done copying files back to original location');
					}
					cleanUpTempFolder();
				});
			});
		}
	});
};