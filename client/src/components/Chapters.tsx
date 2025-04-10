import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

// Define chapter difficulty levels
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

// Define a single chapter
interface Chapter {
  id: number;
  name: string;
  description: string;
  difficulty: Difficulty;
  themeColor: string;
  mapTheme: string;
  enemyTypes: string[];
  completed: boolean;
  highScore: number;
  bestTime: number; // in seconds
  stars: number; // 0-3 stars based on performance
  unlocked: boolean;
  requiredLevel: number;
}

// Create 20 chapters with different difficulty levels, themes, and requirements
const GAME_CHAPTERS: Chapter[] = [
  // Chapter 1-5: Training Grounds (Easy)
  {
    id: 1,
    name: "Boot Camp",
    description: "Basic training mission. Learn how to control your tank and practice shooting.",
    difficulty: "EASY",
    themeColor: "#4CAF50",
    mapTheme: "GRASS",
    enemyTypes: ["BASIC"],
    completed: true,
    highScore: 2500,
    bestTime: 180,
    stars: 3,
    unlocked: true,
    requiredLevel: 1
  },
  {
    id: 2,
    name: "Target Practice",
    description: "Destroy all the targets while avoiding obstacles. Focus on accuracy!",
    difficulty: "EASY",
    themeColor: "#4CAF50",
    mapTheme: "GRASS",
    enemyTypes: ["BASIC", "SCOUT"],
    completed: true,
    highScore: 1800,
    bestTime: 240,
    stars: 2,
    unlocked: true,
    requiredLevel: 1
  },
  {
    id: 3,
    name: "Scout Patrol",
    description: "Enemy scouts have been spotted in the area. Eliminate them before they call reinforcements.",
    difficulty: "EASY",
    themeColor: "#4CAF50",
    mapTheme: "GRASS",
    enemyTypes: ["SCOUT", "BASIC"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: true,
    requiredLevel: 1
  },
  {
    id: 4,
    name: "Defensive Line",
    description: "Hold your position against waves of enemy tanks. Survive for the required time.",
    difficulty: "EASY",
    themeColor: "#4CAF50",
    mapTheme: "GRASS",
    enemyTypes: ["BASIC", "SCOUT"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: true,
    requiredLevel: 2
  },
  {
    id: 5,
    name: "First Encounter",
    description: "Face your first real challenge as enemy tanks attempt to overrun your position.",
    difficulty: "MEDIUM",
    themeColor: "#FF9800",
    mapTheme: "GRASS",
    enemyTypes: ["BASIC", "SCOUT", "ASSAULT"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: true,
    requiredLevel: 2
  },
  
  // Chapter 6-10: Urban Warfare (Medium)
  {
    id: 6,
    name: "Urban Infiltration",
    description: "Navigate through city streets and eliminate hostile forces. Watch for ambushes!",
    difficulty: "MEDIUM",
    themeColor: "#FF9800",
    mapTheme: "URBAN",
    enemyTypes: ["ASSAULT", "HEAVY"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 3
  },
  {
    id: 7,
    name: "Building Clearance",
    description: "Clear each building of enemy forces. Precision is key in the urban environment.",
    difficulty: "MEDIUM",
    themeColor: "#FF9800",
    mapTheme: "URBAN",
    enemyTypes: ["ASSAULT", "SNIPER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 3
  },
  {
    id: 8,
    name: "Supply Convoy",
    description: "Escort a convoy through hostile territory. Keep the trucks safe at all costs.",
    difficulty: "MEDIUM",
    themeColor: "#FF9800",
    mapTheme: "URBAN",
    enemyTypes: ["SCOUT", "ASSAULT", "HEAVY"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 4
  },
  {
    id: 9,
    name: "Sabotage Operation",
    description: "Destroy enemy communications while avoiding detection. Stealth is recommended.",
    difficulty: "MEDIUM",
    themeColor: "#FF9800",
    mapTheme: "URBAN",
    enemyTypes: ["SCOUT", "SNIPER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 4
  },
  {
    id: 10,
    name: "Downtown Showdown",
    description: "Face elite enemy units in the heart of the city. This will be a tough battle!",
    difficulty: "HARD",
    themeColor: "#F44336",
    mapTheme: "URBAN",
    enemyTypes: ["ASSAULT", "HEAVY", "DEMOLISHER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 5
  },
  
  // Chapter 11-15: Desert Storm (Hard)
  {
    id: 11,
    name: "Desert Deployment",
    description: "Adapt to the harsh desert environment while facing new enemy forces.",
    difficulty: "HARD",
    themeColor: "#F44336",
    mapTheme: "DESERT",
    enemyTypes: ["ASSAULT", "HEAVY"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 6
  },
  {
    id: 12,
    name: "Mirage",
    description: "Visibility is low due to sandstorms. Stay alert for surprise attacks.",
    difficulty: "HARD",
    themeColor: "#F44336",
    mapTheme: "DESERT",
    enemyTypes: ["SNIPER", "SCOUT", "ASSAULT"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 6
  },
  {
    id: 13,
    name: "Oil Fields",
    description: "Secure vital oil resources. Watch out for explosive hazards!",
    difficulty: "HARD",
    themeColor: "#F44336",
    mapTheme: "DESERT",
    enemyTypes: ["DEMOLISHER", "HEAVY"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 7
  },
  {
    id: 14,
    name: "Fortress Assault",
    description: "Breach a heavily fortified enemy stronghold guarded by elite units.",
    difficulty: "HARD",
    themeColor: "#F44336",
    mapTheme: "DESERT",
    enemyTypes: ["HEAVY", "DEMOLISHER", "SNIPER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 7
  },
  {
    id: 15,
    name: "Sandstorm",
    description: "The ultimate desert challenge. Face overwhelming forces in brutal conditions.",
    difficulty: "EXTREME",
    themeColor: "#9C27B0",
    mapTheme: "DESERT",
    enemyTypes: ["ASSAULT", "HEAVY", "DEMOLISHER", "BOSS"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 8
  },
  
  // Chapter 16-20: Final Front (Extreme)
  {
    id: 16,
    name: "Mountain Pass",
    description: "Navigate treacherous terrain while facing elite enemy ambushes.",
    difficulty: "EXTREME",
    themeColor: "#9C27B0",
    mapTheme: "MOUNTAIN",
    enemyTypes: ["HEAVY", "SNIPER", "DEMOLISHER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 8
  },
  {
    id: 17,
    name: "Enemy Headquarters",
    description: "Infiltrate the main enemy base. Expect heavy resistance!",
    difficulty: "EXTREME",
    themeColor: "#9C27B0",
    mapTheme: "URBAN",
    enemyTypes: ["ASSAULT", "HEAVY", "DEMOLISHER", "SNIPER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 9
  },
  {
    id: 18,
    name: "Last Stand",
    description: "Hold your position against endless waves of enemies. How long can you survive?",
    difficulty: "EXTREME",
    themeColor: "#9C27B0",
    mapTheme: "MOUNTAIN",
    enemyTypes: ["ASSAULT", "HEAVY", "DEMOLISHER", "SCOUT", "SNIPER"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 9
  },
  {
    id: 19,
    name: "Tank Commander",
    description: "Face the legendary enemy commander in a one-on-one duel.",
    difficulty: "EXTREME",
    themeColor: "#9C27B0",
    mapTheme: "SPECIAL",
    enemyTypes: ["BOSS"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 10
  },
  {
    id: 20,
    name: "Final Battle",
    description: "The ultimate challenge. Face all enemy types and the supreme commander.",
    difficulty: "EXTREME",
    themeColor: "#9C27B0",
    mapTheme: "SPECIAL",
    enemyTypes: ["ASSAULT", "HEAVY", "DEMOLISHER", "SCOUT", "SNIPER", "BOSS"],
    completed: false,
    highScore: 0,
    bestTime: 0,
    stars: 0,
    unlocked: false,
    requiredLevel: 10
  },
];

const Chapters: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  const handleSelectChapter = (chapter: Chapter) => {
    if (chapter.unlocked) {
      setSelectedChapter(chapter);
    }
  };
  
  const startChapter = () => {
    if (selectedChapter) {
      navigate(`/game/chapter/${selectedChapter.id}`);
    }
  };
  
  return (
    <div className="game-container">
      <div className="modern-chapters-screen">
        <div className="setup-header">
          <h1>CAMPAIGN MODE</h1>
          <p className="setup-subtitle">Select a mission to start your campaign</p>
        </div>
        
        {!selectedChapter ? (
          <>
            <div className="chapters-filters">
              <button className="filter-button active">All</button>
              <button className="filter-button">Easy</button>
              <button className="filter-button">Medium</button>
              <button className="filter-button">Hard</button>
              <button className="filter-button">Extreme</button>
              <button className="filter-button">Completed</button>
            </div>
            
            <div className="chapters-grid">
              {GAME_CHAPTERS.map((chapter) => (
                <div 
                  key={chapter.id}
                  className={`chapter-card ${!chapter.unlocked ? 'locked' : ''}`}
                  onClick={() => handleSelectChapter(chapter)}
                >
                  <div 
                    className="chapter-header"
                    style={{ backgroundColor: chapter.themeColor }}
                  >
                    <span className="chapter-number">#{chapter.id}</span>
                    <span className={`chapter-difficulty ${chapter.difficulty.toLowerCase()}`}>
                      {chapter.difficulty}
                    </span>
                  </div>
                  
                  <h3>{chapter.name}</h3>
                  
                  <div className="chapter-theme">
                    <i className={
                      chapter.mapTheme === 'GRASS' ? 'fas fa-tree' : 
                      chapter.mapTheme === 'URBAN' ? 'fas fa-city' :
                      chapter.mapTheme === 'DESERT' ? 'fas fa-sun' :
                      chapter.mapTheme === 'MOUNTAIN' ? 'fas fa-mountain' : 'fas fa-atom'
                    }></i>
                    <span>{chapter.mapTheme} TERRAIN</span>
                  </div>
                  
                  <p className="chapter-description">{chapter.description}</p>
                  
                  <div className="chapter-enemies">
                    {chapter.enemyTypes.map((enemy, index) => (
                      <span key={index} className="enemy-tag">
                        {enemy}
                      </span>
                    ))}
                  </div>
                  
                  <div className="chapter-stats">
                    {chapter.completed ? (
                      <>
                        <div className="chapter-stars">
                          {[...Array(3)].map((_, i) => (
                            <i 
                              key={i} 
                              className={`${i < chapter.stars ? 'fas' : 'far'} fa-star`}
                            ></i>
                          ))}
                        </div>
                        <div className="chapter-records">
                          <div className="record-item">
                            <i className="fas fa-trophy"></i>
                            <span>{chapter.highScore}</span>
                          </div>
                          <div className="record-item">
                            <i className="fas fa-clock"></i>
                            <span>
                              {Math.floor(chapter.bestTime / 60)}:
                              {(chapter.bestTime % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="chapter-status">
                        {chapter.unlocked ? (
                          <span className="status-available">
                            <i className="fas fa-check-circle"></i> Ready to Play
                          </span>
                        ) : (
                          <span className="status-locked">
                            <i className="fas fa-lock"></i> Unlocks at Level {chapter.requiredLevel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="chapters-footer">
              <button className="back-button" onClick={() => navigate('/home')}>
                <i className="fas fa-arrow-left"></i> Back to Home
              </button>
            </div>
          </>
        ) : (
          <div className="chapter-details">
            <div 
              className="chapter-banner" 
              style={{ backgroundColor: selectedChapter.themeColor }}
            >
              <div className="banner-content">
                <h2>
                  <span className="chapter-number">MISSION #{selectedChapter.id}</span>
                  {selectedChapter.name}
                </h2>
                <span className={`chapter-difficulty ${selectedChapter.difficulty.toLowerCase()}`}>
                  {selectedChapter.difficulty}
                </span>
              </div>
            </div>
            
            <div className="chapter-info">
              <div className="info-column">
                <div className="info-section">
                  <h3>Mission Briefing</h3>
                  <p>{selectedChapter.description}</p>
                </div>
                
                <div className="info-section">
                  <h3>Terrain</h3>
                  <div className="terrain-info">
                    <i className={
                      selectedChapter.mapTheme === 'GRASS' ? 'fas fa-tree fa-2x' : 
                      selectedChapter.mapTheme === 'URBAN' ? 'fas fa-city fa-2x' :
                      selectedChapter.mapTheme === 'DESERT' ? 'fas fa-sun fa-2x' :
                      selectedChapter.mapTheme === 'MOUNTAIN' ? 'fas fa-mountain fa-2x' : 'fas fa-atom fa-2x'
                    }></i>
                    <div>
                      <h4>{selectedChapter.mapTheme} TERRAIN</h4>
                      <p>
                        {selectedChapter.mapTheme === 'GRASS' ? 'Open fields with light forest cover. Good visibility and maneuverability.' : 
                         selectedChapter.mapTheme === 'URBAN' ? 'City environment with buildings and narrow streets. Limited movement options.' :
                         selectedChapter.mapTheme === 'DESERT' ? 'Open desert with sandstorms and limited cover. Good long-range visibility.' :
                         selectedChapter.mapTheme === 'MOUNTAIN' ? 'Rough terrain with elevation changes. Challenging to navigate.' : 
                         'Special environment with unique hazards and challenges.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="info-section">
                  <h3>Enemy Forces</h3>
                  <div className="enemy-forces">
                    {selectedChapter.enemyTypes.map((enemy, index) => (
                      <div key={index} className="enemy-info">
                        <div className="enemy-icon">
                          <i className={
                            enemy === 'BASIC' ? 'fas fa-robot' :
                            enemy === 'SCOUT' ? 'fas fa-biking' :
                            enemy === 'ASSAULT' ? 'fas fa-fire' :
                            enemy === 'HEAVY' ? 'fas fa-weight-hanging' :
                            enemy === 'SNIPER' ? 'fas fa-crosshairs' :
                            enemy === 'DEMOLISHER' ? 'fas fa-bomb' : 'fas fa-skull'
                          }></i>
                        </div>
                        <div className="enemy-details">
                          <h4>{enemy}</h4>
                          <p>
                            {enemy === 'BASIC' ? 'Standard enemy tank with balanced capabilities.' :
                             enemy === 'SCOUT' ? 'Fast but lightly armored. Can call reinforcements.' :
                             enemy === 'ASSAULT' ? 'Aggressive with medium armor and good firepower.' :
                             enemy === 'HEAVY' ? 'Slow but heavily armored with powerful cannon.' :
                             enemy === 'SNIPER' ? 'Long-range specialist. Weak armor but deadly accurate.' :
                             enemy === 'DEMOLISHER' ? 'Specializes in explosives and area damage.' : 
                             'Elite commander unit with special abilities and high health.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="info-column">
                <div className="info-section">
                  <h3>Objectives</h3>
                  <ul className="mission-objectives">
                    <li className="primary">
                      <i className="fas fa-check-circle"></i>
                      <span>Eliminate all enemy tanks</span>
                    </li>
                    <li className="primary">
                      <i className="fas fa-check-circle"></i>
                      <span>Reach the extraction point</span>
                    </li>
                    <li className="optional">
                      <i className="fas fa-star"></i>
                      <span>Complete mission in under 5 minutes</span>
                    </li>
                    <li className="optional">
                      <i className="fas fa-star"></i>
                      <span>Destroy all destructible obstacles</span>
                    </li>
                    <li className="optional">
                      <i className="fas fa-star"></i>
                      <span>Finish with at least 80% health</span>
                    </li>
                  </ul>
                </div>
                
                <div className="info-section">
                  <h3>Rewards</h3>
                  <div className="mission-rewards">
                    <div className="reward-item">
                      <i className="fas fa-coins fa-2x"></i>
                      <div>
                        <h4>250 Coins</h4>
                        <p>Plus 50 coins per star earned</p>
                      </div>
                    </div>
                    <div className="reward-item">
                      <i className="fas fa-star fa-2x"></i>
                      <div>
                        <h4>300 XP</h4>
                        <p>Plus 100 XP per star earned</p>
                      </div>
                    </div>
                    {selectedChapter.id % 5 === 0 && (
                      <div className="reward-item special">
                        <i className="fas fa-trophy fa-2x"></i>
                        <div>
                          <h4>Special Tank Part</h4>
                          <p>Unlocks upgrades for your tanks</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="chapter-actions">
                  <button className="back-button" onClick={() => setSelectedChapter(null)}>
                    <i className="fas fa-arrow-left"></i> Back to Missions
                  </button>
                  <button className="start-button" onClick={startChapter}>
                    <i className="fas fa-play"></i> Select Tank & Start
                  </button>
                </div>
                
                {selectedChapter.completed && (
                  <div className="chapter-records-detail">
                    <h3>Your Records</h3>
                    <div className="records-container">
                      <div className="record-card">
                        <i className="fas fa-trophy fa-2x"></i>
                        <div>
                          <h4>High Score</h4>
                          <p>{selectedChapter.highScore}</p>
                        </div>
                      </div>
                      <div className="record-card">
                        <i className="fas fa-clock fa-2x"></i>
                        <div>
                          <h4>Best Time</h4>
                          <p>
                            {Math.floor(selectedChapter.bestTime / 60)}:
                            {(selectedChapter.bestTime % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                      <div className="record-card">
                        <i className="fas fa-star fa-2x"></i>
                        <div>
                          <h4>Stars Earned</h4>
                          <p>{selectedChapter.stars}/3</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chapters; 