export default function manifest() {
  return {
    name: "LK Academy",
    short_name: "LK Academy",
    description: "Attendance, students and payroll for every LK Academy branch.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f1ef",
    theme_color: "#6f1f31",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
