import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PedeAí - Delivery local para sua cidade",
  description: "Comida, remédios, compras e muito mais. Entrega rápida para toda a cidade.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={poppins.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
