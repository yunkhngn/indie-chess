import { useState, useEffect } from 'react';
import './JoinRoomModal.css';

export default function JoinRoomModal({ onClose, onSubmit, isLoading, error }) {
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Show password field if error indicates password required
    useEffect(() => {
        if (error?.includes('Password required')) {
            setShowPassword(true);
        }
    }, [error]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim() || !roomCode.trim()) return;

        onSubmit(roomCode.trim().toUpperCase(), name.trim(), showPassword ? password : null);
    };

    const handleRoomCodeChange = (e) => {
        // Only allow alphanumeric, convert to uppercase
        const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        setRoomCode(value.slice(0, 6)); // Limit to 6 characters
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal join-room-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Join Room</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="input-group">
                        <label className="input-label">Your Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={20}
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Room Code</label>
                        <input
                            type="text"
                            className="input room-code-input"
                            placeholder="XXXXXX"
                            value={roomCode}
                            onChange={handleRoomCodeChange}
                            maxLength={6}
                        />
                        <span className="input-hint">6-character code from your friend</span>
                    </div>

                    {showPassword && (
                        <div className="input-group">
                            <label className="input-label">Room Password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!name.trim() || roomCode.length < 6 || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner" />
                                    Joining...
                                </>
                            ) : (
                                'Join Room'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
