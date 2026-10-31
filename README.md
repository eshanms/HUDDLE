# 🎉 HUDDLE — AI-Powered Event Planning

**Plan smarter. Spot problems early. Save your event.**

HUDDLE is an AI-powered event planning platform that helps users create, organize, evaluate, and recover event plans from a single workspace. Whether you're planning a birthday, wedding, college fest, corporate gathering, or community event, HUDDLE helps you manage the details and make informed decisions.

Instead of simply generating an event plan, HUDDLE also helps identify potential problems, prioritize important tasks, and explore solutions before making changes to the actual event.

## ✨ Key Features

### 📝 1. Create Events
- Create and manage events with essential details such as date, time, venue, attendance, and budget.
- Organize event information in a dedicated workspace.
- Save, edit, reopen, and delete events.
- Keep event data associated with the authenticated user.

### 🔍 2. AI-Powered Event Audit
- Evaluate an existing event plan for potential issues.
- Review budget, scheduling, and event readiness.
- Identify confirmed problems, potential risks, and missing information.
- Help users understand what needs attention.

### 🚨 3. Rescue Mode
- Explore actionable recommendations for addressing event problems.
- Prioritize urgent issues and important tasks.
- Review proposed changes before applying them.
- Keep real event data separate from hypothetical simulations.

### 🔄 4. Before-and-After Comparison
- Compare an existing plan with proposed improvements.
- Review potential changes before approving or rejecting them.
- Maintain a record of proposal decisions.

### 📊 5. Event Health & Smart Priorities
- Review event readiness through an event health assessment.
- Identify high-priority tasks and potential bottlenecks.
- Consider vendor status and other available event information when determining priorities.

### 🎭 6. Creative Studio
- Explore event themes and creative directions.
- Generate ideas suited to the event's purpose and requirements.

### 📅 7. Programs & Scheduling
- Organize event programs and activities.
- View programs in chronological order.
- Manage the schedule and supporting event details.

### 💰 8. Budget & Vendor Management
- Track event budget information.
- Organize vendor details and statuses.
- Keep planning information available within the event workspace.

### 📥 9. Download Event Plans
Download event plans in multiple formats:
- Plain text (`.txt`)
- Markdown (`.md`)
- JSON (`.json`)

These formats make it easier to share, document, and reuse event information.

### 🔐 10. Authentication & Cloud Persistence
- Firebase Authentication for user sign-in.
- Cloud Firestore for persistent event data.
- User-specific data access enforced through Firestore security rules.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript
- **Development & Build:** Vite
- **Backend:** Node.js
- **Database:** Firebase Cloud Firestore
- **Authentication:** Firebase Authentication
- **Generative AI:** Google Gemini API

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/)
- A Firebase project configured for the application
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd HUDDLE
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with your public GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Use the environment variable names expected by the application. Never commit real API keys, private credentials, or secret environment files to GitHub.

### 4. Run the application

```bash
npm run dev
```

Open the local URL printed in the terminal.

## 🔒 Security Notes

- Never upload `.env.local` or other files containing secret credentials.
- Keep Firebase security rules enabled and properly configured.
- Restrict API keys where appropriate.
- Do not commit Firebase service-account private keys or other sensitive credentials.

## 🎯 Project Goal

HUDDLE aims to make event planning more organized, proactive, and reliable by combining generative AI with structured planning, risk identification, and user-approved improvements.

**Create. Audit. Rescue. Plan with confidence.**

---

*Built for Prompt Wars.*
