import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Home: React.FC<{ username: string }> = ({ username }) => {
  const navigate = useNavigate();

  return (
    <div className="game-container">
      <div className="modern-home-screen">
        <div className="setup-header">
          <h1>BBTANK BATTLE ARENA</h1>
          <p className="setup-subtitle">Welcome, Commander {username}</p>
          <div className="player-badge">
            <div className="player-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="player-stats">
              <div className="stat-item">
                <i className="fas fa-star"></i>
                <span>Level 5</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-trophy"></i>
                <span>Rank: Captain</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-coins"></i>
                <span>1250 Coins</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="select-mode-title">SELECT GAME MODE</h2>
        
        <div className="game-modes-carousel">
          <div 
            className="game-mode-card"
            onClick={() => navigate('/pvp')}
          >
            <div className="mode-icon">
              <i className="fas fa-crosshairs"></i>
            </div>
            <h3>PvP BATTLE</h3>
            <p className="mode-description">
              Challenge other players in real-time combat. Destroy enemy tanks and earn rewards.
            </p>
            <div className="mode-features">
              <div className="feature">
                <i className="fas fa-wifi"></i>
                <span>Online Multiplayer</span>
              </div>
              <div className="feature">
                <i className="fas fa-users"></i>
                <span>1v1 or Team Mode</span>
              </div>
              <div className="feature">
                <i className="fas fa-ranking-star"></i>
                <span>Competitive Ranking</span>
              </div>
            </div>
            <button className="mode-select-button">
              <i className="fas fa-play"></i> Enter Battle
            </button>
          </div>
          
          <div 
            className="game-mode-card"
            onClick={() => navigate('/chapters')}
          >
            <div className="mode-icon">
              <i className="fas fa-book"></i>
            </div>
            <h3>CAMPAIGN MODE</h3>
            <p className="mode-description">
              Embark on a strategic mission-based campaign. Complete objectives and unlock new chapters.
            </p>
            <div className="mode-features">
              <div className="feature">
                <i className="fas fa-robot"></i>
                <span>AI Opponents</span>
              </div>
              <div className="feature">
                <i className="fas fa-tasks"></i>
                <span>20 Unique Missions</span>
              </div>
              <div className="feature">
                <i className="fas fa-unlock"></i>
                <span>Unlock New Tanks</span>
              </div>
            </div>
            <button className="mode-select-button">
              <i className="fas fa-book-open"></i> Start Campaign
            </button>
          </div>
          
          <div className="game-mode-card locked">
            <div className="mode-icon">
              <i className="fas fa-crown"></i>
            </div>
            <h3>TOURNAMENT MODE</h3>
            <p className="mode-description">
              Compete in structured tournaments with brackets and win exclusive rewards.
            </p>
            <div className="mode-features">
              <div className="feature">
                <i className="fas fa-calendar"></i>
                <span>Weekly Events</span>
              </div>
              <div className="feature">
                <i className="fas fa-gift"></i>
                <span>Exclusive Rewards</span>
              </div>
              <div className="feature">
                <i className="fas fa-medal"></i>
                <span>Global Leaderboards</span>
              </div>
            </div>
            <div className="locked-overlay">
              <i className="fas fa-lock"></i>
              <span>Available at Level 10</span>
            </div>
            <button className="mode-select-button" disabled>
              <i className="fas fa-crown"></i> Enter Tournament
            </button>
          </div>
        </div>
        
        <div className="home-footer">
          <button className="secondary-button">
            <i className="fas fa-cog"></i> Settings
          </button>
          <button className="secondary-button">
            <i className="fas fa-store"></i> Tank Shop
          </button>
          <button className="danger-button" onClick={() => navigate('/')}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 