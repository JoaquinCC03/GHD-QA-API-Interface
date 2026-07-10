import { useState } from 'react';
import { useTaskState } from '../hooks/useTaskState';
import type { Task } from '../hooks/useTaskState';
import ClaimButton from './ClaimButton';
import ReplicationRow from './ReplicationRow';
import ApproveTaskModal from './ApproveTaskModal';
import '../styles/TaskDetail.css';

interface TaskDetailProps {
  task: Task;
  onBack: () => void;
}

export default function TaskDetail({ task, onBack }: TaskDetailProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const { approveTask, currentUser } = useTaskState();

  const isTaskApproved = task.status === 'approved';
  const isClaimedByMe = task.claimed_by === currentUser;

  // Final approval requires every replication to actually be approved. A
  // reworked one that's merely "sent to rework" or "resubmitted" still needs
  // the QA to review and approve it before the task itself can be finalized.
  const allReplicationsTerminal = task.replications.every((rep) => rep.status === 'approved');

  const handleApproveTask = () => {
    approveTask(task.id);
    setShowApproveModal(false);
  };

  return (
    <div className="task-detail-container">
      <button className="back-button" onClick={onBack}>
        ← Back to List
      </button>

      <div className="task-detail-header">
        <div className="task-detail-info">
          <h2>Task Details</h2>
          <div className="detail-row">
            <span className="detail-label">Revision Set ID:</span>
            <span className="detail-value">{task.revision_set_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Alternative ID:</span>
            <span className="detail-value">{task.alternative_id}</span>
          </div>
        </div>
        <div className="claim-button-container">
          {isTaskApproved ? (
            <span className="approved-badge">Task Approved</span>
          ) : (
            <ClaimButton task={task} />
          )}
        </div>
      </div>

      <div className="replications-section">
        <h3>Replications ({task.replications.length})</h3>
        {!isTaskApproved && !isClaimedByMe && (
          <p className="claim-required-note">
            {task.claimed_by
              ? `This task is claimed by ${task.claimed_by}.`
              : 'Claim this task to view, edit, approve, or send replications to rework.'}
          </p>
        )}
        <div className="replications-list">
          {task.replications.map((replication) => (
            <ReplicationRow
              key={replication.id}
              taskId={task.id}
              replication={replication}
              canAct={isClaimedByMe}
            />
          ))}
        </div>
      </div>

      {!isTaskApproved && (
        <div className="approval-section">
          <button
            className={`approve-task-button ${
              allReplicationsTerminal && isClaimedByMe ? 'enabled' : 'disabled'
            }`}
            onClick={() => setShowApproveModal(true)}
            disabled={!allReplicationsTerminal || !isClaimedByMe}
          >
            Approve Task
          </button>
        </div>
      )}

      {showApproveModal && (
        <ApproveTaskModal
          onConfirm={handleApproveTask}
          onCancel={() => setShowApproveModal(false)}
        />
      )}
    </div>
  );
}
