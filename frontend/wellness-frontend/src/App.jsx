import { useEffect, useState, useRef } from "react";
import "./App.css";
import CoursePlanner from "./components/CoursePlanner";
import WellnessLogger from "./components/WellnessLogger";
import { Sun, SunMedium, MoonStar, Lightbulb, Book } from "lucide-react";
import ComingSoon from "./components/comingSoon";
const API_BASE = "http://127.0.0.1:8000";
import { supabase } from "./supabaseClient";
import Login from "./components/login";
import { FaRegUser } from "react-icons/fa";
import { IoMdCode } from "react-icons/io";

// ========================================
// IMPROVED STREAK CALCULATION FUNCTIONS
// ========================================

/**
 * Calculate consecutive day streak
 */
const calculateStreak = (entries) => {
  if (!entries || entries.length === 0) return 0;

  // Get unique dates and normalize them
  const uniqueDates = new Set();
  entries.forEach(entry => {
    const date = new Date(entry.created_at);
    // Create date string in YYYY-MM-DD format to avoid timezone issues
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    uniqueDates.add(normalized.getTime());
  });

  // Sort dates descending (most recent first)
  const sortedDates = Array.from(uniqueDates)
    .sort((a, b) => b - a)
    .map(timestamp => new Date(timestamp));

  if (sortedDates.length === 0) return 0;

  // Start from the most recent log date (not necessarily today)
  let streak = 1; // Count the first date
  let currentDate = new Date(sortedDates[0]);

  // Check backwards for consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i]);
    
    // Calculate expected previous day
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - 1);

    // Check if this entry is exactly one day before
    if (
      prevDate.getFullYear() === expectedDate.getFullYear() &&
      prevDate.getMonth() === expectedDate.getMonth() &&
      prevDate.getDate() === expectedDate.getDate()
    ) {
      streak++;
      currentDate = prevDate;
    } else {
      // Gap found - streak is broken
      break;
    }
  }

  return streak;
};

/**
 * Check if logged today
 */
const checkLoggedToday = (entries) => {
  if (!entries || entries.length === 0) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entries.some(entry => {
    const entryDate = new Date(entry.created_at);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
};

// ========================================
// MAIN APP COMPONENT
// ========================================

function App() {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(
    localStorage.getItem("guest") === "true"
  );
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

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);


  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);

        if (session) {
          localStorage.removeItem("guest");
          setIsGuest(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);



  useEffect(() => {
    if (isGuest) return;

    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
      } catch (err) {
        // No session is a valid state
        setUser(null);
      }
    };

    fetchUser();
  }, [isGuest]);


  const DEMO_ENTRIES = [
    {
      id: "demo-1",
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      sleep_hours: 7.5,
      stress_level: 4,
      study_hours: 3,
      mood: "good",
    },
    {
      id: "demo-2",
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      sleep_hours: 6,
      stress_level: 6,
      study_hours: 4,
      mood: "okay",
    },
    {
      id: "demo-3",
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      sleep_hours: 8,
      stress_level: 3,
      study_hours: 2,
      mood: "great",
    },
    {
      id: "demo-4",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      sleep_hours: 5.5,
      stress_level: 7,
      study_hours: 5,
      mood: "stressed",
    },
    {
      id: "demo-5",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      sleep_hours: 7,
      stress_level: 5,
      study_hours: 4,
      mood: "good",
    },
  ];

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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) console.error(error);
  };


  // Get motivational message based on recent data
  const getMotivation = () => {
    if (effectiveEntries.length === 0)
      return (
        <>
          Let's start tracking your wellness journey
        </>
      );

    const recentEntries = effectiveEntries.slice(-3);
    const avgSleep =
      recentEntries.reduce((sum, e) => sum + e.sleep_hours, 0) /
      recentEntries.length;
    const avgStress =
      recentEntries.reduce((sum, e) => sum + e.stress_level, 0) /
      recentEntries.length;

    if (avgSleep >= 7 && avgStress <= 5) {
      return (
        <>
          You're doing great! Keep it up <Sun size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </>
      );
    }
    
    if (avgSleep < 6) {
      return (
        <>
          Your sleep could use some attention <MoonStar size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </>
      );
    }
    
    if (avgStress >= 8) {
      return (
        <>
          High stress detected - take care of yourself <Lightbulb size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </>
      );
    }
    
    if (avgSleep >= 7) {
      return (
        <>
          Great sleep habits! <MoonStar size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </>
      );
    }

    return (
      <>
        Stay consistent with your wellness goals <Book size={18} style={{ display: 'inline', verticalAlign: 'middle' }} />
      </>
    );
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("guest");
    localStorage.removeItem("session_id");
    window.location.reload();
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
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const fetchInsights = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/wellness/insights/${sessionId}`);

      if (!res.ok) {
        // No data is a VALID state after reset
        setInsights([]);
        return;
      }

      const data = await res.json();
      setInsights(data.insights ?? []);
    } catch (err) {
      console.error("Failed to fetch insights", err);
      setInsights([]);
    }
  };


  const fetchEntries = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        console.log("No user found");
        setEntries([]);
        return;
      }

      const { data, error } = await supabase
        .from("wellness_logs")
        .select("id, created_at, sleep_hours, stress_level, study_hours, mood")
        .eq("user_id", authData.user.id) // Filter by current user's ID
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      setEntries(data ?? []);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    }
  };

  const effectiveEntries = isGuest
    ? [...DEMO_ENTRIES, ...entries]
    : entries;


  const last7Entries = effectiveEntries
    .slice(0, 7)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));


  const hasLoggedToday = () => {
    return checkLoggedToday(entries);
  };

  const submitWellness = async (payload) => {
    // Check if already logged today
    if (hasLoggedToday()) {
      alert('You have already logged your wellness data today. Come back tomorrow!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/wellness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: Number(sessionId),
          sleep_hours: payload.sleep_hours,
          stress_level: payload.stress_level,
          study_hours: payload.study_hours,
          mood: payload.mood,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API Error:", error);
        return;
      }

      await fetchInsights();
      await fetchEntries();

      setSleepHours("");
      setStudyHours("");
      setStressLevel(5);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return <p className="app">Creating session...</p>;
  }

  if (!user && !isGuest) {
    return <Login />;
  }

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Guest";

  const email = user?.email || "Not signed in";


  async function saveWellnessLog(data) {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      console.log("Current user:", user); // Debug log
      console.log("User ID:", user?.id); // Debug log

      if (!user) {
        alert("You must be signed in to save logs");
        return;
      }

      const { data: inserted, error } = await supabase
        .from("wellness_logs")
        .insert({
          user_id: user.id,
          mood: data.mood,
          sleep_hours: data.sleep_hours,
          stress_level: data.stress_level,
          study_hours: data.study_hours,
        })
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      console.log("Inserted log:", inserted); // Debug log

      setEntries((prev) => [inserted, ...prev]);

      // optional reset after save
      setSleepHours("");
      setStudyHours("");
      setStressLevel(5);

      alert("Log saved");
    } catch (err) {
      console.error("Save wellness log error:", err);
      alert(`Error saving log: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const summaryFromEntries = (() => {
    if (effectiveEntries.length === 0) {
      return {
        avg_sleep_hours: 0,
        avg_stress_level: 0,
        avg_study_hours: 0,
      };
    }

    const total = effectiveEntries.reduce(
      (acc, e) => {
        acc.sleep += e.sleep_hours ?? 0;
        acc.stress += e.stress_level ?? 0;
        acc.study += e.study_hours ?? 0;
        return acc;
      },
      { sleep: 0, stress: 0, study: 0 }
    );

    const count = effectiveEntries.length;

    return {
      avg_sleep_hours: (total.sleep / count).toFixed(1),
      avg_stress_level: (total.stress / count).toFixed(1),
      avg_study_hours: (total.study / count).toFixed(1),
    };
  })();

  const maxSleep = Math.max(...last7Entries.map(e => e.sleep_hours), 1);
  const maxStress = Math.max(...last7Entries.map(e => e.stress_level), 1);
  const maxStudy = Math.max(...last7Entries.map(e => e.study_hours), 1);



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
                <span className="quick-stat-value">
                  {calculateStreak(effectiveEntries)} days
                </span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-label">Total Logs</span>
                <span className="quick-stat-value">{effectiveEntries.length}</span>
              </div>
            </div>
            <div className="account-area">
              <div className="account-text">
                <span className="welcome-label">Welcome back</span>
                <span className="welcome-identity">
                  {isGuest ? "Guest" : name}
                </span>
              </div>

              <div className="account-wrapper" ref={ref}>
                <button
                  className="account-button"
                  onClick={() => setOpen((prev) => !prev)}
                  aria-label="Account menu"
                >
                  <FaRegUser className="account-avatar" />
                </button>

                {open && (
                  <div className="account-popover">
                    <div className="popover-header">
                      <p className="account-name">
                        {name}
                        {isGuest && <span className="account-badge guest">Guest</span>}
                      </p>
                      <p className="account-email">{email}</p>
                    </div>
                    <div className="popover-actions">
                      <a
                        href="http://aben-balcha.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="developer-btn"
                      >
                        <IoMdCode size={16} />
                        <span>Developer</span>
                      </a>

                      <button onClick={handleLogout} className="logout-btn">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Sign out</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>


          </div>





        </div>

        <div className="tab-row">
          {/* Tab Navigation */}
          <div className="tab-container">
            <div
              className={`indicator ${activeTab}`}
            />

            <button
              className={`tab_label dashboard ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={`tab_label log ${activeTab === "log" ? "active" : ""}`}
              onClick={() => setActiveTab("log")}
            >
              Log Entry
            </button>

            <button
              className={`tab_label course ${activeTab === "course_evaluator" ? "active" : ""}`}
              onClick={() => setActiveTab("course_evaluator")}
            >
              Course Evaluator
            </button>
          </div>


        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            {/* Stats Cards Row */}
            <div className="stats-grid">
              <div className="stat-card stat-sleep">
                <div className="stat-label">Sleep</div>
                <div className="stat-value">{summaryFromEntries.avg_sleep_hours}
                </div>
                <div className="stat-unit">hours avg</div>
              </div>

              <div className="stat-card stat-stress">
                <div className="stat-label">Stress</div>
                <div className="stat-value">{summaryFromEntries.avg_stress_level || "0"}</div>
                <div className="stat-unit">out of 10</div>
              </div>

              <div className="stat-card stat-study">
                <div className="stat-label">Study</div>
                <div className="stat-value">{summaryFromEntries.avg_study_hours || "0"}</div>
                <div className="stat-unit">hours avg</div>
              </div>
            </div>

            {/* Charts Row - Horizontal */}
            {effectiveEntries.length === 0 ? (
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
                </div>

                {/* Stress Chart */}
                <div className="chart-card">
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
                        left: `${50 + (hoveredBar.index * (600 / (last7Entries.length - 1)))}px`
                      }}
                    >
                      <div className="tooltip-date">
                        {new Date(hoveredBar.entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="tooltip-value">
                        Level {hoveredBar.entry.stress_level}/10
                      </div>
                    </div>
                  )}
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
                </div>
              </div>
            )}

            {/* Bottom Grid - Insights & Course Overview */}
            {/* <div className="dashboard-grid">
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
            </div> */}
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
            onSubmit={isGuest ? submitWellness : saveWellnessLog}
            last7Entries={last7Entries}
            hasLoggedToday={hasLoggedToday()}
            maxSleep={maxSleep}
            maxStress={maxStress}
            maxStudy={maxStudy}
          />

        )}

        {/* Course Evaluator Tab */}
        {activeTab === "course_evaluator" && (
          <div className="course-evaluator-page">
            <ComingSoon />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;