export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Talendro",
  description: "Decentralized Freelance Marketplace on Cardano",
  navItems: [
    {
      label: "Gigs",
      href: "/marketplace",
    },
    {
      label: "Disputes",
      href: "/disputes",
    },
    {
      label: "Leaderboard",
      href: "/leaderboard",
    },
  ],
  navMenuItems: [
    {
      label: "Marketplace",
      href: "/marketplace",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Disputes",
      href: "/disputes",
    },
    {
      label: "Leaderboard",
      href: "/leaderboard",
    },
    {
      label: "Profile",
      href: "/profile/me",
    },
    {
      label: "Create Project",
      href: "/projects/create",
    },
    {
      label: "Log Out",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
