'use strict';
let yabbc = require('./ya-bbcode.js');

let bbc = '[url=https://nodecraft.com]Visit Nodecraft[/url]';

let parser = new yabbc();

console.time('parse');
console.dir(parser.parse(bbc), {depth: 909999});
console.timeEnd('parse');