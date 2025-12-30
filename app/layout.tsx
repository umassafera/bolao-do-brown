export const metadata = {
  title: "Bolão do Brown",
  description: "Checador da Mega-Sena",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
