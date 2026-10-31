# 🎉 HUDDLE — AI-Powered Event Planning

**Plan smarter. Spot problems early. Save your event.**

HUDDLE is an AI-powered event planning platform built for the **Celebration & Event Planner** challenge vertical. It helps users create, organize, evaluate, and improve event plans through a unified workspace.

From birthdays and weddings to technology conferences, college festivals, corporate gatherings, and community events, HUDDLE brings essential planning information together and helps users make more informed decisions.

Unlike a planning assistant that only generates suggestions, HUDDLE also supports event auditing, risk identification, and user-reviewed recovery recommendations.

**Create. Audit. Rescue. Plan with confidence.**

---

## 📌 1. Chosen Challenge Vertical

**Vertical:** Celebration & Event Planner

### Problem Statement

Event planning involves coordinating schedules, budgets, venues, vendors, programs, and other logistical requirements. Missing information, budget overruns, scheduling conflicts, and unconfirmed arrangements can create problems before or during an event.

Traditional planning tools may help organize information but do not always help users evaluate their plans and decide what to address first.

### HUDDLE's Approach

HUDDLE combines structured event management, deterministic validations where implemented, and generative AI assistance to help users:

- Create organized event plans.
- Manage schedules, budgets, programs, and vendors.
- Identify potential problems and missing information.
- Prioritize important planning tasks.
- Explore possible solutions before changing an event plan.

---

## ✨ 2. Key Features

### 📝 Event Creation and Management

- Create events using details such as event type, date, time, venue, attendance, and budget.
- Organize planning information in a dedicated event workspace.
- Save, edit, reopen, and delete events.
- Associate saved event data with the authenticated user.

### 🔍 AI-Powered Event Audit

Evaluate an existing event plan to identify issues that may affect its readiness.

Depending on the information available and the validations implemented, Audit can help examine:

- Budget constraints and potential overruns.
- Program schedules and possible timing conflicts.
- Vendor confirmation status.
- Missing information and unresolved arrangements.
- Potential operational risks.

Where supported, findings distinguish confirmed problems, potential risks, and missing information.

### 🚨 Rescue Mode

Rescue helps users explore ways to address problems identified during planning.

- Review recommendations for resolving event issues.
- Prioritize urgent problems and important tasks.
- Examine proposed changes before applying them.
- Keep hypothetical simulations separate from actual event data.
- Maintain user control over proposed changes.

Recommendations are suggestions for review; they do not establish that an external vendor has been contacted or that a real-world action has been completed.

### 🔄 Before-and-After Comparison

- Compare an existing event plan with proposed improvements.
- Review changes before approving or rejecting proposals.
- Inspect the consequences of proposed changes where supported.
- Maintain a record of proposal decisions where implemented.

### 📊 Event Health and Smart Priorities

- Review an assessment of event readiness.
- Identify important tasks and potential bottlenecks.
- Consider available event information, including vendor statuses, when determining priorities.

### 🎭 Creative Studio

- Explore themes, decorations, and creative directions.
- Generate ideas based on the event's purpose and requirements.
- Support creative planning across different event categories.

### 📅 Programs and Scheduling

- Organize programs, sessions, and activities.
- Review the event schedule in chronological order.
- Manage program details within the event workspace.
- Identify scheduling issues where supported by the available data and validation logic.

### 💰 Budget and Vendor Management

- Organize event budget information.
- Review planned expenses against available funds.
- Manage vendor details and confirmation statuses.
- Keep relevant planning information accessible within the event workspace.

### 📥 Event Plan Exports

Export event plans in supported formats:

- Plain text (`.txt`)
- Markdown (`.md`)
- JSON (`.json`)

These formats support documentation, sharing, and further processing of event information.

### 🔐 Authentication and Cloud Persistence

- Firebase Authentication for user sign-in.
- Cloud Firestore for persistent event data.
- User-specific data access enforced through Firebase security rules.

---

## 🧠 3. Approach and Decision-Making Logic

HUDDLE uses event context and planning information to help users make informed decisions.

### Step 1: Collect Event Context

The application uses available event information, including:

- Event type and objectives.
- Date, time, and venue.
- Attendance requirements.
- Budget and planned expenses.
- Programs and schedules.
- Vendor details and statuses.
- Other planning information supplied by the user.

The quality of the results depends partly on the completeness and accuracy of this information.

### Step 2: Organize the Event Plan

Event information is organized into relevant planning sections, including Programs, Timeline, Budget, Vendors, and Creative Studio.

This structure makes it easier to review the event and identify areas requiring attention.

### Step 3: Validate Planning Constraints

Where implemented, deterministic checks evaluate structured information.

Examples include:

- Comparing planned expenses with the available budget.
- Checking program start and end times.
- Identifying overlapping programs that use the same venue.
- Checking whether required event information is available.

Deterministic checks are useful for conditions that can be evaluated using explicit rules and data.

### Step 4: Generate AI-Assisted Analysis

Generative AI helps interpret the event context and produce planning suggestions, audit explanations, and possible recovery actions.

AI recommendations complement structured validations; they should not be treated as proof that every possible issue has been detected.

### Step 5: Prioritize Problems

Findings can help users understand which issues may require attention first.

Prioritization may consider severity, scheduling constraints, budget impact, dependencies, and available event information, depending on the implemented feature.

### Step 6: Review and Apply Proposed Changes

Users can review proposed improvements before approving or rejecting them where the relevant workflow is supported.

This keeps users involved in important decisions and helps prevent unreviewed suggestions from being treated as completed actions.

---

## 🔄 4. How HUDDLE Works

HUDDLE follows a connected event-planning workflow:

1. **Create:** Enter event requirements and develop a structured plan.
2. **Organize:** Review programs, schedules, budgets, vendors, and creative ideas.
3. **Audit:** Evaluate the available plan information for problems and risks.
4. **Rescue:** Explore recommendations for addressing identified issues.
5. **Review:** Examine proposed changes and their potential implications.
6. **Approve:** Apply suitable changes through the supported approval workflow.
7. **Reassess:** Review the updated event plan to determine whether the relevant issues have been resolved.

The workflow is designed to help users move from planning to evaluation and improvement within one application.

---

## 🛠️ 5. Technology Stack

The project uses the following technologies:

- **Frontend:** React, TypeScript
- **Development and Build Tool:** Vite
- **Backend:** Node.js
- **Database:** Firebase Cloud Firestore
- **Authentication:** Firebase Authentication
- **Generative AI:** Google Gemini API

The exact runtime and deployment configuration depend on the project's current implementation.

---

## 🚀 6. Getting Started

### Prerequisites

Before running HUDDLE locally, ensure you have:

- Node.js and npm installed.
- Git installed.
- Access to the public HUDDLE repository.
- A configured Firebase project.
- A Gemini API key if required by the configured AI integration.

### Step 1: Clone the Repository

```bash
git clone https://github.com/eshanms/HUDDLE.git
cd HUDDLE
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Configure the environment variables required by the application's actual server and Firebase setup.

For example, if the server expects the `GEMINI_API_KEY` variable, configure it in a local environment file or the deployment platform's secret configuration:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Use the exact variable names expected by the application.

**Never commit real API keys, private credentials, service-account files, or secret environment files to GitHub.**

Firebase client configuration and any additional required settings should be configured according to the application's implementation.

### Step 4: Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### Additional Notes

- Use the repository's actual scripts and dependency configuration.
- Configure Firebase Authentication and Firestore before testing cloud-backed functionality.
- Ensure the necessary server-side environment variables are available.
- Follow any additional setup requirements specified in the project configuration.

---

## 🔒 7. Security and Privacy

Security is important because event plans may contain personal and operational information.

HUDDLE's security considerations include:

- **Authentication:** Use Firebase Authentication to identify signed-in users.
- **Data isolation:** Configure Firestore security rules to restrict access to authorized user data.
- **Secret management:** Keep privileged API credentials on the server and out of public source files.
- **Input validation:** Validate relevant event fields before accepting or processing changes.
- **Responsible AI use:** Treat generated recommendations as suggestions that may require human review.
- **Data integrity:** Preserve unrelated event information when modifying existing plans.

Security depends on the deployed configuration as well as the application code. Firebase rules, API restrictions, and environment settings should be reviewed before deployment.

---

## 🧪 8. Testing and Validation

Important workflows to validate include:

### Event Management
- Create an event.
- Edit an existing event without creating duplicates.
- Delete an event.
- Refresh the application and verify persistence.
- Confirm that a user cannot access another user's private events.

### Scheduling
- Verify chronological program ordering.
- Test overlapping sessions.
- Confirm that separate venues are handled appropriately where supported.
- Check date and time validation.

### Budget
- Compare planned expenses with the available budget.
- Test a budget that exceeds its limit.
- Verify that calculations remain correct after changes.

### Audit and Rescue
- Run Audit against an event with known problems.
- Confirm that findings reflect the available event information.
- Review proposed recovery actions.
- Approve or reject proposals where supported.
- Verify the resulting event data and relevant proposal history.

### User Interface
- Test the main workflows at different screen sizes.
- Check form labels, readable text, and visible feedback.
- Verify loading, success, and error states where implemented.

These checks provide a validation plan. Report test results separately and only claim that tests passed after actually performing them.

---

## ⚠️ 9. Assumptions and Limitations

- Recommendations depend on the accuracy and completeness of the event information provided.
- Missing information may limit the reliability of audit results and suggested actions.
- AI-generated recommendations may require verification and may not identify every possible issue.
- Budget estimates and vendor details supplied by users may not reflect current real-world prices or availability.
- A proposed change does not mean that a real-world booking, payment, cancellation, or vendor communication has occurred.
- Users remain responsible for reviewing important decisions and confirming external arrangements.
- Feature availability depends on the current application implementation and its configuration.

HUDDLE is intended to support event planning and decision-making, not replace human judgment or confirmation of real-world arrangements.

---

## 🎯 10. Project Goal

HUDDLE aims to make event planning more organized, proactive, and reliable by combining generative AI assistance with structured planning information, validation, risk identification, and user-reviewed improvements.

From building an initial plan to identifying problems and exploring recovery options, HUDDLE brings key planning workflows together in one place.

**HUDDLE — Create. Audit. Rescue. Plan with confidence.**

---

*Built for Prompt Wars.*
