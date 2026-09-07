# IronCore — Fitness Management Platform

> Move Better. Live Better.

IronCore is a modern full-stack fitness management platform designed to connect athletes, trainers, and administrators through a unified digital fitness experience.

The platform provides role-based authentication, personalized fitness dashboards, workout management, progress tracking, nutrition monitoring, membership management, trainer-client interactions, bookings, payments, and notifications.

---

## ✨ Overview

IronCore combines a premium fitness-focused frontend with a structured backend API and role-based access control.

The application is designed around three primary roles:

- 🏋️ **Athlete / User**
- 🧑‍🏫 **Trainer**
- 🛡️ **Administrator**

Each role receives a different experience and access level based on its responsibilities.

---

## 🚀 Key Features

### 🔐 Authentication & Security

- User registration and login
- JWT-based authentication
- Remember Me functionality
- Protected API routes
- Role-based authorization
- Session/token verification
- Active/inactive account validation
- Password change functionality
- Password reset flow
- Secure password hashing
- Automatic user identification through authentication middleware

### 🏋️ Athlete Dashboard

Athletes can access a personalized dashboard containing:

- Current weight
- Target weight
- Calories burned
- Daily steps
- Workout streak
- Overall fitness progress
- Today's workout
- Nutrition information
- Active membership
- Upcoming coaching sessions
- Notifications

### 💪 Workout Management

- View assigned workouts
- View workout plans
- Track workout assignments
- Mark workouts as completed
- Record workout completion time
- Generate workout-related notifications

### 📈 Progress Tracking

Users can track:

- Weight
- Calories burned
- Daily steps
- Strength score
- Progress notes
- Historical progress records

### 🥗 Nutrition Tracking

Nutrition features include:

- Daily calorie targets
- Consumed calories
- Protein tracking
- Carbohydrate tracking
- Fat tracking
- Nutrition logs
- Daily nutrition overview

### 💳 Membership Management

Users can:

- View their active membership
- View membership details
- Check membership expiry
- View billing cycle
- View membership pricing
- Review available membership tiers
- Manage membership-related information

### 📅 Trainer Booking System

Users can book coaching sessions including:

- 1-on-1 Personal Training
- Nutrition Consultation
- Form Assessment
- Custom Coaching

Booking functionality includes:

- Trainer selection
- Date and time selection
- Booking confirmation
- Booking cancellation
- Session status tracking
- Booking notifications

### 🧑‍🏫 Trainer Dashboard

Trainers can:

- View assigned clients
- View client profiles
- Monitor client memberships
- Review latest workouts
- View upcoming sessions
- Track completed sessions
- Monitor active clients
- Add client progress notes
- Flag client progress

Trainer access is protected using role-based authorization.

### 🛡️ Admin Dashboard

Administrators have elevated access for platform management.

Admin functionality includes:

- User management
- Trainer management
- Membership management
- Payment management
- Platform settings
- Account status management
- Role-based administration
- Platform-level analytics and oversight

### 🔔 Notifications

The notification system supports:

- Workout completion notifications
- Coaching session confirmations
- Nutrition updates
- Read/unread notification states
- User-specific notifications

---

# 🏗️ System Architecture

```text
                           IRONCORE
                              │
                              ▼
                    ┌──────────────────┐
                    │   React Frontend │
                    │   TypeScript     │
                    │   Vite           │
                    └────────┬─────────┘
                             │
                             │ HTTP / REST API
                             ▼
                    ┌──────────────────┐
                    │  Express Server  │
                    │   server.ts      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    API Router    │
                    │     api.ts       │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        Authentication    Authorization   Business Logic
              │              │              │
              ▼              ▼              ▼
          auth.ts       JWT + Roles       API Services
                             │
                             ▼
                    ┌──────────────────┐
                    │   Database Layer │
                    │      db.ts       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ ironcore_db.json │
                    │ Local Persistence│
                    └──────────────────┘ 
