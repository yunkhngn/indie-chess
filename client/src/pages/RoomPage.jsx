import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Copy,
    Check,
    Link2,
    Sun,
    Moon,
    Loader2,
    LogIn
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
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [joinName, setJoinName] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [joinError, setJoinError] = useState(null);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    // Tab state for Dashboard Layout
    const [activeTab, setActiveTab] = useState('moves'); // Default to moves or chat
    const [rematchRequested, setRematchRequested] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    const {
        connected,
        roomCode: connectedRoom,
        playerColor,
        opponentName,
        opponentConnected,
        gameState,
        chat,
        pendingRequest,
        error,
        makeMove,
        sendChat,
        joinRoom,
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
        leaveRoom,
        setCallbacks
    } = useChessSocket();

    // Check if we need to show join form
    useEffect(() => {
        if (connected && roomCode && !playerColor && !connectedRoom) {
            // Not in a room yet, show join form
            setShowJoinForm(true);
        }
    }, [connected, roomCode, playerColor, connectedRoom]);

    // Handle join callbacks
    useEffect(() => {
        setCallbacks({
            onJoinError: (data) => {
                setJoinError(data.message);
                if (data.requiresPassword) {
                    setNeedsPassword(true);
                }
            },
            onJoined: () => {
                setShowJoinForm(false);
                setJoinError(null);
            }
        });
    }, [setCallbacks]);

    // Hide join form when we have a color (joined successfully)
    useEffect(() => {
        if (playerColor) {
            setShowJoinForm(false);
        }
    }, [playerColor]);

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

    // Reset rematch state when game restarts
    useEffect(() => {
        if (!gameState.isEnded) {
            setRematchRequested(false);
        }
    }, [gameState.isEnded]);

    const handleLeaveRoom = () => {
        // If game is in progress, show confirmation
        if (gameState.isStarted && !gameState.isEnded) {
            setShowLeaveConfirm(true);
        } else {
            confirmLeave();
        }
    };

    const confirmLeave = () => {
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

    const handleJoinSubmit = (e) => {
        e.preventDefault();
        if (!joinName.trim()) return;

        setJoinError(null);
        joinRoom(roomCode, joinName.trim(), needsPassword ? joinPassword : null);
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

    // Show join form if not in room
    if (showJoinForm) {
        return (
            <div className="room-page join-page">
                <div className="join-container">
                    <div className="modal join-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">Join Room</h2>
                        </div>
                        <div className="modal-body">
                            <p className="join-info">
                                Joining room <strong>{roomCode}</strong>
                            </p>

                            <form onSubmit={handleJoinSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Your Name</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Enter your name"
                                        value={joinName}
                                        onChange={(e) => setJoinName(e.target.value)}
                                        maxLength={20}
                                        autoFocus
                                    />
                                </div>

                                {needsPassword && (
                                    <div className="form-group">
                                        <label className="form-label">Room Password</label>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="Enter password"
                                            value={joinPassword}
                                            onChange={(e) => setJoinPassword(e.target.value)}
                                        />
                                    </div>
                                )}

                                {joinError && (
                                    <p className="error-text">{joinError}</p>
                                )}

                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={!joinName.trim()}>
                                        <LogIn size={16} />
                                        Join Game
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="room-page dashboard-layout">
            {/* Left Panel: Control Center */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="room-info-compact">
                        <span className="room-label">Room</span>
                        <code className="room-code">{roomCode}</code>
                        <button className="btn btn-ghost btn-xs" onClick={handleCopyCode} title="Copy Room Code">
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <div className="header-divider"></div>
                        <button className="btn btn-ghost btn-xs text-error" onClick={handleLeaveRoom} title="Leave Room">
                            <ArrowLeft size={14} />
                            <span className="btn-text-xs">Leave</span>
                        </button>
                    </div>
                    <div className="theme-toggle">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>
                </div>

                {/* Player Profiles */}
                <div className="profiles-section">
                    <div className="profile-row opponent">
                        <div className="profile-info">
                            <span className="role">Opponent</span>
                            <div className="nametag-pill">
                                <span className={`status-dot ${opponentConnected ? 'online' : 'offline'}`}></span>
                                <span className="name">{opponentName || 'Waiting...'}</span>
                            </div>
                        </div>
                        <span className={`color-indicator ${playerColor === 'white' ? 'black' : 'white'}`} title="Opponent Color" />
                    </div>

                    <div className="profile-divider"></div>

                    <div className="profile-row player">
                        <div className="profile-info">
                            <span className="role">You</span>
                            <div className="nametag-pill">
                                <span className="status-dot online"></span>
                                <span className="name">Me</span>
                            </div>
                        </div>
                        <span className={`color-indicator ${playerColor || 'white'}`} title="Your Color" />
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="sidebar-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'moves' ? 'active' : ''}`}
                        onClick={() => setActiveTab('moves')}
                    >
                        Moves & Controls
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Chat
                    </button>
                </div>

                {/* Tab Content Area */}
                <div className="sidebar-content">
                    {activeTab === 'chat' ? (
                        <div className="tab-pane chat-pane">
                            <ChatPanel
                                messages={chat}
                                onSend={sendChat}
                                playerColor={playerColor}
                            />
                        </div>
                    ) : (
                        <div className="tab-pane moves-controls-pane">
                            <div className="moves-scroll-area">
                                <MoveList moves={gameState.moves} />
                            </div>
                            <div className="controls-area">
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
                        </div>
                    )}
                </div>
            </aside>

            {/* Right Panel: Game Board */}
            <main className="dashboard-main">
                <div className="board-centering-container">
                    {/* Mobile Player Bar (Opponent) */}
                    <div className="mobile-player-bar top mobile-only">
                        <span className={`color-indicator ${playerColor === 'white' ? 'black' : 'white'}`} />
                        <span className="name">{opponentName || 'Waiting...'}</span>
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
                        opponentConnected={opponentConnected}
                    />

                    {/* Mobile Player Bar (Self) */}
                    <div className="mobile-player-bar bottom mobile-only">
                        <span className={`color-indicator ${playerColor || 'white'}`} />
                        <span className="name">You</span>
                    </div>
                </div>
            </main>
            {/* Modals & Overlays */}
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
                    onRematch={() => {
                        setRematchRequested(true);
                        requestRestart();
                    }}
                    onLeave={handleLeaveRoom}
                    pendingRematch={pendingRequest?.type === 'restart' ? pendingRequest : null}
                    onAcceptRematch={approveRestart}
                    onDeclineRematch={() => {
                        declineRestart();
                        setRematchRequested(false);
                    }}
                    rematchRequested={rematchRequested}
                />
            )}

            {showLeaveConfirm && (
                <ConfirmDialog
                    title="Leave Game?"
                    message="The game is still in progress. Are you sure you want to leave?"
                    onConfirm={confirmLeave}
                    onCancel={() => setShowLeaveConfirm(false)}
                    confirmText="Leave"
                    cancelText="Stay"
                />
            )}
        </div>
    );
}
