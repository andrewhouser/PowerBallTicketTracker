module.exports = {
	options: {
		compress: true,
		sourceMap: true,
		sourceMapName: 'res/js/main.min.map'
	},
	js: {
		files: [{
			src: ['res/js/src/build.js'],
			dest: 'res/js/src/build.min.js'
		}]
	}
};