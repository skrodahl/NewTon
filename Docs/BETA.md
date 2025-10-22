# Beta Release Process

Guide for using beta releases to test features safely before stable release.

---

## Why Beta Releases?

Beta releases let you:
- **Test in production safely** - Real Monday tournaments without affecting stable users
- **Iterate rapidly** - Re-release as many times as needed
- **No version pressure** - Beta signals "testing, might change"
- **Easy rollback** - Stable users stay on previous version

---

## Docker Tag Strategy

When you push a beta tag, GitHub Actions builds it separately from stable releases:

**Beta tag:** `v3.0.3-beta`
- Builds image: `ghcr.io/skrodahl/newton:3.0.3-beta`
- Does **not** update `:latest`
- Does **not** update `:3.0` or `:3`
- Stable users unaffected

**Stable tag:** `v3.0.3` (after beta testing complete)
- Builds image: `ghcr.io/skrodahl/newton:3.0.3`
- Updates `:latest`
- Updates `:3.0` and `:3`
- All users get the stable release

---

## Beta Release Workflow

### Step 1: Create Beta Release

```bash
# Commit your changes
git add .
git commit -m "Add new feature X"
git push

# Tag as beta
git tag v3.0.3-beta
git push origin v3.0.3-beta
```

GitHub Actions will automatically build `ghcr.io/skrodahl/newton:3.0.3-beta`

### Step 2: Test Beta Locally

Pull and run the beta image:

```bash
# Pull beta image
docker pull ghcr.io/skrodahl/newton:3.0.3-beta

# Stop current container
docker stop newton
docker rm newton

# Run beta version
docker run -d \
  --name newton \
  -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  ghcr.io/skrodahl/newton:3.0.3-beta
```

Or using docker-compose (edit `docker-compose.yml`):

```yaml
services:
  newton-tournament:
    image: ghcr.io/skrodahl/newton:3.0.3-beta  # Change to beta tag
    # ... rest of config
```

Then:
```bash
docker compose down
docker compose pull
docker compose up -d
```

### Step 3: Iterate on Beta (Optional)

Found a bug? Fix it and release another beta:

```bash
# Fix the bug
git add .
git commit -m "Fix edge case in feature X"
git push

# Release beta.2
git tag v3.0.3-beta.2
git push origin v3.0.3-beta.2

# Pull and test again
docker pull ghcr.io/skrodahl/newton:3.0.3-beta.2
docker stop newton && docker rm newton
docker run -d --name newton -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  ghcr.io/skrodahl/newton:3.0.3-beta.2
```

### Step 4: Graduate to Stable

After testing for 2-3 Monday tournaments (or whenever you're confident):

```bash
# Create stable release
git tag v3.0.3
git push origin v3.0.3
```

GitHub Actions will build the stable release and update `:latest`, `:3.0`, and `:3` tags.

**Optional:** Delete beta tags to keep things clean:

```bash
# Delete local beta tags
git tag -d v3.0.3-beta
git tag -d v3.0.3-beta.2

# Delete remote beta tags
git push origin :refs/tags/v3.0.3-beta
git push origin :refs/tags/v3.0.3-beta.2
```

**Optional:** Delete beta packages from GHCR:
- Go to https://github.com/skrodahl?tab=packages
- Click on `newton` package
- Find beta versions and delete them

---

## Example Timeline

**Week 1 - Monday Oct 28:**
```bash
git tag v3.0.3-beta
git push origin v3.0.3-beta
```
- Test duplicate prevention feature during tournament
- Works well, but notice edge case with special characters

**Week 2 - Tuesday Oct 29:**
```bash
git commit -m "Fix special character handling in duplicate check"
git tag v3.0.3-beta.2
git push origin v3.0.3-beta.2
```

**Week 2 - Monday Nov 4:**
- Test beta.2 during tournament
- Everything works perfectly
- Confident in the feature

**Week 3 - Tuesday Nov 5:**
```bash
git tag v3.0.3
git push origin v3.0.3
```
- Stable release!
- All users get the feature

---

## Reverting to Stable

If a beta has issues, easily revert to the last stable version:

```bash
# Revert to v3.0.2 (last stable)
docker pull ghcr.io/skrodahl/newton:3.0.2
docker stop newton && docker rm newton
docker run -d --name newton -p 8080:80 \
  -v ./tournaments:/var/www/html/tournaments \
  ghcr.io/skrodahl/newton:3.0.2
```

Or with docker-compose:
```yaml
image: ghcr.io/skrodahl/newton:3.0.2  # Pin to last stable
```

---

## Beta Naming Conventions

**First beta:**
- `v3.0.3-beta`

**Subsequent iterations:**
- `v3.0.3-beta.2`
- `v3.0.3-beta.3`
- etc.

**Alternative naming:**
- `v3.0.3-beta.1`, `v3.0.3-beta.2`, etc. (more explicit)
- `v3.0.3-rc1`, `v3.0.3-rc2` (release candidate style)

Use whatever feels natural. The important part is that it's clearly **not stable**.

---

## When to Use Beta vs Stable

**Use Beta When:**
- ✅ Testing new features before wide release
- ✅ Unsure about implementation details
- ✅ Want to iterate rapidly without version commitment
- ✅ Changes affect Docker/REST API (need server testing)
- ✅ Want real-world testing (Monday tournaments)

**Skip Beta, Go Straight to Stable When:**
- ✅ Tiny bug fix that can't break anything
- ✅ Documentation-only changes
- ✅ UI polish that's fully tested locally
- ✅ High confidence in the change

---

## Best Practices

1. **Test locally first** - Rebuild Docker image locally before tagging beta
2. **Use beta in production** - Run 2-3 Monday tournaments on beta before stable
3. **Document beta changes** - Note what's being tested in CHANGELOG
4. **Don't rush stable** - Take your time, no pressure to graduate beta quickly
5. **Clean up old betas** - Delete beta tags/packages after stable release

---

## Current Workflow Integration

This beta process fits perfectly with your **"take my time"** development philosophy:

- Make changes when inspired → Tag beta → Test over weeks → Release stable when confident
- No pressure to release immediately
- Real-world testing without risk
- Easy iteration if something needs adjustment

---

**Last updated:** October 22, 2025
