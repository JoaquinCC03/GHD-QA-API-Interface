import '../styles/Modal.css';

interface SendToReworkModalProps {
  raterName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SendToReworkModal({
  raterName,
  onConfirm,
  onCancel,
}: SendToReworkModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Send to Rework</h3>
        <p>
          This replication will be sent back to <strong>{raterName}</strong> for rework.
        </p>
        <p className="modal-note">
          (In production, this would send a Slack message to the rater)
        </p>
        <div className="modal-actions">
          <button className="modal-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-button confirm-button" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
