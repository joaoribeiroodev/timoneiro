import "./globals.css";

export const metadata = {
  title: "Timoneiro — Internacional Travessias",
  description:
    "Sistema de mapeamento 3D de câmeras e televisões da frota — Internacional Travessias Salvador.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
