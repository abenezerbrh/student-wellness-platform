import { useState } from "react";
import "./CoursePlanner.css";
import { Pencil, Trash2, Check } from "lucide-react";


export default function CoursePlanner() {
  const [course, setCourse] = useState({
    name: "",
    target_grade: "",
    assessments: [
      { name: "", weight: "", grade: "", isEditing: true }
    ]
  });

  const [results, setResults] = useState(null);

  /* ---------- Course-level input ---------- */
  const handleCourseChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  /* ---------- Assessment handlers ---------- */
  const handleAssessmentChange = (index, e) => {
    const updated = [...course.assessments];
    updated[index][e.target.name] = e.target.value;
    setCourse({ ...course, assessments: updated });
  };

  const finalizeAssessment = (index) => {
    const updated = [...course.assessments];
    updated[index].isEditing = false;

    const isLast = index === course.assessments.length - 1;

    setCourse({
      ...course,
      assessments: isLast
        ? [...updated, { name: "", weight: "", grade: "", isEditing: true }]
        : updated
    });
  };

  const editAssessment = (index) => {
    const updated = course.assessments.map((a, i) => ({
      ...a,
      isEditing: i === index
    }));
    setCourse({ ...course, assessments: updated });
  };

  const deleteAssessment = (index) => {
    setCourse({
      ...course,
      assessments: course.assessments.filter((_, i) => i !== index)
    });
  };

  /* ---------- Submit ---------- */
  const submitCourse = async () => {
    const payload = {
      courses: [
        {
          name: course.name,
          target_grade: Number(course.target_grade),
          assessments: course.assessments
            .filter(a => a.name && a.weight)
            .map(a => ({
              name: a.name,
              weight: Number(a.weight),
              grade: a.grade === "" ? null : Number(a.grade)
            }))
        }
      ]
    };

    const response = await fetch("http://127.0.0.1:8000/courses/rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setResults(data);
  };

  return (
    <div className="planner-container">
      <h2>Course Priority Planner</h2>

      <div className="course-info">
        <input
          name="name"
          placeholder="Course name"
          value={course.name}
          onChange={handleCourseChange}
        />

        <input
          name="target_grade"
          placeholder="Target grade (%)"
          value={course.target_grade}
          onChange={handleCourseChange}
        />
      </div>

      <h3>Assessments</h3>

      {course.assessments.map((a, i) => (
        <div key={i} className="assessment-item">
          {a.isEditing ? (
            <div className="assessment-row">
              <input
                name="name"
                placeholder="Assessment"
                value={a.name}
                onChange={(e) => handleAssessmentChange(i, e)}
              />
              <input
                name="weight"
                placeholder="Weight %"
                value={a.weight}
                onChange={(e) => handleAssessmentChange(i, e)}
              />
              <input
                name="grade"
                placeholder="Grade"
                value={a.grade}
                onChange={(e) => handleAssessmentChange(i, e)}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => finalizeAssessment(i)}
                aria-label="Save assessment"
                title="Save"
              >
                <Check />
              </button>
            </div>
          ) : (
            <div className="assessment-row muted">
              <div><strong>{a.name}</strong></div>
              <div>{a.weight}%</div>
              <div>{a.grade ?? "Not graded"}</div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => editAssessment(i)}
                aria-label="Edit assessment"
                title="Edit"
              >
                <Pencil />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => deleteAssessment(i)}
                aria-label="Delete assessment"
                title="Delete"
              >
                <Trash2 />
              </button>
            </div>
          )}
        </div>
      ))}

      <button onClick={submitCourse}>Evaluate Course</button>

      {results && (
        <div className="results-section">
          <h3>Result</h3>
          {results.map(r => (
            <div
              key={r.course}
              className={`results-card ${
                r.risk === "Critical" || r.risk === "Unrealistic"
                  ? "risk-high"
                  : r.risk === "Watch"
                  ? "risk-medium"
                  : "risk-low"
              }`}
            >
              <strong>{r.priority}. {r.course}</strong>
              <div className="results-detail">
                Risk: {r.risk}<br />
                Required Avg: {r.required_average}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
