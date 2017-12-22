#!/usr/bin/env node

var program = require('commander');
var fs = require('fs');
var fsExtra = require('fs-extra');
var path = require('path');
var execFile = require('child_process').execFile;
var utils = require('./utils');
const confirm = require('confirm-simple');

var fileTypes = {
  png: '**/*.png',
  jpg: '**/*.jpg'
};

var fileType, imgDir, tmpDir = './tmp/';

program
  .version('0.0.1')
  .usage('[options] <PATHS...>')
  .option('-t, --type [IMGTYPE]', 'File type (for now only .PNG is supported) [PNG]', 'png')
  .option('-a, --audit [TRESHHOLD]', 'Check which files will be optimized', '')
  .option('-v, --verbose', 'Make some noise', '')
  .parse(process.argv);

const compression = {};
if (typeof fileTypes[program.type] === 'undefined') {
	console.log('Invalid FILE TYPE');
	process.exit();
} else if (program.type === 'png') {
  compression.binary = require('pngquant-bin');
  compression.option = ['-o'];
} else if (program.type === 'jpg') {
  compression.binary = require('jpegtran-bin');
  compression.option = ['-progressive', '-optimize', '-outfile'];
}

try {
  let imgPath = program.args[0];
	imgPath = path.normalize(imgPath);
	var pathStats = fs.statSync(imgPath);

	if (pathStats.isDirectory()) {
		if (imgPath[imgPath.length-1] !== '/')
			imgPath = imgPath + '/';

		fileType = fileTypes[program.type];
		imgDir = imgPath;
	}
	if (pathStats.isFile()) {
		imgDir = path.dirname(imgPath) + '/';
		fileType = path.basename(imgPath);
	}
} catch(e) {
	console.log('Invalid PATH');
	process.exit();
}

utils.getSizeInfo(imgDir + fileType, (err, result) => {
  if (err) { throw err }
  const originalSize = result.size;

  logStart(result.files, originalSize);
  optimizeBatch(result.files).then(files => {
    if (program.audit) {
      removeTmpDir();
      printFiles(files, program.audit);
    } else {
      confirm('Would you like to replace these files?', ok => {
        if (ok) {
          utils.getSizeInfo(tmpDir + imgDir + fileType, function(err, result) {
            const optimizedSize = result.size;
            var totalSizeReduced = Math.round((originalSize - optimizedSize) / 1024);
            var totalSizeReducedPercent = 100 - Math.round(optimizedSize / originalSize * 100);
            logEnd(result.files.length, result.size, totalSizeReduced, totalSizeReducedPercent);
            cleanup();
          });
        } else {
          removeTmpDir();
        }
      });
    }
  });
});

function logStart(fileCount, dirSize) {
  console.log('### Before optimizing ###');
  console.log('Files: ' + fileCount);
  console.log('Total Size: ' + Math.round(dirSize / 1024) + 'kb');
  console.log('#########################');
}

function logEnd(fileCount, dirSize, sizeReduced, percentReduced) {
  console.log('### After optimizing ###');
  console.log('Files: ' + fileCount);
  console.log('Total Size: ' + Math.round(dirSize / 1024) + 'kb');
  console.log('Total size reduced by: '+sizeReduced+'kb ('+percentReduced+'%)');
  console.log('#########################');
}

function cleanup() {
  var copyOptions = {
    clobber: true
  };
  fsExtra.copy(tmpDir + imgDir, imgDir, copyOptions, function(err) {
    if (err) {
      console.log('Error copying files back to original location');
    } else {
      console.log('Done copying files back to original location');
      removeTmpDir();
    }
  });
}

async function optimizeBatch(files) {
  let fileChange = [];

	for (var i = 0; i < files.length; i++) {
		var dir = tmpDir + path.dirname(files[i]);
		fsExtra.mkdirsSync(dir);
	}

  for (let i = 0, j = files.length; i < j; i ++) {
    let file = files[i];
    process.stdout.write(i + ". Processing file: " + file+' ... ');
    try {
      let fileOutput = await optimize(file, tmpDir + file);
      fileChange.push(fileOutput);
      console.log('done! ('+fileOutput.changePercent+'%)');
    } catch (e) {
      console.log(e);
    }
  }
  return fileChange;
}

function removeTmpDir(){
  fsExtra.remove(tmpDir, function(err) {
    if (err) {
      console.log('error cleaning tmp files');
    }
    process.exit();
  });
}

function optimize(src, dest) {
  return new Promise((resolve, reject) => {
    execFile(compression.binary, [...compression.option, dest, src], function(err) {
      if (err) {
        removeTmpDir();
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

function printFiles(files, threshold) {
  console.log(`All files over ${threshold}%`);
  for (let i = 0, j = files.length; i < j; i ++) {
    if (files[i].changePercent >= threshold) {
      process.stdout.write(files[i].src + '\n');
    }
  }
}
