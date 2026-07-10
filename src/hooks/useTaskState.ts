import { useState, useCallback, useContext, createContext } from 'react';

export const EXPECTED_REPLICATIONS = 3;

export interface ReplicationEvent {
  timestamp: string
  action: 'submit' | 'view' | 'edit' | 'send_to_rework' | 'resubmit' | 'approve'
  actor: string
  details?: any
}

export interface Replication {
  id: string
  replication_number: number
  status: 'unclaimed' | 'pending_edit' | 'approved' | 'sent_to_rework' | 'rework_resubmitted'
  completed: boolean
  wasReworked: boolean
  history: ReplicationEvent[]
  rater_id: string
  rater_name: string
  rater_email: string
  completed_at: string
}

export interface Task {
  id: string
  revision_set_id: string
  alternative_id: string
  original_task_instance_id: string
  replications: Replication[]
  status: 'claimed' | 'unclaimed' | 'waiting_for_rework' | 'approved'
  claimed_by?: string
  claimed_at?: string
}

interface TaskContextType {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  claimedTasks: string[];
  currentUser: string;
  claimTask: (taskId: string) => boolean;
  getClaimedCount: () => number;
  updateReplicationStatus: (
    taskId: string,
    repId: string,
    status: Replication['status']
  ) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  addReplicationHistory: (
    taskId: string,
    repId: string,
    action: string,
    actor: string
  ) => void;
  approveTask: (taskId: string) => void;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskState = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskState must be used within TaskProvider');
  }
  return context;
};

export const useTaskStateProvider = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);
  const currentUser = 'jordan.lee@qacorp.com';

  const getClaimedCount = useCallback(() => claimedTasks.length, [claimedTasks]);

  const claimTask = useCallback(
    (taskId: string): boolean => {
      if (getClaimedCount() >= 3) {
        return false;
      }
      if (claimedTasks.includes(taskId)) {
        return false;
      }

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.replications.length < EXPECTED_REPLICATIONS) {
        return false;
      }
      if (task.claimed_by && task.claimed_by !== currentUser) {
        return false;
      }

      setClaimedTasks((prev) => [...prev, taskId]);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'claimed',
                claimed_by: currentUser,
                claimed_at: new Date().toISOString(),
              }
            : t
        )
      );
      return true;
    },
    [claimedTasks, getClaimedCount, tasks, currentUser]
  );

  const updateReplicationStatus = useCallback(
    (taskId: string, repId: string, status: Replication['status']) => {
      let allDecided = false;

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;

          const replications = task.replications.map((rep) =>
            rep.id === repId
              ? { ...rep, status, wasReworked: rep.wasReworked || status === 'sent_to_rework' }
              : rep
          );

          allDecided = replications.every(
            (rep) => rep.status === 'approved' || rep.status === 'sent_to_rework'
          );

          return { ...task, replications };
        })
      );

      if (allDecided) {
        setClaimedTasks((prev) => prev.filter((id) => id !== taskId));
      }
    },
    []
  );

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status } : task
      )
    );
  }, []);

  const addReplicationHistory = useCallback(
    (taskId: string, repId: string, action: string, actor: string) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                replications: task.replications.map((rep) =>
                  rep.id === repId
                    ? {
                        ...rep,
                        history: [
                          ...rep.history,
                          {
                            timestamp: new Date().toISOString(),
                            action: action as any,
                            actor,
                          },
                        ],
                      }
                    : rep
                ),
              }
            : task
        )
      );
    },
    []
  );

  const approveTask = useCallback((taskId: string) => {
    setClaimedTasks((prev) => prev.filter((id) => id !== taskId));
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: 'approved' } : task
      )
    );
  }, []);

  return {
    tasks,
    setTasks,
    claimedTasks,
    currentUser,
    claimTask,
    getClaimedCount,
    updateReplicationStatus,
    updateTaskStatus,
    addReplicationHistory,
    approveTask,
  };
};
