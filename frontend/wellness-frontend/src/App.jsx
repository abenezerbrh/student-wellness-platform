import { useEffect, useState, useRef } from "react";
import "./App.css";
import WellnessLogger from "./components/WellnessLogger";
import ComingSoon from "./components/comingSoon";
import { Sun, SunMedium, MoonStar, Lightbulb, Book } from "lucide-react";
import { supabase } from "./supabaseClient";
import Login from "./components/login";
import { FaRegUser, FaLinkedin, FaGithub } from "react-icons/fa";
import { HiOutlineExternalLink } from "react-icons/hi";

// ========================================
// STREAK + TODAY CHECK
// ========================================

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

// ========================================
// APP
// ========================================

function App() {
  const [user, setUser] = useState(null);

  const [isGuest, setIsGuest] = useState(localStorage.getItem("guest") === "true");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hoveredBar, setHoveredBar] = useState(null);

  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [studyHours, setStudyHours] = useState("");

  const [loading, setLoading] = useState(false);

  // supabase entries (signed-in)
  const [entries, setEntries] = useState([]);

  // guest entries (local only)
  const [guestEntries, setGuestEntries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("guest_entries") || "[]");
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // ----------------------------------------
  // auth listener
  // ----------------------------------------
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

  // initial fetch user (if not guest)
  useEffect(() => {
    if (isGuest) return;

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
    })();
  }, [isGuest]);

  // fetch DB entries when user changes
  useEffect(() => {
    if (!user) return;
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // click outside popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // keep guest entries in localStorage
  useEffect(() => {
    localStorage.setItem("guest_entries", JSON.stringify(guestEntries));
  }, [guestEntries]);

  // ----------------------------------------
  // data helpers
  // ----------------------------------------
  const effectiveEntries = isGuest ? guestEntries : entries;

  const last7Entries = effectiveEntries
    .slice(0, 7)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const maxSleep = Math.max(...last7Entries.map((e) => Number(e.sleep_hours ?? 0)), 1);
  const maxStress = Math.max(...last7Entries.map((e) => Number(e.stress_level ?? 0)), 1);
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

  // ----------------------------------------
  // UI helpers
  // ----------------------------------------
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

  // ----------------------------------------
  // actions
  // ----------------------------------------
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

      // keep UI fresh
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

  // ----------------------------------------
  // gate
  // ----------------------------------------
  if (!user && !isGuest) return <Login />;

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || "Guest";
  const email = user?.email || "Not signed in";

  // ----------------------------------------
  // render
  // ----------------------------------------
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

                {/* keep your stress svg chart as-is */}

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
            maxStress={maxStress}
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