import type { Task, Replication, ReplicationEvent } from '../hooks/useTaskState';

const raters = [
  { id: 'rater-1', name: 'Alice Johnson', email: 'alice.johnson@qacorp.com' },
  { id: 'rater-2', name: 'Bob Smith', email: 'bob.smith@qacorp.com' },
  { id: 'rater-3', name: 'Carol Davis', email: 'carol.davis@qacorp.com' },
  { id: 'rater-4', name: 'David Wilson', email: 'david.wilson@qacorp.com' },
  { id: 'rater-5', name: 'Emma Brown', email: 'emma.brown@qacorp.com' },
];

// Other QAs already working the queue, distinct from the current user.
const otherQas = {
  sam: 'sam.taylor@qacorp.com',
  priya: 'priya.nair@qacorp.com',
  morgan: 'morgan.reyes@qacorp.com',
};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();

interface QaEvent {
  hoursAgo: number;
  action: ReplicationEvent['action'];
  actor: string;
}

const makeReplication = (
  id: string,
  replication_number: number,
  raterIndex: number,
  status: Replication['status'],
  completedHoursAgo: number,
  qaEvents: QaEvent[] = []
): Replication => {
  const rater = raters[raterIndex];
  const completed_at = hoursAgo(completedHoursAgo);

  const history: ReplicationEvent[] = [
    { timestamp: completed_at, action: 'submit', actor: rater.email },
    ...qaEvents.map((e) => ({
      timestamp: hoursAgo(e.hoursAgo),
      action: e.action,
      actor: e.actor,
    })),
  ];

  return {
    id,
    replication_number,
    status,
    completed: status === 'approved',
    wasReworked: status === 'sent_to_rework' || status === 'rework_resubmitted',
    rater_id: rater.id,
    rater_name: rater.name,
    rater_email: rater.email,
    completed_at,
    history,
  };
};

// Simulates the rater completing the fix and sending a reworked replication back.
const applyResubmit = (rep: Replication, resubmittedHoursAgo: number): Replication => {
  const completed_at = hoursAgo(resubmittedHoursAgo);
  return {
    ...rep,
    status: 'rework_resubmitted',
    completed_at,
    history: [...rep.history, { timestamp: completed_at, action: 'resubmit', actor: rep.rater_email }],
  };
};

export const generateMockTasks = (): Task[] => {
  return [
    // Queue: fresh, untouched task. Nobody has claimed or reviewed it yet.
    {
      id: 'task-1',
      revision_set_id: 'RS-2024-001',
      alternative_id: 'ALT-A1',
      original_task_instance_id: 'OTI-001',
      status: 'unclaimed',
      replications: [
        makeReplication('rep-1-1', 1, 0, 'unclaimed', 5),
        makeReplication('rep-1-2', 2, 1, 'unclaimed', 4),
        makeReplication('rep-1-3', 3, 2, 'unclaimed', 6),
      ],
    },
    // Queue: partially reviewed by another QA, still in progress.
    {
      id: 'task-2',
      revision_set_id: 'RS-2024-002',
      alternative_id: 'ALT-B2',
      original_task_instance_id: 'OTI-002',
      status: 'claimed',
      claimed_by: otherQas.sam,
      claimed_at: hoursAgo(1),
      replications: [
        makeReplication('rep-2-1', 1, 1, 'approved', 2, [
          { hoursAgo: 1, action: 'view', actor: otherQas.sam },
          { hoursAgo: 0.5, action: 'approve', actor: otherQas.sam },
        ]),
        makeReplication('rep-2-2', 2, 3, 'unclaimed', 3),
        makeReplication('rep-2-3', 3, 4, 'unclaimed', 3.5),
      ],
    },
    // Queue: another QA already sent one replication to rework, but not all
    // are decided yet, so it must stay in "Queue" instead of moving to "Reworks".
    {
      id: 'task-3',
      revision_set_id: 'RS-2024-003',
      alternative_id: 'ALT-C3',
      original_task_instance_id: 'OTI-003',
      status: 'claimed',
      claimed_by: otherQas.priya,
      claimed_at: hoursAgo(2),
      replications: [
        makeReplication('rep-3-1', 1, 0, 'sent_to_rework', 3, [
          { hoursAgo: 2, action: 'view', actor: otherQas.priya },
          { hoursAgo: 1, action: 'send_to_rework', actor: otherQas.priya },
        ]),
        makeReplication('rep-3-2', 2, 4, 'approved', 2, [
          { hoursAgo: 1, action: 'view', actor: otherQas.priya },
          { hoursAgo: 0.5, action: 'approve', actor: otherQas.priya },
        ]),
        makeReplication('rep-3-3', 3, 2, 'unclaimed', 4),
      ],
    },
    // Queue: fully approved by another QA, zero reworks, ready for their final approval.
    {
      id: 'task-4',
      revision_set_id: 'RS-2024-004',
      alternative_id: 'ALT-D4',
      original_task_instance_id: 'OTI-004',
      status: 'claimed',
      claimed_by: otherQas.morgan,
      claimed_at: hoursAgo(2.5),
      replications: [
        makeReplication('rep-4-1', 1, 1, 'approved', 2.5, [
          { hoursAgo: 1.5, action: 'view', actor: otherQas.morgan },
          { hoursAgo: 1, action: 'approve', actor: otherQas.morgan },
        ]),
        makeReplication('rep-4-2', 2, 3, 'approved', 2.5, [
          { hoursAgo: 1.5, action: 'view', actor: otherQas.morgan },
          { hoursAgo: 1, action: 'approve', actor: otherQas.morgan },
        ]),
        makeReplication('rep-4-3', 3, 0, 'approved', 2.5, [
          { hoursAgo: 1.5, action: 'view', actor: otherQas.morgan },
          { hoursAgo: 1, action: 'approve', actor: otherQas.morgan },
        ]),
      ],
    },
    // Reworks: 1 of 3 sent to rework, still waiting on the rater. Always
    // claimed by whoever reviewed it the first time.
    {
      id: 'task-5',
      revision_set_id: 'RS-2024-005',
      alternative_id: 'ALT-E5',
      original_task_instance_id: 'OTI-005',
      status: 'claimed',
      claimed_by: otherQas.sam,
      claimed_at: hoursAgo(4),
      replications: [
        makeReplication('rep-5-1', 1, 0, 'sent_to_rework', 4, [
          { hoursAgo: 3, action: 'view', actor: otherQas.sam },
          { hoursAgo: 2, action: 'send_to_rework', actor: otherQas.sam },
        ]),
        makeReplication('rep-5-2', 2, 1, 'approved', 3, [
          { hoursAgo: 2, action: 'view', actor: otherQas.sam },
          { hoursAgo: 1.5, action: 'approve', actor: otherQas.sam },
        ]),
        makeReplication('rep-5-3', 3, 2, 'approved', 3, [
          { hoursAgo: 2, action: 'view', actor: otherQas.sam },
          { hoursAgo: 1.5, action: 'approve', actor: otherQas.sam },
        ]),
      ],
    },
    // Reworks: 2 of 3 sent to rework. One already resubmitted by the rater
    // (ready for re-review), the other still waiting.
    {
      id: 'task-6',
      revision_set_id: 'RS-2024-006',
      alternative_id: 'ALT-F6',
      original_task_instance_id: 'OTI-006',
      status: 'claimed',
      claimed_by: otherQas.priya,
      claimed_at: hoursAgo(4),
      replications: [
        applyResubmit(
          makeReplication('rep-6-1', 1, 3, 'sent_to_rework', 4, [
            { hoursAgo: 3, action: 'view', actor: otherQas.priya },
            { hoursAgo: 2, action: 'send_to_rework', actor: otherQas.priya },
          ]),
          1
        ),
        makeReplication('rep-6-2', 2, 4, 'sent_to_rework', 4, [
          { hoursAgo: 3, action: 'view', actor: otherQas.priya },
          { hoursAgo: 2, action: 'send_to_rework', actor: otherQas.priya },
        ]),
        makeReplication('rep-6-3', 3, 0, 'approved', 3, [
          { hoursAgo: 2, action: 'view', actor: otherQas.priya },
          { hoursAgo: 1.5, action: 'approve', actor: otherQas.priya },
        ]),
      ],
    },
    // Queue: only 2 of 3 replications have arrived so far, not claimable yet.
    {
      id: 'task-7',
      revision_set_id: 'RS-2024-007',
      alternative_id: 'ALT-G7',
      original_task_instance_id: 'OTI-007',
      status: 'unclaimed',
      replications: [
        makeReplication('rep-7-1', 1, 2, 'unclaimed', 1),
        makeReplication('rep-7-2', 2, 3, 'unclaimed', 0.5),
      ],
    },
    // Queue: fully submitted but already claimed by another QA. Nothing
    // reviewed yet.
    {
      id: 'task-8',
      revision_set_id: 'RS-2024-008',
      alternative_id: 'ALT-H8',
      original_task_instance_id: 'OTI-008',
      status: 'claimed',
      claimed_by: otherQas.morgan,
      claimed_at: hoursAgo(0.75),
      replications: [
        makeReplication('rep-8-1', 1, 4, 'unclaimed', 2),
        makeReplication('rep-8-2', 2, 0, 'unclaimed', 1.5),
        makeReplication('rep-8-3', 3, 1, 'unclaimed', 1),
      ],
    },
  ];
};
