# QA Task Interface

Web interface for managing QA tasks with replications, claims, and reworks. Everything runs in memory: there is no backend or database, so reloading the page resets the state back to the sample data.

## Requirements

- Node.js 18 or higher
- npm

## Running it

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in the browser.

## What it does

The app has three tabs:

- **Queue**: tasks that haven't been sent to rework yet, or that have a replication in rework but haven't had a decision made on all of them.
- **Reworks**: tasks where all 3 replications have been decided and at least one was sent to rework.
- **Approved**: tasks that have received final approval.

### Claims

- Each QA can have up to **3 claimed tasks** at a time.
- A task can only be claimed once all **3 replications** have arrived (see the "Submitted" column).
- Once claimed, a task cannot be manually unclaimed.
- Once all 3 replications of a task are decided (approved or sent to rework), the task frees up its slot in "My Claimed Tasks" automatically, even though it still shows as claimed by that QA.

### Replications

Each replication has 4 actions: **View**, **Edit Myself**, **Send to Rework**, and **Approve**. All of them require the task to be claimed, except View, which is also never disabled based on the replication's status.

When a replication is sent to rework, it waits on the rater. While waiting, only View works; Edit and Send to Rework stay disabled until it's resolved. Approve stays available so it can be resolved directly once the corrected work is ready.

### Final approval

The "Approve Task" button is enabled only once **all 3 replications are actually approved**. It asks for confirmation in a popup since the action can't be undone.

### Row colors (in the lists)

- Blue: task claimed by you.
- Orange: claimed by another QA.
- Green: unclaimed and ready to pick up (3/3 submitted).
- No color: not all 3 replications have arrived yet.

There's a "Ready to Claim" filter to show only the green rows, and a "My Claimed Tasks" filter to show only your own.

## Code structure

```
src/
  hooks/useTaskState.ts   # all app state (tasks, claims, actions)
  data/mockTasks.ts       # sample data loaded on startup
  components/             # UI: Layout (tabs), TaskList, TaskDetail, ReplicationRow, etc.
```

There's no routing and no persistence. `useTaskState.ts` is the single source of truth, held in a React `useState`.
