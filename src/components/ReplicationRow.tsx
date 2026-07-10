import { useState } from 'react';
import { useTaskState } from '../hooks/useTaskState';
import type { Replication } from '../hooks/useTaskState';
import SendToReworkModal from './SendToReworkModal';
import '../styles/ReplicationRow.css';

interface ReplicationRowProps {
  taskId: string;
  replication: Replication;
  canAct: boolean;
}

export default function ReplicationRow({ taskId, replication, canAct }: ReplicationRowProps) {
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [viewLink, setViewLink] = useState('');
  const [editLink, setEditLink] = useState('');
  const [reworkConfirm, setReworkConfirm] = useState(false);

  const {
    updateReplicationStatus,
    updateTaskStatus,
    addReplicationHistory,
    currentUser,
  } = useTaskState();

  const statusLabels: Partial<Record<Replication['status'], string>> = {
    unclaimed: 'Pending Review',
    pending_edit: 'Pending Edit by QA',
    rework_resubmitted: 'Resubmitted, Pending Review',
  };
  const statusLabel = statusLabels[replication.status] ?? replication.status;
  const statusBadgeClass = `status-badge status-${replication.status.replace(/_/g, '-')}`;
  const isWaitingOnRework = replication.status === 'sent_to_rework';

  const viewDisabled = !canAct;
  const editDisabled = !canAct || replication.status === 'approved' || isWaitingOnRework;
  const reworkDisabled = !canAct || replication.status === 'approved' || isWaitingOnRework;
  // Approve stays enabled on 'sent_to_rework' too, so the QA can resolve it
  // directly once the rework comes back. There's no separate resubmit step.
  const approveDisabled = !canAct || replication.status === 'approved';

  const handleView = () => {
    setViewLink(`view-link-${replication.id}`);
    addReplicationHistory(taskId, replication.id, 'view', currentUser);
  };

  const handleEdit = () => {
    setEditLink(`edit-link-${replication.id}`);
    addReplicationHistory(taskId, replication.id, 'edit', currentUser);
    updateReplicationStatus(taskId, replication.id, 'pending_edit');
  };

  const handleSendToRework = () => {
    setShowReworkModal(true);
  };

  const handleConfirmRework = () => {
    updateReplicationStatus(taskId, replication.id, 'sent_to_rework');
    updateTaskStatus(taskId, 'waiting_for_rework');
    addReplicationHistory(taskId, replication.id, 'send_to_rework', currentUser);
    setReworkConfirm(true);
    setShowReworkModal(false);
  };

  const handleApprove = () => {
    updateReplicationStatus(taskId, replication.id, 'approved');
    addReplicationHistory(taskId, replication.id, 'approve', currentUser);
  };

  return (
    <div className="replication-row">
      <div className="replication-header">
        <div className="replication-info">
          <span className="replication-number">Rep #{replication.replication_number}</span>
          <span className={statusBadgeClass}>{statusLabel}</span>
        </div>
        <button
          className="history-toggle"
          onClick={() => setExpandedHistory(!expandedHistory)}
        >
          {expandedHistory ? '▼' : '▶'} History
        </button>
      </div>

      <div className="replication-completed-by">
        Completed by <strong>{replication.rater_email}</strong> on{' '}
        {new Date(replication.completed_at).toLocaleString()}
      </div>

      {expandedHistory && (
        <div className="replication-history">
          {replication.history.length === 0 ? (
            <p className="no-history">No history</p>
          ) : (
            <ul className="history-list">
              {replication.history.map((event, idx) => (
                <li key={idx} className="history-item">
                  <span className="history-action">{event.action}</span>
                  <span className="history-actor">by {event.actor}</span>
                  <span className="history-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="replication-actions">
        {viewLink && (
          <div className="link-display">
            <strong>View Link:</strong> {viewLink}
          </div>
        )}
        {editLink && (
          <div className="link-display">
            <strong>Edit Link:</strong> {editLink}
          </div>
        )}
        {reworkConfirm && (
          <div className="rework-confirm">
            <strong>Sent to rework.</strong> Waiting for reviewer response.
          </div>
        )}

        <div className="action-buttons">
          <button
            className="action-button view-button"
            onClick={handleView}
            disabled={viewDisabled}
          >
            View
          </button>
          <button
            className="action-button edit-button"
            onClick={handleEdit}
            disabled={editDisabled}
          >
            Edit Myself
          </button>
          <button
            className="action-button rework-button"
            onClick={handleSendToRework}
            disabled={reworkDisabled}
          >
            Send to Rework
          </button>
          <button
            className="action-button approve-button"
            onClick={handleApprove}
            disabled={approveDisabled}
          >
            Approve
          </button>
        </div>
      </div>

      {showReworkModal && (
        <SendToReworkModal
          raterName={replication.rater_name}
          onConfirm={handleConfirmRework}
          onCancel={() => setShowReworkModal(false)}
        />
      )}
    </div>
  );
}
