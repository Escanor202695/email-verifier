# Understanding Port 25 and SMTP Email Verification

## Table of Contents
- [What is Port 25?](#what-is-port-25)
- [Why Port 25 is Required for Email Verification](#why-port-25-is-required)
- [Why Port 25 Gets Blocked](#why-port-25-gets-blocked)
- [Who Blocks Port 25?](#who-blocks-port-25)
- [How VPS Hosting Can Solve This](#how-vps-hosting-can-solve-this)
- [Alternative Solutions](#alternative-solutions)
- [Recommended VPS Providers](#recommended-vps-providers)

---

## What is Port 25?

**Port 25** is the default port for **SMTP (Simple Mail Transfer Protocol)** - the protocol used for sending and routing email between mail servers across the internet.

```
Port 25 = SMTP = Mail Server to Mail Server Communication
```

### The Email Delivery Chain:
```
Your App → Port 25 → Recipient's Mail Server → Recipient's Inbox
          (SMTP)
```

---

## Why Port 25 is Required for Email Verification

When verifying an email address, we need to check if the mailbox actually exists. Here's the verification process:

### Step-by-Step Verification Process:

1. **Syntax Check** ✅ (No network required)
   - Is the email format valid? `user@domain.com`
   
2. **MX Record Lookup** ✅ (DNS query)
   - Does the domain have mail servers configured?
   - Example: `gmail.com` → `gmail-smtp-in.l.google.com`

3. **SMTP Verification** ⚠️ (Requires Port 25)
   ```
   Connect to mail server on Port 25
   → EHLO verify.local
   → MAIL FROM:<verify@verify.local>
   → RCPT TO:<target@domain.com>
   → Check response code
   ```
   
   **Response codes:**
   - `250` = Mailbox exists ✅
   - `550` = Mailbox not found ❌
   - `421` = Rate limited ⏳

### Why Port 25 Specifically?

Port 25 is the **only port** that mail servers accept for **unsolicited** (unauthenticated) mail delivery between servers. Other ports like 587 and 465 require authentication and are for client-to-server communication, not server-to-server.

```
Port 25  → Server to Server (no auth needed) ← We need this!
Port 587 → Client to Server (auth required)
Port 465 → Client to Server (auth required, SSL)
```

---

## Why Port 25 Gets Blocked

### 1. **Spam Prevention** 🛡️

Port 25 blocking became widespread in the early 2000s as a response to the spam epidemic.

**The Problem:**
- Spammers infected millions of home computers with malware
- These "zombie" computers sent spam directly to mail servers
- Billions of spam emails flooded the internet daily

**The Solution:**
- ISPs started blocking outbound port 25 for residential customers
- This prevented infected computers from sending spam directly
- Legitimate email still works because email clients use ports 587/465

### 2. **Botnet Prevention** 🤖

Modern malware often tries to:
- Send spam emails
- Spread via email attachments
- Use compromised machines as spam relays

By blocking port 25, ISPs prevent compromised computers from becoming spam bots.

### 3. **Abuse Prevention** 📧

Without port 25 blocking:
- Anyone could run a mail server from home
- No accountability for spam sources
- Difficult to trace abuse
- Email reputation systems would be useless

---

## Who Blocks Port 25?

### 1. **Residential ISPs** (Almost Always Blocked)

| ISP | Port 25 Status |
|-----|----------------|
| Comcast/Xfinity | ❌ Blocked |
| AT&T | ❌ Blocked |
| Verizon | ❌ Blocked |
| Spectrum | ❌ Blocked |
| Cox | ❌ Blocked |
| Most others | ❌ Blocked |

**Why:** Prevent home computers from sending spam

### 2. **Cloud Providers** (Blocked by Default)

| Provider | Port 25 Status | Can Request? |
|----------|----------------|--------------|
| AWS EC2 | ❌ Blocked | ✅ Yes (form required) |
| Google Cloud | ❌ Blocked | ✅ Yes (limited) |
| Microsoft Azure | ❌ Blocked | ✅ Yes (limited) |
| DigitalOcean | ❌ Blocked | ❌ No |
| Heroku | ❌ Blocked | ❌ No |
| Vercel | ❌ Blocked | ❌ No |
| Netlify | ❌ Blocked | ❌ No |

**Why:** Prevent abuse of cloud infrastructure for spam

### 3. **Corporate Networks** (Often Blocked)

- Companies block port 25 for security
- Prevents data exfiltration via email
- Enforces use of company email servers

### 4. **Universities & Schools** (Usually Blocked)

- Prevent student abuse
- Reduce spam from campus networks
- Enforce institutional email policies

---

## How VPS Hosting Can Solve This

### What is a VPS?

A **VPS (Virtual Private Server)** is a virtual machine that gives you:
- Full root access
- Dedicated IP address
- Complete control over network ports
- Server-grade internet connection

### Why VPS Providers Allow Port 25

Unlike residential ISPs or managed cloud platforms, VPS providers:

1. **Target Server Use Cases** 🖥️
   - Expect customers to run mail servers
   - Provide business-grade infrastructure
   - Have abuse monitoring systems

2. **Accountability** 📝
   - Require identity verification
   - Accept business customers only (usually)
   - Have clear Terms of Service
   - Can quickly shut down abusers

3. **IP Reputation Management** ⭐
   - Provide clean IP addresses
   - Monitor for spam/abuse
   - Maintain blacklist monitoring
   - Can replace IPs if needed

### VPS vs Cloud Comparison

| Feature | VPS (OVH, Hetzner) | Cloud (AWS, GCP) |
|---------|-------------------|------------------|
| Port 25 | ✅ Open by default | ❌ Blocked by default |
| Setup Complexity | 🟢 Simple | 🔴 Complex |
| Cost | 💰 $5-20/month | 💰💰 $10-50/month |
| Request Process | ⚡ Instant | 📝 Form + approval |
| Email Reputation | 🟢 Good | 🟡 Varies |

---

## Alternative Solutions

If you can't use a VPS with open port 25, consider these alternatives:

### 1. **Third-Party Email Verification APIs** (Recommended)

Use professional services that handle the SMTP verification:

| Service | Pricing | Features |
|---------|---------|----------|
| [ZeroBounce](https://www.zerobounce.net/) | $0.008/email | SMTP, catch-all, disposable |
| [NeverBounce](https://neverbounce.com/) | $0.008/email | Real-time, bulk |
| [Hunter.io](https://hunter.io/) | $0.01/email | SMTP + email finder |
| [Abstract API](https://www.abstractapi.com/email-verification-api) | $0.001/email | Budget-friendly |
| [Mailboxlayer](https://mailboxlayer.com/) | $0.004/email | SMTP + syntax |

**Pros:**
- ✅ No port 25 needed
- ✅ Better deliverability
- ✅ Maintained IP reputation
- ✅ Handle rate limiting
- ✅ No infrastructure management

**Cons:**
- ❌ Ongoing costs
- ❌ API dependency
- ❌ Privacy concerns (sharing email data)

### 2. **Proxy/Relay Services**

Use a service that provides SMTP relay:
- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)

**Note:** These are designed for sending email, not verification, but can be adapted.

### 3. **Hybrid Approach**

Combine multiple validation methods:
```javascript
1. Syntax validation (free, instant)
2. MX record check (free, instant)
3. Disposable domain check (free, instant)
4. SMTP verification (VPS or API, costs money)
```

Only use SMTP verification for high-value emails to reduce costs.

---

## Recommended VPS Providers

### Best for Email Verification (Port 25 Open)

#### 1. **Hetzner** 🇩🇪
- **Cost:** €4.51/month (~$5 USD)
- **Port 25:** ✅ Open by default
- **Location:** Germany, Finland, USA
- **IP Reputation:** 🟢 Excellent
- **Setup Time:** ⚡ 5 minutes
- **Link:** [hetzner.com](https://www.hetzner.com/)

**Pros:**
- Cheapest option
- Great IP reputation
- Fast setup
- Excellent network

**Cons:**
- EU-based (GDPR compliance required)
- Limited US locations

#### 2. **OVH** 🇫🇷
- **Cost:** $6/month
- **Port 25:** ✅ Open by default
- **Location:** Worldwide
- **IP Reputation:** 🟢 Good
- **Setup Time:** ⚡ 10 minutes
- **Link:** [ovhcloud.com](https://www.ovhcloud.com/)

**Pros:**
- Global locations
- Reliable infrastructure
- Good support

**Cons:**
- Slightly more expensive
- Interface can be confusing

#### 3. **Vultr** 🌍
- **Cost:** $6/month
- **Port 25:** ✅ Open (may need ticket)
- **Location:** Worldwide
- **IP Reputation:** 🟡 Variable
- **Setup Time:** ⚡ 5 minutes
- **Link:** [vultr.com](https://www.vultr.com/)

**Pros:**
- Easy to use
- Many locations
- Good performance

**Cons:**
- May need to open support ticket for port 25
- IP reputation varies by location

#### 4. **Linode (Akamai)** 🌐
- **Cost:** $5/month
- **Port 25:** ✅ Open by default
- **Location:** Worldwide
- **IP Reputation:** 🟢 Good
- **Setup Time:** ⚡ 5 minutes
- **Link:** [linode.com](https://www.linode.com/)

**Pros:**
- Reliable
- Good documentation
- Clean IPs

**Cons:**
- Slightly more expensive for higher tiers

### ❌ **Avoid These for Email Verification:**

- **DigitalOcean** - Port 25 permanently blocked
- **AWS EC2** - Requires form submission and approval
- **Google Cloud** - Requires justification and limits
- **Azure** - Restricted, requires approval
- **Heroku/Vercel/Netlify** - No port 25 access

---

## Setting Up on a VPS

### Quick Setup Guide

1. **Choose a VPS provider** (e.g., Hetzner)

2. **Create a VPS instance**
   ```bash
   OS: Ubuntu 22.04 LTS
   RAM: 2GB minimum
   Storage: 20GB
   ```

3. **Deploy your application**
   ```bash
   # SSH into your VPS
   ssh root@your-vps-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   
   # Clone your repo
   git clone https://github.com/Escanor202695/email-verifier.git
   cd email-verifier
   
   # Install dependencies
   npm install
   
   # Build and run
   npm run build
   npm start
   ```

4. **Test port 25 connectivity**
   ```bash
   # Test if port 25 is open
   telnet gmail-smtp-in.l.google.com 25
   
   # You should see:
   # 220 mx.google.com ESMTP
   ```

5. **Set up reverse DNS (Optional but recommended)**
   - Configure PTR record for your IP
   - Improves email reputation
   - Reduces chance of being blocked

---

## Best Practices for SMTP Verification

### 1. **Rate Limiting** ⏱️
```javascript
// Don't hammer mail servers
- Max 10 requests per domain per minute
- Delay 200ms between same-domain checks
- Max 5 concurrent connections
```

### 2. **Respect Greylisting** 🔄
```javascript
// Some servers temporarily reject first attempts
- Retry after 5 minutes if greylisted
- Don't mark as invalid immediately
```

### 3. **Handle Timeouts Gracefully** ⏰
```javascript
// Set reasonable timeouts
- Connection timeout: 5 seconds
- Total verification timeout: 10 seconds
- Mark as "unknown" not "invalid" on timeout
```

### 4. **Monitor Your IP Reputation** 📊
```bash
# Check if your IP is blacklisted
- https://mxtoolbox.com/blacklists.aspx
- https://www.spamhaus.org/lookup/
- https://multirbl.valli.org/
```

### 5. **Use Proper SMTP Commands** 📝
```
EHLO verify.local          # Identify yourself
MAIL FROM:<verify@verify.local>  # Use consistent sender
RCPT TO:<target@domain.com>      # Check recipient
QUIT                       # Always close cleanly
```

---

## Conclusion

### Summary

- **Port 25 is essential** for real SMTP email verification
- **It's blocked everywhere** except dedicated servers/VPS
- **VPS hosting solves this** by providing unrestricted port 25 access
- **Costs ~$5-20/month** for a basic VPS
- **Alternatives exist** (APIs) but cost per verification

### Recommendation

**For Production Use:**
1. Start with **syntax + MX + disposable checks** (free, works everywhere)
2. Add **VPS with port 25** for SMTP verification ($5-20/month)
3. Or use **third-party API** for simplicity ($0.001-0.01 per email)

**For Development/Testing:**
- Accept that SMTP verification will timeout
- Mark as "risky" instead of "invalid"
- Focus on other validation methods

### This Project's Approach

Our email verifier handles port 25 blocking gracefully:
- ✅ Validates syntax
- ✅ Checks MX records
- ✅ Detects disposable domains
- ✅ Attempts SMTP verification
- ⚠️ Marks as "risky" (not invalid) on timeout
- 💡 Shows helpful message about port 25

This provides **maximum value** regardless of hosting environment!

---

## Additional Resources

- [RFC 5321 - SMTP Protocol](https://tools.ietf.org/html/rfc5321)
- [Why ISPs Block Port 25](https://www.spamhaus.org/news/article/803/port-25-blocking-best-practice-for-isps)
- [Email Verification Best Practices](https://sendgrid.com/blog/email-verification-best-practices/)
- [SMTP Response Codes](https://www.mailgun.com/blog/email/smtp-response-codes/)

---

**Questions or Issues?** Open an issue on [GitHub](https://github.com/Escanor202695/email-verifier/issues)

