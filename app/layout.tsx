import type { Metadata } from "next";
import { headers } from "next/headers";
import "katex/dist/katex.min.css";
import "./globals.css";
import "./article-reset.css";

const title = "A Feature That Makes Gemma Keep Reasoning";
const description =
  "Attribution graphs found a Gemma feature for mathematical continuation. Ten verified trajectories show where keeping the argument going helps and where it does not.";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og-cases.png`;

  return {
    metadataBase: new URL(origin),
    title,
    description,
    openGraph: {
      title,
      description: "Tracing and steering a sentence-boundary continuation feature in Gemma-3-4B-IT.",
      type: "article",
      images: [{ url: socialImage, width: 1736, height: 906, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "Tracing and steering a sentence-boundary continuation feature in Gemma-3-4B-IT.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
