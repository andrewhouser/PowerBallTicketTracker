module.exports = function ( grunt ) {
	// Load all the required grunt task plugins
	var options = { config: { src: "res/grunt/*.js" } };
	var configs = require('load-grunt-configs')(grunt, options);

	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig(configs);

	/**
	SPECIFY TASKS TO RUN
	*/

	grunt.registerTask( 'css', ['sass', 'postcss', 'concat:css', 'clean:css'] );

	grunt.registerTask( 'js', ['concat:library', 'concat:js', 'uglify:js', 'concat:main', 'clean:js'] );

	grunt.registerTask( 'build', ['css', 'js']);


	// Default task(s).
	grunt.registerTask('default', ['build', 'watch']);

};