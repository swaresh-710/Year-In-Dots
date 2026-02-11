# Year In Dots - Setup & Publishing Guide

This guide will help you install the "Year In Dots" extension on your browser and publish it to the Chrome Web Store for others to use.

## 1. How to Make it Live (Local Installation)

To use the extension yourself and set it as your default home screen (New Tab page):

1.  Open Google Chrome.
2.  Type `chrome://extensions` in the address bar and press Enter.
3.  In the top-right corner, toggle the switch for **Developer mode** to **ON**.
4.  Click the **Load unpacked** button that appears in the top-left.
5.  Select the `YearInDots` folder (the folder containing `manifest.json`).
6.  **Done!** Open a new tab. Chrome might ask "Is this the new tab page you expected?". Click **"Keep it"**.

You now have the extension running live as your default home screen.

## 2. How to Set as Default Home Screen

By design, this extension "overrides" the New Tab page.
*   Once you **Load unpacked** (as above) and click **"Keep it"**, it automatically becomes your default home screen whenever you open a new tab.
*   You don't need to change any other settings.

## 3. How to Add to Chrome Web Store (Publishing)

To verify and share your extension with the world, follow these steps:

### Prerequisites:
*   A Google account.
*   $5.00 USD (one-time fee) to register as a Chrome Web Store developer.

### Steps:

1.  **Zip the Project**:
    *   Go to your `YearInDots` folder.
    *   Select all files (`manifest.json`, `newtab.html`, `script.js`, `style.css`, `icon.png`).
    *   Right-click -> **Compress to ZIP file** (or Send to -> Compressed (zipped) folder).
    *   Name it `YearInDots.zip`.

2.  **Register**:
    *   Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/dev/dashboard).
    *   Sign in and pay the $5 registration fee if you haven't already.

3.  **Upload**:
    *   Click **"New Item"** in the dashboard.
    *   Upload your `YearInDots.zip` file.

4.  **Store Listing**:
    *   Fill in the details:
        *   **Description**: Explain what it does (e.g., "Visualizes your year as a grid of dots...").
        *   **Category**: "Productivity" or "Fun".
        *   **Language**: English.
        *   **Screenshots**: Take a screenshot of your new tab page and upload it (1280x800 recommended).
        *   **Icon**: You can upload the `icon.png` here as well if asked for a store icon.

5.  **Privacy**:
    *   Since your extension uses `storage` (to save settings), you might need to check "Single Purpose" and justify that it saves user preferences locally.
    *   You likely do **not** collect user data, so you can state that.

6.  **Submit**:
    *   Click **"Submit for Review"**.
    *   Google will review it (usually takes 1-3 days). Once approved, it will be live for everyone to download!
