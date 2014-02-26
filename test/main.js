var pogo = require('../');
var should = require('should');
var pogoscript = require('pogo');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
require('mocha');

var createFile = function (filepath, contents) {
  var base = path.dirname(filepath);
  return new gutil.File({
    path: filepath,
    base: base,
    cwd: path.dirname(base),
    contents: contents
  });
}

describe('gulp-pogo', function() {
  describe('pogo()', function() {
    before(function() {
      this.testData = function (expected, newPath, done) {
        var newPaths = [newPath];

        if (expected.v3SourceMap) {
          newPaths.unshift(newPath + '.map');
          expected = [
            expected.v3SourceMap,
            expected.js + "\n/*\n//# sourceMappingURL=" + path.basename(newPaths[0]) + "\n*/\n"
          ];
        } else {
          expected = [expected];
        }

        return function (newFile) {
          this.expected = expected.shift();
          this.newPath = newPaths.shift();

          should.exist(newFile);
          should.exist(newFile.path);
          should.exist(newFile.relative);
          should.exist(newFile.contents);
          newFile.path.should.equal(this.newPath);
          newFile.relative.should.equal(path.basename(this.newPath));
          String(newFile.contents).should.equal(this.expected);

          if (done && !expected.length) {
            done.call(this);
          }
        }
      };
    });

    it('should concat two files', function(done) {
      var filepath = "/home/contra/test/file.pogo";
      var contents = new Buffer("a = 2");
      var opts = {bare: true};
      var expected = pogoscript.compile(String(contents), opts);

      pogo(opts)
        .on('error', done)
        .on('data', this.testData(expected, "/home/contra/test/file.js", done))
        .write(createFile(filepath, contents));
    });

    it('should emit errors correctly', function(done) {
      var filepath = "/home/contra/test/file.pogo";
      var contents = new Buffer("a=1\r\na=2");

      pogo({bare: true})
        .on('error', function(err) {
          err.message.indexOf(filepath).should.not.equal(-1);
          done();
        })
        .on('data', function(newFile) {
          throw new Error("no file should have been emitted!");
        })
        .write(createFile(filepath, contents));
    });
  });
});
