## Why

Currently, when the Intelligent Service processes natural language insights using the OpenAI API, the final response is delivered to the user but we do not persist the interaction history. Logging these interactions (including token usage, called tools, user queries, and final AI responses) is critical for debugging MCP interactions, analyzing token costs, optimizing tool usage, and maintaining a historical audit of generated insights.

## What Changes

- Create a new PostgreSQL table to store insight interactions securely in the database.
- Modify the `/insights` logic in `intelligent-service/app/insights.py` to extract execution metrics (input tokens, output tokens, which tools were called, the text of the tool calls) from the OpenAI response context.
- Implement a logging mechanism within the Intelligent Service to persist this interaction struct into the database safely without significantly blocking the response time for the user.
- **BREAKING**: (None identified, this is an additive change to the schema and endpoint).

## Capabilities

### New Capabilities
- `insight-history`: Defines the strict requirements for recording the context of natural language insight interactions, capturing tokens, tools, queries, and responses.

### Modified Capabilities
- `database-schema`: Updating the relational database structure to include the new insight logs table (e.g., `insight_log`).

## Non-goals
- We will not build a new user-facing UI/dashboard to visualize these logs in this change.
- We will not implement real-time alerts or quotas based on the token usage.
- This change will not alter the actual RAG logic or how the knowledge-service MCP is processed, just logging the run.

## Impact
- **Database**: Adds a new relation to the PostgreSQL database configuration. 
- **Intelligent Service (`insights.py`)**: Adds metrics extraction logic to the OpenAI LLM invocation. Introduces database interaction (either synchronously or via background tasks) for saving the logs.
