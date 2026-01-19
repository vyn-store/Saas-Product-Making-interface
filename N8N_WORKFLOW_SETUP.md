# n8n Workflow Setup for Result Callback

## Overview
This document explains how to configure your n8n workflow to automatically send generation results back to the frontend when complete.

## Current Issue
The workflow was creating duplicate items (2 images, 2 videos) because both "Respond Immediately" and "Generate Job ID" nodes were sending data forward to the AI agent.

## Required Changes

### 1. Fix Duplication Issue
**Action**: Disconnect the "Respond Immediately" node from the AI prompt generator.

- Only the "Generate Job ID" node should connect forward to your AI agent/prompt nodes
- The "Respond Immediately" node should be a terminal node that only sends the initial HTTP response
- This ensures only ONE set of data flows through the AI generation pipeline

### 2. Add HTTP Request Node at End of Workflow

After your video generation completes, add a new **HTTP Request** node with these settings:

#### Node Configuration

**Method**: `POST`

**URL**: `https://saas-product-making-interface.vercel.app/api/results/{{ $node["Generate Job ID"].json.jobId }}`

**Authentication**: None

**Send Body**: Yes (JSON)

**Body Content** (use Expression mode):
```json
{
  "imageUrl": "{{ $node["Flux AI Image"].json.imageUrl }}",
  "videoUrl": "{{ $node["Luma AI Video"].json.videoUrl }}",
  "imagePrompt": "{{ $node["Image Prompt Generator"].json.prompt }}",
  "videoPrompt": "{{ $node["Video Prompt Generator"].json.prompt }}"
}
```

**Important Notes**:
- Replace node names like `"Flux AI Image"`, `"Luma AI Video"`, etc. with your actual node names in the workflow
- The `jobId` must come from the "Generate Job ID" node that was used in the initial response
- All fields are optional - the frontend will display whatever is available

#### Headers
Add these headers to the HTTP Request node:

| Name | Value |
|------|-------|
| Content-Type | application/json |

### 3. Error Handling (Optional but Recommended)

Add an **Error Trigger** node connected to your HTTP Request node to catch any failures:

1. Add "Error Trigger" node
2. Set it to watch the HTTP Request node
3. On error, you could:
   - Log the error to a database
   - Send a notification
   - Retry the request

## Workflow Structure

Your final workflow should look like this:

```
Webhook Trigger
  ├─→ Respond Immediately (terminal - no connections forward)
  └─→ Generate Job ID
       └─→ Extract Product Data
            └─→ Image Prompt Generator
                 └─→ Flux AI Image Generator
                      └─→ Video Prompt Generator
                           └─→ Luma AI Video Generator
                                └─→ HTTP Request (Send Results to Frontend)
```

## Testing

1. Deploy the updated frontend code to Vercel
2. Update your n8n workflow with the changes above
3. Click "Generate AI Media" from the frontend
4. Wait for the generation to complete
5. The frontend should automatically display the image and video when ready
6. If results don't appear, check:
   - n8n workflow execution logs
   - Browser console for polling errors
   - Vercel logs for API endpoint errors

## Frontend Polling

The frontend now polls `/api/results/{jobId}` every 3 seconds to check if results are available. When n8n POSTs to this endpoint, the results are stored and the frontend immediately displays them.

## Production Considerations

For production use, you should:
1. Replace the in-memory Map storage in `/api/results/[jobId]/route.ts` with Redis or a database
2. Add authentication to the results endpoint
3. Add a webhook signature verification to ensure requests are from your n8n instance
4. Set up result expiration (auto-delete old results after 24 hours)
