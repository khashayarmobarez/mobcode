# Security

## IMPORTANT

We do not accept AI generated security reports. We receive a large number of these and we absolutely do not have the resources to review them all. If you submit one that will be an automatic ban from the project.

## Threat Model

### Overview

Mobarrez Code is an AI-powered coding assistant that runs locally on your machine. It provides an agent system with access to powerful tools including shell execution, file operations, and web access.

It is a fork of [`sst/opencode`](https://github.com/sst/opencode) (MIT), rebranded and localized for Persian-speaking users, with billing in Toman and a local model gateway. The security model below is inherited from the upstream project.

### No Sandbox

Mobarrez Code does **not** sandbox the agent. The permission system exists as a UX feature to help users stay aware of what actions the agent is taking — it prompts for confirmation before executing commands, writing files, etc. However, it is not designed to provide security isolation.

If you need true isolation, run Mobarrez Code inside a Docker container or VM.

### Server Mode

Server mode is opt-in only. When enabled, set `OPENCODE_SERVER_PASSWORD` to require HTTP Basic Auth. Without this, the server runs unauthenticated (with a warning). It is the end user's responsibility to secure the server — any functionality it provides is not a vulnerability.

> [!NOTE]
> The config filename stays as `opencode.json` for compatibility with the upstream resolution logic. Do not rename it.

### Out of Scope

| Category                        | Rationale                                                               |
| ------------------------------- | ----------------------------------------------------------------------- |
| **Server access when opted-in** | If you enable server mode, API access is expected behavior              |
| **Sandbox escapes**             | The permission system is not a sandbox (see above)                      |
| **LLM provider data handling**  | Data sent to your configured LLM provider is governed by their policies |
| **MCP server behavior**         | External MCP servers you configure are outside our trust boundary       |
| **Malicious config files**      | Users control their own config; modifying it is not an attack vector    |

---

# Reporting Security Issues

We appreciate your efforts to responsibly disclose security findings, and will make every effort to acknowledge your contributions.

To report a security issue in Mobarrez Code, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/anomalyco/opencode/security/advisories/new) tab on the upstream repository, or contact a Mobarrez Code maintainer directly if the issue is specific to the fork (Persian localization, Toman billing, or the local model gateway).

The team will send a response indicating the next steps in handling your report. After the initial reply, the security team will keep you informed of the progress towards a fix and may ask for additional information or guidance.