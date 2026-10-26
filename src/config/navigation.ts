export type NavigationEntry = {
  label: string;
  route: string;
  group: "explore" | "institutional" | "engage";
  desktop?: boolean;
  protected?: boolean;
};
export const navigation: NavigationEntry[] = [
  { label: "Home", route: "/", group: "explore" },
  { label: "About Pamodzi", route: "/about/", group: "explore", desktop: true },
  { label: "What We Do", route: "/what-we-do/", group: "explore", desktop: true },
  { label: "Our Projects", route: "/projects/", group: "explore", desktop: true },
  { label: "Our Model", route: "/model/", group: "explore", desktop: true },
  { label: "Our Impact", route: "/impact/", group: "explore", desktop: true },
  { label: "Partnerships", route: "/partnerships/", group: "explore", desktop: true },
  { label: "Governance", route: "/governance/", group: "institutional" },
  { label: "Updates", route: "/updates/", group: "institutional" },
  { label: "Contact", route: "/contact/", group: "engage" },
  { label: "Walk for Education", route: "/walk-for-education/", group: "engage", protected: true },
  { label: "Faith in Motion", route: "/faith-in-motion/", group: "engage" },
];

// The header, the mobile menu and the sitemap read the same grouping, by what a visitor wants to know.
export type NavItem = { label: string; route: string };
export type NavGroup = { label: string; route: string; items?: NavItem[] };
export const primaryNav: NavGroup[] = [
  {
    label: "Our work",
    route: "/what-we-do/",
    items: [
      { label: "Walk for Education", route: "/walk-for-education/" },
      { label: "Faith in Motion", route: "/faith-in-motion/" },
      { label: "What We Do", route: "/what-we-do/" },
      { label: "Our Projects", route: "/projects/" },
      { label: "Our Model", route: "/model/" },
    ],
  },
  {
    label: "Impact and trust",
    route: "/impact/",
    items: [
      { label: "Our Impact", route: "/impact/" },
      { label: "Governance", route: "/governance/" },
    ],
  },
  { label: "Partner with us", route: "/partnerships/" },
  { label: "Updates", route: "/updates/" },
  { label: "About", route: "/about/" },
];
export const isCurrent = (group: NavGroup, path: string) =>
  group.route === path || (group.items ?? []).some((item) => item.route === path);
export const programmes = [
  {
    id: "education",
    title: "Education",
    short: "Education",
    summary: "Learning environments, school infrastructure, digital learning and teacher capacity.",
    covers: [
      "Schools and classroom blocks",
      "Science and ICT laboratories",
      "Teachers’ housing and sanitation",
      "Digital learning and teacher capacity",
    ],
    cta: "See our education work",
  },
  {
    id: "health",
    title: "Health",
    short: "Health",
    summary: "Community-defined health priorities, facilities, equipment and professional partnerships.",
    covers: [
      "Health Centre II, III and IV facilities",
      "Theatres and diagnostic laboratories",
      "Equipment and ambulances",
      "Energy, water and digital health",
    ],
    cta: "See our health work",
  },
  {
    id: "climate",
    title: "Climate & Green Development",
    short: "Climate",
    summary: "Renewable energy, climate-smart agriculture, conservation and resilient local infrastructure.",
    covers: [
      "Renewable energy",
      "Climate-smart agriculture",
      "Afforestation and restoration",
      "Waste management and education",
    ],
    cta: "See our climate work",
  },
  {
    id: "inclusion",
    title: "Financial Inclusion",
    short: "Inclusion",
    summary: "Savings groups, cooperatives, financial literacy and community enterprise.",
    covers: [
      "VSLAs, SACCOs and cooperatives",
      "Youth and women’s enterprises",
      "Financial literacy and investment readiness",
      "Responsible use of community resources",
    ],
    cta: "See our financial inclusion work",
  },
];
export const modelStages = [
  "Community mobilisation",
  "Partnership building",
  "Local resource mobilisation",
  "Strategic investment",
  "Asset development",
  "Sustainable service delivery",
  "Income generation",
  "Reinvestment",
  "Community transformation",
];
// Plain-language stage summaries derived from the existing model narrative, not reported outcomes.
export const modelSummaries = [
  "Bring people together around a priority the community defines.",
  "Connect community structures with the institutions, businesses and expertise the work needs.",
  "Organise local resources and participation around the shared priority.",
  "Deploy shared resources into a defined purpose with documented responsibilities.",
  "Develop the asset or infrastructure around the agreed community need.",
  "Keep the asset working and connected to the people it is intended to serve.",
  "Where appropriate, organise income from productive assets under clear governance.",
  "Reinvest income to sustain the asset and support further community work.",
  "Strengthen the community’s capacity to act together and steward its future.",
];
