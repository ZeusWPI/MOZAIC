const gulp = require('gulp');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

function compile_ts() {
    return tsProject.src()
        .pipe(tsProject())
        js.pipe(gulp.dest('dist'));
}

gulp.task('default', compile_ts);
gulp.task('build', compile_ts);