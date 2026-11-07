# Google Search Console "Couldn't fetch" Sitemap Checklist & Fixes

If your sitemap is loading perfectly in your browser at `https://lions-karate-club-pune.vercel.app/sitemap.xml` but Google Search Console (GSC) says **"Couldn't fetch"** in red, follow these quick diagnostic checks and steps:

## 1. The GSC Queue Bug (Most Common)
* **The Issue:** When you submit a sitemap for the first time, Google often immediately shows "Couldn't fetch" because it has queued the request but hasn't actually crawled it yet.
* **The Solution:** **Wait 24 to 72 hours.** Google usually crawls and updates the status to green "Success" automatically without you changing anything.

## 2. Double-Check Domain Accuracies
* **The Issue:** The property URL in GSC must exactly match your live website.
* **Checks:**
  - Make sure the GSC property selected in your top-left dropdown is exactly `https://lions-karate-club-pune.vercel.app/` (with `https://` and without `www`).
  - Do not submit the sitemap under a developer/live preview URL such as `https://ais-pre-...asia-southeast1.run.app`.

## 3. Robots.txt Permission Checks
* Ensure your `robots.txt` file at `https://lions-karate-club-pune.vercel.app/robots.txt` allows crawlers to reach the sitemap.
* **Your current configuration:**
  ```text
  User-agent: *
  Allow: /
  Sitemap: https://lions-karate-club-pune.vercel.app/sitemap.xml
  ```
  *(This is 100% correct and fully open for Google Bots).*

## 4. Forced Re-evaluation Step
If the status doesn't turn green after 3 days:
1. Click on the three dots next to `/sitemap.xml` under GSC "Submitted sitemaps" and click **Remove sitemap**.
2. Refresh the page.
3. Submit the sitemap again by typing `sitemap.xml` and clicking **Submit**.
4. Use the **URL Inspection** tool in GSC for your homepage (`https://lions-karate-club-pune.vercel.app/`), click **Request Indexing** to invite Google's bot to crawl your site faster.

## 5. "Quota Exceeded" on Request Indexing
* **What it means:** Google places a strict daily limit on how many manual crawl requests (using "Request Indexing") a single user/property can submit in 24 hours (usually around 10 to 15 URL inspect requests).
* **The Solution:** 
  - **Do nothing else today:** Since Google's quota is strictly server-side and resets every 24 hours, you just have to wait.
  - **No impact on automatic crawl:** Exceeding this manual quota does **NOT** block Google's automated crawler. Google will still automatically discover and crawl your sitemap and pages on its own schedule.
  - **Retry tomorrow:** If you still feel the need to manually request indexing, try again in 24 hours.

