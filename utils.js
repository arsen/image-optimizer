var fs = require('fs');
var glob = require('glob');



var utilsModule = {
	getSizeInfo: function(path, callback) {
		glob(path, function(err, files) {
			if (err) {
				callback(err);
				return;
			}
			var totalSize = 0;
			for (var i = 0; i < files.length; i++) {
				var stats = fs.statSync(files[i]);
				var fileSizeInBytes = stats.size;
				// console.log(files[i] + ' - ' + fileSizeInBytes);
				totalSize+= fileSizeInBytes;
			}

			callback(null, {files: files, size: totalSize});
		});
	}
};


module.exports = utilsModule;
