var m = require('mithril');
var makeItems = require('./item').ctrl;
var itemView = require('./item').view;
var makeChess = require('./chess');
var ground = require('./ground');
var sound = require('./sound');
var promotion = require('./promotion');

module.exports = function(blueprint, opts) {

  var items = makeItems({
    apples: blueprint.apples
  });

  var vm = {
    initialized: false,
    lastStep: false,
    completed: false,
    failed: false,
    score: 0,
    nbMoves: 0
  };
  setTimeout(function() {
    vm.initialized = true;
    m.redraw();
  }, 100);

  var addScore = function(v) {
    vm.score += v;
    opts.onScore(v);
  };

  var getRank = function() {
    if (!vm.completed) return;
    var late = vm.nbMoves - blueprint.nbMoves;
    if (late <= 0) return 1;
    else if (late <= Math.max(1, blueprint.nbMoves / 8)) return 2;
    return 3;
  };

  var complete = function() {
    setTimeout(function() {
      if (vm.failed) return opts.restart();
      vm.lastStep = false;
      vm.completed = true;
      sound.stageEnd();
      var rank = getRank();
      var bonus = 100;
      if (rank === 1) bonus = 500;
      else if (rank === 2) bonus = 300;
      addScore(bonus);
      ground.stop();
      m.redraw();
      setTimeout(opts.onComplete, 1200);
    }, ground.data().stats.dragged ? 0 : 250);
  };

  var detectFailure = function() {
    var failed = false;
    (blueprint.failure || []).forEach(function(f) {
      failed = failed || f(chess);
    });
    if (failed) sound.failure();
    return failed;
  };

  var sendMove = function(orig, dest, prom) {
    vm.nbMoves++;
    var move = chess.move(orig, dest, prom);
    if (!move) throw 'Invalid move!';
    var starTaken = false;
    items.withItem(move.to, function(item) {
      if (item === 'apple') {
        addScore(50);
        items.remove(move.to);
        starTaken = true;
      }
    });
    if (!items.hasItem('apple')) complete();
    else if (starTaken) sound.take();
    else sound.move();
    if (vm.completed) return;
    vm.failed = vm.failed || detectFailure();
    chess.color(blueprint.color);
    ground.color(blueprint.color, chess.dests());
    m.redraw();
  };

  var onMove = function(orig, dest) {
    if (!promotion.start(orig, dest, sendMove)) sendMove(orig, dest);
  };

  var chess = makeChess(
    blueprint.fen,
    blueprint.emptyApples ? [] : items.appleKeys());

  ground.set({
    chess: chess,
    orientation: blueprint.color,
    onMove: onMove,
    items: {
      render: function(pos, key) {
        return items.withItem(key, itemView);
      }
    },
    shapes: blueprint.shapes
  });

  if (blueprint.id !== 1) sound.stageStart();

  return {
    blueprint: blueprint,
    items: items,
    vm: vm,
    getRank: getRank,
    restart: opts.restart
  };
};
