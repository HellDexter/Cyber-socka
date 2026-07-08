import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Globe, 
  Share2, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Podcast, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Cpu, 
  ExternalLink,
  Info,
  Layers,
  Palette,
  Type,
  FileText,
  MousePointerClick
} from "lucide-react";
import { DEFAULT_FOCUS_PRESETS, type GenerationResult } from "./types";

export default function App() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  
  // Custom focus area string, with initial prompt matching the default preset
  const [focus, setFocus] = useState<string>("Manažerská odpovědnost, sankce a pokuty za neplnění");
  
  const [isScraping, setIsScraping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
  const [focusPresets, setFocusPresets] = useState<string[]>(DEFAULT_FOCUS_PRESETS);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"linkedin" | "x" | "facebook">("linkedin");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // States for customizing the generated graphic card
  const [graphicHeadline, setGraphicHeadline] = useState("");
  const [graphicSubheadline, setGraphicSubheadline] = useState("");
  const [graphicTagline, setGraphicTagline] = useState("");
  const [graphicPalette, setGraphicPalette] = useState<"dark-neon" | "corporate-blue" | "warning-red" | "success-emerald" | "deep-indigo">("dark-neon");
  const [graphicIconName, setGraphicIconName] = useState<"shield" | "lock" | "alert" | "terminal" | "database" | "cpu">("shield");
  const [graphicRatio, setGraphicRatio] = useState<"1:1" | "16:9">("1:1");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Helper to intelligently transfer a social media post text to the graphic canvas
  const transferToGraphic = (textStr: string) => {
    if (!textStr) return;
    
    // Clean up text
    const cleanedText = textStr
      .replace(/[#*•➢➤✓💻🔒🛡️⚠️🚨]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Split into lines/paragraphs
    const parts = textStr.split(/\n+/).map(p => p.trim()).filter(Boolean);
    
    let headline = "";
    let subheadline = "";
    
    if (parts.length > 0) {
      // Find first non-empty line
      let firstLine = parts[0]
        .replace(/^[#\s\d.*•\-—+>➢✓💻🔒🛡️⚠️🚨]+/g, "") // strip leading decorators
        .trim();
      
      if (firstLine.length > 55) {
        headline = firstLine.substring(0, 52) + "...";
      } else {
        headline = firstLine;
      }
      
      let restOfText = parts.slice(1).join(" ");
      if (!restOfText) {
        if (firstLine.length > 55) {
          headline = firstLine.substring(0, 45) + "...";
          restOfText = firstLine.substring(45);
        } else {
          restOfText = "Podrobné shrnutí a analýza bezpečnostních dopadů.";
        }
      }
      
      let sub = restOfText
        .replace(/[#*•\-—+>➢✓💻🔒🛡️⚠️🚨]/g, "")
        .replace(/\s+/g, " ")
        .trim();
        
      if (sub.length > 130) {
        subheadline = sub.substring(0, 127) + "...";
      } else {
        subheadline = sub;
      }
    } else {
      headline = "Kybernetická Bezpečnost";
      subheadline = "Klíčové body a doporučení pro ochranu firemních dat a systémů.";
    }
    
    setGraphicHeadline(headline);
    setGraphicSubheadline(subheadline);
    
    // Automatically tweak palette based on content keywords
    const lowerText = textStr.toLowerCase();
    if (lowerText.includes("hrozba") || lowerText.includes("sankce") || lowerText.includes("pokut") || lowerText.includes("útok") || lowerText.includes("varování") || lowerText.includes("chyb")) {
      setGraphicPalette("warning-red");
      setGraphicIconName("alert");
    } else if (lowerText.includes("kod") || lowerText.includes("terminál") || lowerText.includes("databáz") || lowerText.includes("server") || lowerText.includes("system")) {
      setGraphicPalette("dark-neon");
      setGraphicIconName("terminal");
    } else if (lowerText.includes("soulad") || lowerText.includes("směrnic") || lowerText.includes("nis2") || lowerText.includes("zákon") || lowerText.includes("compliance")) {
      setGraphicPalette("corporate-blue");
      setGraphicIconName("shield");
    } else if (lowerText.includes("ochran") || lowerText.includes("bezpečnost") || lowerText.includes("šifrován") || lowerText.includes("data")) {
      setGraphicPalette("success-emerald");
      setGraphicIconName("lock");
    } else {
      setGraphicPalette("deep-indigo");
      setGraphicIconName("lock");
    }
    
    setSuccess("Text příspěvku byl úspěšně přenesen do šablony grafiky!");
  };

  // Populate customization states once result is received
  useEffect(() => {
    if (result && result.graphic) {
      setGraphicHeadline(result.graphic.headline || "");
      setGraphicSubheadline(result.graphic.subheadline || "");
      setGraphicTagline(result.graphic.tagline || "");
      setGraphicPalette(result.graphic.palette || "dark-neon");
      setGraphicIconName(result.graphic.iconName || "shield");
    }
  }, [result]);

  // Re-draw canvas preview whenever custom graphic states or active tab changes
  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas(
        canvasRef.current,
        graphicHeadline,
        graphicSubheadline,
        graphicTagline,
        graphicPalette,
        graphicIconName,
        graphicRatio
      );
    }
  }, [graphicHeadline, graphicSubheadline, graphicTagline, graphicPalette, graphicIconName, graphicRatio, result]);

  // Scrape text content from a provided URL
  const handleScrape = async () => {
    if (!url) {
      setError("Zadejte prosím platnou URL adresu pro stažení textu.");
      return;
    }
    setIsScraping(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(textError || `Chyba serveru s kódem ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Nepodařilo se stáhnout webovou stránku.");
      }
      
      setText(data.text);
      setSuccess("Obsah webu byl úspěšně stažen! Nyní z něj automaticky generujeme doporučená témata...");
      
      // Separate background call to generate topics (avoids Vercel 10s serverless timeout)
      setTimeout(async () => {
        try {
          setIsSuggestingTopics(true);
          const suggestResponse = await fetch("/api/suggest-topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: data.text }),
          });
          if (suggestResponse.ok) {
            const suggestData = await suggestResponse.json();
            if (suggestData.suggestedTopics && Array.isArray(suggestData.suggestedTopics) && suggestData.suggestedTopics.length > 0) {
              setFocusPresets(suggestData.suggestedTopics);
              setFocus(suggestData.suggestedTopics[0]);
              setSuccess("Obsah webu byl načten a byla úspěšně vygenerována doporučená témata na míru!");
            }
          }
        } catch (suggestErr) {
          console.error("Chyba při automatickém návrhu témat:", suggestErr);
        } finally {
          setIsSuggestingTopics(false);
        }
      }, 50);

    } catch (err: any) {
      setError(err.message || "Při stahování obsahu z URL došlo k chybě.");
    } finally {
      setIsScraping(false);
    }
  };

  // Generate suggested topics on-demand from current text area content
  const handleSuggestTopics = async () => {
    if (!text) {
      setError("Zadejte prosím nejprve podkladový text, ze kterého chcete navrhnout témata.");
      return;
    }
    setIsSuggestingTopics(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/suggest-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(textError || `Chyba serveru s kódem ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Nepodařilo se navrhnout témata.");
      }
      if (data.suggestedTopics && Array.isArray(data.suggestedTopics) && data.suggestedTopics.length > 0) {
        setFocusPresets(data.suggestedTopics);
        setFocus(data.suggestedTopics[0]);
        setSuccess("Doporučená témata a zaměření byla úspěšně vygenerována na základě textu!");
      } else {
        throw new Error("Nepodařilo se vygenerovat doporučená témata.");
      }
    } catch (err: any) {
      setError(err.message || "Při generování doporučených témat došlo k chybě.");
    } finally {
      setIsSuggestingTopics(false);
    }
  };

  // Generate social media posts and graphic layout
  const handleGenerate = async () => {
    if (!text && !url) {
      setError("Zadejte prosím podkladový text nebo vložte URL adresu k analýze.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      let activeText = text;
      
      // If text is empty but URL is specified, scrape it first client-side (to avoid combined slow scrape + slow generate server timeout)
      if (!activeText && url) {
        setIsScraping(true);
        setSuccess("Nejprve stahuji a čistím obsah webové stránky...");
        
        const scrapeResponse = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        
        let scrapeData: any;
        const scrapeContentType = scrapeResponse.headers.get("content-type");
        if (scrapeContentType && scrapeContentType.includes("application/json")) {
          scrapeData = await scrapeResponse.json();
        } else {
          const scrapeTextError = await scrapeResponse.text();
          throw new Error(scrapeTextError || `Chyba při stahování webu: ${scrapeResponse.status}`);
        }
        
        if (!scrapeResponse.ok) {
          throw new Error(scrapeData.error || "Nepodařilo se stáhnout webovou stránku.");
        }
        
        activeText = scrapeData.text;
        setText(activeText);
        setIsScraping(false);
        setSuccess("Web úspěšně stažen! Nyní generuji příspěvky pomocí AI...");
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: activeText, focus, url }),
      });

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(textError || `Chyba serveru s kódem ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Chyba při komunikaci s generátorem.");
      }
      setResult(data);
      setSuccess("Příspěvky byly úspěšně vygenerovány včetně návrhu pro doprovodnou grafiku!");
    } catch (err: any) {
      setError(err.message || "Chyba při generování obsahu.");
    } finally {
      setIsGenerating(false);
      setIsScraping(false);
    }
  };

  // Handle clipboard copying
  const copyToClipboard = (content: string, fieldName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Download rendered canvas as a PNG
  const handleDownloadGraphic = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    const sanitizedTitle = graphicHeadline.substring(0, 30).toLowerCase().replace(/[^a-z0-9]/g, "-");
    link.download = `cyber-grafika-${sanitizedTitle || "post"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Text wrapper helper for HTML Canvas drawing
  const wrapText = (ctx: CanvasRenderingContext2D, textStr: string, maxWidth: number): string[] => {
    const words = textStr.split(" ");
    const lines: string[] = [];
    let currentLine = words[0] || "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Draw cyber icon onto the Canvas
  const drawIconOnCanvas = (ctx: CanvasRenderingContext2D, iconName: string, x: number, y: number, size: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (iconName === "shield") {
      ctx.beginPath();
      ctx.moveTo(x + size/2, y);
      ctx.bezierCurveTo(x + size, y, x + size, y + size/3, x + size/2, y + size);
      ctx.bezierCurveTo(x, y + size/3, x, y, x + size/2, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size/2, y + 12);
      ctx.lineTo(x + size/2, y + size - 14);
      ctx.moveTo(x + 14, y + size/3);
      ctx.lineTo(x + size - 14, y + size/3);
      ctx.stroke();
    } else if (iconName === "lock") {
      ctx.strokeRect(x + 12, y + size/2 - 4, size - 24, size/2 + 4);
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2 - 4, size/2 - 16, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2 + 10, 5, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + size/2, y + size/2 + 10);
      ctx.lineTo(x + size/2, y + size/2 + 25);
      ctx.stroke();
    } else if (iconName === "alert") {
      ctx.beginPath();
      ctx.moveTo(x + size/2, y);
      ctx.lineTo(x + size, y + size);
      ctx.lineTo(x, y + size);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(x + size/2 - 2, y + size/3, 4, size/3);
      ctx.beginPath();
      ctx.arc(x + size/2, y + size * 0.8, 3, 0, Math.PI*2);
      ctx.fill();
    } else if (iconName === "terminal") {
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 15);
      ctx.lineTo(x + size/2 - 5, y + size/2);
      ctx.lineTo(x + 12, y + size - 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + size/2 + 5, y + size - 15);
      ctx.lineTo(x + size - 12, y + size - 15);
      ctx.stroke();
    } else if (iconName === "database") {
      const h = size / 3;
      const drawCylinder = (cy: number) => {
        ctx.beginPath();
        ctx.ellipse(x + size/2, cy, size/2 - 6, h/2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 6, cy);
        ctx.lineTo(x + 6, cy + h);
        ctx.ellipse(x + size/2, cy + h, size/2 - 6, h/2, 0, 0, Math.PI, false);
        ctx.lineTo(x + size - 6, cy);
        ctx.stroke();
      };
      drawCylinder(y + h/2);
      drawCylinder(y + h * 1.5);
    } else if (iconName === "cpu") {
      ctx.strokeRect(x + 12, y + 12, size - 24, size - 24);
      ctx.strokeRect(x + size/3, y + size/3, size/3, size/3);
      for (let i = 0; i < 4; i++) {
        const offset = 18 + i * 11;
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset, y + 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + offset, y + size - 12);
        ctx.lineTo(x + offset, y + size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + offset);
        ctx.lineTo(x + 12, y + offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size - 12, y + offset);
        ctx.lineTo(x + size, y + offset);
        ctx.stroke();
      }
    }
  };

  // Main Canvas Drawing Engine
  const drawCanvas = (
    canvas: HTMLCanvasElement, 
    headline: string, 
    subheadline: string, 
    tagline: string, 
    palette: "dark-neon" | "corporate-blue" | "warning-red" | "success-emerald" | "deep-indigo", 
    iconName: "shield" | "lock" | "alert" | "terminal" | "database" | "cpu", 
    ratio: "1:1" | "16:9"
  ) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = ratio === "1:1" ? 1080 : 1200;
    const height = ratio === "1:1" ? 1080 : 675;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Palettes configuration matching professional Cyber branding
    let bgGradientStart = "#020617";
    let bgGradientEnd = "#0f172a";
    let accentColor = "#06b6d4"; // Cyan/Neon
    let accentGlow = "rgba(6, 182, 212, 0.12)";
    let textColor = "#f8fafc";
    let subtextColor = "#94a3b8";

    if (palette === "corporate-blue") {
      bgGradientStart = "#0f172a";
      bgGradientEnd = "#1e293b";
      accentColor = "#3b82f6"; // Blue
      accentGlow = "rgba(59, 130, 246, 0.12)";
    } else if (palette === "warning-red") {
      bgGradientStart = "#180808";
      bgGradientEnd = "#0a0303";
      accentColor = "#ef4444"; // Red
      accentGlow = "rgba(239, 68, 68, 0.12)";
    } else if (palette === "success-emerald") {
      bgGradientStart = "#03120c";
      bgGradientEnd = "#010503";
      accentColor = "#10b981"; // Emerald
      accentGlow = "rgba(16, 185, 129, 0.12)";
    } else if (palette === "deep-indigo") {
      bgGradientStart = "#11092e";
      bgGradientEnd = "#04020c";
      accentColor = "#8b5cf6"; // Purple
      accentGlow = "rgba(139, 92, 246, 0.12)";
    }

    // Draw Background Gradient
    const grad = ctx.createRadialGradient(width/2, height/2, 20, width/2, height/2, Math.max(width, height)*0.75);
    grad.addColorStop(0, bgGradientStart);
    grad.addColorStop(1, bgGradientEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Draw Cybernetic Grid system background
    ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Border line accents
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    // Decorative corner widgets for advanced tech visual design
    ctx.fillStyle = accentColor;
    ctx.fillRect(25, 25, 45, 4);
    ctx.fillRect(25, 25, 4, 45);

    ctx.fillRect(width - 70, 25, 45, 4);
    ctx.fillRect(width - 29, 25, 4, 45);

    ctx.fillRect(25, height - 29, 45, 4);
    ctx.fillRect(25, height - 70, 4, 45);

    ctx.fillRect(width - 70, height - 29, 45, 4);
    ctx.fillRect(width - 29, height - 70, 4, 45);

    // Glowing background orbs
    ctx.beginPath();
    ctx.arc(width - 160, height / 2, 240, 0, Math.PI * 2);
    ctx.fillStyle = accentGlow;
    ctx.fill();

    // Draw upper Tag category outline
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(80, 80, 290, 48);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
    ctx.lineWidth = 1;
    ctx.strokeRect(80, 80, 290, 48);
    ctx.fillStyle = accentColor;
    ctx.fillRect(80, 80, 5, 48);

    // Upper Tagline text
    ctx.fillStyle = textColor;
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textBaseline = "middle";
    ctx.fillText((tagline || "KYBERBEZPEČNOST").toUpperCase(), 102, 104);

    // Draw the active cyber icon
    drawIconOnCanvas(ctx, iconName, width - 210, 80, 80, accentColor);

    // Draw main Headline wrapping
    ctx.fillStyle = textColor;
    ctx.font = "bold 44px 'Inter', sans-serif";
    ctx.textBaseline = "top";

    const headlineX = 80;
    const headlineY = 165;
    const headlineMaxWidth = width - 180;
    const headlineLineHeight = 56;

    const headlineLines = wrapText(ctx, headline || "Hlavní Titulek Grafiky", headlineMaxWidth);
    headlineLines.forEach((line, index) => {
      ctx.fillText(line, headlineX, headlineY + (index * headlineLineHeight));
    });

    // Drawing divider line below headline
    const dividerY = headlineY + (headlineLines.length * headlineLineHeight) + 24;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.moveTo(80, dividerY);
    ctx.lineTo(width - 80, dividerY);
    ctx.stroke();

    // Subheadline text wrap & write
    ctx.fillStyle = subtextColor;
    ctx.font = "500 22px 'Inter', sans-serif";
    ctx.textBaseline = "top";

    const subY = dividerY + 28;
    const subMaxWidth = width - 180;
    const subLines = wrapText(ctx, subheadline || "Analýza dopadů, bezpečnostní rizika a doporučené strategické kroky pro firmy.", subMaxWidth);
    subLines.forEach((line, index) => {
      if (subY + (index * 32) < height - 120) {
        ctx.fillText(line, headlineX, subY + (index * 32));
      }
    });

    // Footer brand lines
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textBaseline = "bottom";
    ctx.fillText("CYBERCONTENT AI • GRAFICKÝ PRŮVODCE", 80, height - 70);

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(width - 90, height - 76, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = subtextColor;
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("GEMINI 3.5 FLASH", width - 110, height - 70);
    ctx.textAlign = "left"; // restore original
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* Header - Geometric Balance Style Header with Dark Background */}
      <header className="h-16 flex items-center justify-between px-6 sm:px-8 bg-slate-900 text-white border-b border-slate-700 shadow-lg shrink-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight flex items-center">
            CyberContent AI
            <span className="text-slate-400 font-normal text-xs ml-2 hidden sm:inline">| Pro-Suite</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-mono rounded border border-green-500/30 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-green-400 animate-pulse" />
            GEMINI 3.5 AKTIVNÍ
          </div>
        </div>
      </header>

      {/* Main Grid section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: CONFIGURATION & INPUT (Lg: 5cols) */}
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Kontext &amp; Cíl analýzy</h2>
            </div>

            {/* Custom Focus Prompt Field - Replaced Static Theme Dropdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Na co se má generovaný obsah zaměřit?
                </label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Vlastní cíl
                </span>
              </div>
              <textarea
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Napište konkrétní zaměření, např.: Zaměř se na drakonické sankce pro management, praktický postup obrany před podvodným e-mailem, nebo dopady NIS2 na malé české dodavatele..."
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 resize-none"
              />
              <p className="text-xs text-slate-400 leading-relaxed">
                Zadejte vlastní pokyny k zaměření, nebo klikněte na jedno z doporučených níže k rychlému vyplnění.
              </p>
            </div>

            {/* Recommended quick-select presets */}
            <div className="space-y-3 bg-slate-50/50 p-4.5 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3 text-blue-600" />
                  Doporučená témata a zaměření
                </label>
                {focusPresets === DEFAULT_FOCUS_PRESETS ? (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Výchozí
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Pro váš obsah
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {focusPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFocus(preset)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-150 flex items-start gap-2 ${
                      focus === preset
                        ? "bg-blue-50 border border-blue-200 text-blue-700 font-semibold"
                        : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${focus === preset ? 'bg-blue-600' : 'bg-slate-300'}`} />
                    <span className="leading-tight">{preset}</span>
                  </button>
                ))}
              </div>

              <div className="pt-1.5 flex justify-between items-center gap-2">
                <p className="text-[10px] text-slate-400">
                  {focusPresets === DEFAULT_FOCUS_PRESETS 
                    ? "Nahrajte odkaz nebo vygenerujte témata přímo z vašeho textu:" 
                    : "Témata byla vygenerována přímo na míru vašemu podkladu."}
                </p>
                <button
                  type="button"
                  onClick={handleSuggestTopics}
                  disabled={isSuggestingTopics || isScraping || isGenerating || !text}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-blue-600 border border-slate-200 rounded-md text-[10px] font-bold transition-all duration-150 flex items-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSuggestingTopics ? (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-blue-600" />
                  )}
                  <span>Navrhnout z textu</span>
                </button>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Zdrojový Odkaz k analýze (Volitelné URL)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://nukib.cz/cs/kyberneticka-bezpecnost/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleScrape}
                  disabled={isScraping || isGenerating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  {isScraping ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Načíst</span>
                </button>
              </div>
            </div>

            {/* Direct Text Area Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Podkladový text (Poznámky, Zákony, Incidenty)
                </label>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {text.length} znaků
                </span>
              </div>
              <textarea
                placeholder="Sem vložte text zákona, tiskovou zprávu o útoku nebo jakékoli vlastní poznámky, ze kterých má příspěvek čerpat..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-y bg-slate-50 text-slate-800 placeholder:text-slate-400 min-h-[120px]"
              />
            </div>

            {/* GENERATE SUBMIT BUTTON */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isScraping || isGenerating}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>ANALYZUJI &amp; GENERUJI VŠECHNY MATERIÁLY...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-white" />
                  <span>GENEROVAT KOMPLETNÍ OBSAH</span>
                </>
              )}
            </button>

            {/* Feedback Notifications */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Nastala chyba</h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Generování dokončeno</h4>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* RIGHT PANEL: DISPLAY OUTPUTS & GRAPHIC GENERATOR */}
          <section className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {!result && !isGenerating ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[520px] shadow-sm"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4 border border-slate-200">
                    <Shield className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Čeká se na vaše zadání</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                    Zadejte podklady nebo URL v levém sloupci a klikněte na tlačítko <strong>GENEROVAT KOMPLETNÍ OBSAH</strong>. Nástroj vytvoří sociální příspěvky na LinkedIn, X a Facebook a doprovodnou grafickou kartu.
                  </p>
                </motion.div>
              ) : isGenerating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[520px] space-y-6 shadow-sm"
                >
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Analyzuji s Gemini 3.5</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Komponuji texty na základě vašeho specifického zaměření: <strong className="text-slate-700">"{focus}"</strong>. Tvořím naformátované příspěvky a doprovodný vizuální layout.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  
                  {/* FEATURE 1: SOCIAL MEDIA WRITTEN POSTS */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Příspěvky na sociální sítě</span>
                      </div>
                      
                      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                        {(["linkedin", "x", "facebook"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 rounded text-xs font-bold capitalize transition-all duration-150 ${
                              activeTab === tab
                                ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {tab === "linkedin" && "LinkedIn"}
                            {tab === "x" && "X (Twitter)"}
                            {tab === "facebook" && "Facebook"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeTab === "linkedin" && result && (
                      <div className="flex flex-col">
                        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase flex items-center gap-1.5">
                            <Linkedin className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                            LinkedIn / Strategický &amp; Compliance tón
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => transferToGraphic(result.linkedin)}
                              className="text-slate-500 hover:text-blue-700 flex items-center gap-1 text-xs font-bold transition-colors border-r border-slate-200 pr-2.5 mr-1"
                              title="Přenést tento text do generátoru grafiky"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              <span>Přenést do grafiky</span>
                            </button>
                            <button
                              onClick={() => copyToClipboard(result.linkedin, "linkedin")}
                              className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-xs font-bold transition-colors"
                            >
                              {copiedField === "linkedin" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-mono">Zkopírováno</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Kopírovat</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div 
                          draggable="true"
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", result.linkedin);
                          }}
                          className="p-5 text-sm leading-relaxed text-slate-700 bg-white min-h-[140px] max-h-[300px] overflow-y-auto select-text font-sans cursor-grab active:cursor-grabbing hover:bg-slate-50/50 transition-colors relative group border-2 border-dashed border-transparent hover:border-slate-200"
                        >
                          {result.linkedin}
                          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-250 font-medium flex items-center gap-1 shadow-sm">
                            <span>💡 Přetáhněte text do modrého náhledu grafiky níže</span>
                          </div>
                        </div>
                      </div>
                    )}
 
                    {activeTab === "x" && result && (
                      <div className="flex flex-col">
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 tracking-widest uppercase flex items-center gap-1.5">
                            <Twitter className="w-3.5 h-3.5 text-slate-800 fill-slate-800" />
                            X (Twitter) / Max 280 znaků
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => transferToGraphic(result.x)}
                              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-xs font-bold transition-colors border-r border-slate-200 pr-2.5 mr-1"
                              title="Přenést tento text do generátoru grafiky"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              <span>Přenést do grafiky</span>
                            </button>
                            <span className={`text-[10px] font-mono ${result.x.length <= 280 ? 'text-slate-400' : 'text-red-500 font-bold'}`}>
                              {result.x.length} / 280
                            </span>
                            <button
                              onClick={() => copyToClipboard(result.x, "x")}
                              className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-xs font-bold transition-colors"
                            >
                              {copiedField === "x" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-mono">Kopírováno</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Kopírovat</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div 
                          draggable="true"
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", result.x);
                          }}
                          className="p-5 text-sm leading-relaxed text-slate-700 bg-white min-h-[140px] max-h-[300px] overflow-y-auto select-text font-sans cursor-grab active:cursor-grabbing hover:bg-slate-50/50 transition-colors relative group border-2 border-dashed border-transparent hover:border-slate-200"
                        >
                          {result.x}
                          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-250 font-medium flex items-center gap-1 shadow-sm">
                            <span>💡 Přetáhněte text do modrého náhledu grafiky níže</span>
                          </div>
                        </div>
                        {result.x.length > 280 && (
                          <div className="p-3 bg-amber-50 border-t border-amber-100 text-[11px] text-amber-700 flex items-center gap-2">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Tento text přesahuje 280 znaků. Před odesláním na X může být nutné jej mírně upravit.
                          </div>
                        )}
                      </div>
                    )}
 
                    {activeTab === "facebook" && result && (
                      <div className="flex flex-col">
                        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-800 tracking-widest uppercase flex items-center gap-1.5">
                            <Facebook className="w-3.5 h-3.5 text-blue-800 fill-blue-800" />
                            Facebook / Přístupná osvěta a doporučení
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => transferToGraphic(result.facebook)}
                              className="text-slate-500 hover:text-blue-800 flex items-center gap-1 text-xs font-bold transition-colors border-r border-slate-200 pr-2.5 mr-1"
                              title="Přenést tento text do generátoru grafiky"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              <span>Přenést do grafiky</span>
                            </button>
                            <button
                              onClick={() => copyToClipboard(result.facebook, "facebook")}
                              className="text-slate-500 hover:text-blue-800 flex items-center gap-1 text-xs font-bold transition-colors"
                            >
                              {copiedField === "facebook" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-600 font-mono">Zkopírováno</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Kopírovat</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div 
                          draggable="true"
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", result.facebook);
                          }}
                          className="p-5 text-sm leading-relaxed text-slate-700 bg-white min-h-[140px] max-h-[300px] overflow-y-auto select-text font-sans cursor-grab active:cursor-grabbing hover:bg-slate-50/50 transition-colors relative group border-2 border-dashed border-transparent hover:border-slate-200"
                        >
                          {result.facebook}
                          <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-250 font-medium flex items-center gap-1 shadow-sm">
                            <span>💡 Přetáhněte text do modrého náhledu grafiky níže</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NEW FEATURE 2: GENERATE RELEVANT GRAPHICS (IMAGE GENERATOR & EDITOR CARD) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                        <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Generátor grafiky k příspěvku</h2>
                      </div>
                      
                      <button
                        onClick={handleDownloadGraphic}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center transition-all duration-150 shadow-sm gap-1.5 self-start sm:self-auto"
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>Stáhnout grafiku (PNG)</span>
                      </button>
                    </div>

                    <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      
                      {/* Left half inside generator: Interactive controls */}
                      <div className="md:col-span-5 space-y-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 border-b border-slate-100 pb-1">
                          <Layers className="w-3.5 h-3.5" />
                          Upravit parametry grafiky
                        </div>

                        {/* Ratio toggle */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Poměr Stran (Formát)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setGraphicRatio("1:1")}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                graphicRatio === "1:1"
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Čtverec (1:1 feed)
                            </button>
                            <button
                              type="button"
                              onClick={() => setGraphicRatio("16:9")}
                              className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                graphicRatio === "16:9"
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Širokoúhlý (16:9 banner)
                            </button>
                          </div>
                        </div>

                        {/* Palette Selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Palette className="w-3.5 h-3.5 text-slate-400" />
                            Barevné Téma (Paleta)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {(["dark-neon", "corporate-blue", "warning-red", "success-emerald", "deep-indigo"] as const).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setGraphicPalette(p)}
                                className={`px-2 py-1.5 rounded border text-left flex items-center gap-2 capitalize transition-all ${
                                  graphicPalette === p
                                    ? "border-blue-500 bg-blue-50/50 text-blue-900 font-bold"
                                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                                }`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  p === 'dark-neon' ? 'bg-cyan-400' :
                                  p === 'corporate-blue' ? 'bg-blue-600' :
                                  p === 'warning-red' ? 'bg-red-500' :
                                  p === 'success-emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                                }`} />
                                <span className="text-[10px]">
                                  {p === 'dark-neon' && 'Cyan Neon'}
                                  {p === 'corporate-blue' && 'Corp Blue'}
                                  {p === 'warning-red' && 'Alert Red'}
                                  {p === 'success-emerald' && 'Emerald Safe'}
                                  {p === 'deep-indigo' && 'Deep Purple'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Icon Selector */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Doprovodná Ikona
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 text-xs">
                            {(["shield", "lock", "alert", "terminal", "database", "cpu"] as const).map((ic) => (
                              <button
                                key={ic}
                                type="button"
                                onClick={() => setGraphicIconName(ic)}
                                className={`px-2 py-1.5 rounded border text-center font-mono text-[10px] uppercase transition-all ${
                                  graphicIconName === ic
                                    ? "border-blue-500 bg-blue-50 text-blue-800 font-bold"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                {ic}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Editable texts live update */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Hlavní nadpis (Headline)
                            </label>
                            <input
                              type="text"
                              value={graphicHeadline}
                              onChange={(e) => setGraphicHeadline(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Podtitulek (Subheadline)
                            </label>
                            <textarea
                              value={graphicSubheadline}
                              onChange={(e) => setGraphicSubheadline(e.target.value)}
                              rows={2}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-700 resize-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Kategorie / Štítek (Tagline)
                            </label>
                            <input
                              type="text"
                              value={graphicTagline}
                              onChange={(e) => setGraphicTagline(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-slate-800 font-mono"
                            />
                          </div>
                        </div>

                      </div>

                      {/* Right half inside generator: High DPI Canvas preview box */}
                      <div 
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(true);
                        }}
                        onDragLeave={() => {
                          setIsDraggingOver(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(false);
                          const droppedText = e.dataTransfer.getData("text/plain");
                          if (droppedText) {
                            transferToGraphic(droppedText);
                          }
                        }}
                        className={`md:col-span-7 flex flex-col items-center justify-center space-y-3 p-4 rounded-xl border transition-all relative ${
                          isDraggingOver 
                            ? "bg-blue-50 border-blue-400 ring-4 ring-blue-500/20 scale-[1.01]" 
                            : "bg-slate-50 border-slate-150"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block self-start">
                          Živý Náhled Grafické Karty (Canvas)
                        </span>
                        
                        {/* Interactive Canvas container with responsive sizing */}
                        <div className="w-full flex items-center justify-center overflow-hidden relative">
                          <canvas
                            ref={canvasRef}
                            style={{
                              width: "100%",
                              maxWidth: graphicRatio === "1:1" ? "340px" : "440px",
                              aspectRatio: graphicRatio === "1:1" ? "1/1" : "16/9"
                            }}
                            className="bg-slate-900 rounded-lg shadow-md border border-slate-200 shrink-0"
                          />
                          
                          {/* Animated overlay on drag over */}
                          <AnimatePresence>
                            {isDraggingOver && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-blue-600/95 rounded-lg flex flex-col items-center justify-center text-white p-6 text-center select-none backdrop-blur-sm z-10"
                              >
                                <Sparkles className="w-10 h-10 mb-2 animate-bounce text-cyan-300" />
                                <p className="font-bold text-sm">Pusťte text zde</p>
                                <p className="text-xs text-blue-100 mt-1">Okamžitě přeneseme a naformátujeme text do této grafiky</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 w-full justify-center">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Obrázek je vykreslován ve vysokém rozlišení (Full HD) pro ostrý tisk a sociální sítě.</span>
                        </div>
                      </div>

                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>
      </main>
      
      {/* Footer styled according to theme template requirements */}
      <footer className="h-12 bg-slate-900 border-t border-slate-800 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-white z-50">
        <div className="text-[10px] text-slate-500 font-mono">
          SYSTEM STATUS: OK | API LATENCY: 220ms | BUILD: 1.0.4-STABLE
        </div>
        <div className="text-[10px] text-slate-400 font-sans">
          &copy; 2026 AI Cyber Specialist Hub — Vytvořeno pro experty v kyberbezpečnosti
        </div>
      </footer>
    </div>
  );
}
