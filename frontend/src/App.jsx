import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TaskBoard from './pages/TaskBoard';
import Users from './pages/Users';
import { auth } from './api/client';

function App() {
  const [user, setUser] = useState(() => auth.getUser());

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const onLogout = () => setUser(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TaskBoard user={user} onLogout={onLogout} />} />
        <Route path="/users" element={<Users user={user} onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
