import '../styles/Modal.css';

interface ApproveTaskModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ApproveTaskModal({
  onConfirm,
  onCancel,
}: ApproveTaskModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Approve Task</h3>
        <p className="warning-text">
          This is a final action. Are you sure? There is no going back.
        </p>
        <p>
          Please confirm the task has been completed correctly.
        </p>
        <div className="modal-actions">
          <button className="modal-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-button confirm-button danger" onClick={onConfirm}>
            Approve Task
          </button>
        </div>
      </div>
    </div>
  );
}
