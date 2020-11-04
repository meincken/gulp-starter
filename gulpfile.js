// require('require-dir')('./gulp');
(() => {
  "use strict";

  const // development or production
    devBuild =
      (process.env.NODE_ENV || "development").trim().toLowerCase() ===
      "development",
    // directory locations
    dir = {
      src: "develop/",
      build: "public/",
    },
    // modules
    gulp = require("gulp"),
    del = require("del"),
    noop = require("gulp-noop"),
    newer = require("gulp-newer"),
    size = require("gulp-size"),
    imagemin = require("gulp-imagemin"),
    sass = require("gulp-sass"),
    postcss = require("gulp-postcss"),
    svgSprite = require("gulp-svg-sprites"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    babel = require("gulp-babel"),
    changed = require("gulp-changed"),
    rename = require("gulp-rename"),
    sourcemaps = devBuild ? require("gulp-sourcemaps") : null,
    browserSync = require("browser-sync").create();

  console.log("Gulp", devBuild ? "development" : "production", "public");

  //clean task

  function clean() {
    return del([dir.build]);
  }
  exports.clean = clean;
  exports.wipe = clean;

  // **************** HTML task **************** /;

  const htmlConfig = {
    src: dir.src + "*.html",
    build: dir.build,
  };

  function html() {
    return gulp
      .src(htmlConfig.src)
      .pipe(gulp.dest(htmlConfig.build))
      .pipe(browserSync.stream());
  }

  exports.html = gulp.series(html);

  // **************** images task **************** /;

  const imgConfig = {
    src: dir.src + "assets/images/**/*",
    build: dir.build + "assets/images/",

    minOpts: {
      optimizationLevel: 5,
    },
  };

  function images() {
    return gulp
      .src(imgConfig.src)
      .pipe(newer(imgConfig.build))
      .pipe(imagemin(imgConfig.minOpts))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest(imgConfig.build))
      .pipe(browserSync.stream());
  }
  exports.images = gulp.series(images);

  // **************** Sprite task **************** /;
  const spriteConfig = {
    src: dir.src + "assets/icons/*.svg",
    build: dir.build + "assets/icons/",
  };

  function sprite() {
    return gulp
      .src(spriteConfig.src)
      .pipe(
        svgSprite({
          mode: "symbols",
          preview: false,
          svg: {
            symbols: "icons.svg",
          },
        })
      )
      .pipe(gulp.dest(spriteConfig.build))
      .pipe(browserSync.stream());
  }
  exports.sprite = gulp.series(sprite);

  // **************** Font task **************** /;

  const fontConfig = {
    src: dir.src + "assets/fonts/*",
    build: dir.build + "assets/fonts/",
  };

  function fonts() {
    return gulp.src(fontConfig.src).pipe(gulp.dest(fontConfig.build));
  }
  exports.fonts = gulp.series(fonts);

  // **************** Vendor JS task **************** /;
  const vendorConfig = {
    src: dir.src + "assets/js/vendors/*.js",
    build: dir.build + "assets/js/",
  };

  function vendor() {
    return gulp
      .src(vendorConfig.src)
      .pipe(uglify())
      .pipe(concat("vendors.js"))
      .pipe(gulp.dest(vendorConfig.build))
      .pipe(browserSync.stream());
  }

  exports.vendor = gulp.series(vendor);

  // **************** Functions JS task **************** /;

  const functionsConfig = {
    src: dir.src + "assets/js/*.js",
    build: dir.build + "assets/js/",
  };

  function functions() {
    return gulp
      .src(functionsConfig.src)
      .pipe(concat("functions.js"))
      .pipe(
        babel({
          presets: ["@babel/env"],
        })
      )
      .pipe(uglify())
      .pipe(gulp.dest(functionsConfig.build))
      .pipe(browserSync.stream());
  }
  exports.functions = gulp.series(functions);

  // **************** CSS task **************** /;

  const cssConfig = {
    src: dir.src + "assets/scss/*.scss",
    watch: dir.src + "assets/scss/**/*",
    build: dir.build + "assets/css/",
    sassOpts: {
      sourceMap: devBuild,
      outputStyle: "compressed", //compressed, nested, compact
      imagePath: "/images/",
      precision: 3,
      errLogToConsole: true,
    },

    postCSS: [
      require("postcss-assets")({
        loadPaths: ["images/"],
        basePath: dir.build,
      }),
      require("autoprefixer")({
        overrideBrowserslist: ["last 5 version"],
      }),
    ],
  };

  // remove unused selectors and minify production CSS
  // if (!devBuild) {
  //   cssConfig.postCSS.push(
  //     require("usedcss")({ html: ["index.html"] }),
  //     require("cssnano")
  //   );
  // }

  function css() {
    return gulp
      .src(cssConfig.src)
      .pipe(sourcemaps ? sourcemaps.init() : noop())
      .pipe(sass(cssConfig.sassOpts).on("error", sass.logError))
      .pipe(postcss(cssConfig.postCSS))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest(cssConfig.build))
      .pipe(browserSync.stream());
  }
  exports.css = gulp.series(css);

  // **************** serve task **************** /;

  function serve(done) {
    browserSync.init({
      server: {
        baseDir: "./public/",
      },
      port: 3000,
      open: true,
    });
    done();
  }

  function reload(done) {
    browserSync.reload();
    done();
  }

  exports.serve = serve;

  // **************** watch task **************** /;

  function watch(done) {
    // HTML changes
    gulp.watch(htmlConfig.src, html);

    // Image changes
    gulp.watch(imgConfig.src, images);

    // Sprite changes
    gulp.watch(spriteConfig.src, sprite);

    // Vendor changes
    gulp.watch(vendorConfig.src, vendor);

    // Functions JS changes
    gulp.watch(functionsConfig.src, functions);

    // Font changes
    gulp.watch(fontConfig.src, fonts);

    // CSS changes
    gulp.watch(cssConfig.watch, css);

    done();
  }

  // **************** default task **************** /;

  exports.default = gulp.series(
    clean,
    exports.html,
    exports.css,
    exports.vendor,
    exports.functions,
    exports.sprite,
    exports.fonts,
    exports.images,
    watch,
    serve,
    reload
  );

  exports.build = gulp.series(
    exports.html,
    exports.css,
    exports.vendor,
    exports.functions,
    exports.sprite,
    exports.fonts,
    exports.images
  );
})();
