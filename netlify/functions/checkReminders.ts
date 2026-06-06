import { Handler } from "@netlify/functions";

export const handler: Handler = async (event, context) => {
  try {
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers.host;
    
    if (!host) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Host header is missing" })
        };
    }

    const url = `${protocol}://${host}/api/cron/check-reminders`;
    console.log("[Netlify Cron] Triggering internal Next.js cron at", url);
    
    const res = await fetch(url);
    const data = await res.json();
    
    return {
      statusCode: res.status,
      body: JSON.stringify(data)
    };
  } catch (error: any) {
    console.error("[Netlify Cron] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
