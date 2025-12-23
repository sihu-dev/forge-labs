Ubuntu setup for Claude Code CLI

Overview
- This script bootstraps an Ubuntu environment for working with the repository and the Claude Code CLI.

Quick run
1. Make script executable:

   chmod +x scripts/setup-ubuntu.sh

2. Run it from the repository root:

   bash scripts/setup-ubuntu.sh

Notes
- The script installs Node.js LTS via NodeSource (20.x by default). Adjust the setup URL in the script if you prefer another version.
- The script installs `@anthropic-ai/claude-code-cli` globally. If you prefer a local install, run `npm install --save-dev @anthropic-ai/claude-code-cli`.
- Provide credentials/configs (e.g., `credentials.json`, env vars) after the script runs.
- For WSL users: run the script inside your WSL distro. If you want to use Docker instead, consider `docker-compose` or building a container.

Troubleshooting
- If `claude` command is not found after install, run `npm -g bin` to find the binary path, or run via `npx @anthropic-ai/claude-code-cli --help`.
- If Node install fails, ensure you have `curl` and `ca-certificates` installed and retry.

Contact
- If you want, I can add CI steps or a Dockerfile configuration to standardize environments further.
