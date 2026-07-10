import { useState } from 'react';
import { useTaskState, EXPECTED_REPLICATIONS } from '../hooks/useTaskState';
import type { Task } from '../hooks/useTaskState';
import '../styles/ClaimButton.css';

interface ClaimButtonProps {
  task: Task;
}

export default function ClaimButton({ task }: ClaimButtonProps) {
  const [error, setError] = useState('');
  const { claimTask, getClaimedCount, currentUser } = useTaskState();

  const isClaimedByMe = task.claimed_by === currentUser;
  const isClaimedByOther = !!task.claimed_by && !isClaimedByMe;
  const isFullySubmitted = task.replications.length >= EXPECTED_REPLICATIONS;

  const handleClaim = () => {
    setError('');
    if (getClaimedCount() >= 3) {
      setError('Maximum 3 tasks can be claimed at once');
      return;
    }

    const success = claimTask(task.id);
    if (!success) {
      setError('Failed to claim task');
    }
  };

  if (isClaimedByMe) {
    return (
      <div className="claim-button-wrapper">
        <span className="claim-badge claimed">Claimed by {task.claimed_by}</span>
      </div>
    );
  }

  if (isClaimedByOther) {
    return (
      <div className="claim-button-wrapper">
        <span className="claim-badge claimed-other">Claimed by {task.claimed_by}</span>
      </div>
    );
  }

  return (
    <div className="claim-button-wrapper">
      <button
        className="claim-button unclaimed"
        onClick={handleClaim}
        disabled={!isFullySubmitted}
      >
        {isFullySubmitted
          ? 'Claim Task'
          : `Waiting for submissions (${task.replications.length}/${EXPECTED_REPLICATIONS})`}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
