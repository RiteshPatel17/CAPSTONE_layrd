// ─────────────────────────────────────────────
// LÄYRD – Root Layout (server component)
// No "use client" here — interactive state lives in Providers.jsx
// ─────────────────────────────────────────────
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "LÄYRD – Cake in a Can | Espresso Shots",
  description:
    "LÄYRD is a Calgary boutique dessert brand. Handcrafted cheesecakes and tiramisus in 250ml cans. Order online for pickup or delivery in Calgary.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Google Fonts removed in favour of system monospace */}
        {/* ── Theme init: read localStorage and set data-theme before first paint ── */}
        {/* This prevents a flash of light/dark on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('layrd-theme');if(t==='night'){document.documentElement.setAttribute('data-theme','night');}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
