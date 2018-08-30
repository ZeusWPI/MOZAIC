
const through = require('through2');
const Vinyl = require('vinyl');
const gutil = require('gulp-util');

const gulp = require('gulp');
const ts = require('gulp-typescript');
const path = require('path');

const protobuf = require('protobufjs');
const pbts = require('protobufjs/cli/pbts');

const toml = require('toml');
const CodeBlockWriter = require('code-block-writer').default;

/******************************************************************************
 * Helpers
 ******************************************************************************/

const targets = {
    'static': require('protobufjs/cli/targets/static'),
    'static-module': require('protobufjs/cli/targets/static-module')
};

function gen_protobuf(out_path) {
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
        "keepCase": false,
        "forceLong": false,
        "forceNumber": true,
        "forceEnumString": true,
        "forceMessage": false,
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
                    path: out_path,
                    contents: new Buffer(result)
                }));
            }
        });
    }
    
    return through.obj(parse_file, gen_output);
}

// IMPORTANT: this is a bit of a hack, as this requires the
// input files to actually be on disk in order to be read by
// pbts.
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

function generate_events_declaration(events) {
    const writer = new CodeBlockWriter();
    writer.writeLine('import * as proto from "./proto";');
    writer.writeLine('export = proto.mozaic.events;');
    writer.write('declare module "./proto"').block(() => {
        writer.write('namespace mozaic.events').block(() => {
            Object.keys(events).forEach((eventName) => {
                const typeId = events[eventName];
                writer.write(`namespace ${eventName}`).block(() => {
                    writer.write(`const typeId: ${typeId};`);
                });
                writer.write(`interface ${eventName}`).block(() => {
                    writer.write(`eventType: typeof ${eventName};`);
                });
            });
        });

    });
    return writer.toString();
}

function generate_events_implementation(events) {
    const writer = new CodeBlockWriter();
    writer.writeLine(`const proto_root = require('./proto');`);
    // TODO: dont hardcode this
    writer.writeLine(`const events = proto_root.mozaic.events;`);
    Object.keys(events).forEach((eventName) => {
        const typeId = events[eventName];
        const eventType = `events["${eventName}"]`;
        writer.writeLine(`${eventType}.typeId = ${typeId};`);
        writer.writeLine(`${eventType}.prototype.eventType = ${eventType};`);
    });
    writer.writeLine('module.exports = events;');
    return writer.toString();
}

function generate_events_module() {
    return through.obj(function(file, enc, callback) {
        if (!file.isBuffer()) {
            callback(new gutil.PluginError('toml', 'unsupported'));
        }
        var events = toml.parse(file.contents).events;

        const module_name = "eventTypes";

        const declaration = generate_events_declaration(events);
        this.push(new Vinyl({
            path: `${module_name}.d.ts`,
            contents: Buffer.from(declaration),
        }));

        const implementation = generate_events_implementation(events);
        this.push(new Vinyl({
            path: `${module_name}.js`,
            contents: Buffer.from(implementation),
        }));

        callback();
    });
}


/******************************************************************************
 * Tasks
 ******************************************************************************/

const TS_SOURCES = "src/**/*.ts";
const PROTO_SOURCES = "../proto/**/*.proto"

const tsProject = ts.createProject('tsconfig.json');

function compile_typescript() {
    return gulp.src(TS_SOURCES)
        .pipe(tsProject())
        .pipe(gulp.dest('dist'));
}

function watch_typescript() {
    return gulp.watch(TS_SOURCES, compile_typescript);
}

function gen_proto() {
    return gulp.src(PROTO_SOURCES)
        .pipe(gen_protobuf('proto.js'))
        .pipe(gulp.dest('generated'));
}

function type_proto() {
    return gulp.src('generated/proto.js')
        .pipe(type_protobuf())
        .pipe(gulp.dest('generated'));
}

function gen_events() {
    return gulp.src("../proto/events.toml")
        .pipe(generate_events_module())
        .pipe(gulp.dest('generated'));
}

const build_protobuf = gulp.series(
    gen_proto,
    type_proto,
);

function watch_protobuf() {
    return gulp.watch(PROTO_SOURCES, gulp.series(
        build_protobuf,
        copy_generated_code,
    ));
}

function watch_events_toml() {
    return gulp.watch("../proto/events.toml", gulp.series(
        gen_events,
        copy_generated_code,
    ));
}

function copy_generated_code() {
    return gulp.src('generated/**/*')
        .pipe(gulp.dest('dist'));
}

const build = gulp.series(
    build_protobuf,
    gen_events,
    compile_typescript,
    copy_generated_code,
);

gulp.task('build', build);

gulp.task('watch', gulp.parallel(
    watch_typescript,
    watch_protobuf,
    watch_events_toml,
));

gulp.task('default', build);