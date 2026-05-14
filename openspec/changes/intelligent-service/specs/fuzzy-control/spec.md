## ADDED Requirements

### Requirement: Service-Level Fuzzy Logic Override
The service must compute control actions (such as fan speed and misting) using a fuzzy inference system responding to temperature and humidity cross-variations. It must then publish these computed actions as actuator overrides back to the MQTT broker.

#### Scenario: Pushing a control override
- **WHEN** the fuzzy logic controller evaluates current telemetry and determines an environmental correction is needed
- **THEN** the service must publish a distinct control payload directly to the target device's MQTT actuator topic (e.g., `actuators/<device_id>/command`).

### Requirement: Graceful Fallback Isolation
The system edge must not be completely reliant on the cloud overriding it in perpetuity. The controller expects the edge to have its own fundamental safety. Thus, the fuzzy logic control is an active "override," not a perpetual life-support signal.

#### Scenario: Network Disconnection
- **WHEN** the service loses connectivity to the MQTT broker and fails to send control commands
- **THEN** the service must log the network error, allowing the Edge node to smoothly revert to local closed-loop logic when it detects a timeout in cloud heartbeats.
