const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const execFile = require('child_process').execFile;
const utils = require('./utils');
const confirm = require('confirm-simple');

const fileTypes = {
  png: '**/*.png',
  jpg: '**/*.jpg'
};

const compression = {};
let imgPath;
var fileType,
  imgDir,
  tmpDir = './tmp/';
const program = require('commander');
program
  .version('1.0.0')
  .usage('[options] <IMGTYPE> <PATH>')
  // .option('-t, --type [IMGTYPE]', 'File type (for now only .PNG is supported) [PNG]', 'png')
  .option('-a, --audit <TRESHHOLD>', 'Check which files will be optimized', '')
  .option('-v, --verbose', 'Make some noise', '')
  .option('-f, --force', 'Force overwriting files', '')
  .arguments('<IMGTYPE> <PATH>')
  .action((IMGTYPE, PATH) => {
    selectCompression(IMGTYPE);
    imgPath = PATH;
  })
  .parse(process.argv);

function selectCompression(filetype) {
  switch (filetype) {
    case 'png':
      compression.binary = require('pngquant-bin');
      compression.option = ['-o'];
      compression.type = filetype;
      break;
    case 'jpg':
      compression.binary = require('jpegtran-bin');
      compression.option = ['-progressive', '-optimize', '-outfile'];
      compression.type = filetype;
      break;
    default:
      console.log('Invalid <IMGTYPE>');
      process.exit();
  }
}

try {
  imgPath = path.normalize(imgPath);
  var pathStats = fs.statSync(imgPath);

  if (pathStats.isDirectory()) {
    if (imgPath[imgPath.length - 1] !== '/') imgPath = imgPath + '/';

    fileType = fileTypes[compression.type];
    imgDir = imgPath;
  }
  if (pathStats.isFile()) {
    imgDir = path.dirname(imgPath) + '/';
    fileType = path.basename(imgPath);
  }
} catch (e) {
  console.log('Invalid PATH');
  process.exit();
}

utils.getSizeInfo(imgDir + fileType, (err, result) => {
  if (err) {
    throw err;
  }
  const originalSize = Math.round(result.size / 1024);

  if (program.verbose) {
    logStart(result.files, originalSize);
  }
  optimizeBatch(result.files).then(files => {
    if (program.audit) {
      removeTmpDir();
      printFiles(files, program.audit);
    } else if (program.force) {
      replaceSrcFiles();
    } else {
      confirm('Would you like to replace these files?', ok => {
        if (ok && program.verbose) {
          let optimizedSize = 0;
          files.forEach(file => (optimizedSize += file.destSize));
          console.log(optimizedSize);
          var totalSizeReduced = originalSize - optimizedSize;
          var totalSizeReducedPercent =
            100 - Math.round((optimizedSize / originalSize) * 100);
          logEnd(
            files.length,
            optimizedSize,
            totalSizeReduced,
            totalSizeReducedPercent
          );
          replaceSrcFiles();
        } else if (ok) {
          replaceSrcFiles();
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
  console.log('Total Size: ' + dirSize + 'kb');
  console.log('#########################');
}

function logEnd(fileCount, dirSize, sizeReduced, percentReduced) {
  console.log('### After optimizing ###');
  console.log('Files: ' + fileCount);
  console.log('Total Size: ' + dirSize + 'kb');
  console.log(
    'Total size reduced by: ' + sizeReduced + 'kb (' + percentReduced + '%)'
  );
  console.log('#########################');
}

function replaceSrcFiles() {
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

  for (let i = 0, j = files.length; i < j; i++) {
    let file = files[i];
    process.stdout.write(i + '. Processing file: ' + file + ' ... ');
    try {
      let fileOutput = await optimize(file, tmpDir + file);
      fileChange.push(fileOutput);
      console.log('done! (' + fileOutput.changePercent + '%)');
    } catch (e) {
      console.log(e);
    }
  }
  return fileChange;
}

function removeTmpDir() {
  fsExtra.remove(tmpDir, function(err) {
    if (err) {
      console.log('error cleaning tmp files');
    }
    process.exit();
  });
}

function optimize(src, dest) {
  return new Promise((resolve, reject) => {
    execFile(compression.binary, [...compression.option, dest, src], function(
      err
    ) {
      if (err) {
        removeTmpDir();
        reject(err);
      }
      var sizeBefore = Math.round(fs.statSync(src).size / 1024);
      var sizeAfter = Math.round(fs.statSync(dest).size / 1024);
      var changePercent = 100 - Math.round((sizeAfter / sizeBefore) * 100);
      changePercent = Math.max(0, changePercent);

      resolve({
        src,
        dest,
        srcSize: sizeBefore,
        destSize: sizeAfter,
        changePercent
      });
    });
  });
}

function printFiles(files, threshold) {
  for (let i = 0, j = files.length; i < j; i++) {
    if (files[i].changePercent >= threshold) {
      process.stdout.write(files[i].src + '\n');
    }
  }
}
