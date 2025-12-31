import { useEffect, useState } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [sessionId, setSessionId] = useState(null);

  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [studyHours, setStudyHours] = useState("");

  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);

  const [loading, setLoading] = useState(false);

  const [entries, setEntries] = useState([]);


  // Create or reuse anonymous session
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

    // Sort oldest → newest for charts
    const sorted = data.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    setEntries(sorted);
  };


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

    setSleepHours("");
    setStudyHours("");

    fetchEntries();

    setLoading(false);
  };

  if (!sessionId) {
    return <p className="app">Creating session...</p>;
  }

  return (
  <div className="app">
    <h1>Student Wellness Tracker</h1>
    <p className="session">Session ID: {sessionId}</p>

    <div className="layout">
      {/* LEFT COLUMN */}
      <div className="left">
        {/* Wellness Form */}
        <section>
          <div className="card">
            <h2>Log Today</h2>

            <form onSubmit={submitWellness}>
              <label>
                Sleep Hours
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  required
                />
              </label>

              <label>
                Stress Level: {stressLevel}
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressLevel}
                  onChange={(e) => setStressLevel(e.target.value)}
                />
              </label>

              <label>
                Study Hours
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  required
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Submit Wellness Entry"}
              </button>
            </form>
          </div>
        </section>

        {/* Summary */}
        {summary && (
          <section>
            <div className="card">
              <h2>Summary</h2>
              <ul>
                <li>Entries: {summary.entries}</li>
                <li>Avg Sleep: {summary.avg_sleep_hours}</li>
                <li>Avg Stress: {summary.avg_stress_level}</li>
                <li>Avg Study: {summary.avg_study_hours}</li>
              </ul>
            </div>
          </section>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <section>
            <div className="card">
              <h2>Insights</h2>
              <ul>
                {insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>

      {/* RIGHT COLUMN */}
      <div className="right">
        <section>
          <h2>Trends</h2>

          {entries.length === 0 ? (
            <div className="card muted">No data yet</div>
          ) : (
            <>
              {/* Sleep Chart */}
              <div className="card">
                <h3>Sleep (hours)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={entries}>
                    <CartesianGrid stroke="#333" />
                    <XAxis
                      dataKey="created_at"
                      tickFormatter={(v) =>
                        new Date(v).toLocaleDateString()
                      }
                    />
                    <YAxis domain={[0, 24]} />
                    <Tooltip
                      labelFormatter={(v) =>
                        new Date(v).toLocaleString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="sleep_hours"
                      stroke="#4f8cff"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Study Chart */}
              <div className="card">
                <h3>Study (hours)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={entries}>
                    <CartesianGrid stroke="#333" />
                    <XAxis
                      dataKey="created_at"
                      tickFormatter={(v) =>
                        new Date(v).toLocaleDateString()
                      }
                    />
                    <YAxis domain={[0, 24]} />
                    <Tooltip
                      labelFormatter={(v) =>
                        new Date(v).toLocaleString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="study_hours"
                      stroke="#4caf50"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stress Chart */}
              <div className="card">
                <h3>Stress</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={entries}>
                    <CartesianGrid stroke="#333" />
                    <XAxis
                      dataKey="created_at"
                      tickFormatter={(v) =>
                        new Date(v).toLocaleDateString()
                      }
                    />
                    <YAxis domain={[1, 10]} />
                    <Tooltip
                      labelFormatter={(v) =>
                        new Date(v).toLocaleString()
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="stress_level"
                      stroke="#ff6b6b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  </div>
);

}

export default App;
