import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reserva Podcast Studio · Steren Panamá",
  description: "Reserva tu sesión en el podcast studio de Steren Panamá.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
