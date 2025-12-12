import { useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './ChessBoard.css';

export default function ChessBoard({
    fen,
    playerColor,
    onMove,
    isMyTurn,
    isGameStarted,
    isGameEnded,
    lastMove,
    isCheck
}) {
    const [moveFrom, setMoveFrom] = useState(null);
    const [optionSquares, setOptionSquares] = useState({});
    const [rightClickedSquares, setRightClickedSquares] = useState({});

    // Create a chess instance for move validation
    const game = useMemo(() => {
        const chess = new Chess();
        chess.load(fen);
        return chess;
    }, [fen]);

    // Get valid moves for a piece
    const getMoveOptions = (square) => {
        const moves = game.moves({ square, verbose: true });
        if (moves.length === 0) return false;

        const newSquares = {};
        moves.forEach((move) => {
            newSquares[move.to] = {
                background: game.get(move.to)
                    ? 'radial-gradient(circle, rgba(239, 68, 68, 0.6) 85%, transparent 85%)'
                    : 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 25%, transparent 25%)',
                borderRadius: '50%'
            };
        });
        newSquares[square] = {
            background: 'rgba(139, 92, 246, 0.4)'
        };
        setOptionSquares(newSquares);
        return true;
    };

    // Handle square click
    const onSquareClick = (square) => {
        if (isGameEnded || !isMyTurn) return;

        // If we have a piece selected
        if (moveFrom) {
            const piece = game.get(moveFrom);

            // Check if this is a pawn promotion
            const isPromotion =
                piece?.type === 'p' &&
                ((piece.color === 'w' && square[1] === '8') ||
                    (piece.color === 'b' && square[1] === '1'));

            // Try to make the move
            const moveData = {
                from: moveFrom,
                to: square,
                promotion: isPromotion ? 'q' : undefined // Auto-promote to queen for now
            };

            try {
                const result = game.move(moveData);
                if (result) {
                    onMove(moveFrom, square, isPromotion ? 'q' : null);
                }
            } catch (e) {
                // Invalid move, try selecting this square instead
                const hasMoves = getMoveOptions(square);
                setMoveFrom(hasMoves ? square : null);
                if (!hasMoves) setOptionSquares({});
                return;
            }

            setMoveFrom(null);
            setOptionSquares({});
            return;
        }

        // Select a piece
        const hasMoves = getMoveOptions(square);
        setMoveFrom(hasMoves ? square : null);
        if (!hasMoves) setOptionSquares({});
    };

    // Handle piece drag
    const onPieceDragBegin = (piece, sourceSquare) => {
        if (isGameEnded || !isMyTurn) return false;
        getMoveOptions(sourceSquare);
    };

    // Handle piece drop
    const onPieceDrop = (sourceSquare, targetSquare, piece) => {
        if (isGameEnded || !isMyTurn) return false;

        const pieceType = piece[1].toLowerCase();
        const isPromotion =
            pieceType === 'p' &&
            ((piece[0] === 'w' && targetSquare[1] === '8') ||
                (piece[0] === 'b' && targetSquare[1] === '1'));

        try {
            const result = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: isPromotion ? 'q' : undefined
            });

            if (result) {
                onMove(sourceSquare, targetSquare, isPromotion ? 'q' : null);
                setMoveFrom(null);
                setOptionSquares({});
                return true;
            }
        } catch (e) {
            // Invalid move
        }

        setMoveFrom(null);
        setOptionSquares({});
        return false;
    };

    // Handle right click for annotations
    const onSquareRightClick = (square) => {
        const color = 'rgba(239, 68, 68, 0.5)';
        setRightClickedSquares((prev) => ({
            ...prev,
            [square]: prev[square] ? undefined : { background: color }
        }));
    };

    // Custom square styles
    const customSquareStyles = useMemo(() => {
        const styles = { ...optionSquares, ...rightClickedSquares };

        // Highlight last move
        if (lastMove) {
            styles[lastMove.from] = {
                ...styles[lastMove.from],
                background: 'rgba(255, 255, 0, 0.3)'
            };
            styles[lastMove.to] = {
                ...styles[lastMove.to],
                background: 'rgba(255, 255, 0, 0.4)'
            };
        }

        // Highlight check
        if (isCheck) {
            const kingSquare = findKingSquare(game, game.turn());
            if (kingSquare) {
                styles[kingSquare] = {
                    ...styles[kingSquare],
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.4) 50%, transparent 70%)'
                };
            }
        }

        return styles;
    }, [optionSquares, rightClickedSquares, lastMove, isCheck, game]);

    return (
        <div className={`chess-board-wrapper ${!isMyTurn && isGameStarted ? 'not-my-turn' : ''}`}>
            <Chessboard
                position={fen}
                onSquareClick={onSquareClick}
                onPieceDragBegin={onPieceDragBegin}
                onPieceDrop={onPieceDrop}
                onSquareRightClick={onSquareRightClick}
                boardOrientation={playerColor || 'white'}
                customSquareStyles={customSquareStyles}
                customBoardStyle={{
                    borderRadius: '8px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}
                customDarkSquareStyle={{ backgroundColor: '#7c3aed' }}
                customLightSquareStyle={{ backgroundColor: '#e8edf9' }}
                animationDuration={200}
                arePiecesDraggable={isMyTurn && !isGameEnded}
                showBoardNotation={true}
            />

            {!isGameStarted && !isGameEnded && (
                <div className="board-overlay">
                    <div className="waiting-message">
                        <span className="waiting-icon">⏳</span>
                        <span>Waiting for opponent...</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper to find king square
function findKingSquare(game, color) {
    const board = game.board();
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.type === 'k' && piece.color === color) {
                const file = String.fromCharCode(97 + col);
                const rank = 8 - row;
                return `${file}${rank}`;
            }
        }
    }
    return null;
}
