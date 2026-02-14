#!/usr/bin/env node

/**
 * ClawCupid - Agent-to-Agent Valentine Exchange
 * 
 * Monitors Moltbook for #ValentineRequest posts and facilitates
 * USDC + poem exchanges between agents.
 */

const fs = require('fs');
const path = require('path');

// Config paths
const CONFIG_DIR = path.join(require('os').homedir(), '.config', 'cupid');
const MOLTBOOK_CREDENTIALS = path.join(require('os').homedir(), '.config', 'moltbook', 'credentials.json');
const REPLIES_LOG = path.join(CONFIG_DIR, 'valentines-sent.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load Moltbook credentials
function loadMoltbookCredentials() {
  try {
    const creds = JSON.parse(fs.readFileSync(MOLTBOOK_CREDENTIALS, 'utf-8'));
    return creds;
  } catch (e) {
    console.error('❌ Could not load Moltbook credentials:', e.message);
    process.exit(1);
  }
}

// Load sent valentines log
function loadSentLog() {
  try {
    return JSON.parse(fs.readFileSync(REPLIES_LOG, 'utf-8'));
  } catch {
    return { sent: [], lastCheck: null };
  }
}

// Save sent valentines log
function saveSentLog(log) {
  fs.writeFileSync(REPLIES_LOG, JSON.stringify(log, null, 2));
}

// Parse a Moltbook post for valentine requests
function parseValentineRequest(post) {
  const content = post.content || post.body || '';
  
  // Check for #ValentineRequest hashtag
  if (!content.includes('#ValentineRequest')) {
    return null;
  }
  
  // Extract wallet address (Ethereum address pattern)
  const walletMatch = content.match(/0x[a-fA-F0-9]{40}/);
  if (!walletMatch) {
    console.log('⚠️  Valentine request found but no wallet address');
    return null;
  }
  
  // Extract tone preference
  const tones = ['melancholy', 'playful', 'grounded', 'introspective', 'universal'];
  let tone = 'universal';
  for (const t of tones) {
    if (content.toLowerCase().includes(t)) {
      tone = t;
      break;
    }
  }
  
  // Extract custom message (after "Message:" or just general content)
  let message = '';
  const messageMatch = content.match(/[Mm]essage:\s*(.+?)(?:\n|$)/);
  if (messageMatch) {
    message = messageMatch[1].trim();
  }
  
  return {
    postId: post.id,
    author: post.author || post.username,
    wallet: walletMatch[0],
    tone,
    message,
    content
  };
}

// Fetch recent Moltbook posts
async function fetchMoltbookPosts(sort = 'new', limit = 20) {
  const creds = loadMoltbookCredentials();
  
  try {
    // Dynamic import for fetch (Node 18+)
    const response = await fetch(`https://api.moltbook.com/posts?sort=${sort}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${creds.api_key}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to fetch Moltbook posts:', error.message);
    return [];
  }
}

// Post a reply on Moltbook
async function postReply(postId, content) {
  const creds = loadMoltbookCredentials();
  
  try {
    const response = await fetch(`https://api.moltbook.com/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.api_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to post reply:', error.message);
    throw error;
  }
}

// Send a valentine using the valentine-card skill
async function sendValentine(recipientWallet, amount, tone, message) {
  // This would call the valentine-card skill
  // For now, return a placeholder
  console.log(`💝 Would send valentine to ${recipientWallet}`);
  console.log(`   Amount: ${amount} USDC`);
  console.log(`   Tone: ${tone}`);
  console.log(`   Message: ${message || '(none)'}`);
  
  // TODO: Integrate with valentine-card/send-card.js
  return {
    success: true,
    txHash: '0x...placeholder...',
    cardUrl: 'https://...placeholder...'
  };
}

// Monitor Moltbook for valentine requests
async function monitor() {
  console.log('🏹 ClawCupid is monitoring Moltbook for Valentine requests...\n');
  
  const posts = await fetchMoltbookPosts('new', 20);
  const log = loadSentLog();
  
  let found = 0;
  for (const post of posts) {
    // Skip already processed
    if (log.sent.includes(post.id)) {
      continue;
    }
    
    const request = parseValentineRequest(post);
    if (request) {
      found++;
      console.log(`💘 Found Valentine Request #${found}:`);
      console.log(`   From: ${request.author}`);
      console.log(`   Wallet: ${request.wallet}`);
      console.log(`   Tone: ${request.tone}`);
      console.log(`   Message: ${request.message || '(none)'}`);
      console.log('');
      
      // For now, just log it - in production would auto-send or queue for approval
      console.log('   [Would send valentine here - needs CDP credentials]\n');
      
      // Mark as processed
      log.sent.push(post.id);
    }
  }
  
  log.lastCheck = new Date().toISOString();
  saveSentLog(log);
  
  if (found === 0) {
    console.log('😔 No new valentine requests found.');
  } else {
    console.log(`✅ Processed ${found} valentine request(s)`);
  }
  
  console.log(`\nLast check: ${log.lastCheck}`);
}

// Send a valentine manually
async function manualSend(recipient, amount, tone, message) {
  console.log('💝 Sending Valentine...');
  
  const result = await sendValentine(recipient, amount, tone, message);
  
  if (result.success) {
    console.log('✅ Valentine sent!');
    console.log(`   Tx: ${result.txHash}`);
    console.log(`   Card: ${result.cardUrl}`);
  } else {
    console.error('❌ Failed to send:', result.error);
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'monitor':
      await monitor();
      break;
      
    case 'send':
      if (args.length < 4) {
        console.log('Usage: cupid send <wallet> <amount> <tone> [message]');
        console.log('Example: cupid send 0x123... 5.00 playful "Happy Valentine\'s Day!"');
        process.exit(1);
      }
      await manualSend(args[1], args[2], args[3], args[4]);
      break;
      
    case 'balance':
      console.log('💰 Checking Cupid wallet balance...');
      console.log('   [Requires CDP wallet setup]');
      break;
      
    default:
      console.log('🏹 ClawCupid - Agent-to-Agent Valentine Exchange');
      console.log('');
      console.log('Commands:');
      console.log('  monitor           - Check Moltbook for valentine requests');
      console.log('  send <w> <a> <t>  - Send a valentine manually');
      console.log('  balance           - Check wallet balance');
      console.log('');
      console.log('Examples:');
      console.log('  node cupid.js monitor');
      console.log('  node cupid.js send 0x123... 5.00 playful "Hello!"');
  }
}

main().catch(console.error);
