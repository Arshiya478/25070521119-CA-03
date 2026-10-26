# MediMate — Medicine Reminder FLEXI Project

A full-stack Medicine Reminder web application for the FLEXI project.

## Technology
- Frontend: React.js + Vite
- Backend: Node.js + Express
- Database: MongoDB (local Community Server + MongoDB Compass)
- Authentication: bcryptjs password hashing + JWT sessions

## Features
- Register and login
- Protected personal dashboard
- User-specific medicine reminders
- Medicine name, dosage, timing, frequency and date range
- Add, edit, delete and enable/disable reminders
- Browser notifications and optional alarm sound
- MongoDB persistence
- Responsive, health-themed UI with green accents

## Folder structure
```text
medicine-reminder/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── server.js
│   ├── package.json
│   └── .env
└── README.md
```

## Setup

### 1. MongoDB
Make sure MongoDB Community Server is running as a Windows service.
Open MongoDB Compass and connect to:
```text
mongodb://127.0.0.1:27017
```

You do not need to manually create the database. The app uses:
```text
medicineReminderDB
├── users
└── medicines
```

### 2. Backend
Open a VS Code terminal:
```powershell
cd medicine-reminder
cd server
npm install
npm run dev
```
Expected output:
```text
MongoDB connected: medicineReminderDB.users + medicineReminderDB.medicines
Medicine Reminder API running at http://localhost:5000
```
Keep this terminal running.

### 3. Frontend
Open a second VS Code terminal:
```powershell
cd medicine-reminder
cd client
npm install
npm run dev
```
Open the Vite URL, normally:
```text
http://localhost:5173/
```

## Using login
1. Create an account on the Register screen.
2. Sign in with that email and password.
3. Add medicines from the dashboard.
4. Your medicines are stored with your MongoDB user ID, so each account sees only its own reminders.

## MongoDB Compass verification
After registering and adding a medicine, refresh Compass and open:
```text
medicineReminderDB
├── users
└── medicines
```
The `users` collection contains account records with hashed passwords. The `medicines` collection contains the reminder records associated with each user's `userId`.

## Important reminder behavior
Browser alerts require the dashboard to remain open. Click **Enable alerts** and allow notifications. The optional alarm sound can be switched on/off from the dashboard.

## If you already installed the previous version
You do not need to reinstall MongoDB or recreate the project. Replace/use this updated project, then run `npm install` once in `server` and once in `client` because authentication adds `bcryptjs` and `jsonwebtoken` to the backend.
