# Docker Hub Push Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up manual and automated Docker Hub pushing for f1-dashboard so pre-built images can be pulled directly on Unraid.

**Architecture:** Create a push script for manual builds, a GitHub Actions workflow for CI/CD, and a separate docker-compose for Unraid that pulls from Docker Hub instead of building locally.

**Tech Stack:** Docker, Docker Hub (`jthil23/f1-dashboard`), GitHub Actions, shell scripting

---

### Task 1: Create manual push script

**Files:**
- Create: `f1-dashboard/push.sh`

**Step 1: Create the push script**

```bash
#!/bin/bash
set -e

IMAGE="jthil23/f1-dashboard"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "Building $IMAGE..."
docker build -t "$IMAGE:latest" -t "$IMAGE:$TIMESTAMP" .

echo "Pushing $IMAGE:latest..."
docker push "$IMAGE:latest"

echo "Pushing $IMAGE:$TIMESTAMP..."
docker push "$IMAGE:$TIMESTAMP"

echo "Done! Pushed:"
echo "  $IMAGE:latest"
echo "  $IMAGE:$TIMESTAMP"
```

**Step 2: Make it executable**

Run: `chmod +x f1-dashboard/push.sh`

**Step 3: Commit**

```bash
git add f1-dashboard/push.sh
git commit -m "feat: add manual Docker Hub push script"
```

---

### Task 2: Create .dockerignore

**Files:**
- Create: `f1-dashboard/.dockerignore`

**Step 1: Create .dockerignore to keep image small**

```
node_modules
.next
.git
*.md
docs
push.sh
docker-compose*.yml
.env*
```

**Step 2: Commit**

```bash
git add f1-dashboard/.dockerignore
git commit -m "feat: add .dockerignore for cleaner builds"
```

---

### Task 3: Create GitHub Actions workflow

**Files:**
- Create: `.github/workflows/docker-publish.yml`

**Step 1: Create the workflow file**

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]
    paths:
      - 'f1-dashboard/**'
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./f1-dashboard
          push: true
          tags: |
            jthil23/f1-dashboard:latest
            jthil23/f1-dashboard:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Step 2: Commit**

```bash
git add .github/workflows/docker-publish.yml
git commit -m "feat: add GitHub Actions workflow for Docker Hub CI/CD"
```

**Step 3: Set up GitHub repo secrets (manual step)**

In your GitHub repo, go to Settings > Secrets and variables > Actions, and add:
- `DOCKERHUB_USERNAME`: `jthil23`
- `DOCKERHUB_TOKEN`: Create an access token at https://hub.docker.com/settings/security and paste it here

---

### Task 4: Create Unraid docker-compose

**Files:**
- Create: `f1-dashboard/docker-compose.hub.yml`

**Step 1: Create a pull-based docker-compose for Unraid**

```yaml
services:
  f1-dashboard:
    image: jthil23/f1-dashboard:latest
    container_name: f1-dashboard
    ports:
      - "8100:3000"
    environment:
      - DATABASE_URL=mysql://mainUser:mainPass@192.168.1.103:3306/JT-F1
    restart: unless-stopped
```

**Step 2: Commit**

```bash
git add f1-dashboard/docker-compose.hub.yml
git commit -m "feat: add Unraid docker-compose that pulls from Docker Hub"
```

---

### Task 5: Remove node_modules from repo copy

**Files:**
- Modify: `.gitignore`

**Step 1: Add gitignore entry**

Add `node_modules/` to `.gitignore` at the repo root to prevent committing the copied node_modules.

**Step 2: Remove node_modules from tracking if needed**

Run: `git rm -r --cached f1-dashboard/node_modules/ 2>/dev/null || true`

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore node_modules"
```
