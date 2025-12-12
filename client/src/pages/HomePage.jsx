import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChessSocket } from '../hooks/useChessSocket';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import './HomePage.css';

export default function HomePage() {
    const navigate = useNavigate();
    const { connected, createRoom, joinRoom, error, clearError, setCallbacks } = useChessSocket();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Set up callbacks
    setCallbacks({
        onRoomCreated: (data) => {
            setIsLoading(false);
            navigate(`/room/${data.roomCode}`);
        },
        onJoined: (data) => {
            setIsLoading(false);
            navigate(`/room/${data.roomCode}`);
        },
        onJoinError: () => {
            setIsLoading(false);
        }
    });

    const handleCreateRoom = (name, password, timeControl) => {
        setIsLoading(true);
        clearError();
        createRoom(name, password, timeControl);
    };

    const handleJoinRoom = (code, name, password) => {
        setIsLoading(true);
        clearError();
        joinRoom(code, name, password);
    };

    return (
        <div className="home-page">
            <div className="home-background">
                <div className="bg-gradient" />
                <div className="bg-grid" />
            </div>

            <main className="home-content">
                <header className="home-header">
                    <div className="logo">
                        <span className="logo-icon">♔</span>
                        <h1>Indie Chess</h1>
                    </div>
                    <p className="tagline">Real-time multiplayer chess. Play with friends anywhere.</p>

                    <div className="connection-status">
                        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
                        <span>{connected ? 'Connected' : 'Connecting...'}</span>
                    </div>
                </header>

                <div className="action-cards">
                    <button
                        className="action-card create-card"
                        onClick={() => setShowCreateModal(true)}
                        disabled={!connected}
                    >
                        <div className="card-icon">✨</div>
                        <h3>Create Room</h3>
                        <p>Start a new game and invite a friend</p>
                    </button>

                    <button
                        className="action-card join-card"
                        onClick={() => setShowJoinModal(true)}
                        disabled={!connected}
                    >
                        <div className="card-icon">🎯</div>
                        <h3>Join Room</h3>
                        <p>Enter a room code to join a game</p>
                    </button>
                </div>

                <div className="features">
                    <div className="feature">
                        <span className="feature-icon">⚡</span>
                        <span>Real-time moves</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">💬</span>
                        <span>In-game chat</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">⏱️</span>
                        <span>Chess clocks</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🔒</span>
                        <span>Private rooms</span>
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <p>Built with ♥ for chess lovers</p>
            </footer>

            {showCreateModal && (
                <CreateRoomModal
                    onClose={() => {
                        setShowCreateModal(false);
                        clearError();
                    }}
                    onSubmit={handleCreateRoom}
                    isLoading={isLoading}
                    error={error}
                />
            )}

            {showJoinModal && (
                <JoinRoomModal
                    onClose={() => {
                        setShowJoinModal(false);
                        clearError();
                    }}
                    onSubmit={handleJoinRoom}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </div>
    );
}
