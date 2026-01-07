# Infrastructure

## n8n Server (AWS EC2)

| Property | Value |
|----------|-------|
| Type | t3.small (2GB RAM) |
| Region | ap-southeast-1 (Singapore) |

See `.claude/secrets.local.md` for Instance ID, Security Group, and URL.

## Security Group Rules

| Port | Access | Purpose |
|------|--------|---------|
| 22 | Restricted to user IP | SSH |
| 80, 443 | Public | Web (Cloudflare proxy) |
| 5678 | Blocked | n8n internal only |

## SSH Access - Update IP When Location Changes

When changing network/location, update Security Group for SSH access:

```bash
# 1. Get current IP
curl -s ifconfig.me

# 2. Find old SSH rule ID
aws ec2 describe-security-groups --group-ids <sg-id> \
  --query "SecurityGroups[0].IpPermissions[?FromPort==\`22\`]"

# 3. Remove old rule
aws ec2 revoke-security-group-ingress --group-id <sg-id> \
  --security-group-rule-ids <rule-id>

# 4. Add new IP (IPv4)
aws ec2 authorize-security-group-ingress --group-id <sg-id> \
  --protocol tcp --port 22 --cidr "<your-ip>/32"

# 4b. Or IPv6
aws ec2 authorize-security-group-ingress --group-id <sg-id> \
  --ip-permissions "IpProtocol=tcp,FromPort=22,ToPort=22,Ipv6Ranges=[{CidrIpv6=<your-ipv6>/64}]"
```

## n8n Logging Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| N8N_LOG_LEVEL | info | Log level (error, warn, info, verbose, debug) |
| N8N_LOG_OUTPUT | console,file | Output to both console and file |
| N8N_LOG_FORMAT | json | JSON format for parsing |
| N8N_LOG_FILE_LOCATION | /home/node/.n8n/logs/n8n.log | Log file path |
| N8N_LOG_FILE_COUNT_MAX | 10 | Max log files to keep |
| N8N_LOG_FILE_SIZE_MAX | 10 | Max size per file (MB) |

**Log files location on host**: `/home/ubuntu/.n8n/logs/`

## Troubleshooting n8n

```bash
# Check instance status
aws ec2 describe-instance-status --instance-ids <instance-id>

# Reboot if OOM or unresponsive
aws ec2 reboot-instances --instance-ids <instance-id>

# Check logs (SSH into server)
ssh -i n8n-key.pem ubuntu@<ip>
docker logs n8n

# View log file
cat /home/ubuntu/.n8n/logs/n8n.log

# Follow logs in real-time
docker logs -f n8n
tail -f /home/ubuntu/.n8n/logs/n8n.log

# Change log level to debug (for troubleshooting)
# Stop container, update N8N_LOG_LEVEL=debug, restart
```

## Other Cloud Services

- **Cloudflare**: Use `wrangler` CLI for Workers, Pages, R2, KV, D1
- **DigitalOcean**: Use `doctl` CLI

Alternative services if n8n doesn't meet requirements:
- **AWS**: Lambda, SQS/SNS, S3, EventBridge
- **DigitalOcean**: Functions, Spaces, App Platform, Droplets
- **Cloudflare**: Workers (serverless), R2 (storage), D1 (SQLite), KV (key-value)

## uv - Python Package Manager

Use `uv` instead of `pip`, `pyenv`, `pipx` (10-100x faster):

**Project workflow:**
```bash
uv init my-project && cd my-project  # Create new project
uv add requests rich                  # Add dependencies
uv add --dev pytest                   # Dev dependencies
uv sync                               # Install from uv.lock
uv run python script.py               # Run in venv
uv run pytest                         # Run command in venv
```

**Python version management** (replaces pyenv):
```bash
uv python install 3.11 3.12           # Install Python versions
uv python list --only-installed       # List installed versions
uv python pin 3.12                    # Pin version for project
uv run --python 3.11 script.py        # Run with specific Python
```

**CLI tools** (replaces pipx):
```bash
uvx ruff check .                      # Run tool temporarily
uv tool install ruff                  # Install tool globally
```

**Inline script** (PEP 723 - no project needed):
```python
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests>=2.31", "rich>=13.0"]
# ///
import requests
```
```bash
uv run script.py  # Auto-creates temp venv and installs deps
```

Docs: https://docs.astral.sh/uv/
