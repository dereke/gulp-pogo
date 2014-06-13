var es = require('event-stream');
var pogo = require('pogo');
var gutil = require('gulp-util');
var Buffer = require('buffer').Buffer;
var path = require('path');

module.exports = function (opt) {
  var pogoExtensionRegex = /\.pogo$/;
  function modifyFile(file) {
    function isPogoFile(){ return !!pogoExtensionRegex.exec(file.path);}

    if (file.isNull() || !isPogoFile()) return this.emit('data', file); // pass along
    if (file.isStream()) return this.emit('error', new Error("gulp-pogo: Streaming not supported"));

    var str = file.contents.toString('utf8');
    var dest = gutil.replaceExtension(file.path, ".js");

    var options = {
    };

    if (opt) {
      options = {
        bare: opt.bare != null ? !! opt.bare : false,
        sourceMap: opt.sourceMap != null ? !! opt.sourceMap : false,
        filename: file.path,
        sourceFiles: [path.basename(file.path)],
        generatedFile: path.basename(dest)
      }
    }

    try {
      data = pogo.compile(str, options);
    } catch (err) {
      var message = "Error compiling pogo file: " + file.path;
      message += ' \n' + err
      return this.emit('error', new Error(message));
    }

    if (options.sourceMap) {
      sourceMapFile = new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: dest + '.map',
        contents: new Buffer(data.v3SourceMap)
      });
      this.emit('data', sourceMapFile);
      data = data.js + "\n/*\n//# sourceMappingURL=" + path.basename(sourceMapFile.path) + "\n*/\n";
    }
    file.contents = new Buffer(data);
    file.path = dest;
    this.emit('data', file);
  }

  return es.through(modifyFile);
};
