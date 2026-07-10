export interface ReplicationEvent {
  timestamp: string
  action: 'view' | 'edit' | 'send_to_rework' | 'approve'
  actor: string
  details?: any
}

export interface Replication {
  id: string
  replication_number: number
  status: 'unclaimed' | 'view_link_pending' | 'approved' | 'sent_to_rework'
  completed: boolean
  history: ReplicationEvent[]
  rater_id: string
  rater_name: string
}

export interface Task {
  id: string
  revision_set_id: string
  alternative_id: string
  original_task_instance_id: string
  replications: Replication[]
  status: 'claimed' | 'unclaimed' | 'waiting_for_rework'
  claimed_by?: string
  claimed_at?: string
}

export interface ClaimedTask {
  task_id: string
  claimed_by: string
  claimed_at: string
}
