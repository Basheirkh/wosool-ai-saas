# Resolve Git Conflict on Server

## Quick Fix

You have local changes to `docker-compose.yml` that conflict with the remote. Here's how to resolve:

### Option 1: Stash local changes (recommended if you want to keep them)
```bash
cd /root/wosool-ai
git stash
git pull
git stash pop  # Re-apply your local changes if needed
```

### Option 2: Discard local changes (use remote version)
```bash
cd /root/wosool-ai
git checkout -- docker-compose.yml
git pull
```

### Option 3: Commit local changes first
```bash
cd /root/wosool-ai
git add docker-compose.yml
git commit -m "Local docker-compose changes"
git pull
# If conflicts occur, resolve them manually
```

## After resolving, run force-rebuild:

```bash
chmod +x force-rebuild.sh
./force-rebuild.sh
```

