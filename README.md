# SiapGrek - Greenhouse Orchid IoT System 🌸

SiapGrek is a comprehensive, modern Internet of Things (IoT) and AI-driven platform designed specifically for monitoring and managing orchid greenhouses. It combines real-time sensor telemetry, automated fuzzy-logic control, and an advanced **Context-Aware AI Agent** to ensure optimal growing conditions and disease prevention.

## 🌟 Key Features

* **Context-Aware AI Agent Chat 🤖**: An intelligent, conversational AI assistant (powered by LLMs and RAG) that understands the real-time context of your greenhouse. You can interact with the AI to ask about current conditions, request analysis on historical data, or get actionable advice on orchid care based on live sensor readings and domain knowledge.
* **Real-time Environment Monitoring**: Continuous tracking of ambient temperature, humidity, light intensity (lux), soil moisture, soil temperature, pH, and electrical conductivity.
* **AI Disease Detection**: Integrated computer vision models (TensorFlow Lite) that detect common orchid diseases (e.g., Leaf Spot, Leaf Rot) from images, helping prevent outbreaks before they spread.
* **Fuzzy-Logic Automation**: Automated control of greenhouse actuators based on intelligent fuzzy logic rules, reducing the need for manual intervention.
* **Modern Microservices Architecture**: Highly scalable backend powered by Docker, comprising specialized services for data ingestion, analytics, authentication, and AI inference.

## 🏗️ Architecture & Tech Stack

SiapGrek is built using a robust, polyglot microservices architecture orchestrated with **Docker Compose**:

### Frontend
* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Styling**: Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
* **Package Manager**: Bun

### Backend Services
* **Ingestion Service** (`Bun`): Subscribes to MQTT topics, processes high-throughput sensor telemetry, and persists it to the database.
* **Analytic Service** (`Go` / `Fiber`): High-performance query engine for retrieving time-series telemetry data and generating insights.
* **Auth Service** (`Bun` / `Better Auth`): Handles secure user authentication, session management, and OAuth integrations.
* **Knowledge Service** (`Bun` / `Hono`): Manages the Retrieval-Augmented Generation (RAG) pipeline and Model Context Protocol (MCP) for the AI assistant's knowledge base.
* **Intelligent Service** (`Python` / `FastAPI`): Hosts Machine Learning models (TFLite) for disease detection and integrates with Google Gemini for the Context-Aware AI Agent Chat capabilities.

### Infrastructure & Data
* **Database**: PostgreSQL with `pgvector` (for AI vector search) and TimescaleDB optimization for time-series telemetry. ORM provided by Prisma.
* **Message Broker**: Eclipse Mosquitto (MQTT) for low-latency communication between edge IoT devices and cloud services.
* **Reverse Proxy**: Caddy for automatic HTTPS and traffic routing.

### Edge / Hardware
* **Microcontrollers**: Firmware written in C++ (Arduino IDE) for ESP32/ESP8266 devices.
* **Sensors**: Integrates with various environmental and soil sensors to collect critical growth metrics.

## 🚀 Getting Started

### Prerequisites
* Docker and Docker Compose
* Node.js & Bun (for local development)
* Go (optional, for Analytic service dev)
* Python 3.10+ (optional, for Intelligent service dev)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/siapgrek.git
   cd siapgrek
   ```

2. **Environment Variables:**
   Copy the `.env.example` to `.env` and fill in your secrets (e.g., Database URLs, API Keys for Gemini, Better Auth secret, etc.).
   ```bash
   cp .env.example .env
   ```

3. **Database Migration:**
   Apply the Prisma migrations to set up your PostgreSQL schema.
   ```bash
   cd database
   bun install
   bunx prisma db push
   ```

4. **Start the Infrastructure:**
   Spin up all microservices, databases, and the MQTT broker using Docker Compose.
   ```bash
   docker-compose up -d
   ```

5. **Start the Frontend (Development):**
   ```bash
   cd frontend
   bun install
   bun dev
   ```

The web dashboard will be available at `http://localhost:3000`.

## 🤖 How the Context-Aware AI Agent Works

Unlike a standard chatbot, SiapGrek's AI Agent is deeply integrated with your greenhouse's live data streams and domain-specific knowledge base.

- **Ask Questions**: *"Why did the soil humidity drop yesterday?"* or *"Does my orchid have leaf spot disease?"*
- **Contextual Responses**: The AI retrieves relevant telemetry data (via Analytic Service), recent disease logs (via Intelligent Service), and command execution history to provide accurate, data-driven answers.
- **Actionable Insights**: Get recommendations on watering schedules or light adjustments based on current readings and botanical best practices stored in the RAG system.

## 📄 License
This project is licensed under the MIT License.
