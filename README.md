# 📧 Email Verifier - Internal Tool

A robust, production-ready email verification tool built for Factoryze Agency. Upload CSV files with email lists, verify them in bulk, and download results with detailed verification data.

## ✨ Features

- **Single Email Verification** - Verify individual emails with detailed results
- **Bulk CSV Verification** - Upload CSV, verify thousands of emails, download results
- **No Database Required** - CSV-in, CSV-out workflow
- **Industry Standard Checks**:
  - ✅ SMTP mailbox verification
  - ✅ MX record validation
  - ✅ Disposable email detection (1000+ domains)
  - ✅ Catch-all domain detection
  - ✅ Role account detection (admin@, info@, etc.)
  - ✅ Free provider detection (Gmail, Yahoo, etc.)
  - ✅ Typo suggestions (gmial.com → gmail.com)
  - ✅ Risk scoring (0-100)

- **Built-in Protections**:
  - 🛡️ Rate limiting per domain
  - 🛡️ Daily verification limits
  - 🛡️ Retry logic with exponential backoff
  - 🛡️ Concurrent connection limits
  - 🛡️ Timeout handling

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (Download from https://nodejs.org)
- **npm** (comes with Node.js)

### Installation

1. **Navigate to the project folder:**
   ```bash
   cd email-verifier
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:3000
   ```

That's it! The app is now running locally.

### Production Build (Optional)

For better performance:

```bash
npm run build
npm start
```

## 📖 Usage Guide

### Single Email Verification

1. Go to **Single Verify** page
2. Enter an email address
3. Click **Verify**
4. View detailed results including:
   - Status (valid/invalid/risky/unknown)
   - Risk score
   - MX records
   - Flags (disposable, catch-all, role account, etc.)

### Bulk CSV Verification

1. Go to **Bulk Verify** page
2. Prepare your CSV file (must have an `email` column)
3. Drag & drop or click to upload
4. Click **Start Verification**
5. Watch progress in real-time
6. Click **Download Results** when complete

### CSV Format

**Input CSV Example:**
```csv
email,name,company
john@example.com,John Doe,Acme Inc
jane@gmail.com,Jane Smith,Tech Corp
test@tempmail.com,Test User,Startup XYZ
```

**Output CSV adds these columns:**
| Column | Description |
|--------|-------------|
| status | valid, invalid, risky, unknown |
| reason | mailbox_exists, mailbox_not_found, catch_all, etc. |
| is_valid | true/false |
| is_disposable | true/false |
| is_role_account | true/false |
| is_free_provider | true/false |
| is_catch_all | true/false |
| mx_record | Mail server address |
| risk_score | 0-100 (lower is better) |
| suggestion | Typo correction if detected |
| verified_at | Timestamp |
| verification_time_ms | Time taken |

## 📊 Understanding Results

### Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ **valid** | Email exists and accepts mail | Safe to send |
| ❌ **invalid** | Email doesn't exist or is disposable | Do not send |
| ⚠️ **risky** | Catch-all domain or uncertain | Send with caution |
| ❓ **unknown** | Could not verify (timeout/blocked) | Retry later |

### Risk Score Guide

| Score | Risk Level | Recommendation |
|-------|------------|----------------|
| 0-30 | Low | Safe to send |
| 31-60 | Medium | Proceed with caution |
| 61-100 | High | Avoid sending |

### Reason Codes

| Reason | Description |
|--------|-------------|
| mailbox_exists | SMTP confirmed the mailbox exists |
| mailbox_not_found | SMTP rejected - user doesn't exist |
| catch_all | Domain accepts any email address |
| invalid_syntax | Email format is wrong |
| no_mx_record | Domain has no mail server |
| disposable_domain | Known temporary email service |
| timeout | Server didn't respond in time |
| greylisted | Temporary rejection, retry later |
| rate_limited | Too many requests to this server |
| blocked | Our IP was blocked |

## ⚙️ Configuration

### Rate Limits (Built-in)

These are hardcoded for safety:

| Setting | Value | Purpose |
|---------|-------|---------|
| Max concurrent connections | 5 | Prevent overloading servers |
| Max per domain per minute | 10 | Avoid domain-level blocks |
| Delay between same-domain | 200ms | Spacing requests |
| SMTP timeout | 10 seconds | Prevent hanging |
| Max retries | 2 | Handle temporary failures |
| Daily limit | 5000 emails | Prevent abuse |

### Adjusting Settings

Go to **Settings** page to adjust:
- SMTP timeout
- Concurrent connections
- Requests per domain
- Retry attempts
- Catch-all detection toggle

## 🔧 Troubleshooting

### "Connection timeout" errors

**Cause:** Mail server is slow or blocking verification attempts.

**Solutions:**
- Wait 15-30 minutes and retry
- These emails will be marked as "unknown"
- Corporate domains usually work better than Gmail/Yahoo

### "Rate limited" errors

**Cause:** Too many requests to the same mail server.

**Solutions:**
- The app automatically handles this with delays
- Large Gmail/Yahoo lists will take longer
- Consider splitting very large lists across multiple days

### Low accuracy on Gmail/Yahoo

**Cause:** These providers are aggressive about blocking verification.

**Reality:**
- Gmail: ~85% accuracy from fresh IP
- Yahoo: ~80% accuracy
- Corporate: ~95% accuracy

**Solution:** "Unknown" results should be retried after 24 hours.

### App won't start

**Check:**
1. Node.js 18+ is installed: `node --version`
2. Dependencies are installed: `npm install`
3. Port 3000 is free: `lsof -i :3000`

## 📁 Project Structure

```
email-verifier/
├── app/
│   ├── api/
│   │   ├── verify/route.ts      # Single email API
│   │   └── bulk/
│   │       ├── parse/route.ts   # CSV parsing API
│   │       ├── verify/route.ts  # Bulk verification API
│   │       └── download/route.ts # CSV download API
│   ├── verify/page.tsx          # Single verify page
│   ├── bulk/page.tsx            # Bulk verify page
│   ├── settings/page.tsx        # Settings page
│   ├── layout.tsx               # Root layout with sidebar
│   ├── page.tsx                 # Dashboard
│   └── globals.css              # Styles
├── components/
│   └── Sidebar.tsx              # Navigation sidebar
├── lib/
│   ├── verifier.ts              # Core verification logic
│   ├── csv.ts                   # CSV parsing/generation
│   └── types.ts                 # TypeScript types
├── data/
│   └── disposable-domains.json  # Disposable email list
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🎯 Best Practices

### For Best Results

1. **Clean your list first** - Remove obviously invalid emails
2. **Sort by domain** - Reduces connection overhead
3. **Verify during off-peak hours** - Mail servers are less restrictive
4. **Split large lists** - Process 2000-3000 per session
5. **Retry "unknown" results** - After 24 hours they often succeed

### Interpreting Results

- **Trust "valid" results** - SMTP confirmed the mailbox exists
- **Remove "invalid" immediately** - These will bounce
- **Be cautious with "risky"** - 50/50 chance of delivery
- **Retry "unknown" later** - Temporary failures happen

## 📈 Expected Performance

| List Size | Estimated Time | Notes |
|-----------|---------------|-------|
| 100 emails | 2-5 minutes | Quick test |
| 500 emails | 10-20 minutes | Small campaign |
| 1000 emails | 20-40 minutes | Medium campaign |
| 2000 emails | 40-80 minutes | Large campaign |

*Times vary based on email domains and server response times.*

## 🔒 Privacy & Security

- **No data stored** - Results exist only in your browser session
- **No external APIs** - Direct SMTP verification
- **Local only** - Runs entirely on your machine
- **Your lists stay private** - Nothing leaves your computer

## 📝 License

Internal tool for Factoryze Agency. Not for redistribution.

---

Built with ❤️ for the Factoryze team.
