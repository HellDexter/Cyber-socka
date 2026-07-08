import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// Helper to generate suggested topics using Gemini 3.5
  async function generateSuggestedTopics(text: string, apiKey: string): Promise<string[]> {
    try {
      const aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const response = await aiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Vstupní text k analýze:\n${text.substring(0, 8000)}`,
        config: {
          systemInstruction: `Jste špičkový expert na kybernetickou bezpečnost. Analyzujte zadaný text a navrhněte přesně 4 až 5 specifických a vysoce relevantních cílů zaměření (v češtině), pro které by bylo užitečné vygenerovat příspěvky na sociální sítě.
Každé téma musí být stručné, konkrétní a úderné (max 75 znaků), například:
- "Manažerská odpovědnost a osobní ručení za kybernetické incidenty"
- "Jak správně proškolit zaměstnance na phishing bez zbytečné teorie"
- "Pět technických kroků pro bezpečné uložení záloh"
Vraťte výsledek VÝHRADNĚ jako pole řetězců v JSON formátu podle zadaného schématu.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Seznam 4 až 5 konkrétních témat zaměření v češtině."
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(Boolean);
        }
      }
    } catch (err) {
      console.error("Chyba při generování doporučených témat:", err);
    }
    return [];
  }

  // API Route: Scrape URL and automatically generate suggested topics
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Chybí parametr URL" });
    }
    try {
      const text = await scrapeUrl(url);
      
      let suggestedTopics: string[] = [];
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
        suggestedTopics = await generateSuggestedTopics(text, apiKey);
      }
      
      res.json({ text, suggestedTopics });
    } catch (err: any) {
      console.error("Chyba při scrapování:", err);
      res.status(500).json({ error: `Nepodařilo se načíst obsah z URL: ${err.message}` });
    }
  });

  // API Route: Dynamically suggest focus topics from pasted text
  app.post("/api/suggest-topics", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Chybí vstupní text pro návrh témat" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(500).json({ 
        error: "Klíč GEMINI_API_KEY není nastaven v Secrets. Nastavte ho prosím pro plnou funkčnost doporučených témat." 
      });
    }

    try {
      const suggestedTopics = await generateSuggestedTopics(text, apiKey);
      res.json({ suggestedTopics });
    } catch (err: any) {
      console.error("Chyba v suggest-topics:", err);
      res.status(500).json({ error: `Chyba při analýze témat: ${err.message}` });
    }
  });

  // API Route: Generate Social Media formatted posts & Graphic Spec
  app.post("/api/generate", async (req, res) => {
    const { text, focus, theme, url } = req.body;
    if (!text && !url) {
      return res.status(400).json({ error: "Chybí vstupní text nebo URL" });
    }

    const focusArea = focus || theme || "Hlavní kyberbezpečnostní poselství a dopady";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(500).json({ 
        error: "Klíč GEMINI_API_KEY není v aplikaci nastaven. Nastavte prosím platný API klíč v sekci Settings > Secrets v AI Studio." 
      });
    }

    try {
      let contentToProcess = text || "";
      if (url && !contentToProcess) {
        try {
          contentToProcess = await scrapeUrl(url);
        } catch (scrapeErr: any) {
          return res.status(500).json({ error: `Chyba při stahování URL: ${scrapeErr.message}` });
        }
      }

      const aiInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const response = await aiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Požadované specifické zaměření / cíl příspěvků: ${focusArea}\n\nVstupní text k analýze:\n${contentToProcess}`,
        config: {
          systemInstruction: `Jste špičkový expert na kybernetickou bezpečnost a kreativní specialista na tvorbu obsahu (copywriting).
Vaším úkolem je analyzovat poskytnutý vstupní text s důrazem na uživatelem specifikované zaměření: "${focusArea}".

Na základě této analýzy vytvořte 4 výstupy VÝHRADNĚ V ČEŠTINĚ.
Každý text příspěvku musí být JIŽ DŮKLADNĚ NAFORMÁTOVANÝ pro okamžité vložení a publikování (nadpisy, struktura s odrážkami, řádkování a emoji):

1. LinkedIn post: Profesionální, edukativní a poutavý tón, zdůrazňující strategické dopady, compliance nebo manažerské výzvy.
   Formátování LinkedIn postu:
   - Začněte úderným, kapitálkami psaným nadpisem s tematickým emoji (např. "🚨 JAKÁ JSOU REÁLNÁ RIZIKA...").
   - Použijte jasné odstavce s prázdnými řádky pro maximální čitelnost.
   - Používejte odrážky s tematickými emoji (např. 📌, 🛡️, ⚖️, ❌, 💡) k přehlednému strukturování klíčových bodů.
   - Zakončete výraznou výzvou k akci (Call to Action) a 3-5 relevantními hashtagy na novém řádku.
2. X (Twitter) post: Stručný, úderný, se skvělou strukturou. Maximální délka 280 znaků!
   - Musí se bezpodmínečně vejít do 280 znaků, ale přesto obsahovat rozumné řádkování, emoji a 2-3 extrémně krátké, ostré odrážky.
   - Příklad:
     🔒 [Nadpis]
     • [Krátký bod]
     • [Krátký bod]
     #cyber #tag
3. Facebook post: Přístupnější, lidský, poučný a srozumitelný tón pro široké publikum (zaměstnance, veřejnost).
   - Formátování Facebook postu:
     - Chytlavý úvod s emoji pro vzbuzení pozornosti.
     - Přehledné, strukturované odrážky s emoji (např. ✅ pro praktická doporučení, ⚠️ pro rizika a varování).
     - Praktické shrnutí a přátelská výzva k akci (např. "Sdílejte s kolegy...").
     - Relevantní hashtagy na konci.
4. Grafický návrh (graphic): Specifikace pro vytvoření vizuálního banneru k příspěvku:
   - headline: Úderný, velmi krátký hlavní nadpis (max 45 znaků) pro vložení do grafiky
   - subheadline: Doplňující podtitulek nebo klíčový výrok (max 80 znaků)
   - tagline: Krátký slogan nebo výzva k akci (např. "Ochrana dat", "NIS2 Compliance", "Stop Phishingu")
   - palette: Jedna z palet: "dark-neon", "corporate-blue", "warning-red", "success-emerald", "deep-indigo"
   - iconName: Jeden z doporučených ikonických symbolů: "shield", "lock", "alert", "terminal", "database", "cpu"

Všechny texty musí být vygenerované tak, aby po zkopírování vypadaly skvěle a měly správné formátování. Odpověď musíte vrátit ve formátu JSON podle zadaného schématu.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              linkedin: {
                type: Type.STRING,
                description: "Zformátovaný text příspěvku pro LinkedIn v češtině (nadpisy, emoji odrážky, prázdné řádky, hashtagy)."
              },
              x: {
                type: Type.STRING,
                description: "Zformátovaný úderný text příspěvku pro X v češtině, max 280 znaků včetně emoji a hashtagů."
              },
              facebook: {
                type: Type.STRING,
                description: "Zformátovaný edukativní a srozumitelný text příspěvku pro Facebook v češtině s emoji odrážkami."
              },
              graphic: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING, description: "Hlavní krátký nadpis do grafiky (max 45 znaků)." },
                  subheadline: { type: Type.STRING, description: "Podtitulek nebo stručný výrok (max 80 znaků)." },
                  tagline: { type: Type.STRING, description: "Kategorie nebo klíčové slovo jako štítek v horní části." },
                  palette: { type: Type.STRING, description: "Jedna z palet: dark-neon, corporate-blue, warning-red, success-emerald, deep-indigo" },
                  iconName: { type: Type.STRING, description: "Jedna z ikon: shield, lock, alert, terminal, database, cpu" }
                },
                required: ["headline", "subheadline", "tagline", "palette", "iconName"]
              }
            },
            required: ["linkedin", "x", "facebook", "graphic"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini vrátil prázdnou odpověď.");
      }

      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (err: any) {
      console.error("Chyba při generování:", err);
      res.status(500).json({ error: `Chyba při generování obsahu pomocí Gemini API: ${err.message}` });
    }
  });

  // Vite and Server starting logic (Only when NOT running on Vercel as a Serverless function)
  if (!process.env.VERCEL) {
    const initServer = async () => {
      if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }

      const PORT = 3000;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    };
    initServer();
  }

  async function scrapeUrl(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Clean elements
    $("script, style, head, nav, footer, iframe, header, noscript, aside, form").remove();
    
    // Extract paragraphs, headings, lists
    const textBlocks: string[] = [];
    $("h1, h2, h3, p, li").each((_, el) => {
      const txt = $(el).text().trim();
      if (txt) {
        textBlocks.push(txt);
      }
    });
    
    const text = textBlocks.join("\n\n");
    if (!text) {
      throw new Error("Na této adrese se nepodařilo nalézt žádný čitelný text.");
    }
    return text.substring(0, 15000); // return top 15k chars
  }

  export default app;
