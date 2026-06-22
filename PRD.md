# MoodBloom - Product Requirements Document (PRD)

## Overview
MoodBloom is a wellness-tracker web application built for university students to manage their physical and mental health. 
It features an **Adaptive Aura** design system—a permanently light, high-fidelity interface that automatically synchronizes its accent colors with the user's emotional state.

## Target Audience
University students in Indonesia managing academic stress and health.

## Core Features
1. **Dashboard (The Daily 5)**: Track daily water intake, step count, meditation time, completed tasks, and logged prayers.
2. **Jadwal (Schedule)**: Manage class schedules and academic tasks.
3. **Local Insight Engine**: A privacy-focused, offline-capable heuristic engine that generates contextual wellness summaries on the Home, Water, and Mood tabs. It analyzes cross-metric trends (e.g., mood vs. sleep, hydration vs. heat) to provide actionable nudges without external API calls for primary insights.
4. **Hydration System**: Production-grade water tracker with:
    - **Detailed Session Logging**: Stores individual timestamps, amounts, and vessel types.
    - **Dynamic Heat Scaling**: Automatically increases hydration goals based on local real-time temperature data.
    - **Interactive Liquid UI**: Uses SVG/Motion wave animations to visually represent water levels.
    - **Session Management**: Full history log with deletion capabilities for data accuracy.
5. **Zen Oasis 2.0 (Meditation)**: An immersive, distraction-free meditation environment featuring:
    - **Liquid Breathing Guide**: A morphing SVG engine for 4-7-8 breathing techniques.
    - **Cinematic Atmosphere**: Moving starfields, aura orbs, and dynamic soundscape icons.
    - **Adaptive Haptics**: Tactile feedback synchronized with inhalation and exhalation.
6. **Oasis Sensory Engine**: A full-fidelity local audio system replacing external placeholders. Includes high-quality lo-fi focus tracks, ambient nature sounds, and tactile auditory rewards (Achievement/Success sounds) for all logging actions.
7. **Insights (Stats)**: Visual representation of past data and progress over 7 days.
8. **Gamification**: Streak counts and achievements (e.g., 'Tetesan Pertama', 'Master Fokus').
9. **Authentication & Cloud Sync**: Firebase Auth and Firestore for real-time multi-device sync.

## Technical Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Zustand (sliced architecture: `useAppStore`, `useSettingsStore`, `useHabitsStore`), Lucide React (icons), Motion (animations).
- **Backend/API**: Express (Node.js) handling Gemini API integration.
- **Database/Auth**: Firebase (Firestore, Auth).

## Update Protocol
- This PRD must be updated whenever new major features are introduced or the core architecture changes.
- All structural changes, bug fixes, and feature updates must be logged in `PROJECT_TRACKING.md` to maintain the AI's memory.