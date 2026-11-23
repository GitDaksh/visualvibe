import type { MetadataRoute } from "next";

/** Lets phones add VisualVibe to the home screen and open it full screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VisualVibe",
    short_name: "VisualVibe",
    description: "Video meetings in your browser.",
    start_url: "/home",
    display: "standalone",
    background_color: "#121316",
    theme_color: "#121316",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
