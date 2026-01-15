import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Liper Driver",
    short_name: "Liper",
    description: "Liper Driver",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      //   {
      //     src: "/favicon.ico",
      //     sizes: "512x512",
      //     type: "image/png",
      //   },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
