export class CheckersEngine {
    static createInitialGameState() {
        const board = this.createInitialBoard();
        return {
            board,
            currentPlayer: 'red',
            gameStatus: 'active',
            winner: null,
            moveHistory: [],
            capturedPieces: {
                red: 0,
                black: 0
            }
        };
    }
    static createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null).map(() => ({ type: null, color: null })));
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = { type: 'regular', color: 'black' };
                }
            }
        }
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 1) {
                    board[row][col] = { type: 'regular', color: 'red' };
                }
            }
        }
        return board;
    }
    static isValidMove(gameState, move, playerId, isPlayer1) {
        const { board, currentPlayer } = gameState;
        const playerColor = isPlayer1 ? 'red' : 'black';
        if (currentPlayer !== playerColor) {
            return false;
        }
        const { from, to } = move;
        if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
            return false;
        }
        const piece = board[from.row]?.[from.col];
        const targetSquare = board[to.row]?.[to.col];
        if (!piece?.type || piece.color !== playerColor) {
            return false;
        }
        if (targetSquare?.type !== null) {
            return false;
        }
        if ((to.row + to.col) % 2 === 0) {
            return false;
        }
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;
        if (Math.abs(rowDiff) !== Math.abs(colDiff)) {
            return false;
        }
        const distance = Math.abs(rowDiff);
        if (distance === 1) {
            if (piece.type === 'regular') {
                const correctDirection = playerColor === 'red' ? rowDiff < 0 : rowDiff > 0;
                if (!correctDirection) {
                    return false;
                }
            }
            return true;
        }
        if (distance === 2) {
            const middleRow = from.row + rowDiff / 2;
            const middleCol = from.col + (to.col - from.col) / 2;
            const middlePiece = board[middleRow]?.[middleCol];
            if (!middlePiece?.type || middlePiece.color === playerColor) {
                return false;
            }
            return true;
        }
        return this.isValidPath(board, from, to, playerColor, piece.type === 'king');
    }
    static pathHasCaptures(board, from, to, playerColor) {
        const rowStep = to.row > from.row ? 1 : -1;
        const colStep = to.col > from.col ? 1 : -1;
        const distance = Math.abs(to.row - from.row);
        let currentRow = from.row + rowStep;
        let currentCol = from.col + colStep;
        for (let i = 1; i < distance; i++) {
            const square = board[currentRow]?.[currentCol];
            if (square?.type !== null && square?.color !== playerColor) {
                return true;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        return false;
    }
    static isValidPath(board, from, to, playerColor, isKing) {
        const rowStep = to.row > from.row ? 1 : -1;
        const colStep = to.col > from.col ? 1 : -1;
        const distance = Math.abs(to.row - from.row);
        let currentRow = from.row + rowStep;
        let currentCol = from.col + colStep;
        let captureCount = 0;
        let lastCaptureRow = -1;
        let lastCaptureCol = -1;
        for (let i = 1; i < distance; i++) {
            const square = board[currentRow]?.[currentCol];
            if (square?.type !== null) {
                if (square?.color === playerColor) {
                    return false;
                }
                else {
                    captureCount++;
                    lastCaptureRow = currentRow;
                    lastCaptureCol = currentCol;
                    if (!isKing && captureCount > 1) {
                        const gapBetweenCaptures = Math.abs(currentRow - lastCaptureRow);
                        if (gapBetweenCaptures > 2) {
                            return false;
                        }
                    }
                }
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        if (captureCount === 0) {
            return distance === 1 || isKing;
        }
        return true;
    }
    static applyMove(gameState, move) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        const { board } = newGameState;
        const { from, to } = move;
        const piece = board[from.row]?.[from.col];
        if (!piece) {
            throw new Error('No piece at source position');
        }
        board[to.row][to.col] = piece;
        board[from.row][from.col] = { type: null, color: null };
        const capturedPositions = this.getCapturedPieces(board, from, to);
        move.capturedPieces = capturedPositions;
        for (const capturePos of capturedPositions) {
            const capturedPiece = board[capturePos.row]?.[capturePos.col];
            if (capturedPiece?.type && board[capturePos.row]) {
                board[capturePos.row][capturePos.col] = { type: null, color: null };
                if (capturedPiece.color === 'red') {
                    newGameState.capturedPieces.red++;
                }
                else {
                    newGameState.capturedPieces.black++;
                }
            }
        }
        if (piece.type === 'regular') {
            if ((piece.color === 'red' && to.row === 0) || (piece.color === 'black' && to.row === 7)) {
                if (board[to.row]?.[to.col]) {
                    board[to.row][to.col].type = 'king';
                    move.isKingMove = true;
                }
            }
        }
        move.timestamp = new Date();
        newGameState.moveHistory.push(move);
        newGameState.currentPlayer = newGameState.currentPlayer === 'red' ? 'black' : 'red';
        this.checkGameEnd(newGameState);
        return newGameState;
    }
    static getCapturedPieces(board, from, to) {
        const capturedPositions = [];
        const rowStep = to.row > from.row ? 1 : -1;
        const colStep = to.col > from.col ? 1 : -1;
        const distance = Math.abs(to.row - from.row);
        let currentRow = from.row + rowStep;
        let currentCol = from.col + colStep;
        for (let i = 1; i < distance; i++) {
            const square = board[currentRow]?.[currentCol];
            if (square?.type) {
                capturedPositions.push({ row: currentRow, col: currentCol });
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        return capturedPositions;
    }
    static checkGameEnd(gameState) {
        const { board, currentPlayer } = gameState;
        let redPieces = 0;
        let blackPieces = 0;
        let redHasMoves = false;
        let blackHasMoves = false;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row]?.[col];
                if (piece?.type) {
                    if (piece.color === 'red') {
                        redPieces++;
                        if (!redHasMoves)
                            redHasMoves = this.hasValidMovesFromPosition(gameState, { row, col });
                    }
                    else if (piece.color === 'black') {
                        blackPieces++;
                        if (!blackHasMoves)
                            blackHasMoves = this.hasValidMovesFromPosition(gameState, { row, col });
                    }
                }
            }
        }
        if (redPieces === 0) {
            gameState.gameStatus = 'completed';
            gameState.winner = 'black';
            return;
        }
        if (blackPieces === 0) {
            gameState.gameStatus = 'completed';
            gameState.winner = 'red';
            return;
        }
        if (!redHasMoves && !blackHasMoves) {
            gameState.gameStatus = 'completed';
            gameState.winner = null;
            return;
        }
        if (currentPlayer === 'red' && !redHasMoves) {
            gameState.gameStatus = 'completed';
            gameState.winner = 'black';
            return;
        }
        if (currentPlayer === 'black' && !blackHasMoves) {
            gameState.gameStatus = 'completed';
            gameState.winner = 'red';
            return;
        }
    }
    static hasValidMovesFromPosition(gameState, position) {
        const { board } = gameState;
        const piece = board[position.row]?.[position.col];
        if (!piece?.type)
            return false;
        const directions = piece.type === 'king'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : piece.color === 'red'
                ? [[-1, -1], [-1, 1]]
                : [[1, -1], [1, 1]];
        for (const [rowDir, colDir] of directions) {
            if (rowDir === undefined || colDir === undefined)
                continue;
            const newRow = position.row + rowDir;
            const newCol = position.col + colDir;
            if (this.isValidPosition({ row: newRow, col: newCol })) {
                const targetSquare = board[newRow]?.[newCol];
                if (!targetSquare?.type) {
                    return true;
                }
                const jumpRow = position.row + rowDir * 2;
                const jumpCol = position.col + colDir * 2;
                if (this.isValidPosition({ row: jumpRow, col: jumpCol })) {
                    const jumpSquare = board[jumpRow]?.[jumpCol];
                    if (!jumpSquare?.type && targetSquare.color !== piece.color) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    static isValidPosition(position) {
        return position.row >= 0 && position.row < 8 && position.col >= 0 && position.col < 8;
    }
    static getValidMoves(gameState, position) {
        const validMoves = [];
        const { board } = gameState;
        const piece = board[position.row]?.[position.col];
        if (!piece?.type)
            return validMoves;
        const directions = piece.type === 'king'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const direction of directions) {
            const rowDir = direction[0];
            const colDir = direction[1];
            if (rowDir === undefined || colDir === undefined)
                continue;
            const maxDistance = piece.type === 'king' ? 7 : 7;
            for (let distance = 1; distance <= maxDistance; distance++) {
                const newRow = position.row + rowDir * distance;
                const newCol = position.col + colDir * distance;
                if (!this.isValidPosition({ row: newRow, col: newCol })) {
                    break;
                }
                const targetSquare = board[newRow]?.[newCol];
                if (!targetSquare)
                    break;
                if (piece.type === 'regular' && distance === 1) {
                    const isForwardDirection = piece.color === 'red' ? rowDir < 0 : rowDir > 0;
                    if (!isForwardDirection) {
                        continue;
                    }
                }
                const testMove = {
                    from: position,
                    to: { row: newRow, col: newCol },
                    timestamp: new Date()
                };
                if (this.isValidMove(gameState, testMove, 0, piece.color === 'red')) {
                    validMoves.push({ row: newRow, col: newCol });
                }
                if (targetSquare.type !== null) {
                    break;
                }
            }
        }
        return validMoves;
    }
}
//# sourceMappingURL=checkers-engine.js.map