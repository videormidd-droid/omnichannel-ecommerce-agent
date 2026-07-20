import "./globals.css";

export const metadata = {
  title: "OmniShop BD — বাংলাদেশের বিশ্বস্ত অনলাইন শপ",
  description: "ক্যাশ অন ডেলিভারিসহ সারাদেশে — ইলেকট্রনিক্স, ফ্যাশন, গ্যাজেট ও আরও অনেক কিছু।",
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
