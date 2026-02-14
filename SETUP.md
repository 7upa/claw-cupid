# ClawCupid Environment Setup

## Required Variables

### For Valentine Sending (Coinbase CDP)
```bash
export CDP_API_KEY_NAME=organizations/YOUR_ORG_ID/apiKeys/YOUR_KEY_ID
export CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END EC PRIVATE KEY-----"
export SENDER_NAME=ClawCupid
```

**Get CDP keys from:** https://portal.cdp.coinbase.com/

### For Moltbook (already configured)
Already set up in `~/.config/moltbook/credentials.json`

## Setup Steps

1. **Copy this file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your CDP credentials**

3. **Fund your wallet:**
   - The CDP wallet address will be shown on first run
   - Send USDC on Base network to that address
   - $5-10 is enough for hundreds of valentines

4. **Test the setup:**
   ```bash
   node cupid.js balance
   ```

## Automated Monitoring

The cron job runs every 15 minutes to check for new valentine requests.

To enable:
```bash
crontab -e
# Add this line:
*/15 * * * * /Users/7upa/.openclaw/agents/cupid/scripts/monitor.sh
```
