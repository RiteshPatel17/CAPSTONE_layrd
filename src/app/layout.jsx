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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* ── Theme init: read localStorage and set data-theme before first paint ── */}
        {/* This prevents a flash of light/dark on page load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('layrd-theme');if(t==='night'){document.documentElement.setAttribute('data-theme','night');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
