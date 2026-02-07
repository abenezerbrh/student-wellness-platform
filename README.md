# 🎓 Student Wellness & Academic Performance Platform

A full-stack web application designed to help students track wellness habits (sleep, stress, study time) and gain insights into how those habits relate to academic performance.

Built with **React (frontend)** and **FastAPI + PostgreSQL (backend)**, the platform emphasizes clean API design, data-driven insights, and thoughtful UX for student wellbeing.

---

## 🚀 Features

### 🧠 Wellness Tracking
- Log daily:
  - Sleep hours
  - Stress level
  - Study hours
- Anonymous session-based tracking (no accounts required)

### 📊 Analytics & Insights
- View historical wellness entries
- Automatically computed averages
- Rule-based wellness insights (sleep, stress, consistency, study–stress interactions)

### 🔄 Reset & Development Utilities
- Development-only endpoint to reset wellness data
- Safe frontend handling of empty datasets
- Designed for iteration and testing

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- JavaScript (ES6+)
- Fetch API
- Charting library (for wellness visualization)

### Backend
- FastAPI
- SQLAlchemy ORM
- PostgreSQL (or SQLite for local dev)
- Uvicorn

---
