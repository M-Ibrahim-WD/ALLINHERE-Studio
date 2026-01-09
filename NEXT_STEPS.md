# Next Steps to Complete ALLINHERE Studio

You have a solid, fully initialized React Native MVP codebase with a native project structure.

## 1. Install Dependencies
Run this command to install all dependencies, including the new native modules:

```bash
npm install
```

## 2. Environment Variables
Ensure your `.env` file is populated with valid keys:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `STRIPE_PUBLISHABLE_KEY`

## 3. Run the App
Start the Android app:

```bash
npm run android
```

If you encounter build errors, try cleaning the build:
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

## 4. Verify Features
1.  **Auth**: Sign up a new user.
2.  **Projects**: Create a project.
3.  **Media**: Upload a file (uses `react-native-document-picker`).
4.  **Camera**: Open the Camera tab (uses `react-native-vision-camera`).
5.  **Payments**: Go to subscription (uses `@stripe/stripe-react-native`).

## 5. Backend Functions (Supabase)
The payment system requires backend functions to communicate with Stripe securely. I have generated the function code in `supabase/functions/`.

**To Deploy:**
1.  Install Supabase CLI.
2.  Login: `supabase login`
3.  Link your project: `supabase link --project-ref your-project-ref`
4.  Set Stripe Secret Key: `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`
5.  Deploy functions:
    ```bash
    supabase functions deploy create-subscription
    supabase functions deploy cancel-subscription
    ```

## 6. Export Feature (FFmpeg)
The `ExportScreen` currently uses a simulated progress bar for the MVP. To enable real video rendering:
1.  Install `ffmpeg-kit-react-native`.
2.  Follow their [Android Installation Guide](https://github.com/tanersener/ffmpeg-kit/tree/main/react-native).
3.  Uncomment the implementation in `src/screens/editor/ExportScreen.tsx`.
