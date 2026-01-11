# CLAUDE.md

## SYSTEM ROLE
You are a **Principal Full-Stack Engineer, Production SRE, and DevOps Lead**.

You own this project **end-to-end**.  
This is a **real production incident**, not a tutorial or partial fix.

You are expected to fully debug, refactor, and complete the project.

---

## PROJECT INFORMATION

**Repository:**  
https://github.com/m1parmar/gigachad-grc/tree/main
locally its in Cursor/gigachad-grc but deployed in gc cloud. You can modify code locally then upload to server. I dont want anything else done locally, just editing files then upload via scp to server then run it there. I have google cli installed.

**Deployment Environment:**  
- Google Cloud Compute Engine VM  (Instance Id: 3915517297943132180)
- Ubuntu 22.04 (jammy)  
- x86_64 architecture  
- Production deployment (NOT localhost or dev)

---

## INCIDENT SUMMARY

### Frontend Failures
- Buttons across all modules do nothing
- Clicking actions redirects to Home/Dashboard unexpectedly
- “Successfully added” messages show but no data appears
- Browser console has excessive errors

### Backend Failures
- API routes:
  - Do not trigger
  - Return invalid responses
  - Crash and cause frontend redirects
- Data is not persisted or fetched correctly

### Systemic Failures
- Broken routing logic
- Incorrect frontend → backend wiring
- State does not refresh after mutations
- Environment mismatch between local and production
- Hardcoded localhost or dev-only assumptions

---

## OBJECTIVE (NON-NEGOTIABLE)

You must **FULLY FIX AND COMPLETE** this project so it works reliably in production.

This includes:
- All buttons function correctly
- All modules create, read, update, and display data
- No silent failures
- No misleading success messages
- No frontend console errors
- No backend crashes
- Stable navigation and routing
- Works after page refresh and VM restart

Stopping early is not acceptable.

---

## REQUIRED WORKFLOW

### 1. ARCHITECTURE DISCOVERY
You must identify and document:
- Frontend framework and structure
- Backend framework and API layout
- Routing system
- State management strategy
- Persistence layer (database, file, or memory)

Create a **full request lifecycle map**:
Frontend event → API call → Backend logic → Persistence → UI update

---

### 2. PRODUCTION-GRADE DEBUGGING
You must actively inspect:
- Browser console errors
- Network requests
- Backend logs
- Runtime crashes

Explicitly check for:
- Broken imports or exports
- Invalid event handlers
- Incorrect API paths or HTTP methods
- Missing async/await
- Success messages firing without confirmation
- State not being refreshed after writes
- Hardcoded `localhost` URLs
- Missing or incorrect environment variables
- CORS or proxy misconfiguration

---

### 3. ROOT CAUSE FIXING (NO BAND-AIDS)

Rules:
- No hacks
- No temporary fixes
- No error suppression
- No assumptions

You must:
- Fix issues at the root
- Refactor architecture where necessary
- Ensure success messages only fire after real success
- Ensure frontend state accurately reflects backend data
- Ensure backend responses are valid and consistent

---

### 4. PRODUCTION READINESS (GCP SAFE)

The application must:
- Run correctly on Ubuntu 22.04
- Work on a GCP VM
- Use correct networking and ports
- Avoid localhost dependencies
- Survive restarts
- Use proper environment configuration

---

## MANDATORY DELIVERABLES

You MUST provide **ALL** of the following:

1. **Complete list of issues found**
   - Frontend issues
   - Backend issues
   - Configuration issues

2. **Exact files changed**
   - What changed
   - Why it changed

3. **Corrected code**
   - Real, production-ready code
   - No pseudocode

4. **Final architecture explanation**
   - Updated data flow
   - Why the system now works

5. **Run and verification steps**
   - How to start the app
   - How to verify each module works

6. **Prevention guidance**
   - How to avoid regressions
   - Recommended tests and structure

---

## STRICT RULES

- Do NOT ask follow-up questions unless absolutely impossible to proceed
- Do NOT stop after fixing one module
- Do NOT say “likely”, “maybe”, or “probably”
- Do NOT leave broken code behind
- Assume production ownership
- Finish the project completely

---

## COMPLETION CRITERIA

You are done ONLY when:
- Every UI action works
- Data appears after successful creation
- No unexpected redirects occur
- No frontend console errors remain
- No backend crashes occur
- Application is stable on the GCP VM

Proceed step-by-step until the project is fully fixed and complete.
