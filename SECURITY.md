# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Fuelink, please follow these steps:

1. **Do NOT** open a public issue
2. Email us at security@fuelink.dev (or open a private security advisory on GitHub)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time**: We aim to respond within 48 hours
- **Updates**: We'll keep you informed of our progress
- **Disclosure**: We follow responsible disclosure practices
- **Credit**: With your permission, we'll credit you in the release notes

## Security Best Practices

When using Fuelink in your project:

1. **Keep dependencies updated** - Run `npm audit` regularly
2. **Secure your Lavalink password** - Never commit passwords to version control
3. **Use environment variables** - Store sensitive configuration in `.env` files
4. **Validate user input** - Sanitize search queries and URLs
5. **Limit permissions** - Only request necessary Discord permissions

Thank you for helping keep Fuelink secure! 🔐
