import { useState } from 'react';
import { useTaskState, EXPECTED_REPLICATIONS } from '../hooks/useTaskState';
import TaskList from './TaskList';
import '../styles/Layout.css';

type Tab = 'no-reworks' | 'with-reworks' | 'approved';
type FilterMode = 'all' | 'mine' | 'ready';

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('no-reworks');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const { tasks, claimedTasks, getClaimedCount } = useTaskState();

  const toggleFilter = (mode: FilterMode) =>
    setFilterMode((prev) => (prev === mode ? 'all' : mode));

  const isReady = (task: (typeof tasks)[number]) =>
    !task.claimed_by && task.replications.length >= EXPECTED_REPLICATIONS;

  const pendingTasks = tasks.filter((task) => task.status !== 'approved');

  // A replication has had its first-pass decision made once it's no longer
  // fresh or being edited. This also covers a rework that's since come back
  // (rework_resubmitted), so the task doesn't bounce back out of "Reworks"
  // while the QA is re-reviewing it.
  const hasFirstDecision = (rep: (typeof tasks)[number]['replications'][number]) =>
    rep.status === 'approved' || rep.status === 'sent_to_rework' || rep.status === 'rework_resubmitted';

  // A task only moves out of "Queue" once every replication has been
  // decided AND at least one went to rework at some point.
  const noReworksTasks = pendingTasks.filter((task) => {
    const allDecided = task.replications.every(hasFirstDecision);
    const hasRework = task.replications.some((rep) => rep.wasReworked);
    return !allDecided || !hasRework;
  });

  const withReworksTasks = pendingTasks.filter((task) => {
    const allDecided = task.replications.every(hasFirstDecision);
    const hasRework = task.replications.some((rep) => rep.wasReworked);
    return allDecided && hasRework;
  });

  const approvedTasks = tasks.filter((task) => task.status === 'approved');

  const tabTasks: Record<Tab, typeof tasks> = {
    'no-reworks': noReworksTasks,
    'with-reworks': withReworksTasks,
    approved: approvedTasks,
  };

  const baseTasks = tabTasks[activeTab];
  const readyCount = baseTasks.filter(isReady).length;
  const displayTasks =
    filterMode === 'mine'
      ? baseTasks.filter((task) => claimedTasks.includes(task.id))
      : filterMode === 'ready'
      ? baseTasks.filter(isReady)
      : baseTasks;

  return (
    <div className="layout-container">
      <header className="layout-header">
        <h1>QA Task Management</h1>
      </header>

      <div className="toolbar">
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'no-reworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('no-reworks')}
          >
            Queue ({noReworksTasks.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'with-reworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('with-reworks')}
          >
            Reworks ({withReworksTasks.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({approvedTasks.length})
          </button>
        </div>

        <button
          className={`my-claims-button ${filterMode === 'mine' ? 'active' : ''}`}
          onClick={() => toggleFilter('mine')}
        >
          My Claimed Tasks ({getClaimedCount()}/3)
        </button>
        <button
          className={`ready-filter-button ${filterMode === 'ready' ? 'active' : ''}`}
          onClick={() => toggleFilter('ready')}
        >
          Ready to Claim ({readyCount})
        </button>
      </div>

      <main className="layout-main">
        <TaskList tasks={displayTasks} tab={activeTab} />
      </main>
    </div>
  );
}
