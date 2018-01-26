var chess = new Chess();
var config = {
    coordinates: false,
    highlight: {
        check: true
    },
    movable: {
        free: false,
        color: 'white',
        dests: toDests(chess)
    },
    draggable: {
        showGhost: true
    }
}
var cground = Chessground(document.getElementById('cg'),config);
function aiMove(chess,cg) {
    return (orig,dest) => {
        var obj = { from: orig, to: dest,promotion: 'q' };
        var m = chess.move(obj);
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
cground.set({
    movable: {
        events: {
            after: aiMove(chess,cground)
        }
    }
});
