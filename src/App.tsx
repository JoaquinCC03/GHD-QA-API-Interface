import { useEffect } from 'react';
import { TaskContext, useTaskStateProvider } from './hooks/useTaskState';
import { generateMockTasks } from './data/mockTasks';
import Layout from './components/Layout';
import './App.css';

function App() {
  const taskState = useTaskStateProvider();

  useEffect(() => {
    taskState.setTasks(generateMockTasks());
  }, []);

  return (
    <TaskContext.Provider value={taskState}>
      <Layout />
    </TaskContext.Provider>
  );
}

export default App;
