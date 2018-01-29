var chess = new Chess(),
    clocks = {
        white: 14,
        black: 14
    },
    config = {
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
    },
    animation: {
        enabled: false
    }
},  sound = {
    capture: new Audio('https://lichess1.org/assets/sound/standard/Capture.ogg'),
    gameOver: new Audio('https://lichess1.org/assets/sound/standard/Victory.ogg'),
    move: new Audio('https://lichess1.org/assets/sound/standard/Move.ogg')
},  ended = false, cground = Chessground(document.getElementById('cg'),config);
function aiMove(chess,cg) {
    return (orig,dest) => {
        var obj = { from: orig, to: dest,promotion: 'q' };
        var m = chess.move(obj);
        if (chess.game_over()) ended = true;
        check(chess,cground);
        pressClock();
        makeSound(m.flags);
        if (m.flags.includes('p')) promote(cground,dest,'queen');
        if (chess.turn() === 'b' && !ended) {
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
                if (chess.game_over()) gameEnd();
                check(chess,cground);
                pressClock();
                makeSound(m2.flags);
                cg.playPremove();
            }, 300);
        } else {
            gameEnd();
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
function makeSound(m = '') {
    if (ended) {
        sound.gameOver.volume = 0.1;
        sound.gameOver.play();
    } else if (m.includes('c')) {
        sound.capture.volume = 0.1;
        sound.capture.play();
    } else {
        sound.move.volume = 0.1;
        sound.move.play();
    }
}
var interv = setInterval(()=>console.log('nothing'),10000),
    toMove = 'white';
function pressClock() {
    toMove = toMove === 'white' ? 'black' : 'white';
    var html = {
        black: document.getElementById('clock1'),
        white: document.getElementById('clock2')
    }
    window.clearInterval(interv);
    if (!ended) {
        interv = setInterval(() => {
            clocks[toMove] = (clocks[toMove] - 0.1).toFixed(1);
            html[toMove].innerHTML = '0:' + (clocks[toMove] > 9 ? '' : '0') + clocks[toMove];
            if (clocks[toMove] === (0).toFixed(1)) gameEnd();
        }, 100);
    }
}
function gameEnd() {
    window.clearInterval(interv);
    ended = true;
    makeSound();
    cground.set({
        viewOnly: true
    });
}
cground.set({
    movable: {
        events: {
            after: aiMove(chess,cground)
        }
    }
});