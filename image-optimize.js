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

var fileType, imgDir, tmpDir = './tmp/';

program
  .version('0.0.1')
  .option('-t, --type [IMGTYPE]', 'File type (for now only .PNG is supported) [PNG]', 'png')
  .option('-p, --path [PATH]', 'Path to image file or folder', '')
  .option('-a, --audit', 'Check which files will be optimized', '')
  .option('-v, --verbose', 'Make some noise', '')
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

utils.getSizeInfo(imgDir + fileType, (err, result) => {
  if (err) { throw err }

  optimizeBatch(result);
});

async function optimizeBatch(result) {
	dirData = result;
	console.log('### Before optimizing ###');
	console.log('Files: ' + result.files.length);
	console.log('Total Size: ' + Math.round(result.size / 1024) + 'kb');
	console.log('#########################');
	origSize = result.size;

	for (var i = 0; i < result.files.length; i++) {
		var dir = tmpDir + path.dirname(result.files[i]);
		fsExtra.mkdirsSync(dir);
	}

  for (let i = 0, j = dirData.files.length; i < j; i ++) {
    let file = dirData.files[i];
    process.stdout.write(i + ". Processing file: " + dirData.files[i]+' ... ');
    try {
      let fileOutput = await optimize(file, tmpDir + file);
      if (fileOutput.changePercent >= 10) {
        fileChange.push(fileOutput.src);
      }
      console.log('done! ('+fileOutput.changePercent+'%)');
    } catch (e) {
      console.log(e);
    }
  }

  utils.getSizeInfo(tmpDir + imgDir + fileType, function(err, result) {
    optimizedSize = result.size;

    console.log('### After optimizing ###');
    console.log('Files: ' + result.files.length);
    console.log('Total Size: ' + Math.round(result.size / 1024) + 'kb');
    var totalSizeReduced = Math.round((origSize - optimizedSize) / 1024);
    var totalSizeReducedPercent = 100 - Math.round(optimizedSize / origSize * 100);
    console.log('Total size reduced by: '+totalSizeReduced+'kb ('+totalSizeReducedPercent+'%)');
    console.log('#########################');

    if (program.audit) {
      cleanUpTempFolder();
      console.log("\nFile Changes Greater than 5%");
      printFiles(fileChange);
    } else {
      var copyOptions = {
        clobber: true
      };
      fsExtra.copy(tmpDir + imgDir, imgDir, copyOptions, function(err) {
        if (err) {
          console.log('Error copying files back to original location');
        } else {
          console.log('Done copying files back to original location');
          cleanUpTempFolder();
        }
      });
    }
  });
}

function cleanUpTempFolder(){
  fsExtra.remove(tmpDir, function(err) {
    if (err) {
      console.log('error cleaning tmp files');
    }
    process.exit();
  });
}

let fileChange = [];

function optimize(src, dest) {
  return new Promise((resolve, reject) => {
    execFile(pngquant, ['-o', dest, src], function(err) {
      if (err) {
        cleanUpTempFolder();
        reject(err);
      }
      var sizeBefore = Math.round(fs.statSync(src).size / 1024);
      var sizeAfter = Math.round(fs.statSync(dest).size / 1024);
      var changePercent = 100 - Math.round(sizeAfter / sizeBefore * 100);
      changePercent = Math.max(0, changePercent);

      resolve({
        src,
        dest,
        changePercent
      });
    });
  });
}

function printFiles(files) {
  for (let i = 0, j = files.length; i < j; i ++) {
    process.stdout.write(files[i] + '\n');
  }
}
