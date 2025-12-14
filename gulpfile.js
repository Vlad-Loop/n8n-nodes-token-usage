const { src, dest } = require('gulp');

function buildNodeIcons() {
  return src('nodes/**/*.{png,svg}').pipe(dest('dist/nodes'));
}

exports.default = buildNodeIcons;
exports['build:icons'] = buildNodeIcons;
