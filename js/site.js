var chess = new Chess();
var config = {
    coordinates: false,
    movable: {
        free: false,
        color: 'white',
        dests: toDests(chess)
    },
    draggable: {
        showGhost: true
    },
    highlight: {
        check: true,
        lastMove: true
    }
}
var cground = Chessground(document.getElementById('cg'),config);
function aiMove(chess,cg) {
    return (orig,dest) => {
        var obj = { from: orig, to: dest,promotion: 'q' };
        var m = chess.move(obj);
        check(chess,cground);
        makeSound(m.flags);
        if (m.flags.includes('p')) promote(cground,dest,'queen');
        if (!chess.game_over() && chess.turn() === 'b') {
            setTimeout(() => {
                var moves = chess.moves({ verbose: true });
                var move = moves[Math.floor(Math.random() * moves.length)];
                var m2 = chess.move(move.san);
                cg.move(move.from, move.to);
                cg.set({
                    turnColor: toColor(chess),
                    movable: {
                        color: toColor(chess),
                        dests: toDests(chess)
                    }
                });
                if (m2.flags.includes('p')) promote(cground,m2.to,rToRook(m2.promotion));
                check(chess,cground);
                makeSound(m2.flags);
                cg.playPremove();
            }, 300);
        } else {
            cg.set({
                viewOnly: true
            });
        }
    }
}
function toColor(c) {
    return c.turn() === 'w' ? 'white' : 'black';
}
function toDests(chess) {
    const dests = {};
    chess.SQUARES.forEach(s => {
        const ms = chess.moves({ square: s, verbose: true });
        if (ms.length) dests[s] = ms.map(m => m.to);
    });
    return dests;
}
function promote(g, key, role) {
    var pieces = {};
    var piece = g.state.pieces[key];
    if (piece && piece.role == 'pawn') {
        pieces[key] = {
            color: piece.color,
            role: role,
            promoted: true
        };
        g.setPieces(pieces);
    }
}
function rToRook(s) {
    var pieces = {
        k: 'king',
        q: 'queen',
        b: 'bishop',
        n: 'knight',
        r: 'rook',
    }
    return pieces[s];
}
function check(c,cg) {
    //c -> chess, cg -> chessground, t -> turn;
    if (c.in_check()) {
        var pieces = cg.state.pieces
        var turn = toColor(c);
        var count = 0;
        for (i in pieces) {
            count++;
            if (pieces[i].color === turn && pieces[i].role === 'king') {
                cg.state.check = i;
                cg.redrawAll();
                return;
            }
        };
    }
}
function makeSound(m) {
    var sound;
    if (m.includes('c')) {
        sound = new Audio('https://lichess1.org/assets/sound/standard/Capture.ogg');
    } else if (chess.game_over()) {
        sound = new Audio('https://lichess1.org/assets/sound/standard/Victory.ogg');
    } else {
        sound = new Audio('https://lichess1.org/assets/sound/standard/Move.ogg');
    }
    sound.play();
}
cground.set({
    movable: {
        events: {
            after: aiMove(chess,cground)
        }
    }
});
