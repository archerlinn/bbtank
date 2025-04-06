import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TANK_TYPES } from '../shared/types';

interface Chapter {
  id: number;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  unlocked: boolean;
  completed: boolean;
}

const Chapters: React.FC = () => {
  const [selectedTank, setSelectedTank] = useState<string>('SNIPER');
  const navigate = useNavigate();

  const chapters: Chapter[] = [
    {
      id: 1,
      name: 'The Beginning',
      description: 'Learn the basics of tank combat',
      difficulty: 'Easy',
      unlocked: true,
      completed: false
    },
    {
      id: 2,
      name: 'Desert Showdown',
      description: 'Face off against the Sand King',
      difficulty: 'Medium',
      unlocked: false,
      completed: false
    },
    {
      id: 3,
      name: 'Mountain Assault',
      description: 'Climb the peaks to defeat the Mountain Guardian',
      difficulty: 'Hard',
      unlocked: false,
      completed: false
    }
  ];

  const startChapter = (chapterId: number) => {
    // In a real implementation, you'd load the chapter data and start the game
    navigate(`/chapter/${chapterId}`, { state: { tankType: selectedTank } });
  };

  return (
    <div className="chapters-container">
      <h1>Chapters Mode</h1>
      
      <div className="tank-selection">
        <h2>Select Your Tank</h2>
        <div className="tank-options">
          {Object.entries(TANK_TYPES).map(([type, tank]) => (
            <div
              key={type}
              className={`tank-option ${selectedTank === type ? 'selected' : ''}`}
              onClick={() => setSelectedTank(type)}
            >
              <h3>{type}</h3>
              <p>Health: {tank.health}</p>
              <p>Speed: {tank.speed}</p>
              <p>Damage: {tank.weapon.damage}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="chapters-list">
        {chapters.map(chapter => (
          <div
            key={chapter.id}
            className={`chapter-card ${chapter.unlocked ? '' : 'locked'}`}
            onClick={() => chapter.unlocked && startChapter(chapter.id)}
          >
            <h2>{chapter.name}</h2>
            <p>{chapter.description}</p>
            <div className="difficulty">{chapter.difficulty}</div>
            {!chapter.unlocked && <div className="locked-overlay">Locked</div>}
            {chapter.completed && <div className="completed-badge">Completed</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Chapters; 