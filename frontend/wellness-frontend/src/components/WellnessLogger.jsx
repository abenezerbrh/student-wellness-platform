import "./WellnessLogger.css";
import { useState } from "react";

import {
  Sparkles,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Frown,
  Heart,
  Moon,
  Brain,
  BookOpen,
  Goal,
  PartyPopper
} from "lucide-react";


const moods = [
  { label: "Great", value: "great", icon: Sparkles, className: "mood-great" },
  { label: "Good", value: "good", icon: ThumbsUp, className: "mood-good" },
  { label: "Okay", value: "okay", icon: Minus, className: "mood-okay" },
  { label: "Bad", value: "bad", icon: ThumbsDown, className: "mood-bad" },
  { label: "Terrible", value: "terrible", icon: Frown, className: "mood-terrible" },
];


 

export default function WellnessLogger({
  sleepHours,
  setSleepHours,
  stressLevel,
  setStressLevel,
  studyHours,
  setStudyHours,
  loading,
  onSubmit,
  last7Entries = [],
  maxSleep, 
  maxStress,
  maxStudy,
  hasLoggedToday = false
}) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  const handleSelect = (value) => {
    setSelectedMood(value);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate and clamp values to valid ranges
  const validatedData = {
    mood: selectedMood,
    sleep_hours: sleepHours 
      ? Math.max(0, Math.min(24, Number(sleepHours))) 
      : null,
    stress_level: Math.max(1, Math.min(10, Number(stressLevel))),
    study_hours: studyHours 
      ? Math.max(0, Math.min(24, Number(studyHours))) 
      : null
  };

  // Check if required fields are present
  if (!validatedData.mood || !validatedData.sleep_hours || !validatedData.study_hours) {
    alert('Please fill in all required fields');
    return;
  }

  // Show warning if values were adjusted
  const warnings = [];
  if (sleepHours !== validatedData.sleep_hours) {
    warnings.push('Sleep hours adjusted to valid range (0-24)');
  }
  if (studyHours !== validatedData.study_hours) {
    warnings.push('Study hours adjusted to valid range (0-24)');
  }
  if (stressLevel !== validatedData.stress_level) {
    warnings.push('Stress level adjusted to valid range (1-10)');
  }

  if (warnings.length > 0) {
    alert(warnings.join('\n'));
  }

  onSubmit(validatedData);
};


  return (
    <div className="log-page">
      {hasLoggedToday && (
        <div className="already-logged-banner">
          <span className="banner-icon">✓</span>
          <div>
            <strong>You've already logged today!</strong>
            <p>Come back tomorrow to log your next entry.</p>
          </div>
        </div>
      )}

      <div className="wellness-card">
        <h2>Log Today&apos;s Wellness</h2>
        <p className="subtitle">How are you feeling today?</p>
        <div className="mood-grid">
          {moods.map(({ label, value, icon: Icon, className }) => (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`mood-btn ${selectedMood === value ? className : ""}`}
            >
              <Icon size={22} />
              <span>{label.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <p className="wellness-message">
          Remember to take care of yourself today! <Heart size={16} />
        </p>
      </div>

      {/* Sleep Tracker with Chart */}
      <div className="tracker-card">
        <h3 className="tracker-header">
          <Moon /> Sleep Tracker
        </h3>

        <div className="input-group">
          <label>Hours Slept Last Night</label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(Number(e.target.value))}
            placeholder="e.g., 7.5"
            required
          />
        </div>

        {last7Entries.length > 0 && (
          <>
            <div className="weekly-average">
              <span className="avg-label"><Moon /> Weekly Average:</span>
              <span className="avg-value">
                {(last7Entries.reduce((sum, e) => sum + e.sleep_hours, 0) / last7Entries.length).toFixed(1)}h
                <span className="avg-badge">Optimal</span>
              </span>
            </div>

            <div className="chart-wrapper">
              <div className="simple-chart">
                {last7Entries.map((entry, i) => (
                  <div
                    key={i}
                    className="chart-bar-container"
                    onMouseEnter={() => setHoveredBar({ type: 'sleep', index: i, entry })}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div
                      className="chart-bar chart-bar-sleep"
                      style={{ height: `${(entry.sleep_hours / maxSleep) * 150}px` }}
                    ></div>
                    <div className="chart-day">{new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </div>
                ))}
              </div>
              {hoveredBar?.type === 'sleep' && (
                <div className="chart-tooltip">
                  <div className="tooltip-date">{new Date(hoveredBar.entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="tooltip-value">{hoveredBar.entry.sleep_hours} hours</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stress Tracker with Chart */}
      <div className="tracker-card">
        <h3 className="tracker-header">
          <Brain /> Stress Tracker
        </h3>

        <div className="stress-content">
          <div className="stress-level-display">
            <label>Select Your Stress Level:</label>
            <span className="stress-value">{stressLevel} / 10</span>
          </div>
          <div className="stress-label-center">
            {stressLevel <= 3 && "Low"}
            {stressLevel >= 4 && stressLevel <= 6 && "Moderate"}
            {stressLevel >= 7 && "High"}
          </div>
          <div className="stress-buttons">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <button
                key={level}
                onClick={() => setStressLevel(level)}
                className={`stress-btn ${stressLevel === level ? 'active' : ''} ${
                  level <= 3 ? 'stress-low' : level <= 6 ? 'stress-moderate' : 'stress-high'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {last7Entries.length > 0 && (
          <>
            <div className="weekly-average">
              <span className="avg-label">Weekly Average:</span>
              <span className="avg-value avg-value-stress">
                {(last7Entries.reduce((sum, e) => sum + e.stress_level, 0) / last7Entries.length).toFixed(1)} / 10
              </span>
            </div>

            <div className="chart-wrapper">
              <svg className="line-chart" viewBox="0 0 700 200" preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                <line x1="50" y1="20" x2="650" y2="20" stroke="#333" strokeWidth="1" />
                <line x1="50" y1="60" x2="650" y2="60" stroke="#333" strokeWidth="1" />
                <line x1="50" y1="100" x2="650" y2="100" stroke="#333" strokeWidth="1" />
                <line x1="50" y1="140" x2="650" y2="140" stroke="#333" strokeWidth="1" />
                <line x1="50" y1="180" x2="650" y2="180" stroke="#333" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="30" y="25" fill="#666" fontSize="12">10</text>
                <text x="35" y="65" fill="#666" fontSize="12">8</text>
                <text x="35" y="105" fill="#666" fontSize="12">6</text>
                <text x="35" y="145" fill="#666" fontSize="12">4</text>
                <text x="35" y="185" fill="#666" fontSize="12">0</text>

                {/* Smooth curved line path */}
                <path
                  d={(() => {
                    const points = last7Entries.map((entry, i) => ({
                      x: 50 + (i * (600 / (last7Entries.length - 1))),
                      y: 180 - ((entry.stress_level / 10) * 160)
                    }));

                    if (points.length === 0) return '';

                    let path = `M ${points[0].x} ${points[0].y}`;

                    for (let i = 0; i < points.length - 1; i++) {
                      const current = points[i];
                      const next = points[i + 1];
                      const controlPointX = (current.x + next.x) / 2;

                      path += ` C ${controlPointX} ${current.y}, ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
                    }

                    return path;
                  })()}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {last7Entries.map((entry, i) => {
                  const x = 50 + (i * (600 / (last7Entries.length - 1)));
                  const y = 180 - ((entry.stress_level / 10) * 160);
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#f87171"
                        stroke="#1a1a1a"
                        strokeWidth="2"
                        className="chart-point"
                        onMouseEnter={() => setHoveredBar({ type: 'stress', index: i, entry })}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ cursor: 'pointer' }}
                      />
                      {/* X-axis labels */}
                      <text
                        x={x}
                        y="195"
                        fill="#666"
                        fontSize="11"
                        textAnchor="middle"
                      >
                        {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' })}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {hoveredBar?.type === 'stress' && (
                <div
                  className="chart-tooltip"
                  style={{
                    left: `${50 + (hoveredBar.index * (600 / (last7Entries.length - 1)))}px`,
                    top: '20px'
                  }}
                >
                  <div className="tooltip-date">
                    {new Date(hoveredBar.entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="tooltip-value">Level {hoveredBar.entry.stress_level}/10</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Study Tracker with Chart */}
      <div className="tracker-card">
        <h3 className="tracker-header">
          <BookOpen /> Study Hours Tracker
        </h3>

        <div className="input-group">
          <label>Study Hours Today</label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={studyHours}
            onChange={(e) => setStudyHours(Number(e.target.value))}
            placeholder="e.g., 5"
            required
          />
        </div>

        {last7Entries.length > 0 && (
          <>
            <div className="weekly-goal">
              <span className="goal-label"><Goal /> Weekly Goal Progress</span>
              <span className="goal-value">
                {last7Entries.reduce((sum, e) => sum + e.study_hours, 0).toFixed(0)}h / 35h
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min((last7Entries.reduce((sum, e) => sum + e.study_hours, 0) / 35) * 100, 100)}%` }}
              />
            </div>
            {last7Entries.reduce((sum, e) => sum + e.study_hours, 0) >= 35 && (
              <div className="goal-achieved"><PartyPopper /> Goal achieved!</div>
            )}

            <div className="daily-average">
              <span>Daily Average:</span>
              <span className="avg-study">
                {(last7Entries.reduce((sum, e) => sum + e.study_hours, 0) / last7Entries.length).toFixed(1)}h
              </span>
            </div>

            <div className="chart-wrapper">
              <div className="simple-chart">
                {last7Entries.map((entry, i) => (
                  <div
                    key={i}
                    className="chart-bar-container"
                    onMouseEnter={() => setHoveredBar({ type: 'study', index: i, entry })}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div
                      className="chart-bar chart-bar-study"
                      style={{ height: `${(entry.study_hours / maxStudy) * 150}px` }}
                    ></div>
                    <div className="chart-day">{new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </div>
                ))}
              </div>
              {hoveredBar?.type === 'study' && (
                <div className="chart-tooltip">
                  <div className="tooltip-date">{new Date(hoveredBar.entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className="tooltip-value">{hoveredBar.entry.study_hours} hours</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Summary & Submit */}
      {!hasLoggedToday && (
        <div className="summary-card">
          <div className="summary-header">
            <Heart size={24} />
            <h3>Today's Summary</h3>
          </div>
          
          <div className="summary-items">
            <div className={`summary-chip ${selectedMood ? 'filled' : 'empty'}`}>
              <span className="chip-label">Mood</span>
              <span className="chip-value">
                {selectedMood ? selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1) : '—'}
              </span>
            </div>

            <div className={`summary-chip ${sleepHours ? 'filled' : 'empty'}`}>
              <Moon size={16} />
              <span className="chip-value">
                {sleepHours ? `${sleepHours}h` : '—'}
              </span>
            </div>

            <div className="summary-chip filled">
              <Brain size={16} />
              <span className="chip-value">{stressLevel}/10</span>
            </div>

            <div className={`summary-chip ${studyHours ? 'filled' : 'empty'}`}>
              <BookOpen size={16} />
              <span className="chip-value">
                {studyHours ? `${studyHours}h` : '—'}
              </span>
            </div>
          </div>

          {(!selectedMood || !sleepHours || !studyHours) && (
            <div className="missing-fields">
              Missing: {[
                !selectedMood && 'Mood',
                !sleepHours && 'Sleep',
                !studyHours && 'Study'
              ].filter(Boolean).join(', ')}
            </div>
          )}

          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={loading || !selectedMood || !sleepHours || !studyHours}
          >
            {loading ? 'Submitting...' : 'Submit Daily Log'}
          </button>
        </div>
      )}
    </div>
  );
}