import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Copy,
    Check,
    Link2,
    Sun,
    Moon,
    Loader2
} from 'lucide-react';
import { useChessSocket } from '../hooks/useChessSocket';
import ChessBoard from '../components/ChessBoard';
import MoveList from '../components/MoveList';
import ChatPanel from '../components/ChatPanel';
import GameControls from '../components/GameControls';
import ConfirmDialog from '../components/ConfirmDialog';
import GameOverModal from '../components/GameOverModal';
import './RoomPage.css';

export default function RoomPage() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system';
        }
        return 'system';
    });

    const {
        connected,
        playerColor,
        opponentName,
        opponentConnected,
        gameState,
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

    useEffect(() => {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (roomCode && !opponentName && playerColor) {
            setShowShareModal(true);
        }
    }, [roomCode, opponentName, playerColor]);

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

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
            <header className="room-header glass">
                <div className="room-info">
                    <button className="btn btn-ghost" onClick={handleLeaveRoom}>
                        <ArrowLeft size={18} />
                        Leave
                    </button>
                    <div className="room-code-display">
                        <span className="room-label">Room</span>
                        <span className="room-code">{roomCode}</span>
                        <button className="btn btn-ghost btn-sm" onClick={handleCopyCode}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className="header-right">
                    <div className="connection-info">
                        <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
                        <span className="status-text">
                            {!connected ? 'Reconnecting...' :
                                !opponentConnected ? 'Waiting for opponent...' :
                                    opponentName}
                        </span>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            <main className="game-container">
                <div className="board-section">
                    <div className="player-bar opponent">
                        <span className={`color-indicator ${playerColor === 'white' ? 'black' : 'white'}`} />
                        <span className="player-name">{opponentName || 'Waiting for opponent...'}</span>
                    </div>

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

                    <div className="player-bar player">
                        <span className={`color-indicator ${playerColor || 'white'}`} />
                        <span className="player-name">You</span>
                    </div>
                </div>

                <div className="sidebar">
                    <MoveList moves={gameState.moves} />

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
                        movesCount={gameState.moves.length}
                    />
                </div>
            </main>

            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal share-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Invite a Friend</h2>
                            <button className="modal-close" onClick={() => setShowShareModal(false)}>
                                <span>&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="share-info">Share this code with your friend to start playing:</p>

                            <div className="share-code-box glass">
                                <span className="share-code">{roomCode}</span>
                                <button className="btn btn-secondary btn-sm" onClick={handleCopyCode}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            <div className="share-divider">
                                <span>or</span>
                            </div>

                            <button className="btn btn-primary btn-lg" onClick={handleCopyLink} style={{ width: '100%' }}>
                                <Link2 size={18} />
                                {copied ? 'Link Copied!' : 'Copy Invite Link'}
                            </button>

                            <p className="share-hint">
                                <Loader2 size={14} className="spinner" />
                                Waiting for opponent to join...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {confirmDialogProps && (
                <ConfirmDialog {...confirmDialogProps} />
            )}

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
