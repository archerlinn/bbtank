import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Game from './components/Game';
import Chapters from './components/Chapters';
import './App.css';

const App: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);

  const handleLogin = (username: string) => {
    setUsername(username);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              username ? (
                <Navigate to="/home" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/home"
            element={
              username ? (
                <Home username={username} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/pvp"
            element={
              username ? (
                <Game mode="pvp" />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/chapters"
            element={
              username ? (
                <Chapters />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/chapter/:id"
            element={
              username ? (
                <Game mode="chapter" />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
