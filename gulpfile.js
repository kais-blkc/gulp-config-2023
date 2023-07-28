import gulpClean from "gulp-clean";
import pkg from "gulp";
import bc from "browser-sync";
import gulpPug from "gulp-pug";
import dartSass from "sass";
import gulpSass from "gulp-sass";
import sourcemaps from "gulp-sourcemaps";
import fileinclude from "gulp-file-include";
import group_media from "gulp-group-css-media-queries";
import autoPrefixer from "gulp-autoprefixer";
import ttf2woff2 from "gulp-ttf2woff2";
import ttf2woff from "gulp-ttf2woff";
import fonter from "gulp-fonter";
// import clean_css from "gulp-clean-css";
// import uglify from "gulp-uglify-es";
// import rename from "gulp-rename";

const project_folder = "./dist";
const source_folder = "./#src";
const { src, dest, series, parallel, watch } = pkg;
const sass = gulpSass(dartSass);
const browserSync = bc.create();
// import fs from "fs";

/* Paths */
let paths = {
	build: {
		html: project_folder + "/",
		css: project_folder + "/css/",
		js: project_folder + "/js/",
		img: project_folder + "/img/",
		fonts: project_folder + "/fonts/",
		libs: project_folder + "/libs/",
	},
	src: {
		html: source_folder + "/*.html",
		pug: source_folder + "/pug/*.pug",
		sass: source_folder + `/sass/*.sass`,
		css: source_folder + "/css/**/*.css",
		js: source_folder + "/js/*.js",
		jsCopy: source_folder + "/jsCopy/*.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
		fonts: source_folder + "/fonts/*.ttf",
		libs: source_folder + "/libs/**/*",
	},
	watch: {
		html: source_folder + "/html/**/*.html",
		pug: source_folder + "/pug/**/*.pug",
		sass: source_folder + `/sass/**/*.sass`,
		js: source_folder + "/js/*.js",
		img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
	},
	clean: "./dist/**",
};

/* Funcs */
function browserSyncStart() {
	browserSync.init({
		server: {
			baseDir: "./dist/",
		},
		port: 3000,
		notify: false,
	});
}

function clearDist() {
	return src(paths.clean).pipe(gulpClean());
}

function pugF() {
	return src(paths.src.pug)
		.pipe(gulpPug({ pretty: true }))
		.pipe(dest(paths.build.html))
		.pipe(browserSync.stream());
}

function sassF() {
	return (
		src(paths.src.sass)
			.pipe(sourcemaps.init())
			.pipe(sass({ outputStyle: "expanded" }))
			.pipe(group_media())
			.pipe(
				autoPrefixer({
					overrideBrowserslist: ["last 3 version"],
					cascade: true,
				})
			)
			.pipe(sourcemaps.write())
			.pipe(dest(paths.build.css))
			// .pipe(clean_css())
			// .pipe(rename({ extname: ".min.css" }))
			// .pipe(sourcemaps.write())
			.pipe(dest(paths.build.css))
			.pipe(browserSync.stream())
	);
}

function js() {
	return (
		src(paths.src.js)
			.pipe(fileinclude())
			.pipe(dest(paths.build.js))
			// .pipe(uglify())
			// .pipe(rename({ extname: ".min.js" }))
			.pipe(dest(paths.build.js))
			.pipe(browserSync.stream())
	);
}

function copyCSS() {
	return src(paths.src.css).pipe(dest(paths.build.css));
}

function copyJS() {
	return src(paths.src.jsCopy).pipe(dest(paths.build.js));
}

function img() {
	return src(paths.src.img)
		.pipe(dest(paths.build.img))
		.pipe(browserSync.stream());
}

function fonts() {
	src(paths.src.fonts).pipe(ttf2woff()).pipe(dest(paths.build.fonts));
	return src(paths.src.fonts).pipe(ttf2woff2()).pipe(dest(paths.build.fonts));
}

function otf2ttf() {
	return src([source_folder + "/fonts/*.otf"])
		.pipe(fonter({ formats: ["ttf"] }))
		.pipe(dest(source_folder + "/fonts/"));
}

function watchFiles() {
	watch([paths.watch.pug], pugF);
	watch([paths.watch.sass], sassF);
	watch([paths.watch.js], js);
	watch([paths.watch.img], img);
}

function logHello() {
	console.log("Hello!");
	console.log(project_folder);
}

const build = series(
	clearDist,
	parallel(pugF, sassF, js, img, fonts, otf2ttf, copyCSS, copyJS)
);

const dev = parallel(browserSyncStart, build, watchFiles);

export { dev as default, build, watch };
