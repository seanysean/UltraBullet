var Popup = {
    ovr: document.getElementById('js-overlay'),
    close(which,notOvr) {
        // Ovr refers to .overlay
        if (!notOvr) {
            this.ovr.style.opacity = 0;
            setTimeout(function() {
                Popup.ovr.style.display = 'none';
                document.getElementById('js-popup-' + which).style.display = 'none';
            }, 500);
        } else {
            document.getElementById('js-popup-' + which).style.display = 'none';
        }
    },
    open(which) {
        this.ovr.style.display = 'block';
        document.getElementById('js-popup-' + which).style.display = 'block';
        this.ovr.style.opacity = 1;
    }
}

var play = document.getElementById('play'),
    machineTimeMove = 300;

Popup.open('start');

play.addEventListener('click', function() {
    Popup.close('start');
    var v = document.querySelector('.optgroup input:checked').value;
    if (v) {
        machineTimeMove = document.querySelector('.optgroup input:checked').value;
    }
});


var chess = new Chess(),
    clocks = {
        white: 15,
        black: 15
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
            }, machineTimeMove);
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
        for (i in pieces) {
            if (pieces[i].color === turn && pieces[i].role === 'king') {
                cg.state.check = i;
                cg.redrawAll();
                return;
            }
        }
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
var toMove = 'white',
    clockUpdate = false;
function pressClock() {
    toMove = toMove === 'white' ? 'black' : 'white';
    if (clockUpdate) {
        window.clearInterval(clockUpdate);
    }
    var html = {
        black: document.getElementById('clock1'),
        white: document.getElementById('clock2')
    }
    if (!ended) {
        if (toMove === 'white') {
            html.white.classList.add('tick');
            html.black.classList.remove('tick');
        } else {
            html.black.classList.add('tick');
            html.white.classList.remove('tick');
        }
        clockUpdate = setInterval(() => {
            clocks[toMove] = (clocks[toMove] - 0.1).toFixed(1);
            html[toMove].innerHTML = '0:' + (clocks[toMove] > 9.9 ? '' : '0') + clocks[toMove];
            if (clocks[toMove] === (0).toFixed(1)) gameEnd();
        }, 100);
    }
}
function gameEnd() {
    window.clearInterval(clockUpdate);
    ended = true;
    makeSound();
    cground.set({
        viewOnly: true
    });
    setTimeout(function() {
        Popup.open('gameEnd');
    },500);
}
cground.set({
    movable: {
        events: {
            after: aiMove(chess,cground)
        }
    }
});
const endbtns = {
    pgn: document.getElementById('js-end-pgn'),
    refresh: document.getElementById('js-end-refresh'),
    pgnClose: document.getElementById('pgn-close'),
    pgnAll: document.getElementById('pgn-all'),
    copyPgn: document.getElementById('copy-pgn')
}

endbtns.pgn.addEventListener('click',()=>{
    Popup.open('pgn');
    endbtns.pgnAll.innerHTML = `[White "You"]
[Black "Random ${machineTimeMove}ms/move"]
[Site "https://seanysean.github.io/UltraBullet/"]
[Variant "Standard"]

${chess.pgn()}`;
});
endbtns.copyPgn.addEventListener('click',()=>{
    endbtns.pgnAll.select();
    document.execCommand("Copy");
    endbtns.copyPgn.innerHTML = `<i class="fa fa-check"></i> Copied!`;
});
endbtns.pgnClose.addEventListener('click',()=>{
    Popup.close('pgn', true);
});

endbtns.refresh.addEventListener('click',()=>{
    window.location.reload();
})
