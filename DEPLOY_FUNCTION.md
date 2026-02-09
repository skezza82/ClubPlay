# Deploying Your IGDB Cloud Function

To make the game search work live, you need to deploy the function we just created and set your Twitch/IGDB keys.

### 1. Set your Environment Configuration
Run these commands in your terminal (replace the values with your actual keys from dev.twitch.tv):

```bash
firebase functions:config:set twitch.id="YOUR_CLIENT_ID" twitch.secret="YOUR_CLIENT_SECRET"
```

### 2. Deploy the Function
Deploy the function to Firebase:

```bash
firebase deploy --only functions
```

### 3. Get the Function URL
After deployment, Firebase will print the **Function URL** in the terminal. It looks like:
`https://us-central1-your-project-id.cloudfunctions.net/searchGames`

### 4. Update your App
You will need to add this URL to your `.env.local` file or directly in the code if you prefer (since the URL itself is public, but the keys are hidden on the server).

I have updated the code to look for a `NEXT_PUBLIC_FUNCTIONS_URL` environment variable, or default to the standard Firebase URL format.
