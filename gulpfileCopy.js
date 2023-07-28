let project_folder = require('path').basename(__dirname);
let source_folder = '#src';
let fs = require('fs');
let style_type = 'sass';

// Path
let path = {
	build: {
		html: project_folder + '/',
		css: project_folder + '/css/',
		js: project_folder + '/js/',
		img: project_folder + '/img/',
		fonts: project_folder + '/fonts/',
		libs: project_folder + '/libs/',
	},
	src: {
		html: source_folder + '/*.html',
		pug: source_folder + '/pug/*.pug',
		sass: source_folder + `/sass/*.${style_type}`,
		css: source_folder + '/css/**/*.css',
		js: source_folder + '/js/*.js',
		jsCopy: source_folder + '/jsCopy/*.js',
		img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
		fonts: source_folder + '/fonts/*.ttf',
		libs: source_folder + '/libs/**/*',
	},
	watch: {
		html: source_folder + '/html/**/*.html',
		pug: source_folder + '/pug/**/*.pug',
		sass: source_folder + `/sass/**/*.${style_type}`,
		js: source_folder + '/js/*.js',
		img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
	},
	clean: './' + project_folder + '/'
}

// VARIABLES
let {src, dest } = require('gulp'),
		gulp = require('gulp'),
		browsersync = require('browser-sync').create(),
		plumber = require('gulp-plumber'),
		notify = require('gulp-notify'),
		pug = require('gulp-pug'),
		del = require('del'),
		sass = require('gulp-sass'),
		sourcemaps = require('gulp-sourcemaps'),
		autoprefixer = require('gulp-autoprefixer'),
		group_media = require('gulp-group-css-media-queries'),
		clean_css = require('gulp-clean-css'),
		rename = require('gulp-rename'),
		fileinclude = require('gulp-file-include'),
		uglify = require('gulp-uglify-es').default,
		babel = require('gulp-babel'),
		ttf2woff = require('gulp-ttf2woff'),
		ttf2woff2 = require('gulp-ttf2woff2'),
		fonter = require('gulp-fonter');


// FUNCTIONS
function browserSync() {
	browsersync.init({
		server: {
			baseDir: './' + project_folder + '/'
		},
		port: 3000,
		notify: false
	})
}

// HTML
function html() {
	return src(path.src.html)
	.pipe(fileinclude({prefix: '@@',}))
	.pipe(dest(path.build.html))
	.pipe(browsersync.stream())
}

// PUG
function pugF() {
	return src(path.src.pug)
	.pipe(pug({pretty: true}))
	.pipe(dest(path.build.html))
	.pipe(browsersync.stream())
}

// SASS
function sassF() {
	return src(path.src.sass)
	.pipe(sourcemaps.init())
	.pipe(sass({ outputStyle: "expanded" }))
	.pipe(group_media())
	.pipe(autoprefixer({
		overrideBrowserslist: ["last 3 version"],
		cascade: true
	}))
	.pipe(sourcemaps.write())
	.pipe(dest(path.build.css))
	.pipe(clean_css())
	.pipe(rename({ extname: ".min.css" }))
	.pipe(sourcemaps.write())
	.pipe(dest(path.build.css))
	.pipe(browsersync.stream())
}

// COPY CSS
function copyCss() {
	return src(path.src.css)
	.pipe(dest(path.build.css))
	.pipe(browsersync.stream())
}

// JS
function js() {
	return src(path.src.js)
	.pipe(fileinclude())
	// .pipe(babel({
	// 	presets: ['@babel/env']
	//  }))
	.pipe(dest(path.build.js))
	.pipe(uglify())
	.pipe(rename({ extname: ".min.js" }))
	.pipe(dest(path.build.js))
	.pipe(browsersync.stream())
}

// COPY JS
function copyJs() {
	return src(path.src.jsCopy)
	.pipe(dest(path.build.js))
	.pipe(browsersync.stream())
}

// COPY LIBS
function libs() {
	return src(path.src.libs)
		.pipe(dest(path.build.libs))
		.pipe(browsersync.stream())
}

// IMG
function img() {
	return src(path.src.img)
	.pipe(dest(path.build.img))
	.pipe(browsersync.stream())
}

// FONTS
function fonts() {
	src(path.src.fonts)
	.pipe(ttf2woff())
	.pipe(dest(path.build.fonts))
	return src(path.src.fonts)
	.pipe(ttf2woff2())
	.pipe(dest(path.build.fonts))
}

// For OTF format
// Для otf формата
gulp.task('otf2ttf', function() {
	return src([source_folder + '/fonts/*.otf'])
	.pipe(fonter({ formats: ['ttf'] }))
	.pipe(dest(source_folder + '/fonts/'))
});

// Automatic font connection
// Автоматическое подключение шрифтов
function fontStyle() {
	let file_content = fs.readFileSync(source_folder + '/sass/parts/fonts.sass');
	if (file_content == '') {
		fs.writeFile(source_folder + '/sass/parts/fonts.sass', '', cb);
		return fs.readdir(path.build.fonts, function(err, items) {
			if (items) {
				let c_fontname;
				for (let i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(source_folder + '/sass/parts/fonts.sass', `\n @include font(${fontname}, ${fontname}, 400, normal);`, (err) => {
							if (err) throw err;
							console.log('err')
						});
					}
						c_fontname = fontname;
				}
			}
		})
	}
}
// Needed for the previous function to work correctly
// Нужно для корректной работы предыдущей функции
function cb() {}

// CLEAN BUILD DIRECTORY
function clean() {
	return del(path.clean);
}

// WATCH FILES
function watchFiles() {
	// gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.pug], pugF);
	gulp.watch([path.watch.sass], sassF);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.img], img);
}




// GULP COMMANDS

/* Build */
let build = gulp.series(clean, gulp.parallel(pugF, sassF, js, img, fonts, fontStyle, copyCss, copyJs));
/*Development */
let watch = gulp.parallel(browserSync, build, watchFiles);

// EXPPORTS
exports.libs = libs;
exports.fontStyle = fontStyle;
exports.img = img;
exports.fonts = fonts;
exports.js = js;
exports.copyJs = copyJs;
exports.sass = sassF;
exports.copyCss = copyCss;
exports.pugF = pugF;
exports.html = html;
exports.build = build;
exports.watchFiles = watchFiles;
exports.default = watch;
exports.clean = clean;