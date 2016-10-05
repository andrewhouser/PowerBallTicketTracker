module.exports = {
	options: {
		separator: ';',
	},
	css: {
		options: {
			separator: '',
		},
		src: ['res/css/main.post.css', 'res/css/lib/select2.min.css'],
		dest: 'res/css/style.css'
	},
	js: {
		src: ['res/js/src/models/*.js', 'res/js/src/init.js'],
		dest: 'res/js/src/build.js'
	},
	library : {
		src: ['res/js/src/lib/jquery-1.12.1.min.js', 'res/js/src/lib/select2/select2.min.js', 'res/js/src/lib/knockout-3.4.0.js', 'res/js/src/lib/moment.min.js'],
		dest: 'res/js/src/lib.js'
	},
	main : {
		src: ['res/js/src/lib.js', 'res/js/src/build.min.js'],
		dest: 'res/js/main.js'
	}
};