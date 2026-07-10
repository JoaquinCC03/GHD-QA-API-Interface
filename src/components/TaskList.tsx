import { useState } from 'react';
import type { Task } from '../hooks/useTaskState';
import { useTaskState, EXPECTED_REPLICATIONS } from '../hooks/useTaskState';
import TaskDetail from './TaskDetail';
import '../styles/TaskList.css';

interface TaskListProps {
  tasks: Task[];
  tab: 'no-reworks' | 'with-reworks' | 'approved';
}

const lastReplicationSubmittedAt = (task: Task): string | null =>
  task.replications.reduce<string | null>(
    (latest, rep) => (!latest || rep.completed_at > latest ? rep.completed_at : latest),
    null
  );

interface PendingReviewInfo {
  numerator: number;
  denominator: number;
  isComplete: boolean;
}

// Used for the "Approved" tab: how many replications are still awaiting a
// QA decision, out of the total.
const getPendingReviewInfo = (task: Task): PendingReviewInfo => {
  const pendingCount = task.replications.filter(
    (rep) => rep.status !== 'approved' && rep.status !== 'sent_to_rework'
  ).length;
  return {
    numerator: pendingCount,
    denominator: task.replications.length,
    isComplete: pendingCount === 0,
  };
};

interface ReworkInfo {
  submitted: number;
  reviewed: number;
  total: number;
}

// For the "Reworks" tab: total = how many replications were sent to rework;
// submitted = how many of those have come back from the rater (resubmitted
// or already re-approved); reviewed = how many of those the QA has approved.
const getReworkInfo = (task: Task): ReworkInfo => {
  const reworkedReps = task.replications.filter((rep) => rep.wasReworked);
  const submitted = reworkedReps.filter((rep) => rep.status !== 'sent_to_rework').length;
  const reviewed = reworkedReps.filter((rep) => rep.status === 'approved').length;
  return { submitted, reviewed, total: reworkedReps.length };
};

const reviewedCount = (task: Task): number =>
  task.replications.filter((rep) => rep.status === 'approved' || rep.status === 'sent_to_rework')
    .length;

const rowColorClass = (task: Task, claimedTasks: string[], currentUser: string): string => {
  if (claimedTasks.includes(task.id)) return 'mine';
  if (task.claimed_by && task.claimed_by !== currentUser) return 'claimed-other';
  if (!task.claimed_by && task.replications.length >= EXPECTED_REPLICATIONS) return 'ready';
  return '';
};

export default function TaskList({ tasks, tab }: TaskListProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const { claimedTasks, currentUser } = useTaskState();

  if (selectedTaskId) {
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (task) {
      return (
        <TaskDetail task={task} onBack={() => setSelectedTaskId(null)} />
      );
    }
  }

  const isQueue = tab === 'no-reworks';
  const isReworks = tab === 'with-reworks';

  return (
    <div className="task-list-container">
      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks in this tab</p>
        </div>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Revision Set ID</th>
              <th>Alternative ID</th>
              <th>Original Task Instance ID</th>
              {isQueue || isReworks ? (
                <>
                  <th>Submitted</th>
                  <th>Reviewed</th>
                </>
              ) : (
                <th>Pending Review</th>
              )}
              <th>Last Replication Submitted</th>
              <th>Claimed By</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const lastSubmitted = lastReplicationSubmittedAt(task);
              const colorClass = rowColorClass(task, claimedTasks, currentUser);

              return (
                <tr
                  key={task.id}
                  className={`task-table-row ${colorClass}`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <td className="mono">{task.revision_set_id}</td>
                  <td className="mono">{task.alternative_id}</td>
                  <td className="mono">{task.original_task_instance_id}</td>
                  {isQueue ? (
                    <>
                      <td>
                        <span
                          className={`pending-review-count ${
                            task.replications.length >= EXPECTED_REPLICATIONS ? 'complete' : ''
                          }`}
                        >
                          {task.replications.length}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`pending-review-count ${
                            reviewedCount(task) === task.replications.length ? 'complete' : ''
                          }`}
                        >
                          {reviewedCount(task)}
                        </span>
                      </td>
                    </>
                  ) : isReworks ? (
                    (() => {
                      const { submitted, reviewed, total } = getReworkInfo(task);
                      return (
                        <>
                          <td>
                            <span
                              className={`pending-review-count ${
                                submitted === total ? 'complete' : ''
                              }`}
                            >
                              {submitted}/{total}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`pending-review-count ${
                                reviewed === total ? 'complete' : ''
                              }`}
                            >
                              {reviewed}/{total}
                            </span>
                          </td>
                        </>
                      );
                    })()
                  ) : (
                    (() => {
                      const { numerator, denominator, isComplete } = getPendingReviewInfo(task);
                      return (
                        <td>
                          <span
                            className={`pending-review-count ${isComplete ? 'complete' : ''}`}
                          >
                            {numerator}/{denominator}
                          </span>
                        </td>
                      );
                    })()
                  )}
                  <td>{lastSubmitted ? new Date(lastSubmitted).toLocaleString() : '—'}</td>
                  <td>{task.claimed_by ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
