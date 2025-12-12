import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    LogIn,
    Zap,
    MessageSquare,
    Lock,
    Heart,
    Sun,
    Moon,
    Crown
} from 'lucide-react';
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
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system';
        }
        return 'system';
    });

    useEffect(() => {
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

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

    const handleCreateRoom = (name, password) => {
        setIsLoading(true);
        clearError();
        createRoom(name, password);
    };

    const handleJoinRoom = (code, name, password) => {
        setIsLoading(true);
        clearError();
        joinRoom(code, name, password);
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="home-page">
            <button className="theme-toggle btn btn-ghost btn-icon" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <main className="home-content">
                <header className="home-header">
                    <div className="logo">
                        <Crown className="logo-icon" size={40} strokeWidth={1.5} />
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
                        className="action-card glass"
                        onClick={() => setShowCreateModal(true)}
                        disabled={!connected}
                    >
                        <Plus className="card-icon" size={32} />
                        <h3>Create Room</h3>
                        <p>Start a new game and invite a friend</p>
                    </button>

                    <button
                        className="action-card glass"
                        onClick={() => setShowJoinModal(true)}
                        disabled={!connected}
                    >
                        <LogIn className="card-icon" size={32} />
                        <h3>Join Room</h3>
                        <p>Enter a room code to join a game</p>
                    </button>
                </div>

                <div className="features">
                    <div className="feature">
                        <Zap size={16} />
                        <span>Real-time moves</span>
                    </div>
                    <div className="feature">
                        <MessageSquare size={16} />
                        <span>In-game chat</span>
                    </div>
                    <div className="feature">
                        <Lock size={16} />
                        <span>Private rooms</span>
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <p>
                    Built with <Heart size={14} className="heart-icon" /> Summer by{' '}
                    <a href="https://github.com/yunkhngn" target="_blank" rel="noopener noreferrer">
                        yunkhngn
                    </a>
                </p>
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
