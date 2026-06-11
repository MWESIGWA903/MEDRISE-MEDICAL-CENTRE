---
name: MedRise workflows
description: Two workflows needed — API server on port 8080 and frontend on port 8081
---

**API workflow:** name="Start API", command=`PORT=8080 pnpm --filter @workspace/api-server run dev`, port 8080, outputType="console"

**Frontend workflow:** name="Start Frontend", command=`PORT=8081 pnpm --filter @workspace/medrise run dev`, port 8081, outputType="webview"

**Why:** The .replit file maps localPort 8080→externalPort 8080 and localPort 8081→externalPort 80 (preview). These ports must be used precisely.

Note: "Project" is a prohibited workflow name in Replit — use a descriptive name instead.
