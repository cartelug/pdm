export const site = {
  name: "Pamodzi Community Initiative",
  url: "https://pamodzici.com",
  email: "shyakaneeza@gmail.com",
  phone: "+256 708 735 878",
  whatsapp: "https://wa.me/256708735878",
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/pamodzici/" },
    { label: "TikTok", href: "https://www.tiktok.com/@pamodzici" },
    { label: "X", href: "https://x.com/pamodzici" },
  ],
};

export function asset(from: string, file: string): string {
  const depth = from.split("/").filter(Boolean).length;
  return "../".repeat(depth) + file.replace(/^\//, "");
}
export function href(from: string, to: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(to)) return to;
  const [route, hash] = to.split("#");
  return asset(from, route.replace(/^\//, "") + (route.endsWith("/") ? "index.html" : "")) + (hash ? "#" + hash : "");
}
