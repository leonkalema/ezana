function isValidPos(p) {
    return p.row >= 0 && p.row < 8 && p.col >= 0 && p.col < 8;
}
function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
function colorAt(state, p) {
    if (!isValidPos(p))
        return null;
    const row = state.board[p.row];
    if (!row)
        return null;
    const sq = row[p.col];
    return sq && sq.color ? sq.color : null;
}
function typeAt(state, p) {
    if (!isValidPos(p))
        return null;
    const row = state.board[p.row];
    if (!row)
        return null;
    const sq = row[p.col];
    return sq && sq.type ? sq.type : null;
}
function setEmpty(state, p) {
    if (!isValidPos(p))
        return;
    state.board[p.row][p.col] = { type: null, color: null };
}
function setPiece(state, p, type, color) {
    if (!isValidPos(p))
        return;
    state.board[p.row][p.col] = { type, color };
}
function diagonalStep(a, b) {
    const rowDiff = b.row - a.row;
    const colDiff = b.col - a.col;
    if (Math.abs(rowDiff) !== Math.abs(colDiff))
        return null;
    const distance = Math.abs(rowDiff);
    if (distance < 1)
        return null;
    return { rowStep: rowDiff > 0 ? 1 : -1, colStep: colDiff > 0 ? 1 : -1, distance };
}
function collectCapturedAlong(state, from, to, moverColor, isKing) {
    const step = diagonalStep(from, to);
    if (!step)
        return null;
    const { rowStep, colStep, distance } = step;
    let seenOpponent = 0;
    const captured = [];
    let r = from.row + rowStep;
    let c = from.col + colStep;
    for (let i = 1; i <= distance; i++) {
        if (!isValidPos({ row: r, col: c }))
            return null;
        const sq = state.board[r] ? state.board[r][c] : undefined;
        const isLast = i === distance;
        if (isLast) {
            if (sq?.type !== null)
                return null;
            break;
        }
        if (sq?.type !== null) {
            if (sq && sq.color === moverColor)
                return null;
            seenOpponent++;
            captured.push({ row: r, col: c });
            if (!isKing) {
                if (i !== 1 || distance !== 2)
                    return null;
            }
        }
        r += rowStep;
        c += colStep;
    }
    if (seenOpponent === 0) {
        return [];
    }
    if (!isKing && seenOpponent === 1)
        return captured;
    if (isKing && seenOpponent === 1)
        return captured;
    return null;
}
export function applyMovePath(stateIn, path, moverIsPlayer1) {
    if (!path || path.length < 2)
        return null;
    const state = cloneState(stateIn);
    const from = path[0];
    if (!from)
        return null;
    const pieceType = typeAt(state, from);
    const moverColor = moverIsPlayer1 ? 'red' : 'black';
    if (!pieceType)
        return null;
    if (colorAt(state, from) !== moverColor)
        return null;
    let isKing = pieceType === 'king';
    const capturedAll = [];
    const movingPiece = { type: pieceType, color: moverColor };
    setEmpty(state, from);
    let current = from;
    for (let i = 1; i < path.length; i++) {
        const to = path[i];
        if (!to)
            return null;
        if (!isValidPos(to))
            return null;
        const segCaptured = collectCapturedAlong(state, current, to, moverColor, isKing);
        if (segCaptured === null)
            return null;
        setPiece(state, to, isKing ? 'king' : 'regular', moverColor);
        for (const cap of segCaptured) {
            const victim = state.board[cap.row]?.[cap.col];
            if (victim?.type) {
                setEmpty(state, cap);
                if (victim.color === 'red')
                    state.capturedPieces.red++;
                else
                    state.capturedPieces.black++;
                capturedAll.push(cap);
            }
        }
        if (!isKing) {
            if ((moverColor === 'red' && to.row === 0) || (moverColor === 'black' && to.row === 7)) {
                isKing = true;
                setPiece(state, to, 'king', moverColor);
            }
        }
        current = to;
    }
    state.currentPlayer = state.currentPlayer === 'red' ? 'black' : 'red';
    const start = path[0];
    const end = path[path.length - 1];
    state.moveHistory.push({ from: start, to: end, capturedPieces: capturedAll, timestamp: new Date() });
    return { state, captured: capturedAll };
}
//# sourceMappingURL=move-utils.js.map