// eslint-disable-next-line filenames/match-regex
module.exports = grunt => {
  grunt.initConfig({
    bump: {
      options: {
        files: ['package.json'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('default', []);
};
