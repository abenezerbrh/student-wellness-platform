import { useEffect, useState } from "react";
import "./App.css";
import CoursePlanner from "./components/CoursePlanner";
import WellnessLogger from "./components/WellnessLogger";
import { Sun, SunMedium, MoonStar, Lightbulb, Book } from "lucide-react";
const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hoveredBar, setHoveredBar] = useState(null);

  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [studyHours, setStudyHours] = useState("");

  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);

  const [loading, setLoading] = useState(false);

  const [entries, setEntries] = useState([]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return (
        <h1 className="greeting">
          Good morning
          <Sun className="greeting-icon" />
        </h1>

      );
    }

    if (hour < 18) {
      return (
        <>
          Good afternoon <SunMedium className="greeting-icon" />
        </>
      );
    }

    return (
      <>
        Good evening <MoonStar className="greeting-icon" />
      </>
    );
  };

  // Get motivational message based on recent data
  const getMotivation = () => {
    if (entries.length === 0) return "Let's start tracking your wellness journey";

    const recentEntries = entries.slice(-3);
    const avgSleep = recentEntries.reduce((sum, e) => sum + e.sleep_hours, 0) / recentEntries.length;
    const avgStress = recentEntries.reduce((sum, e) => sum + e.stress_level, 0) / recentEntries.length;

    if (avgSleep >= 7 && avgStress <= 5) return "You're doing great! Keep it up 🌟";
    if (avgSleep < 6) return "Your sleep could use some attention 💤";
    if (avgStress >= 8) return "High stress detected - take care of yourself 🧘";
    if (avgSleep >= 7) return "Great sleep habits! 😴";

    return "Stay consistent with your wellness goals 💪";
  };

  useEffect(() => {
    const existingSession = localStorage.getItem("session_id");

    if (existingSession) {
      setSessionId(existingSession);
      return;
    }

    fetch(`${API_BASE}/session`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("session_id", data.id);
        setSessionId(data.id);
      })
      .catch((err) => console.error("Session error:", err));
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchSummary();
      fetchInsights();
      fetchEntries();
    }
  }, [sessionId]);

  const fetchSummary = async () => {
    const res = await fetch(`${API_BASE}/wellness/summary/${sessionId}`);
    const data = await res.json();
    setSummary(data);
  };

  const fetchInsights = async () => {
    const res = await fetch(`${API_BASE}/wellness/insights/${sessionId}`);
    const data = await res.json();
    setInsights(data.insights);
  };

  const fetchEntries = async () => {
    const res = await fetch(`${API_BASE}/wellness/${sessionId}`);
    const data = await res.json();

    const sorted = data.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    setEntries(sorted);
  };

  const last7Entries = entries.slice(-7);

  const submitWellness = async (e) => {
    e.preventDefault();

    setLoading(true);

    await fetch(`${API_BASE}/wellness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: Number(sessionId),
        sleep_hours: Number(sleepHours),
        stress_level: Number(stressLevel),
        study_hours: Number(studyHours),
      }),
    });

    fetchSummary();
    fetchInsights();
    fetchEntries();

    setSleepHours("");
    setStudyHours("");

    setLoading(false);
  };

  if (!sessionId) {
    return <p className="app">Creating session...</p>;
  }

  return (
    <div className="app">
      <div className="content">
        {/* Enhanced Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-text">
              <h1>{getGreeting()}</h1>
              <p className="header-subtitle">{getMotivation()}</p>
            </div>
            <div className="header-stats">
              <div className="quick-stat">
                <span className="quick-stat-label">Streak</span>
                <span className="quick-stat-value">{entries.length > 0 ? Math.min(entries.length, 7) : 0} days</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-label">Total Logs</span>
                <span className="quick-stat-value">{entries.length}</span>
              </div>
            </div>
          </div>
          <p className="session-id">Session: {sessionId}</p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-container">
          <div
            className={`indicator ${activeTab}`}
          />

          <button
            className={`tab_label ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={`tab_label ${activeTab === "log" ? "active" : ""}`}
            onClick={() => setActiveTab("log")}
          >
            Log Entry
          </button>

          <button
            className={`tab_label ${activeTab === "course_evaluator" ? "active" : ""}`}
            onClick={() => setActiveTab("course_evaluator")}
          >
            Course Evaluator
          </button>
        </div>


        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats Cards Row */}
            <div className="stats-grid">
              <div className="stat-card stat-sleep">
                <div className="stat-label">Sleep</div>
                <div className="stat-value">{summary?.avg_sleep_hours || "0"}</div>
                <div className="stat-unit">hours avg</div>
              </div>

              <div className="stat-card stat-stress">
                <div className="stat-label">Stress</div>
                <div className="stat-value">{summary?.avg_stress_level || "0"}</div>
                <div className="stat-unit">out of 10</div>
              </div>

              <div className="stat-card stat-study">
                <div className="stat-label">Study</div>
                <div className="stat-value">{summary?.avg_study_hours || "0"}</div>
                <div className="stat-unit">hours avg</div>
              </div>
            </div>

            {/* Charts Row - Horizontal */}
            {entries.length === 0 ? (
              <div className="card muted">No data yet. Start logging your wellness data!</div>
            ) : (
              <div className="charts-row">
                {/* Sleep Chart */}
                <div className="chart-card">
                  <h3>Sleep Trends</h3>
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
                            style={{ height: `${(entry.sleep_hours / 24) * 150}px` }}
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
                </div>

                {/* Stress Chart */}
                <div className="chart-card">
                  <h3>Stress Trends</h3>
                  <div className="chart-wrapper">
                    <div className="simple-chart">
                      {last7Entries.map((entry, i) => (
                        <div
                          key={i}
                          className="chart-bar-container"
                          onMouseEnter={() => setHoveredBar({ type: 'stress', index: i, entry })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className="chart-bar chart-bar-stress"
                            style={{ height: `${(entry.stress_level / 10) * 150}px` }}
                          ></div>
                          <div className="chart-day">{new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        </div>
                      ))}
                    </div>
                    {hoveredBar?.type === 'stress' && (
                      <div className="chart-tooltip">
                        <div className="tooltip-date">{new Date(hoveredBar.entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="tooltip-value">Level {hoveredBar.entry.stress_level}/10</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Study Chart */}
                <div className="chart-card">
                  <h3>Study Trends</h3>
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
                            style={{ height: `${(entry.study_hours / 24) * 150}px` }}
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
                </div>
              </div>
            )}

            {/* Bottom Grid - Insights & Course Overview */}
            <div className="dashboard-grid">
              <div className="dashboard-left">
                {insights.length > 0 && (
                  <div className="card">
                    <h2><Lightbulb /> Insights</h2>
                    <div className="insights-list">
                      {insights.map((insight, index) => (
                        <div key={index} className="insight-item">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="dashboard-right">
                <div className="card">
                  <h2> <Book /> Course Overview</h2>
                  <div className="muted" style={{ padding: '2rem 1rem' }}>
                    Add courses in the Course Evaluator tab to see your progress here
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "log" && (
          <WellnessLogger
            sleepHours={sleepHours}
            setSleepHours={setSleepHours}
            stressLevel={stressLevel}
            setStressLevel={setStressLevel}
            studyHours={studyHours}
            setStudyHours={setStudyHours}
            loading={loading}
            onSubmit={submitWellness}
            entries={entries}
          />
        )}

        {/* Course Evaluator Tab */}
        {activeTab === "course_evaluator" && (
          <div className="course-evaluator-page">
            <CoursePlanner />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;