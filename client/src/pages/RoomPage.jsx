import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChessSocket } from '../hooks/useChessSocket';
import ChessBoard from '../components/ChessBoard';
import MoveList from '../components/MoveList';
import ChatPanel from '../components/ChatPanel';
import GameClock from '../components/GameClock';
import GameControls from '../components/GameControls';
import ConfirmDialog from '../components/ConfirmDialog';
import GameOverModal from '../components/GameOverModal';
import './RoomPage.css';

export default function RoomPage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        connected,
        playerColor,
        opponentName,
        opponentConnected,
        gameState,
        clocks,
        chat,
        pendingRequest,
        makeMove,
        sendChat,
        requestRestart,
        approveRestart,
        declineRestart,
        requestColorSwap,
        approveColorSwap,
        declineColorSwap,
        resign,
        offerDraw,
        acceptDraw,
        declineDraw,
        leaveRoom
    } = useChessSocket();

    // Show share modal if room just created and no opponent
    useEffect(() => {
        if (roomCode && !opponentName && playerColor) {
            setShowShareModal(true);
        }
    }, [roomCode, opponentName, playerColor]);

    // Hide share modal when opponent joins
    useEffect(() => {
        if (opponentName) {
            setShowShareModal(false);
        }
    }, [opponentName]);

    const handleLeaveRoom = () => {
        leaveRoom();
        navigate('/');
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCopyLink = async () => {
        try {
            const link = `${window.location.origin}/room/${roomCode}`;
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getConfirmDialogProps = () => {
        if (!pendingRequest) return null;

        switch (pendingRequest.type) {
            case 'restart':
                return {
                    title: 'Rematch Request',
                    message: `${pendingRequest.from} wants to start a new game.`,
                    onConfirm: approveRestart,
                    onCancel: declineRestart
                };
            case 'color':
                return {
                    title: 'Color Swap Request',
                    message: `${pendingRequest.from} wants to swap colors.`,
                    onConfirm: approveColorSwap,
                    onCancel: declineColorSwap
                };
            case 'draw':
                return {
                    title: 'Draw Offer',
                    message: `${pendingRequest.from} offers a draw.`,
                    onConfirm: acceptDraw,
                    onCancel: declineDraw
                };
            default:
                return null;
        }
    };

    const confirmDialogProps = getConfirmDialogProps();

    return (
        <div className="room-page">
            <header className="room-header">
                <div className="room-info">
                    <button className="btn btn-ghost" onClick={handleLeaveRoom}>
                        ← Leave
                    </button>
                    <div className="room-code-display">
                        <span className="room-label">Room</span>
                        <span className="room-code">{roomCode}</span>
                        <button className="btn btn-ghost btn-sm" onClick={handleCopyCode}>
                            {copied ? '✓' : '📋'}
                        </button>
                    </div>
                </div>

                <div className="connection-info">
                    <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
                    <span className="status-text">
                        {!connected ? 'Reconnecting...' :
                            !opponentConnected ? 'Waiting for opponent...' :
                                opponentName}
                    </span>
                </div>
            </header>

            <main className="game-container">
                <div className="game-sidebar left-sidebar">
                    <GameClock
                        time={clocks[playerColor === 'white' ? 'black' : 'white']}
                        color={playerColor === 'white' ? 'black' : 'white'}
                        isActive={gameState.isStarted && !gameState.isEnded &&
                            gameState.turn !== playerColor}
                        playerName={opponentName || 'Opponent'}
                    />

                    <MoveList moves={gameState.moves} />

                    <GameClock
                        time={clocks[playerColor || 'white']}
                        color={playerColor || 'white'}
                        isActive={gameState.isStarted && !gameState.isEnded &&
                            gameState.turn === playerColor}
                        playerName="You"
                        isPlayer
                    />
                </div>

                <div className="board-container">
                    <ChessBoard
                        fen={gameState.fen}
                        playerColor={playerColor}
                        onMove={makeMove}
                        isMyTurn={gameState.turn === playerColor}
                        isGameStarted={gameState.isStarted}
                        isGameEnded={gameState.isEnded}
                        lastMove={gameState.moves[gameState.moves.length - 1]}
                        isCheck={gameState.isCheck}
                    />
                </div>

                <div className="game-sidebar right-sidebar">
                    <ChatPanel
                        messages={chat}
                        onSend={sendChat}
                        playerColor={playerColor}
                    />

                    <GameControls
                        onResign={resign}
                        onOfferDraw={offerDraw}
                        onRequestRestart={requestRestart}
                        onRequestColorSwap={() => requestColorSwap(playerColor === 'white' ? 'black' : 'white')}
                        isGameEnded={gameState.isEnded}
                        isGameStarted={gameState.isStarted}
                        hasOpponent={!!opponentName}
                    />
                </div>
            </main>

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal share-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Invite a Friend</h2>
                            <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p className="share-info">Share this code with your friend to start playing:</p>

                            <div className="share-code-box">
                                <span className="share-code">{roomCode}</span>
                                <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
                                    {copied ? 'Copied!' : 'Copy Code'}
                                </button>
                            </div>

                            <div className="share-divider">
                                <span>or</span>
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={handleCopyLink} style={{ width: '100%' }}>
                                {copied ? 'Link Copied!' : 'Copy Invite Link'}
                            </button>

                            <p className="share-hint">Waiting for opponent to join...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmDialogProps && (
                <ConfirmDialog {...confirmDialogProps} />
            )}

            {/* Game Over Modal */}
            {gameState.isEnded && (
                <GameOverModal
                    result={gameState.result}
                    playerColor={playerColor}
                    pgn={gameState.pgn}
                    onRematch={requestRestart}
                    onLeave={handleLeaveRoom}
                />
            )}
        </div>
    );
}
