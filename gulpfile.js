/* eslint-disable indent */
/* eslint-disable no-unused-vars */
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const responsive = require('gulp-responsive');
const webp = require('gulp-webp');
const fs = require('fs');
const del = require('del');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const runSequence = require('run-sequence');
const lazypipe = require('lazypipe');
const browserSync = require('browser-sync').create();

const reload = browserSync.reload;

// Lint JavaScript
gulp.task('lint', function () {
	return gulp.src(['app/**/*.js', '!node_modules/**'])
		.pipe(plugins.eslint())
		.pipe(plugins.eslint.format())
		.pipe(plugins.eslint.failOnError());
});

// Build responsive images
gulp.task('images', function () {
	return gulp.src('app/img/*.jpg')
		.pipe(responsive({
			'*.jpg': [
				{ width: 300, rename: { suffix: '-300_1x' }, },
				{ width: 400, rename: { suffix: '-400_1x' }, },
				{ width: 600, rename: { suffix: '-600_2x' }, },
				{ width: 800, rename: { suffix: '-800_2x' }, }
			]
		}, {
				quality: 40,
				progressive: true,
				withMetadata: false,
			}))

		.pipe(gulp.dest('.tmp/img'))
		.pipe(gulp.dest('dist/img'));
});


// Convet images also to Webp format and saves in dist folder
gulp.task('webp', () =>
	gulp.src('.tmp/img/*.jpg')
		.pipe(webp())
		.pipe(gulp.dest('dist/img'))
);


// Copy ICONS
gulp.task('icons', function () {
	return gulp.src('app/img/icons/**')
		.pipe(gulp.dest('.tmp/img/icons'))
		.pipe(gulp.dest('dist/img/icons'));
});

// Copy manifest
gulp.task('manifest', function () {
	return gulp.src('app/manifest.json')
		.pipe(gulp.dest('.tmp/'))
		.pipe(gulp.dest('dist/'));
});


// Prep assets for dev
gulp.task('html', function () {
	return gulp.src('app/*.html')
		.pipe(plugins.useref())
		.pipe(plugins.if('*.css', plugins.autoprefixer()))
		.pipe(plugins.if('*.js', plugins.babel()))
		.pipe(plugins.if('*.html', plugins.htmlmin({
			removeComments: true,
			collapseBooleanAttributes: true,
			removeAttributeQuotes: true,
			removeRedundantAttributes: true,
			removeEmptyAttributes: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: true,
			removeOptionalTags: true
		})))

		.pipe(gulp.dest('.tmp'));
});

// Scan HTML for js & css and optimize them
gulp.task('html:dist', function () {
	return gulp.src('app/*.html')
		.pipe(plugins.size({ title: 'html (before)' }))
		.pipe(plugins.useref({},
			lazypipe().pipe(plugins.sourcemaps.init)
			// lazypipe().pipe(babel) 
			// transforms assets before concat
		))
		.pipe(plugins.if('*.css', plugins.size({ title: 'styles (before)' })))
		.pipe(plugins.if('*.css', plugins.cssnano()))
		.pipe(plugins.if('*.css', plugins.size({ title: 'styles (after) ' })))
		.pipe(plugins.if('*.css', plugins.autoprefixer()))
		.pipe(plugins.if('*.js', plugins.babel()))
		.pipe(plugins.if('*.js', plugins.size({ title: 'scripts (before)' })))
		.pipe(plugins.if('*.js', plugins.uglifyEs.default()))
		.pipe(plugins.if('*.js', plugins.size({ title: 'scripts (after) ' })))
		.pipe(plugins.sourcemaps.write('.'))
		.pipe(plugins.if('*.html', plugins.htmlmin({
			removeComments: true,
			collapseWhitespace: true,
			collapseBooleanAttributes: true,
			removeAttributeQuotes: true,
			removeRedundantAttributes: true,
			minifyJS: { compress: { drop_console: true } },
			removeEmptyAttributes: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: true,
			removeOptionalTags: true
		})))

		.pipe(plugins.if('*.html', plugins.size({ title: 'html (after) ', showFiles: false })))
		.pipe(gulp.dest('dist'));
});

// Process Service Worker
gulp.task('sw', function () {
	let bundler = browserify([
		'./app/js/idbhelper.js',
		'./app/sw.js'
	], { debug: false }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: true })  // required for 'import'
		.bundle()               // concat
		.pipe(source('sw.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(gulp.dest('.tmp'));
});

// DBHelper
gulp.task('dbhelper', function () {
	let bundler = browserify([
		'./app/js/idbhelper.js',
		'./app/js/dbhelper.js'
	], { debug: false }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: false })  // required for 'import'
		.bundle()               // concat
		.pipe(source('dbhelper.min.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(gulp.dest('.tmp/js/'));
});

// Index Scripts
gulp.task('scripts1', function () {
	let bundler = browserify([
		'./app/js/dbhelper.js',
		'./app/js/idbhelper.js',
		'./app/js/register_sw.js',
		'./app/js/main.js'
	], { debug: false, insertGlobals: true }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: false })  // required for 'import'
		.bundle()               // concat
		.pipe(source('index.min.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(gulp.dest('.tmp/js/'));
});

// Restaurant Scripts
gulp.task('scripts2', function () {
	let bundler = browserify([
		'./app/js/idbhelper.js',
		'./app/js/dbhelper.js',
		'./app/js/register_sw.js',
		'./app/js/restaurant_info.js'
	], { debug: false }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: false })  // required for 'import'
		.bundle()               // concat
		.pipe(source('restaurant.min.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(gulp.dest('.tmp/js/'));
});


// Optimize Service Worker
gulp.task('sw:dist', function () {
	let bundler = browserify('./app/sw.js', { debug: true }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: true })  // required for 'import'
		.bundle()               // concat
		.pipe(source('sw.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(plugins.size({ title: 'Service Worker (before)' }))
		.pipe(plugins.sourcemaps.init({ loadMaps: true }))
		.pipe(plugins.uglifyEs.default())         // minify
		.pipe(plugins.size({ title: 'Service Worker (after) ' }))
		.pipe(plugins.sourcemaps.write('./'))
		.pipe(gulp.dest('dist'));
});

// Optimize DBHelper
gulp.task('dbhelper:dist', function () {
	let bundler = browserify([
		'./app/js/idbhelper.js',
		'./app/js/dbhelper.js'
	], { debug: true }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: true })  // required for 'import'
		.bundle()               // concat
		.pipe(source('dbhelper.min.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(plugins.size({ title: 'DBHelper (before)' }))
		.pipe(plugins.sourcemaps.init({ loadMaps: true }))
		.pipe(plugins.uglifyEs.default())         // minify
		.pipe(plugins.size({ title: 'DBHelper (after) ' }))
		.pipe(plugins.sourcemaps.write('./'))
		.pipe(gulp.dest('dist/js/'));
});

//Inline Assets into the HTML files
// index.html
gulp.task('inline1', function () {
	return gulp
		.src('./dist/index.html')
		.pipe(
			plugins.stringReplace('<link rel=stylesheet href=css/styles.css>', function (s) {
				let style = fs.readFileSync('dist/css/styles.css', 'utf8');
				return '<style>' + style + '</style>';
			})
		)
		.pipe(
			plugins.stringReplace('<script src=js/dbhelper.min.js></script>', function (s) {
				let script = fs.readFileSync('dist/js/dbhelper.min.js', 'utf8');
				return '<script>' + script + '</script>';
			})
		)
		.pipe(
			plugins.stringReplace('<script src=js/index.min.js defer></script>', function (s) {
				let script = fs.readFileSync('dist/js/index.min.js', 'utf8');
				return '<script>' + script + '</script>';
			})
		)
		// .pipe(minify())
		.pipe(gulp.dest('dist/'));
});



//Inline Assets into the HTML files
// restaurant.html
gulp.task('inline2', function () {
	return gulp
		.src('./dist/restaurant.html')
		.pipe(
			plugins.stringReplace('<link rel=stylesheet href=css/styles.css>', function (s) {
				let style = fs.readFileSync('dist/css/styles.css', 'utf8');
				return '<style>' + style + '</style>';
			})
		)
		.pipe(
			plugins.stringReplace('<script src=js/dbhelper.min.js></script>', function (s) {
				let script = fs.readFileSync('dist/js/dbhelper.min.js', 'utf8');
				return '<script>' + script + '</script>';
			})
		)
		.pipe(
			plugins.stringReplace('<script src=js/restaurant.min.js defer></script>', function (s) {
				let script = fs.readFileSync('dist/js/restaurant.min.js', 'utf8');
				return '<script>' + script + '</script>';
			})
		)
		// .pipe(minify())
		.pipe(gulp.dest('dist/'));
});



// Clean temp directory
gulp.task('clean', function () {
	return del(['.tmp/**/*']); // del files rather than dirs to avoid error
});

// Clean output directory
gulp.task('clean:dist', function () {
	return del(['dist/**/*']); // del files rather than dirs to avoid error
});

// Watch files for changes & reload
gulp.task('serve', function () {
	runSequence(['clean'], ['icons', 'images', 'lint', 'html', 'sw', 'dbhelper', 'manifest'], function () {
		browserSync.init({
			server: '.tmp',
			port: 8001
		});

		gulp.watch(['app/*.html'], ['html', reload]);
		gulp.watch(['app/css/*.css'], ['html', reload]);
		gulp.watch(['app/js/*.js', '!app/js/dbhelper.js', '!app/js/idbhelper.js'], ['lint', 'html', reload]);
		gulp.watch(['app/sw.js', 'app/js/idbhelper.js'], ['lint', 'sw', reload]);
		gulp.watch(['app/js/dbhelper.js', 'app/js/idbhelper.js'], ['lint', 'dbhelper', reload]);
		gulp.watch(['app/manifest.json'], ['manifest', reload]);
	});
});

// Build and serve the fully optimized site
gulp.task('serve:dist', ['default'], function () {
	browserSync.init({
		server: 'dist',
		port: 8000
	});

	gulp.watch(['app/*.html'], ['html:dist', 'inline1', 'inline2', reload]);
	gulp.watch(['app/css/*.css'], ['html:dist', 'inline1', 'inline2', reload]);
	gulp.watch(['app/js/*.js', '!app/js/dbhelper.js', '!app/js/idbhelper.js'], ['lint', 'html:dist', 'inline1', 'inline2', reload]);
	gulp.watch(['app/sw.js', 'app/js/idbhelper.js'], ['lint', 'sw:dist', reload]);
	gulp.watch(['app/js/dbhelper.js', 'app/js/idbhelper.js'], ['lint', 'dbhelper:dist', 'html:dist', 'inline1', 'inline2', reload]);
	gulp.watch(['app/manifest.json'], ['manifest', reload]);
});

// Build production files, the default task
gulp.task('default', ['clean:dist'], function (done) {
	runSequence(['icons', 'images', 'webp', 'lint', 'html:dist', 'sw:dist', 'dbhelper:dist', 'manifest'], ['inline1', 'inline2'], done);
});



