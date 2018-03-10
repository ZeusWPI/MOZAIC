
const through = require('through2');
const Vinyl = require('vinyl');
const gutil = require('gulp-util');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const path = require('path');

const protobuf = require('protobufjs');
const pbts = require('protobufjs/cli/pbts');

const TS_SOURCES = "src/**/*.ts";

const targets = {
    'static': require('protobufjs/cli/targets/static'),
    'static-module': require('protobufjs/cli/targets/static-module')
};

function compile_protobuf() {
    var options = {
        target: "static-module",
        create: true,
        encode: true,
        decode: true,
        verify: true,
        convert: true,
        delimited: true,
        beautify: true,
        comments: true,
        es6: false,
        wrap: 'commonjs',
        "keep-case": false,
        "force-long": false,
        "force-number": false,
        "force-enum-string": false,
        "force-message": false
    };

    var root = new protobuf.Root();

    function parse_file(file, enc, callback) {
        if (!file.isBuffer()) {
            callback(new gutil.PluginError('pbjs', 'unsupported'));
        }

        protobuf.parse(file.contents, root, options);

        callback();
    }

    function gen_output(callback) {
        var target = targets[options.target];
        target(root, options, function(err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, new Vinyl({
                    path: 'proto.js',
                    contents: new Buffer(result)
                }));
            }
        });
    }
    
    return through.obj(parse_file, gen_output);
}

function type_protobuf() {
    return through.obj(function(file, enc, callback) {
        if (!file.isBuffer()) {
            callback(new gutil.PluginError('pbts', 'unsupported'));
        }
        pbts.main([file.path], function(err, result) {
            if (err) {
                callback(err);
            } else {
                file.extname = '.d.ts';
                file.contents = new Buffer(result)
                callback(null, file);
            }
        });
    });
}

function gen_proto() {
    return gulp.src('../proto/*.proto')
        .pipe(compile_protobuf())
        .pipe(gulp.dest('generated'));
}

function type_proto() {
    return gulp.src('./generated/*.js')
        .pipe(type_protobuf())
        .pipe(gulp.dest('generated'));
}

function copy_generated() {
    return gulp.src('generated/**/*')
        .pipe(gulp.dest('dist'));
}


const tsProject = ts.createProject('tsconfig.json');
function compile_ts() {
    return gulp.src(TS_SOURCES)
        .pipe(tsProject())
        .pipe(gulp.dest('dist'));
}


gulp.task('gen_proto', gulp.series(
    gen_proto,
    type_proto
));

gulp.task('compile', gulp.series(
    compile_ts,
    copy_generated
));

gulp.task('build', gulp.series(
    'gen_proto',
    'compile'
));

gulp.task('watch', () => {
    gulp.watch(TS_SOURCES, compile_ts);
});

gulp.task('default', gulp.series('build'));