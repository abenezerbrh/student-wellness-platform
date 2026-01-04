import { useState } from "react";
import "./CoursePlanner.css";
import { Pencil, Trash2, Check } from "lucide-react";

export default function CoursePlanner() {
    const createEmptyCourse = () => ({
        id: crypto.randomUUID(),
        name: "",
        target_grade: "",
        assessments: [
            { id: crypto.randomUUID(), name: "", weight: "", grade: "", isEditing: true }
        ]
    });

    const [courses, setCourses] = useState([createEmptyCourse()]);
    const [activeCourseId, setActiveCourseId] = useState(courses[0].id);
    const [results, setResults] = useState(null);

    const activeCourse = courses.find(c => c.id === activeCourseId);

    /* ---------- Helpers ---------- */
    const isAssessmentValid = (a) =>
        a.name.trim() !== "" &&
        a.weight !== "" &&
        !isNaN(a.weight) &&
        Number(a.weight) > 0;

    /* ---------- Course-level input ---------- */
    const handleCourseChange = (e) => {
        setCourses(prev =>
            prev.map(course =>
                course.id === activeCourseId
                    ? { ...course, [e.target.name]: e.target.value }
                    : course
            )
        );
    };

    /* ---------- Assessment handlers ---------- */
    const handleAssessmentChange = (index, e) => {
        setCourses(prev =>
            prev.map(course =>
                course.id === activeCourseId
                    ? {
                        ...course,
                        assessments: course.assessments.map((a, i) =>
                            i === index ? { ...a, [e.target.name]: e.target.value } : a
                        )
                    }
                    : course
            )
        );
    };

    const finalizeAssessment = (index) => {
        const assessment = activeCourse.assessments[index];
        if (!isAssessmentValid(assessment)) return;

        setCourses(prev =>
            prev.map(course =>
                course.id === activeCourseId
                    ? {
                        ...course,
                        assessments: [
                            ...course.assessments.map((a, i) =>
                                i === index ? { ...a, isEditing: false } : a
                            ),
                            ...(index === course.assessments.length - 1
                                ? [{
                                    id: crypto.randomUUID(),
                                    name: "",
                                    weight: "",
                                    grade: "",
                                    isEditing: true
                                }]
                                : [])
                        ]
                    }
                    : course
            )
        );
    };

    const editAssessment = (index) => {
        setCourses(prev =>
            prev.map(course =>
                course.id === activeCourseId
                    ? {
                        ...course,
                        assessments: course.assessments.map((a, i) => ({
                            ...a,
                            isEditing: i === index
                        }))
                    }
                    : course
            )
        );
    };

    const deleteAssessment = (index) => {
        setCourses(prev =>
            prev.map(course =>
                course.id === activeCourseId
                    ? {
                        ...course,
                        assessments: course.assessments.filter((_, i) => i !== index)
                    }
                    : course
            )
        );
    };

    /* ---------- Submit ---------- */
    const submitCourse = async () => {
        const payload = {
            courses: courses.map(course => ({
                name: course.name,
                target_grade: Number(course.target_grade),
                assessments: course.assessments
                    .filter(a => a.name && a.weight)
                    .map(a => ({
                        name: a.name,
                        weight: Number(a.weight),
                        grade: a.grade === "" ? null : Number(a.grade)
                    }))
            }))
        };

        const res = await fetch("http://127.0.0.1:8000/courses/rank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        setResults(await res.json());
    };

    /* ---------- Render ---------- */
    return (
        <div className="planner-container">
            <h2>Course Priority Planner</h2>

            {/* Course selector */}
            <label className="course-select-label">
                Select Course
                <select
                    value={activeCourseId}
                    onChange={(e) => setActiveCourseId(e.target.value)}
                    className="course-select"
                >
                    {courses.map(course => (
                        <option key={course.id} value={course.id}>
                            {course.name}
                        </option>
                    ))}
                </select>
            </label>

            <button
                className="add-course-btn"
                onClick={() => {
                    const current = courses.find(c => c.id === activeCourseId);

                    if (!current.name.trim()) {
                        alert("Please name the current course before adding another.");
                        return;
                    }

                    const newCourse = createEmptyCourse();
                    setCourses(prev => [...prev, newCourse]);
                    setActiveCourseId(newCourse.id);
                }}
            >
                + Add Course
            </button>


            {/* Course info */}
            <div className="course-info">
                <input
                    name="name"
                    placeholder="Course name"
                    value={activeCourse.name}
                    onChange={handleCourseChange}
                />
                <input
                    name="target_grade"
                    placeholder="Target grade (%)"
                    value={activeCourse.target_grade}
                    onChange={handleCourseChange}
                />
            </div>

            <h3>Assessments</h3>

            {/* Editing rows */}
            {activeCourse.assessments.map(
                (a, i) =>
                    a.isEditing && (
                        <div key={a.id} className="assessment-row">
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
                                className="icon-btn"
                                onClick={() => finalizeAssessment(i)}
                                disabled={!isAssessmentValid(a)}
                            >
                                <Check />
                            </button>
                        </div>
                    )
            )}

            {/* Saved assessments */}
            {activeCourse.assessments.some(a => !a.isEditing) && (
                <table className="assessment-table">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Weight</th>
                            <th>Grade</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeCourse.assessments
                            .map((a, i) => ({ a, i }))
                            .filter(({ a }) => !a.isEditing)
                            .map(({ a, i }) => (
                                <tr key={a.id}>
                                    <td>{a.name}</td>
                                    <td>{a.weight}%</td>
                                    <td>{a.grade === "" || a.grade == null ? "Not graded" : `${a.grade}%`}</td>
                                    <td>
                                        <button onClick={() => editAssessment(i)}><Pencil /></button>
                                        <button onClick={() => deleteAssessment(i)}><Trash2 /></button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            )}

            <button onClick={submitCourse}>Evaluate Courses</button>

            {results && (
                <div className="results-section">
                    <h3>Result</h3>
                    {results.map(r => (
                        <div key={r.course}>
                            <strong>{r.priority}. {r.course}</strong>
                            <div>
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
