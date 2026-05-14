## ADDED Requirements

### Requirement: Email/Password Registration
The system SHALL allow users to register for an account using a valid email address and a secure password.

#### Scenario: Successful Registration
- **WHEN** a user submits a valid email and a password meeting complexity requirements to the registration endpoint
- **THEN** an account is created in the database and a success response is returned

### Requirement: Email/Password Login
The system SHALL authenticate users using their registered email address and password, returning authentication credentials upon success.

#### Scenario: Successful Login
- **WHEN** a user submits valid, registered login credentials to the login endpoint
- **THEN** the system issues an access token, issues a refresh token, and creates a secure session

#### Scenario: Failed Login due to invalid credentials
- **WHEN** a user submits an unregistered email or an incorrect password
- **THEN** the system replies with an authentication failed error, ensuring no session is created
