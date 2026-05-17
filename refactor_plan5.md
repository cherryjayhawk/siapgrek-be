# Phase 5: AI & LLM Implementation Refactoring Plan

## Objectives
1. Clearly separate the **Insights** feature (one-way, comprehensive recommendation) from the **Chatbot (Siapgrek AI)** feature (multi-turn, interactive dialogue).
2. Ensure the Insights feature uses *all* available MCP tools as context before generating an answer.
3. Enable true multi-session chat history for the Chatbot.
4. Clean up the Insights UI popup to only display the Insight Card.
5. Create a seamless handover from Insights to Chatbot (resuming context).

---

## 1. Backend Modifications (`intelligent-service`)

### 1.1 Redesign `InsightOrchestrator`
- **Current Behavior**: Uses OpenAI function calling, meaning the LLM chooses which tools to call dynamically.
- **New Behavior**: 
  - Manually call *all* available MCP tools (`preference`, `latest_sensor_data`, `weather_forecast`, `disease_log`) upfront in Python.
  - Compile the results into a single comprehensive "Greenhouse Context" block.
  - Pass this context to the LLM in a single shot. This guarantees the LLM takes into account all factors (weather, soil, preferences, diseases) without needing iterative tool calls.
  - Disable OpenAI tool calling for this endpoint to save latency.

### 1.2 Introduce `ChatbotOrchestrator`
- **Behavior**: Keep the dynamic, iterative OpenAI function calling (the current logic of `InsightOrchestrator`).
- **Input**: Accept an array of previous messages (conversation history) to maintain multi-turn context.
- **API**: Create a new endpoint `POST /api/v1/chat`.

---

## 2. Database Schema Updates (Neon / Prisma)

To support true multi-session chat end-to-end, we need to store conversations.
- **New Models in `schema.prisma`**:
  - `ChatSession`: Represents a conversation thread (fields: `id`, `userId`, `title`, `createdAt`).
  - `ChatMessage`: Represents individual turns (fields: `id`, `sessionId`, `role` (user/assistant/system), `content`, `createdAt`).
- Update the Next.js API routes to handle CRUD for Chat Sessions.

---

## 3. Frontend Implementation

### 3.1 Clean up Insights UI
- Locate the Insights pop-up/modal component.
- Remove all extraneous components (sensor cards, extra widgets).
- Ensure only the primary generated Insight text (the "Insight Card") is displayed.

### 3.2 Chatbot Interface
- Create a dedicated Chatbot UI (e.g., a new page `/chat` or a global sliding drawer).
- Implement a sidebar to view and switch between past Chat Sessions (multi-session support).
- Render the chat thread with distinct User and Assistant message bubbles.

### 3.3 "Resume Insight to Chatbot" Flow
- Add a **"Tanyakan Lebih Lanjut ke Siapgrek AI" (Ask Siapgrek AI)** button inside the Insight Card.
- **Action**: When clicked, it will:
  1. Create a new `ChatSession` in the database.
  2. Insert the generated Insight text as an initial `assistant` message in that session (or inject it as a hidden system context prompt).
  3. Navigate the user to the Chatbot UI.
  4. The LLM will now have the full context of the Insight and can answer follow-up questions interactively.

---

## Execution Steps
1. Update `schema.prisma` and push to Neon database.
2. Refactor `app/insights.py` in `intelligent-service` into two separate orchestrators (`insights` and `chat`).
3. Update `main.py` to expose the new `/api/v1/chat` endpoint.
4. Clean up the Frontend Insights UI.
5. Build the Frontend Chat UI and integrate the session management.
6. Connect the "Resume to Chat" logic.
