const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const responsive = require('gulp-responsive');
const webp = require('gulp-webp');
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
	var bundler = browserify('./app/sw.js', { debug: true }); // ['1.js', '2.js']

	return bundler
		.transform(babelify, { sourceMaps: true })  // required for 'import'
		.bundle()               // concat
		.pipe(source('sw.js'))  // get text stream w/ destination filename
		.pipe(buffer())         // required to use stream w/ other plugins
		.pipe(gulp.dest('.tmp'));
});

// Optimize Service Worker
gulp.task('sw:dist', function () {
	var bundler = browserify('./app/sw.js', { debug: true }); // ['1.js', '2.js']

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
	runSequence(['clean'], ['icons', 'images', 'lint', 'html', 'sw', 'manifest'], function () {
		browserSync.init({
			server: '.tmp',
			port: 8001
		});

		gulp.watch(['app/*.html'], ['html', reload]);
		gulp.watch(['app/css/*.css'], ['html', reload]);
		gulp.watch(['app/js/*.js'], ['lint', 'html', reload]);
		gulp.watch(['app/sw.js'], ['lint', 'sw', reload]);
		gulp.watch(['app/manifest.json'], ['manifest', reload]);
	});
});

// Build and serve the fully optimized site
gulp.task('serve:dist', ['default'], function () {
	browserSync.init({
		server: 'dist',
		port: 8000
	});

	gulp.watch(['app/*.html'], ['html:dist', reload]);
	gulp.watch(['app/css/*.css'], ['html:dist', reload]);
	gulp.watch(['app/js/*.js'], ['lint', 'html:dist', reload]);
	gulp.watch(['app/sw.js'], ['lint', 'sw', reload]);
	gulp.watch(['app/manifest.json'], ['manifest', reload]);
});

// Build production files, the default task
gulp.task('default', ['clean:dist'], function (done) {
	runSequence(['icons', 'images', 'webp', 'lint', 'html:dist', 'sw:dist', 'manifest'], done);
});