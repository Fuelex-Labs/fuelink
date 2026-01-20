# Contributing to Fuelink

First off, thank you for considering contributing to Fuelink! 🎉

Fuelink is the audio engine powering the Fuelex ecosystem, and community contributions are what make open-source projects thrive. Whether you're fixing bugs, adding features, improving documentation, or sharing ideas—every contribution matters.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Style Guide](#style-guide)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. We expect all contributors to:

- Be respectful and considerate in discussions
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes and learn from them

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn** or **pnpm**
- **Git** for version control
- A **Lavalink** server for testing (v4.x recommended)

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fuelink.git
   cd fuelink
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/Fuelex-Labs/fuelink.git
   ```

---

## Development Setup

### Install Dependencies

```bash
npm install
```

### Project Structure

```
fuelink/
├── index.js                # Main entry point
├── src/
│   ├── Fuelink.js          # Core client
│   ├── structures/         # Core data structures
│   ├── managers/           # Node & player management
│   ├── adapters/           # Discord & DisTube integration
│   ├── plugins/            # Plugin system
│   ├── persistence/        # State persistence
│   ├── events/             # Event system
│   └── utils/              # Utilities
├── examples/               # Usage examples
└── tests/                  # Test suites
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.js
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

---

## Making Changes

### Branch Naming

Create a descriptive branch for your changes:

```bash
# Feature
git checkout -b feature/add-spotify-autoplay

# Bug fix
git checkout -b fix/node-reconnection-issue

# Documentation
git checkout -b docs/improve-filter-examples

# Refactor
git checkout -b refactor/optimize-queue-operations
```

### Keep Your Fork Updated

Before starting work, sync with upstream:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, readable history.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, semicolons) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies |

### Examples

```bash
# Feature
git commit -m "feat(queue): add priority queue support"

# Bug fix
git commit -m "fix(node): handle reconnection timeout correctly"

# Documentation
git commit -m "docs(readme): add filter examples"

# Multiple lines
git commit -m "feat(player): implement gapless playback

- Add track preloading
- Handle crossfade transitions
- Update position tracking

Closes #123"
```

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream** to avoid merge conflicts
2. **Run tests** and ensure they pass
3. **Run linting** and fix any issues
4. **Update documentation** if needed
5. **Add tests** for new features

### PR Template

When opening a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test these changes?

## Checklist
- [ ] My code follows the project style
- [ ] I have added tests
- [ ] I have updated documentation
- [ ] All tests pass locally
```

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Celebrate! 🎉

---

## Reporting Bugs

### Before Reporting

- Check existing [issues](https://github.com/Fuelex-Labs/fuelink/issues)
- Ensure you're using the latest version
- Test with minimal reproduction code

### Bug Report Template

```markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Create player with '...'
2. Add track '...'
3. Call method '...'
4. See error

**Expected behavior**
What you expected to happen.

**Environment**
- Fuelink version: x.x.x
- Node.js version: x.x.x
- Lavalink version: x.x.x
- Discord.js version: x.x.x (if applicable)

**Additional context**
Error logs, screenshots, etc.
```

---

## Suggesting Features

We welcome feature suggestions! Please:

1. Check if the feature is already requested
2. Open an issue with the `enhancement` label
3. Describe the feature and its use case
4. Explain why it benefits the project

---

## Style Guide

### JavaScript

- **CommonJS** require/module.exports (no ES modules)
- **'use strict'** at the top of every file
- **JSDoc comments** for all public methods
- **2-space indentation**
- **Single quotes** for strings
- **Semicolons** required
- **120 character** line limit

### Example

```javascript
'use strict';

/**
 * @file Example module
 * @module fuelink/example
 */

const { EventEmitter } = require('events');

/**
 * Example class demonstrating style
 */
class Example extends EventEmitter {
  /**
   * Create an Example instance
   * @param {Object} options - Configuration options
   * @param {string} options.name - Instance name
   * @param {boolean} [options.enabled=true] - Whether enabled
   */
  constructor(options = {}) {
    super();
    
    /** @type {string} */
    this.name = options.name;
    
    /** @type {boolean} */
    this.enabled = options.enabled ?? true;
  }

  /**
   * Process an item
   * @param {Object} item - Item to process
   * @returns {Promise<Object>} Processed item
   */
  async process(item) {
    if (!this.enabled) {
      throw new Error('Instance is disabled');
    }
    
    return { ...item, processed: true };
  }
}

module.exports = { Example };
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `PlayerManager` |
| Methods | camelCase | `getPlayer()` |
| Constants | UPPER_SNAKE | `DEFAULT_TIMEOUT` |
| Files | PascalCase | `PlayerManager.js` |
| Private | _prefix | `_internalMethod()` |
| Events | camelCase | `trackStart` |

---

## Questions?

Feel free to:
- Open a [Discussion](https://github.com/Fuelex-Labs/fuelink/discussions)
- Join the community Discord
- Tag maintainers in issues

---

Thank you for contributing to Fuelink! ⚡
