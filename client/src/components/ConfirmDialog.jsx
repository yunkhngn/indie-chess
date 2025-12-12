import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay">
            <div className="modal confirm-dialog">
                <div className="confirm-icon">❓</div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Decline
                    </button>
                    <button className="btn btn-success" onClick={onConfirm}>
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
