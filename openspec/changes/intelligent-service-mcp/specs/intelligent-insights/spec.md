## ADDED Requirements

### Requirement: Expose Insight REST API Endpoint
The system SHALL expose a `/api/v1/insights` REST endpoint in the `intelligent-service` that accepts user queries and returns natural language responses.

#### Scenario: Requesting general system status
- **WHEN** a user queries "How is the orchid greenhouse looking today?" via the REST endpoint
- **THEN** the system returns a comprehensive natural language insight summarizing the state of the greenhouse.

### Requirement: MCP Tool Integration for Context
The system SHALL act as an MCP Client and query the `knowledge-service` MCP servers to dynamically retrieve context (preferences, sensor history, disease logs, anomaly records) to augment the base LLM prompt.

#### Scenario: Requesting specific disease information
- **WHEN** a user queries "Have there been any recent diseases detected?"
- **THEN** the system executes the `disease_log` MCP tool from the `knowledge-service` and includes the returned records in its resulting natural language response.

### Requirement: Graceful Degradation on Tool Failure
If the `knowledge-service` is unreachable or an underlying MCP tool call fails, the system SHALL NOT crash the REST request. It MUST catch the error and generate an LLM response based solely on the base prompt and any successfully retrieved data.

#### Scenario: Knowledge service is down during insight generation
- **WHEN** the system attempts to call an MCP tool but the SSE connection fails
- **THEN** the system safely catches the exception and returns a valid LLM response indicating that it currently cannot access live greenhouse data, rather than throwing a 500 Internal Server Error.
