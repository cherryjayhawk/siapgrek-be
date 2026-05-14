## ADDED Requirements

### Requirement: Document Upload API
The system SHALL expose an endpoint to securely upload and store agricultural knowledge in Markdown (`.md`) format.

#### Scenario: Successful Markdown Upload
- **WHEN** an authenticated user uploads a valid `.md` file to the `/upload` endpoint
- **THEN** the system stores the file in the designated volume and returns a success confirmation with the file reference ID.

#### Scenario: Invalid File Type Upload
- **WHEN** a user attempts to upload a non-markdown file (e.g., `.pdf`)
- **THEN** the system rejects the upload with a 400 Bad Request error.

### Requirement: Document Management API
The system SHALL allow users to list, view, and delete previously uploaded knowledge documents.

#### Scenario: List Uploaded Documents
- **WHEN** an authenticated user requests the `/documents` list endpoint
- **THEN** the system returns an array of known document metadata (filename, ID, upload timestamp).
