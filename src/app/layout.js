import "./globals.css";
import ChildRender from "@/components/main/ChildHandling";

export const metadata = {
  title: "Arunalu Lanka | Loan Management System",
  description:
    "We provide best financial solutions and services to the customers through building strong relationships as a trusted friend to enhancing their quality of life.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="description" content={metadata.description} />
        <title>{metadata.title}</title>
      </head>
      <body className="antialiased font-sf">
        <ChildRender>{children}</ChildRender>
      </body>
    </html>
  );
}
