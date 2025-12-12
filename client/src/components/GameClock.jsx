import { useEffect, useState, useRef } from 'react';
import './GameClock.css';

export default function GameClock({ time, color, isActive, playerName, isPlayer }) {
    const [displayTime, setDisplayTime] = useState(time);
    const intervalRef = useRef(null);

    useEffect(() => {
        setDisplayTime(time);
    }, [time]);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setDisplayTime((prev) => Math.max(0, prev - 100));
            }, 100);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const tenths = Math.floor((ms % 1000) / 100);

        if (minutes >= 1) {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `0:${seconds.toString().padStart(2, '0')}.${tenths}`;
        }
    };

    const isLowTime = displayTime < 30000; // Less than 30 seconds
    const isCriticalTime = displayTime < 10000; // Less than 10 seconds

    return (
        <div className={`game-clock ${color} ${isActive ? 'active' : ''} ${isPlayer ? 'player' : ''}`}>
            <div className="clock-player">
                <span className={`color-indicator ${color}`} />
                <span className="player-name">{playerName}</span>
            </div>
            <div className={`clock-time ${isLowTime ? 'low' : ''} ${isCriticalTime ? 'critical' : ''}`}>
                {formatTime(displayTime)}
            </div>
        </div>
    );
}
