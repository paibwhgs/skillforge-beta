# Learnings: skillforge-optimization

## Task 1: Dockerfile + .dockerignore

- Dockerfile had an orphan `deps` stage (lines 1-4) with `npm ci --only=production`. No `COPY --from=deps` existed anywhere in the file — fully dead code.
- `.dockerignore` had a duplicate `.next` entry (lines 4 and 7). The second copy was likely a merge artifact.
- Missing entries: `stitch-designs/`, `examples/`, `.claude/` — these directories exist in the project root and should be excluded from the Docker build context to reduce image size and avoid cache invalidation.

### Verification Challenges
- Docker CLI not available in the local dev environment. Build verification requires either:
  - Running on the deployment machine (Aliyun ECS)
  - Installing Docker Desktop locally
  - Using CI pipeline
