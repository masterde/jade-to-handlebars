'use strict';

var lex = require('jade-lexer');
var parse = require('jade-parser');
var selfClosing = require('void-elements');

module.exports = function (input) {
  var ast = parse(lex(input));

  return walk(ast);
};

function walk (obj) {
  if (obj.type === 'Block') {
    return obj.nodes.map(walk).join('');
  }

  if (obj.type === 'Tag') {
    return tag(obj);
  }

  if (obj.type === 'Text') {
    return obj.val.replace(/#{([^}]+)}/g, '{{$1}}');
  }
}

function tag (obj) {
  var attrs = normalizeAttrs(obj).map(function (attr) {
    var val = attr.escaped ? attr.val : attr.val.replace(/\'/g, '"');

    if (!/^".+"$/.test(val)) {
      val = '"{{' + val +'}}"';
    }

    return attr.name + '=' + val;
  }).join(' ');

  if (selfClosing[obj.name]) {
    return '<' + (obj.name + ' ' + attrs).trim() + '/>';
  }

  return '<' + (obj.name + ' ' + attrs).trim() + '>' +
    walk(obj.block) +
    '</' + obj.name + '>';
}

function normalizeAttrs (obj) {
  var classes = [];
  var id;
  var attrs = obj.attrs.filter(function (attr) {
    if (attr.name === 'id') {
      id = attr;
      return false;
    }
    if (attr.name === 'class') {
      classes.push(attr);
      return false;
    }
    return true;
  });

  if (id) {
    attrs.unshift(id);
  }

  if (classes.length) {
    attrs.push({
      name: 'class',
      val: '"' + classes.map(function (klass) {
        return klass.val.slice(1, -1);
      }).join(' ') + '"',
      escaped: false
    });
  }

  return attrs;
}
