var PATTERN = /<(svg|img|math)\s+(.*?)src="(.*?)"(.*?)\/?>/gi;

var loaderUtils = require('loader-utils');
var fs = require('fs');
var path = require('path');
var SVGO = require('svgo');

var svgo = new SVGO({
  plugins: [
    {
      removeTitle: true
    }
  ]
});

module.exports = function (content) {
  this.cacheable && this.cacheable();
  var loader = this;
  var config = loaderUtils.getLoaderConfig(this, "markupInline");
  content = content.replace(PATTERN, function (match, element, preAttributes, fileName, postAttributes) {
    var isSvgFile = path.extname(fileName).toLowerCase() === '.svg';
    var isImg = element.toLowerCase() === 'img';
    var isRootRelative = fileName.indexOf('/') === 0;

    if (!isSvgFile && isImg) {
      return match;
    }

    var basePath = loader.context;
    if (isRootRelative && config.root) {
      basePath = config.root;
    }

    var filePath = path.join(basePath, fileName);
    loader.addDependency(filePath);
    var fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
    if (isSvgFile) {
      // It's callback, But it's sync
      svgo.optimize(fileContent, function (result) {
        fileContent = result.data;
      });
    }
    return fileContent.replace(/^<svg/, '<svg ' + preAttributes + postAttributes + ' ');
  });
  return content;
};
