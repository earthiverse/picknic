module.exports = function(grunt) {
  "use strict";
  
  grunt.initConfig({
    ts: {
      app: {
        files: [{
          src: ["source/**/*.ts", "!source/.baseDir.ts"],
          dest: "build/"
        }],
        options: {
          module: "commonjs",
          noLib: false,
          target: "es6",
          sourceMap: false
        }
      }
    },
    tslint: {
      options: {
        configuration: "tslint.json"
      },
      files: {
        src: ["source/**/*.ts"]
      }
    },
    copy: {
      main: {
        files: [
          {
            src: "source/index.js",
            dest: "build/index.js"
          },
          {
            expand: true,
            cwd: "source/public",
            src: "**",
            dest: "build/public"
          }
        ]
      }
    },
    watch: {
      ts: {
        files: ["source/**/*.ts"],
        tasks: ["ts", "tslint"]
      },
      copy: {
        files: ["source/**/*.js"],
        tasks: ["copy"]
      }
    }
  });
  
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-tslint");
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask("default", [
    "ts",
    "tslint",
    "copy"
  ]);
};
