import { useState } from 'react';
import './CreateRoomModal.css';

const TIME_CONTROLS = [
    { label: 'Bullet 1+0', initial: 60000, increment: 0 },
    { label: 'Bullet 2+1', initial: 120000, increment: 1000 },
    { label: 'Blitz 3+0', initial: 180000, increment: 0 },
    { label: 'Blitz 5+0', initial: 300000, increment: 0 },
    { label: 'Blitz 5+3', initial: 300000, increment: 3000 },
    { label: 'Rapid 10+0', initial: 600000, increment: 0 },
    { label: 'Rapid 10+5', initial: 600000, increment: 5000 },
    { label: 'Rapid 15+10', initial: 900000, increment: 10000 },
    { label: 'Classical 30+0', initial: 1800000, increment: 0 },
];

export default function CreateRoomModal({ onClose, onSubmit, isLoading, error }) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [usePassword, setUsePassword] = useState(false);
    const [selectedTimeControl, setSelectedTimeControl] = useState(6); // Default 10+5

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const timeControl = TIME_CONTROLS[selectedTimeControl];
        onSubmit(
            name.trim(),
            usePassword ? password : null,
            { initial: timeControl.initial, increment: timeControl.increment }
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal create-room-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Create Room</h2>
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
                        <label className="input-label">Time Control</label>
                        <div className="time-controls-grid">
                            {TIME_CONTROLS.map((tc, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`time-control-btn ${selectedTimeControl === index ? 'selected' : ''}`}
                                    onClick={() => setSelectedTimeControl(index)}
                                >
                                    {tc.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="password-toggle">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={usePassword}
                                onChange={(e) => setUsePassword(e.target.checked)}
                            />
                            <span className="checkbox-custom" />
                            <span>Private room (password protected)</span>
                        </label>
                    </div>

                    {usePassword && (
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
                            disabled={!name.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner" />
                                    Creating...
                                </>
                            ) : (
                                'Create Room'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
