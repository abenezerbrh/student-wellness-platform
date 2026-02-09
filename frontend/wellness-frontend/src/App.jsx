import { useEffect, useState, useRef } from "react";
import "./App.css";
import WellnessLogger from "./components/WellnessLogger";
import ComingSoon from "./components/comingSoon";
import { Sun, SunMedium, MoonStar, Lightbulb, Book } from "lucide-react";
import { supabase } from "./supabaseClient";
import Login from "./components/login";
import { FaRegUser, FaLinkedin, FaGithub } from "react-icons/fa";
import { HiOutlineExternalLink } from "react-icons/hi";



const calculateStreak = (entries) => {
  if (!entries?.length) return 0;

  const uniqueDates = new Set();
  for (const entry of entries) {
    const d = new Date(entry.created_at);
    const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    uniqueDates.add(normalized.getTime());
  }

  const sorted = Array.from(uniqueDates).sort((a, b) => b - a);
  if (!sorted.length) return 0;

  let streak = 1;
  let current = new Date(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i]);
    const expected = new Date(current);
    expected.setDate(expected.getDate() - 1);

    if (
      prev.getFullYear() === expected.getFullYear() &&
      prev.getMonth() === expected.getMonth() &&
      prev.getDate() === expected.getDate()
    ) {
      streak++;
      current = prev;
    } else {
      break;
    }
  }

  return streak;
};

const checkLoggedToday = (entries) => {
  if (!entries?.length) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return entries.some((e) => {
    const d = new Date(e.created_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
};

function App() {
  const [user, setUser] = useState(null);

  const [isGuest, setIsGuest] = useState(localStorage.getItem("guest") === "true");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hoveredBar, setHoveredBar] = useState(null);

  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [studyHours, setStudyHours] = useState("");

  const [loading, setLoading] = useState(false);

  const [entries, setEntries] = useState([]);

  const [guestEntries, setGuestEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("guest_entries") || "[]");
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        localStorage.removeItem("guest");
        setIsGuest(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isGuest) return;

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    })();
  }, [isGuest]);

  useEffect(() => {
    if (!user) return;
    fetchEntries();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem("guest_entries", JSON.stringify(guestEntries));
  }, [guestEntries]);

  const effectiveEntries = isGuest ? guestEntries : entries;

  const last7Entries = effectiveEntries
    .slice(0, 7)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const maxSleep = Math.max(...last7Entries.map((e) => Number(e.sleep_hours ?? 0)), 1);
  const maxStudy = Math.max(...last7Entries.map((e) => Number(e.study_hours ?? 0)), 1);

  const hasLoggedToday = () => checkLoggedToday(effectiveEntries);

  const summaryFromEntries = (() => {
    if (!effectiveEntries.length) {
      return { avg_sleep_hours: 0, avg_stress_level: 0, avg_study_hours: 0 };
    }

    const total = effectiveEntries.reduce(
      (acc, e) => {
        acc.sleep += Number(e.sleep_hours ?? 0);
        acc.stress += Number(e.stress_level ?? 0);
        acc.study += Number(e.study_hours ?? 0);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return <>Good morning <Sun className="greeting-icon" /></>;
    if (hour < 18) return <>Good afternoon <SunMedium className="greeting-icon" /></>;
    return <>Good evening <MoonStar className="greeting-icon" /></>;
  };

  const getMotivation = () => {
    if (!effectiveEntries.length) return <>Let&apos;s start tracking your wellness journey</>;

    const recent = effectiveEntries.slice(0, 3);
    const avgSleep = recent.reduce((s, e) => s + Number(e.sleep_hours ?? 0), 0) / recent.length;
    const avgStress = recent.reduce((s, e) => s + Number(e.stress_level ?? 0), 0) / recent.length;

    if (avgSleep >= 7 && avgStress <= 5) return <>You&apos;re doing great! Keep it up <Sun size={18} /></>;
    if (avgSleep < 6) return <>Your sleep could use some attention <MoonStar size={18} /></>;
    if (avgStress >= 8) return <>High stress detected, take care of yourself <Lightbulb size={18} /></>;
    if (avgSleep >= 7) return <>Great sleep habits! <MoonStar size={18} /></>;
    return <>Stay consistent with your wellness goals <Book size={18} /></>;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("guest");
    localStorage.removeItem("guest_entries");
    window.location.reload();
  };

  const fetchEntries = async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      setEntries([]);
      return;
    }

    const { data, error } = await supabase
      .from("wellness_logs")
      .select("id, created_at, sleep_hours, stress_level, study_hours, mood")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Fetch error:", error);
      return;
    }

    setEntries(data ?? []);
  };

  const saveWellnessLog = async (payload) => {
    if (hasLoggedToday()) {
      alert("You have already logged today. Come back tomorrow!");
      return;
    }

    try {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const u = auth?.user;

      if (!u) {
        alert("You must be signed in to save logs");
        return;
      }

      const { data: inserted, error } = await supabase
        .from("wellness_logs")
        .insert({
          user_id: u.id,
          mood: payload.mood,
          sleep_hours: payload.sleep_hours,
          stress_level: payload.stress_level,
          study_hours: payload.study_hours,
        })
        .select("id, created_at, sleep_hours, stress_level, study_hours, mood")
        .single();

      if (error) throw error;

      setEntries((prev) => [inserted, ...prev]);

      setSleepHours("");
      setStudyHours("");
      setStressLevel(5);

      alert("Log saved");
    } catch (err) {
      console.error(err);
      alert(`Error saving log: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveGuestLog = async (payload) => {
    if (hasLoggedToday()) {
      alert("You have already logged today. Come back tomorrow!");
      return;
    }

    const newEntry = {
      id: `guest-${crypto?.randomUUID?.() ?? Date.now()}`,
      created_at: new Date().toISOString(),
      mood: payload.mood,
      sleep_hours: payload.sleep_hours,
      stress_level: payload.stress_level,
      study_hours: payload.study_hours,
    };

    setGuestEntries((prev) => [newEntry, ...prev]);

    setSleepHours("");
    setStudyHours("");
    setStressLevel(5);

    alert("Saved locally (guest)");
  };

  if (!user && !isGuest) return <Login />;

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "Guest";
  const email = user?.email || "Not signed in";

  return (
    <div className="app">
      <div className="content">
        <div className="header-section">
          <div className="header-content">
            <div className="header-text">
              <h1 className="greeting">{getGreeting()}</h1>
              <p className="header-subtitle">{getMotivation()}</p>
            </div>

            <div className="header-stats">
              <div className="quick-stat">
                <span className="quick-stat-label">Streak</span>
                <span className="quick-stat-value">{calculateStreak(effectiveEntries)} days</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-label">Total Logs</span>
                <span className="quick-stat-value">{effectiveEntries.length}</span>
              </div>
            </div>

            <div className="account-area">
              <div className="account-text">
                <span className="welcome-label">Welcome back</span>
                <span className="welcome-identity">{isGuest ? "Guest" : name}</span>
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
          <div className="tab-container">
            <div className={`indicator ${activeTab}`} />

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

        {activeTab === "dashboard" && (
          <div>
            <div className="stats-grid">
              <div className="stat-card stat-sleep">
                <div className="stat-label">Sleep</div>
                <div className="stat-value">{summaryFromEntries.avg_sleep_hours}</div>
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

            {effectiveEntries.length === 0 ? (
              <div className="card muted">No data yet. Start logging your wellness data!</div>
            ) : (
              <div className="charts-row">
                <div className="chart-card">
                  <h3>Sleep Trends</h3>
                  <div className="chart-wrapper">
                    <div className="simple-chart">
                      {last7Entries.map((entry, i) => (
                        <div
                          key={i}
                          className="chart-bar-container"
                          onMouseEnter={() => setHoveredBar({ type: "sleep", index: i, entry })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className="chart-bar chart-bar-sleep"
                            style={{ height: `${Math.max(10, (Number(entry.sleep_hours ?? 0) / maxSleep) * 150)}px` }}
                          />
                          <div className="chart-day">
                            {new Date(entry.created_at).toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hoveredBar?.type === "sleep" && (
                      <div className="chart-tooltip">
                        <div className="tooltip-date">
                          {new Date(hoveredBar.entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <div className="tooltip-value">{hoveredBar.entry.sleep_hours} hours</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stress Chart */}
                <div className="chart-card">
                  <div className="chart-wrapper">
                  <svg
                    className="line-chart"
                    viewBox="0 0 700 260"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Grid lines */}
                    {[20, 60, 100, 140, 180].map((y) => (
                      <line
                        key={y}
                        x1="50"
                        y1={y}
                        x2="650"
                        y2={y}
                        stroke="#333"
                        strokeWidth="1"
                      />
                    ))}


                    <text x="30" y="25" fill="#666" fontSize="12">10</text>
                    <text x="35" y="65" fill="#666" fontSize="12">8</text>
                    <text x="35" y="105" fill="#666" fontSize="12">6</text>
                    <text x="35" y="145" fill="#666" fontSize="12">4</text>
                    <text x="35" y="185" fill="#666" fontSize="12">0</text>

                    <path
                      d={(() => {
                        if (last7Entries.length === 0) return "";

                        const spacing =
                          last7Entries.length > 1
                            ? 600 / (last7Entries.length - 1)
                            : 0;

                        const points = last7Entries.map((entry, i) => ({
                          x: 50 + i * spacing,
                          y: 180 - (entry.stress_level / 10) * 160,
                        }));

                        let path = `M ${points[0].x} ${points[0].y}`;

                        for (let i = 0; i < points.length - 1; i++) {
                          const current = points[i];
                          const next = points[i + 1];
                          const cx = (current.x + next.x) / 2;

                          path += ` C ${cx} ${current.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
                        }

                        return path;
                      })()}
                      fill="none"
                      stroke="#f87171"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {last7Entries.map((entry, i) => {
                      const spacing =
                        last7Entries.length > 1
                          ? 600 / (last7Entries.length - 1)
                          : 0;

                      const x = 50 + i * spacing;
                      const y = 180 - (entry.stress_level / 10) * 160;

                      return (
                        <g key={i}>
                          
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill="#f87171"
                            stroke="#1a1a1a"
                            strokeWidth="2"
                            className="chart-point"
                            onMouseEnter={() =>
                              setHoveredBar({ type: "stress", index: i, entry })
                            }
                            onMouseLeave={() => setHoveredBar(null)}
                            style={{ cursor: "pointer" }}
                          />

                          <text
                            x={x}
                            y="195"
                            fill="#666"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            {new Date(entry.created_at).toLocaleDateString("en-US", {
                              weekday: "short",
                            })}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {hoveredBar?.type === 'stress' && (
                    <div
                      className="chart-tooltip">
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

                </div>

                <div className="chart-card">
                  <h3>Study Trends</h3>
                  <div className="chart-wrapper">
                    <div className="simple-chart">
                      {last7Entries.map((entry, i) => (
                        <div
                          key={i}
                          className="chart-bar-container"
                          onMouseEnter={() => setHoveredBar({ type: "study", index: i, entry })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <div
                            className="chart-bar chart-bar-study"
                            style={{ height: `${Math.max(10, (Number(entry.study_hours ?? 0) / maxStudy) * 150)}px` }}
                          />
                          <div className="chart-day">
                            {new Date(entry.created_at).toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {hoveredBar?.type === "study" && (
                      <div className="chart-tooltip">
                        <div className="tooltip-date">
                          {new Date(hoveredBar.entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <div className="tooltip-value">{hoveredBar.entry.study_hours} hours</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
            onSubmit={isGuest ? saveGuestLog : saveWellnessLog}
            last7Entries={last7Entries}
            hasLoggedToday={hasLoggedToday()}
            maxSleep={maxSleep}
            maxStudy={maxStudy}
          />
        )}

        {activeTab === "course_evaluator" && (
          <div className="course-evaluator-page">
            <ComingSoon />
          </div>
        )}

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <p className="footer-text">
              Built by <span className="footer-name">Abenezer Balcha</span>
            </p>
            <div className="footer-links">
              <a
                href="https://www.linkedin.com/in/abenezerbalcha/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={18} />
              </a>
              <a
                href="https://github.com/abenezerbrh/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
                aria-label="GitHub"
              >
                <FaGithub size={18} />
              </a>
              <a
                href="http://aben-balcha.me"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link footer-link-portfolio"
                aria-label="Portfolio"
              >
                <HiOutlineExternalLink size={18} />
                <span>Portfolio</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;