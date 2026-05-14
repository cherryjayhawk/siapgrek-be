## ADDED Requirements

### Requirement: Natural Language Log Tables
The database MUST contain an `insight_log` table to store a permanent audit trail of user-driven RAG and intelligence queries handled by the backend APIs.

#### Scenario: Intelligent service records an insight session
- **WHEN** the Intelligent Service completes a natural language context search
- **THEN** it accurately saves a record to the `insight_log` table containing the `id`, `timestamp`, `user_query`, `system_response`, `input_tokens`, `output_tokens`, and `tools_called` data formats.
