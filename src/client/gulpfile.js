
const through = require('through2');
const gutil = require('gulp-util');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const path = require('path');

const protobuf = require('protobufjs');


const targets = {
    'static': require('protobufjs/cli/targets/static'),
    'static-module': require('protobufjs/cli/targets/static-module')
};

function pbjs() {
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
        es6: null,
        wrap: 'commonjs',
        "keep-case": false,
        "force-long": false,
        "force-number": false,
        "force-enum-string": false,
        "force-message": false
    };
    
    return through.obj(function(file, enc, callback) {
        
        if (!file.isBuffer()) {
            callback(new gutil.PluginError('pbjs', 'unsupported'));
        }
        var root = new protobuf.Root();
        protobuf.parse(file.contents, root, options);

        var target = targets[options.target];
        target(root, options, function(err, result) {
            if (err) {
                callback(err);
            } else {
                file.contents = new Buffer(result);
                file.path = gutil.replaceExtension(file.path, '.js');
                callback(null, file);
            }
        });
    });

    
}

function compile_protobuf() {
    return gulp.src('../client_server.proto')
        .pipe(pbjs())
        .pipe(gulp.dest('generated'));
}

const tsProject = ts.createProject('tsconfig.json');

function compile_ts() {
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest('dist'));
}

const compile = gulp.series(
    compile_protobuf,
    compile_ts
);


gulp.task('default', compile);
gulp.task('build', compile);