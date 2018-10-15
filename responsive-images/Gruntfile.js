module.exports = function(grunt) {
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'gm',
          sizes: [
            { name: 'sm', suffix: '_1x', quality: 60, width: 300 },
            { name: 'sm', suffix: '_2x', quality: 60, width: 600 },
            { name: 'lg', suffix: '_1x', quality: 60, width: 400 },
            { name: 'lg', suffix: '_2x', quality: 60, width: 800 }
          ]
        },
        files: [
          {
            expand: true,
            src: ['**/*.{jpg,png,gif}'],
            cwd: 'src/',
            dest: 'dest/'
          }
        ]
      }

    },
      cwebp: {
        dynamic: {
          options: {
            q: 60
          },
          files: [
            {
              expand: true,
              cwd: 'dest/',
              src: ['**/*.{jpg,png.gif}'],
              dest: 'dest/'
            }
          ]
        }
      }
    });
  grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-cwebp');
  grunt.registerTask('default', ['responsive_images', 'cwebp']);
  };