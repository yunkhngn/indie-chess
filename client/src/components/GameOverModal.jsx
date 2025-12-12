import { useState } from 'react';
import { Trophy, Frown, Handshake, Copy, Download, RotateCcw, LogOut, Check } from 'lucide-react';
import './GameOverModal.css';

export default function GameOverModal({ result, playerColor, pgn, onRematch, onLeave }) {
    const [copied, setCopied] = useState(false);

    const isWinner = result?.winner === playerColor;
    const isDraw = result?.winner === null;

    const getResultText = () => {
        if (isDraw) {
            return 'Draw';
        }
        return isWinner ? 'Victory!' : 'Defeat';
    };

    const getReasonText = () => {
        switch (result?.reason) {
            case 'checkmate':
                return isWinner ? 'by checkmate' : 'by checkmate';
            case 'resignation':
                return isWinner ? 'opponent resigned' : 'you resigned';
            case 'timeout':
                return isWinner ? 'opponent ran out of time' : 'you ran out of time';
            case 'stalemate':
                return 'by stalemate';
            case 'repetition':
                return 'by threefold repetition';
            case 'insufficient':
                return 'by insufficient material';
            case 'agreement':
                return 'by mutual agreement';
            default:
                return '';
        }
    };

    const handleCopyPGN = async () => {
        try {
            await navigator.clipboard.writeText(pgn);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy PGN:', err);
        }
    };

    const handleDownloadPGN = () => {
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chess-game-${Date.now()}.pgn`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const ResultIcon = isDraw ? Handshake : isWinner ? Trophy : Frown;

    return (
        <div className="modal-overlay">
            <div className="modal game-over-modal">
                <div className={`result-badge ${isDraw ? 'draw' : isWinner ? 'win' : 'lose'}`}>
                    <ResultIcon size={48} className="result-icon" />
                    <h2 className="result-text">{getResultText()}</h2>
                    <p className="result-reason">{getReasonText()}</p>
                </div>

                <div className="pgn-section">
                    <h4>Game PGN</h4>
                    <div className="pgn-box">
                        <pre className="pgn-content">{pgn || 'No moves played'}</pre>
                    </div>
                    <div className="pgn-actions">
                        <button className="btn btn-secondary btn-sm" onClick={handleCopyPGN}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleDownloadPGN}>
                            <Download size={14} />
                            Download
                        </button>
                    </div>
                </div>

                <div className="game-over-actions">
                    <button className="btn btn-secondary" onClick={onLeave}>
                        <LogOut size={16} />
                        Leave
                    </button>
                    <button className="btn btn-primary" onClick={onRematch}>
                        <RotateCcw size={16} />
                        Rematch
                    </button>
                </div>
            </div>
        </div>
    );
}
