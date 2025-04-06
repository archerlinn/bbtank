import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
  username: string;
}

const Home: React.FC<HomeProps> = ({ username }) => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome, {username}!</h1>
      <div className="game-modes">
        <div className="game-mode-card" onClick={() => navigate('/pvp')}>
          <h2>PvP Mode</h2>
          <p>Battle against other players in real-time combat</p>
          <ul>
            <li>Real-time multiplayer battles</li>
            <li>Different tank types to choose from</li>
            <li>Compete for the highest score</li>
          </ul>
        </div>
        <div className="game-mode-card" onClick={() => navigate('/chapters')}>
          <h2>Chapters Mode</h2>
          <p>Complete challenging levels and defeat powerful bosses</p>
          <ul>
            <li>Progressive difficulty levels</li>
            <li>Unique boss battles</li>
            <li>Earn rewards and upgrades</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home; 