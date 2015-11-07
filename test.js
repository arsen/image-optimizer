var glob = require("glob");

glob('/Users/arsenghazaryan/Documents/aofl/member.abcmouse.com/abcmouse_classroom/first_grade_com_en/img/april.png', function(err, files) {
	console.log(files);
});