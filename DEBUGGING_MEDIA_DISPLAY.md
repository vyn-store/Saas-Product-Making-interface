# Debugging Media Display Issue

## Problem
The frontend shows "Generation Complete" but doesn't display the generated image and video.

## Root Cause Analysis

### Expected Data Flow
1. **User clicks "Generate AI Media"** on frontend
2. **Frontend POSTs** to n8n webhook: `https://kvktrades.app.n8n.cloud/webhook/vyn-media-gen`
3. **n8n responds immediately** with `{ success: true, jobId: "..." }`
4. **Frontend navigates** to `/generation/{jobId}` page
5. **Frontend starts polling** GET `/api/results/{jobId}` every 3 seconds
6. **n8n workflow processes** (2-5 minutes):
   - Generates AI prompts
   - Creates image with Kie AI
   - Creates video with Kie AI
7. **n8n POSTs results** to: `https://saas-product-making-interface.vercel.app/api/results/{jobId}`
8. **Vercel API stores** results in memory Map
9. **Next frontend poll** receives completed data
10. **Frontend displays** image and video

### Where Things Can Break

#### Issue #1: Callback URL Mismatch
**Problem**: n8n workflow is hardcoded to POST to:
```
https://saas-product-making-interface.vercel.app/api/results/{jobId}
```

**Check**:
- What's your actual Vercel deployment URL?
- Is it `saas-product-making-interface.vercel.app`?
- Or a custom domain?
- Or a different environment (preview, development)?

**Fix**:
1. Go to n8n dashboard: https://kvktrades.app.n8n.cloud
2. Open workflow: "Product Media Generation"
3. Find node: "Send Results to Frontend"
4. Update URL to match your actual Vercel deployment
5. Save and activate workflow

#### Issue #2: n8n Workflow Not Completing
**Problem**: Workflow might be stuck or failing silently

**Check n8n Execution**:
1. Go to: https://kvktrades.app.n8n.cloud
2. Click "Executions" tab
3. Find execution with your jobId
4. Check each node for:
   - ✓ Success (green)
   - ⏸ Waiting (yellow)
   - ✗ Error (red)

**Common Failures**:
- Kie AI API rate limits
- Kie AI task timeout
- Invalid prompts
- Network errors

#### Issue #3: Results Not Being Stored
**Problem**: n8n POSTs to Vercel but data isn't stored

**Check Vercel Logs**:
1. Go to Vercel dashboard
2. Select project: `saas-product-making-interface`
3. Go to Logs tab
4. Filter for: `/api/results/`
5. Look for POST requests from n8n

**What to Look For**:
```
[Results API POST] RECEIVED RESULTS FROM N8N
[Results API POST] JobId: 20260119233908-test-product
[Results API POST] imageUrl: https://...
[Results API POST] videoUrl: https://...
```

If you see:
```
[Results API POST] imageUrl: MISSING
[Results API POST] videoUrl: MISSING
```

Then n8n is sending incomplete data.

#### Issue #4: In-Memory Store Cleared
**Problem**: Vercel serverless functions restart and clear memory

**Note**: The current implementation uses an in-memory Map. This gets cleared when:
- Vercel redeploys
- Function cold starts
- Server restarts

**Workaround**:
- Generate media and poll within same serverless function lifecycle
- Keep the generation page open while processing

**Production Fix**:
- Implement Redis for persistent storage
- Or use a database (Postgres, MongoDB)

#### Issue #5: CORS Issues
**Problem**: n8n can't POST to Vercel due to CORS

**Check**: n8n workflow should set headers:
```json
{
  "Content-Type": "application/json"
}
```

Vercel API should allow POST from any origin (already implemented).

## Debugging Steps

### Step 1: Enable Enhanced Logging
The code has been updated with detailed logging. Deploy to Vercel and check logs.

### Step 2: Test a Generation
1. Open your app
2. Click "Discover Random Product"
3. Click "Generate AI Media"
4. Note the jobId from URL
5. Open browser console (F12)
6. Watch for logs starting with `[Poll]`

### Step 3: Check n8n Execution
1. Go to: https://kvktrades.app.n8n.cloud
2. Find workflow: "Product Media Generation"
3. Click "Executions"
4. Find execution with your jobId
5. Check node outputs:
   - "Parse Image Result" → should have imageUrl
   - "Format Response" → should have videoUrl
   - "Send Results to Frontend" → should show successful POST

### Step 4: Check Vercel Logs
1. Vercel Dashboard → Project → Logs
2. Filter time range to when you triggered generation
3. Search for your jobId
4. Look for POST requests to `/api/results/{jobId}`

### Step 5: Manual Test API Endpoint
If n8n completed but frontend didn't receive data, manually check:

```bash
# Replace with your actual jobId and Vercel URL
curl https://saas-product-making-interface.vercel.app/api/results/20260119233908-test-product
```

Expected response if data exists:
```json
{
  "success": true,
  "status": "completed",
  "data": {
    "imageUrl": "https://...",
    "videoUrl": "https://...",
    "imagePrompt": "...",
    "videoPrompt": "...",
    "jobId": "20260119233908-test-product",
    "receivedAt": "2026-01-19T23:39:08.000Z"
  }
}
```

Expected response if no data:
```json
{
  "success": false,
  "status": "processing",
  "message": "Results not yet available"
}
```

## Console Log Reference

### Browser Console Logs (Frontend)

**Generation Page Load**:
```
[Generation Page] Starting polling for jobId: 20260119233908-test-product
```

**Each Poll (every 3 seconds)**:
```
[Poll] Checking results...
[Poll] Response: { success: false, status: "processing", ... }
[Poll] Still processing... (status: processing)
```

**When Complete**:
```
[Poll] Checking results...
[Poll] Response: { success: true, status: "completed", data: {...} }
[Poll] ✓ GENERATION COMPLETE!
[Poll] Results data: { imageUrl: "https://...", videoUrl: "https://..." }
[Poll] - imageUrl: https://...
[Poll] - videoUrl: https://...
```

**If URLs Missing**:
```
[Poll] - imageUrl: MISSING
[Poll] - videoUrl: MISSING
```

### Vercel Logs (Backend)

**When n8n POSTs Results**:
```
================================================================================
[Results API POST] RECEIVED RESULTS FROM N8N
[Results API POST] JobId: 20260119233908-test-product
[Results API POST] Full Body: { ... }
[Results API POST] imageUrl: https://...
[Results API POST] videoUrl: https://...
[Results API POST] imagePrompt: Professional product photography...
[Results API POST] videoPrompt: 15-second UGC video...
[Results API POST] error: NONE
================================================================================
[Results API POST] ✓ Results stored successfully in memory
[Results API POST] Current store size: 1 entries
```

**When Frontend Polls**:
```
[Results API GET] Polling for jobId: 20260119233908-test-product
[Results API GET] ✓ Results found!
[Results API GET] - imageUrl: ✓ Present
[Results API GET] - videoUrl: ✓ Present
[Results API GET] - imagePrompt: ✓ Present
[Results API GET] - videoPrompt: ✓ Present
[Results API GET] Returning data to frontend...
```

## Quick Fixes

### Fix #1: Update n8n Callback URL
1. n8n Dashboard → "Product Media Generation" workflow
2. Node: "Send Results to Frontend"
3. Set URL to: `https://YOUR-ACTUAL-VERCEL-URL.vercel.app/api/results/{{$json.jobId}}`
4. Save & Activate

### Fix #2: Add Environment Variable
Add to Vercel environment variables:
```
NEXT_PUBLIC_APP_URL=https://saas-product-making-interface.vercel.app
```

Then update n8n to use: `{{$env.CALLBACK_URL}}/api/results/{{$json.jobId}}`

### Fix #3: Test Locally with ngrok
For local testing:
1. Run app locally: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Update n8n callback URL to ngrok URL
4. Test generation flow
5. Check terminal logs for API calls

## Expected Frontend Display

When working correctly, the generation page should show:

### While Processing
- Progress bar (0-95%)
- Elapsed time counter
- Current step description
- "Please Wait" card

### When Complete
- ✓ Green checkmark icon
- "Generation Complete!" heading
- Two cards side-by-side:
  - **Generated Image** card with:
    - Image preview
    - Image prompt text
    - "Download Image" button
  - **Generated Video** card with:
    - Video player with controls
    - Video prompt text
    - "Download Video" button

### If Data Missing
If `imageUrl` and `videoUrl` are missing, you'll see:
- ✓ Green checkmark icon
- "Generation Complete!" heading
- Fallback instructions:
  - "How to Get Your Media"
  - 4-step guide to check n8n dashboard
  - "Open n8n Dashboard" button

## Support Checklist

When asking for help, provide:
- [ ] JobId from URL
- [ ] Browser console logs (copy all `[Poll]` logs)
- [ ] Vercel deployment URL
- [ ] n8n execution status (success/failed)
- [ ] Screenshot of n8n execution nodes
- [ ] Vercel logs for the POST request
- [ ] Screenshot of frontend showing "Generation Complete"

## Next Steps

1. **Deploy updated code** with enhanced logging
2. **Test a generation** and collect all logs
3. **Check n8n execution** to verify completion
4. **Check Vercel logs** to verify callback received
5. **Review browser console** to see what data frontend receives

If you still see "Generation Complete" without media after these steps, share:
- Browser console logs
- Vercel API logs
- n8n execution screenshot

And we'll debug further!
