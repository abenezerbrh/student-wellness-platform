import React, { useState } from 'react';
import './courseEvaluator.css';

const CourseEvaluator = () => {
  const [courses, setCourses] = useState([
    {
      id: 1,
      name: 'Data Structures',
      code: 'CS104',
      status: 'behind',
      targetGrade: 85,
      currentGrade: 84.0,
      requiredAverage: 86.0,
      completion: 50,
      courseProgress: 50.0,
      assessments: [
        { id: 1, name: 'Midterm', weight: 30, grade: 90, status: 'completed' },
        { id: 2, name: 'Final', weight: 50, grade: null, status: 'pending' },
        { id: 3, name: 'Projects', weight: 20, grade: 95, status: 'completed' }
      ]
    },
    {
      id: 2,
      name: 'Calculus II',
      code: 'MATH202',
      status: 'behind',
      targetGrade: 80,
      currentGrade: 79.0,
      requiredAverage: 81.0,
      completion: 50,
      courseProgress: 50.0,
      assessments: [
        { id: 1, name: 'Midterm', weight: 30, grade: 76, status: 'completed' },
        { id: 2, name: 'Final', weight: 50, grade: null, status: 'pending' },
        { id: 3, name: 'Projects', weight: 20, grade: 95, status: 'completed' }
      ]
    },
    {
      id: 3,
      name: 'Web Development',
      code: 'CS408',
      status: 'behind',
      targetGrade: 90,
      currentGrade: 89.0,
      requiredAverage: 91.0,
      completion: 50,
      courseProgress: 50.0,
      assessments: [
        { id: 1, name: 'Midterm', weight: 30, grade: 85, status: 'completed' },
        { id: 2, name: 'Final', weight: 50, grade: null, status: 'pending' },
        { id: 3, name: 'Projects', weight: 20, grade: 95, status: 'completed' }
      ]
    }
  ]);

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");

  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState(null);

  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [newAssessmentWeight, setNewAssessmentWeight] = useState("");

  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [assessmentGrade, setAssessmentGrade] = useState("");


  const getStatusColor = (status) => {
    switch (status) {
      case 'ahead': return '#10b981';
      case 'ontrack': return '#3b82f6';
      case 'behind': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const addAssessment = (courseId) => {
    setCourses(courses.map(course => {
      if (course.id === courseId) {
        const newAssessment = {
          id: Date.now(),
          name: 'New Assessment',
          weight: 0,
          grade: null,
          status: 'pending'
        };
        return {
          ...course,
          assessments: [...course.assessments, newAssessment]
        };
      }
      return course;
    }));
  };
  const handleAddAssessment = () => {
    if (!newAssessmentName || !newAssessmentWeight) return;

    setCourses(prev =>
      prev.map(course => {
        if (course.id === activeCourseId) {
          return {
            ...course,
            assessments: [
              ...course.assessments,
              {
                id: Date.now(),
                name: newAssessmentName,
                weight: Number(newAssessmentWeight),
                grade: assessmentCompleted && assessmentGrade !== ""
                  ? Number(assessmentGrade)
                  : null,
                status: assessmentCompleted ? "completed" : "pending"
              }
            ]
          };
        }
        return course;
      })
    );

    setNewAssessmentName("");
    setNewAssessmentWeight("");
    setAssessmentCompleted(false);
    setAssessmentGrade("");
    setActiveCourseId(null);
    setShowAddAssessment(false);
  };



  const deleteAssessment = (courseId, assessmentId) => {
    setCourses(courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          assessments: course.assessments.filter(a => a.id !== assessmentId)
        };
      }
      return course;
    }));
  };

  const deleteCourse = (courseId) => {
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const updateAssessment = (courseId, assessmentId, field, value) => {
    setCourses(courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          assessments: course.assessments.map(assessment => {
            if (assessment.id === assessmentId) {
              return { ...assessment, [field]: value };
            }
            return assessment;
          })
        };
      }
      return course;
    }));
  };
  const handleAddCourse = () => {
    if (!newCourseName || !newCourseCode) return;

    const newCourse = {
      id: Date.now(),
      name: newCourseName,
      code: newCourseCode,
      status: "ontrack",
      targetGrade: 80,
      currentGrade: 0,
      requiredAverage: 0,
      completion: 0,
      courseProgress: 0,
      assessments: []
    };

    setCourses(prev => [...prev, newCourse]);

    setNewCourseName("");
    setNewCourseCode("");
    setShowAddCourse(false);
  };

  return (
    <div className="course-evaluator">
      <div className="evaluator-header">
        <div className="header-left">
          <svg className="header-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="header-title">Course Evaluator</span>
        </div>
        <button className="add-course-btn" onClick={() => setShowAddCourse(true)}>
          <span className="plus-icon">+</span>
          Add Course
        </button>
      </div>

      {showAddCourse && (
        <div className="add-course-modal">
          <div className="modal-content">
            <h3>Add Course</h3>

            <label htmlFor="courseName">Course Name</label>
            <input
              type="text"
              id="courseName"
              placeholder="Course Name"
              onChange={e => setNewCourseName(e.target.value)}
            />

            <label htmlFor="courseCode">Course Code</label>
            <input
              type="text"
              id="courseCode"
              placeholder="Course Code"
              onChange={e => setNewCourseCode(e.target.value)}
            />

            <label htmlFor="targetGrade">Target Grade %</label>
            <input
              type="text"
              placeholder="Target Grade "
              onChange={e => setNewCourseCode(e.target.value)}
            />

            <button onClick={handleAddCourse}>Add</button>
            <button onClick={() => setShowAddCourse(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showAddAssessment && (
        <div className="add-course-modal">
          <div className="modal-content">
            <h3>Add Assessment</h3>

            <label htmlFor="assessmentName">Assessment Name</label>
            <input
              id="assessmentName"
              type="text"
              placeholder="e.g. Midterm"
              value={newAssessmentName}
              onChange={e => setNewAssessmentName(e.target.value)}
            />

            <label htmlFor="assessmentWeight">Weight (%)</label>
            <input
              id="assessmentWeight"
              type="number"
              placeholder="e.g. 30"
              value={newAssessmentWeight}
              onChange={e => setNewAssessmentWeight(e.target.value)}
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={assessmentCompleted}
                onChange={e => setAssessmentCompleted(e.target.checked)}
              />
              Completed
            </label>

            {assessmentCompleted && (
              <div className="grade-row">
                <label htmlFor="assessmentGrade">
                  Grade /100
                </label>
                <input
                  id="assessmentGrade"
                  type="number"
                  placeholder="e.g. 78"
                  value={assessmentGrade}
                  onChange={e => setAssessmentGrade(e.target.value)}
                />
              </div>
            )}



            <button onClick={handleAddAssessment}>Add</button>
            <button onClick={() => setShowAddAssessment(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="courses-container">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <div className="course-title-section">
                <h3 className="course-name">{course.name}</h3>
                <span className="course-code">{course.code}</span>
                <div className="status-badge" style={{ backgroundColor: getStatusColor(course.status) }}>
                  <svg className="warning-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  Behind
                </div>
              </div>
              <button className="delete-course-btn" onClick={() => deleteCourse(course.id)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="course-metrics">
              <div className="metric">
                <div className="metric-label">Target Grade</div>
                <div className="metric-value">{course.targetGrade}%</div>
              </div>
              <div className="metric">
                <div className="metric-label">Current Grade</div>
                <div className="metric-value current-grade">{course.currentGrade}%</div>
                <div className="metric-subtext">based on completed work</div>
              </div>
              <div className="metric">
                <div className="metric-label">Required Average</div>
                <div className="metric-value required-average">{course.requiredAverage}%</div>
                <div className="metric-subtext">on remaining work</div>
              </div>
              <div className="metric">
                <div className="metric-label">Completion</div>
                <div className="metric-value">{course.completion}%</div>
                <div className="metric-subtext">{100 - course.completion}% remaining</div>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Course Progress</span>
                <span className="progress-percentage">{course.courseProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${course.courseProgress}%` }}></div>
              </div>
            </div>

            <div className="assessments-section">
              <div className="assessments-header">
                <span className="assessments-title">Assessments</span>
                <button
                  className="add-assessment-btn"
                  onClick={() => {
                    setActiveCourseId(course.id);
                    setShowAddAssessment(true);
                  }}
                >
                  <span className="plus-icon">+</span>
                  Add Assessment
                </button>
              </div>

              <div className="assessments-list">
                {course.assessments.map(assessment => (
                  <div key={assessment.id} className="assessment-item">
                    <div className="assessment-info">
                      <div className="assessment-name-section">
                        <span className="assessment-name">{assessment.name}</span>
                        <span className="assessment-weight">{assessment.weight}%</span>
                      </div>
                      <div className="assessment-grade-text">Grade: {assessment.grade || '--'}%</div>
                    </div>
                    <div className="assessment-actions">
                      {assessment.status === 'completed' ? (
                        <button className="status-btn completed">Completed</button>
                      ) : (
                        <button className="status-btn pending">Pending</button>
                      )}
                      <button className="action-btn edit-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button className="action-btn delete-btn" onClick={() => deleteAssessment(course.id, assessment.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseEvaluator;