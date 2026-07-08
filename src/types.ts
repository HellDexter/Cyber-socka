export interface GraphicLayout {
  headline: string;
  subheadline: string;
  tagline: string;
  palette: "dark-neon" | "corporate-blue" | "warning-red" | "success-emerald" | "deep-indigo";
  iconName: "shield" | "lock" | "alert" | "terminal" | "database" | "cpu";
}

export interface GenerationResult {
  linkedin: string;
  x: string;
  facebook: string;
  graphic: GraphicLayout;
}

export const DEFAULT_FOCUS_PRESETS = [
  "Manažerská odpovědnost, sankce a pokuty za neplnění",
  "Praktické kroky a ochrana před phishingem pro zaměstnance",
  "Technické zabezpečení systémů a audit dodavatelského řetězce",
  "Klíčové termíny, harmonogram splnění a legislativní přehled",
  "Prevence úniků citlivých dat, šifrování a GDPR nároky",
  "Analýza konkrétního kybernetického incidentu a ponaučení"
];

