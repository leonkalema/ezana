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
        const piece = board[from.row][from.col];
        const targetSquare = board[to.row][to.col];
        if (!piece.type || piece.color !== playerColor) {
            return false;
        }
        if (targetSquare.type !== null) {
            return false;
        }
        if ((to.row + to.col) % 2 === 0) {
            return false;
        }
        const rowDiff = to.row - from.row;
        const colDiff = Math.abs(to.col - from.col);
        if (Math.abs(rowDiff) === 1 && colDiff === 1) {
            if (piece.type === 'regular') {
                const correctDirection = playerColor === 'red' ? rowDiff < 0 : rowDiff > 0;
                if (!correctDirection) {
                    return false;
                }
            }
            return true;
        }
        if (Math.abs(rowDiff) === 2 && colDiff === 2) {
            const middleRow = from.row + rowDiff / 2;
            const middleCol = from.col + (to.col - from.col) / 2;
            const middlePiece = board[middleRow][middleCol];
            if (!middlePiece.type || middlePiece.color === playerColor) {
                return false;
            }
            if (piece.type === 'regular') {
                const correctDirection = playerColor === 'red' ? rowDiff < 0 : rowDiff > 0;
                if (!correctDirection) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    static applyMove(gameState, move) {
        const newGameState = JSON.parse(JSON.stringify(gameState));
        const { board } = newGameState;
        const { from, to } = move;
        const piece = board[from.row][from.col];
        board[to.row][to.col] = piece;
        board[from.row][from.col] = { type: null, color: null };
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;
        if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
            const middleRow = from.row + rowDiff / 2;
            const middleCol = from.col + colDiff / 2;
            const capturedPiece = board[middleRow][middleCol];
            board[middleRow][middleCol] = { type: null, color: null };
            if (capturedPiece.color === 'red') {
                newGameState.capturedPieces.red++;
            }
            else {
                newGameState.capturedPieces.black++;
            }
        }
        if (piece.type === 'regular') {
            if ((piece.color === 'red' && to.row === 0) || (piece.color === 'black' && to.row === 7)) {
                board[to.row][to.col].type = 'king';
                move.isKingMove = true;
            }
        }
        move.timestamp = new Date();
        newGameState.moveHistory.push(move);
        newGameState.currentPlayer = newGameState.currentPlayer === 'red' ? 'black' : 'red';
        this.checkGameEnd(newGameState);
        return newGameState;
    }
    static checkGameEnd(gameState) {
        const { board, currentPlayer } = gameState;
        let redPieces = 0;
        let blackPieces = 0;
        let hasValidMoves = false;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece.type) {
                    if (piece.color === 'red')
                        redPieces++;
                    if (piece.color === 'black')
                        blackPieces++;
                    if (piece.color === currentPlayer && !hasValidMoves) {
                        hasValidMoves = this.hasValidMovesFromPosition(gameState, { row, col });
                    }
                }
            }
        }
        if (redPieces === 0) {
            gameState.gameStatus = 'completed';
            gameState.winner = 'black';
        }
        else if (blackPieces === 0) {
            gameState.gameStatus = 'completed';
            gameState.winner = 'red';
        }
        else if (!hasValidMoves) {
            gameState.gameStatus = 'completed';
            gameState.winner = currentPlayer === 'red' ? 'black' : 'red';
        }
    }
    static hasValidMovesFromPosition(gameState, position) {
        const { board } = gameState;
        const piece = board[position.row][position.col];
        if (!piece.type)
            return false;
        const directions = piece.type === 'king'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : piece.color === 'red'
                ? [[-1, -1], [-1, 1]]
                : [[1, -1], [1, 1]];
        for (const [rowDir, colDir] of directions) {
            const newRow = position.row + rowDir;
            const newCol = position.col + colDir;
            if (this.isValidPosition({ row: newRow, col: newCol })) {
                const targetSquare = board[newRow][newCol];
                if (!targetSquare.type) {
                    return true;
                }
                const jumpRow = position.row + rowDir * 2;
                const jumpCol = position.col + colDir * 2;
                if (this.isValidPosition({ row: jumpRow, col: jumpCol })) {
                    const jumpSquare = board[jumpRow][jumpCol];
                    if (!jumpSquare.type && targetSquare.color !== piece.color) {
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
        const piece = board[position.row][position.col];
        if (!piece.type)
            return validMoves;
        const directions = piece.type === 'king'
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : piece.color === 'red'
                ? [[-1, -1], [-1, 1]]
                : [[1, -1], [1, 1]];
        for (const [rowDir, colDir] of directions) {
            const newRow = position.row + rowDir;
            const newCol = position.col + colDir;
            if (this.isValidPosition({ row: newRow, col: newCol })) {
                const targetSquare = board[newRow][newCol];
                if (!targetSquare.type) {
                    validMoves.push({ row: newRow, col: newCol });
                }
                else if (targetSquare.color !== piece.color) {
                    const jumpRow = position.row + rowDir * 2;
                    const jumpCol = position.col + colDir * 2;
                    if (this.isValidPosition({ row: jumpRow, col: jumpCol })) {
                        const jumpSquare = board[jumpRow][jumpCol];
                        if (!jumpSquare.type) {
                            validMoves.push({ row: jumpRow, col: jumpCol });
                        }
                    }
                }
            }
        }
        return validMoves;
    }
}
//# sourceMappingURL=checkers-engine.js.map