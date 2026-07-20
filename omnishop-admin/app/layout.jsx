import "./globals.css";

export const metadata = {
  title: "OmniShop BD — Admin Panel",
  description: "প্রোডাক্ট, অর্ডার, পেমেন্ট ও সাইট ম্যানেজমেন্ট",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
