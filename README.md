# 🎓 Student Wellness Platform

A full-stack web application that helps students track daily wellness habits and explore how those habits relate to academic performance.

The platform focuses on a clean user experience, secure authentication, and clear data insights.

---

## 🌟 Project Overview

The Student Wellness Platform allows users to log key wellness metrics and view trends over time through an interactive dashboard.

Users can explore the app as a guest or sign in to save and manage their personal wellness data. The project is designed to reflect real-world full-stack development practices and production-ready tooling.

---

## ✨ Features

### 🧠 Wellness Logging
- Log daily:
  - Sleep hours
  - Stress level (1–10)
  - Study hours
- One log per day per user

### 📊 Dashboard & Insights
- Daily and average wellness metrics
- Visual trend charts
- Streak tracking
- Total log count
- Simple rule-based feedback to support healthy habits

### 🔐 Authentication
- Email and password sign-in
- OAuth sign-in options
- Secure session handling
- Create accounts using Google or Email

### 🧪 Guest Mode
- Explore the platform without creating an account
- Guest data is stored locally and does not persist across sessions
- Designed to reduce friction for first-time users

---

## 🏗️ Architecture

The application follows a modern frontend-driven architecture with managed backend services.

Key responsibilities include:
- Authentication and session management
- Secure storage of user wellness data
- Policy-based data access control
- Scalable PostgreSQL data storage

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- JavaScript (ES6+)
- Custom CSS
- Charting library for data visualization

### Services
- Supabase
  - Authentication and OAuth
  - PostgreSQL database
  - Row Level Security (RLS)

### Deployment
- Frontend hosted on Vercel
- Managed backend services via 

---

## 🔒 Security

- User data is protected using policy-based access control
- Each user can only access their own wellness entries
- Guest users do not interact with persistent storage

---
