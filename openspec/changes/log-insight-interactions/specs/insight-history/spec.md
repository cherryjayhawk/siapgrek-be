## ADDED Requirements

### Requirement: Insight Execution Logging
The system SHALL capture and record execution details for every natural language query processed by the Intelligent Service. This includes the exact user query, the complete system response, total tokens consumed (input + output), and metadata regarding which specific capabilities/tools were invoked.

#### Scenario: User queries the AI insight endpoint
- **WHEN** the user submits a natural language query for greenhouse insights (and the API resolves successfully)
- **THEN** the system logs the full execution context (query, response, token usage, tool invocations) asynchronously.

### Requirement: Non-Blocking Log Persistence
The system MUST persist insight logs to the database without significantly blocking the primary synchronous REST response returned to the user.

#### Scenario: High concurrency API requests
- **WHEN** multiple insight queries are requested concurrently
- **THEN** the API returns the insight response immediately, pushing the logging operation to the background.
