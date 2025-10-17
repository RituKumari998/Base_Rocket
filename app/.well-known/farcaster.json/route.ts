import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    
      "accountAssociation": {
     "header": "eyJmaWQiOjI2ODAwOSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc5M0Y2MTBGNUUwQjM2RDc0OThkQUFhMTdFZDVBZjAyNTc5NjJlN0IifQ",
    "payload": "eyJkb21haW4iOiJhcmJqdW1wLnZlcmNlbC5hcHAifQ",
    "signature": "MHgyMWU3OGU4YThkNTNlMzgwYTNlZTE1MzI5ZDRiZDg0ZmVkOWQzMTI1ZDliMzU2YzJmMjZkZTQ3MzlkNDU1NTc3NGFjMGQ0YjM4YjJjMDcxNGUyMzEzYmZhZWI0MDRiM2RkZGVlYjQ3YWJhMzI5YTNjNDg1NmM3YjcxODU2NTI3ZDFi"
      },
    
    frame: {
      version: "1",
      name: "Base Rocket",
      iconUrl: `${APP_URL}/images/icon.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/feed.png`,
      screenshotUrls: [],
      tags: ["Base", "farcaster", "miniapp", "games"],
      primaryCategory: "games",
      buttonTitle: "Play Now",
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: "#ffffff",
      webhookUrl: `${APP_URL}/api/webhook`,
      subtitle: " ",
      description: "Base Rocket",
      tagline:"Base Rocket",
      ogTitle:"Base Rocket",
      ogDescription: "Base Rocket",
      ogImageUrl: `${APP_URL}/images/feed.png`,
      heroImageUrl: `${APP_URL}/images/feed.png`,
      requiredChains: ["eip155:42161"],
    },

  };

  return NextResponse.json(farcasterConfig);
}
