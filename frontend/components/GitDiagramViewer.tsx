"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArchitectureModule } from "../types/repository";

interface GitDiagramViewerProps {
  spec: string;
  repoName: string;
  modules?: ArchitectureModule[];
  onSelectModule?: (mod: ArchitectureModule) => void;
  onRegenerate?: () => void;
}

export default function GitDiagramViewer({
  spec,
  repoName,
  modules = [],
  onSelectModule,
  onRegenerate,
}: GitDiagramViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"visual" | "mermaid">("visual");

  // Pan and Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

  // Normalize and clean mermaid spec
  const cleanSpec = useCallback((rawSpec: string) => {
    let clean = rawSpec.trim();
    if (clean.startsWith("```mermaid")) {
      clean = clean.replace(/^```mermaid\s*/i, "").replace(/```$/, "").trim();
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    // Ensure it begins with graph TD
    if (!clean.startsWith("graph") && !clean.startsWith("flowchart")) {
      clean = "graph TD\n" + clean;
    }

    // If missing GitDiagram pastel classDefs, inject them
    if (!clean.includes("classDef clientClass")) {
      clean += `
  classDef clientClass fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1,rx:20px;
  classDef execClass fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1,rx:6px;
  classDef protocolClass fill:#ffe4e6,stroke:#f43f5e,stroke-width:1.5px,color:#9f1239,rx:6px;
  classDef docClass fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#166534,rx:6px;
  classDef secClass fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e,rx:6px;
  classDef endpointClass fill:#e0e7ff,stroke:#6366f1,stroke-width:1.5px,color:#3730a3,rx:6px;
`;
    }
    return clean;
  }, []);

  // Render diagram using Mermaid.js
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setRenderError(null);

    async function loadAndRender() {
      if (typeof window === "undefined") return;

      let mermaidInstance = (window as any).mermaid;
      if (!mermaidInstance) {
        // Wait up to 3s for CDN script from layout.tsx
        for (let i = 0; i < 30; i++) {
          if ((window as any).mermaid) {
            mermaidInstance = (window as any).mermaid;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }

        // If still not available, inject script tag dynamically
        if (!mermaidInstance && typeof document !== "undefined") {
          await new Promise<void>((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
            script.async = true;
            script.onload = () => {
              mermaidInstance = (window as any).mermaid;
              resolve();
            };
            script.onerror = () => resolve();
            document.head.appendChild(script);
          });
        }
      }

      if (!mermaidInstance) {
        if (isMounted) {
          setRenderError("Mermaid renderer could not be loaded from CDN.");
          setLoading(false);
        }
        return;
      }

      try {
        mermaidInstance.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            fontFamily: "'Space Grotesk', 'Inter', -apple-system, sans-serif",
            primaryColor: "#e0f2fe",
            primaryBorderColor: "#0284c7",
            primaryTextColor: "#0f172a",
            lineColor: "#64748b",
            clusterBkg: "#ffffffcc",
            clusterBorder: "#cbd5e1",
            edgeLabelBackground: "#ffffff",
          },
          flowchart: {
            curve: "basis",
            htmlLabels: true,
            useMaxWidth: false,
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 60,
          },
        });

        const id = `diagram_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const cleaned = cleanSpec(spec);
        const { svg } = await mermaidInstance.render(id, cleaned);

        if (isMounted) {
          // Adjust SVG for responsive crisp display without squishing
          const sanitizedSvg = svg
            .replace(/max-width:[^;]+;/gi, "")
            .replace(/style="[^"]*"/, 'style="overflow: visible;"');

          setSvgHtml(sanitizedSvg);
          setLoading(false);
          setRenderError(null);
        }
      } catch (err: any) {
        console.error("Mermaid Render Exception:", err);
        if (isMounted) {
          setRenderError(err?.message || "Failed to render Mermaid diagram spec.");
          setLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      isMounted = false;
    };
  }, [spec, cleanSpec]);

  // Handle node clicks inside the rendered SVG
  useEffect(() => {
    if (!containerRef.current || !modules || modules.length === 0 || !onSelectModule) return;

    const el = containerRef.current;
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest(".node");
      if (nodeEl) {
        const textContent = (nodeEl.textContent || "").toLowerCase();
        // Match with module list
        const matched = modules.find((m) => {
          const modName = m.name.toLowerCase().replace("module:", "").trim();
          const modPath = m.path.toLowerCase().replace("/", "").trim();
          return (
            (modName && textContent.includes(modName)) ||
            (modPath && textContent.includes(modPath)) ||
            (m.scope && textContent.includes(m.scope.toLowerCase()))
          );
        });

        if (matched) {
          onSelectModule(matched);
        }
      }
    };

    el.addEventListener("click", clickHandler);
    return () => {
      el.removeEventListener("click", clickHandler);
    };
  }, [svgHtml, modules, onSelectModule]);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom((z) => Math.min(2.5, Math.max(0.3, +(z + delta).toFixed(2))));
  };

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.3, +(z - 0.15).toFixed(2)));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const fitView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 15 });
  };

  // Copy Mermaid Spec
  const copySpec = () => {
    navigator.clipboard.writeText(cleanSpec(spec));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export SVG file
  const exportSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${repoName.replace("/", "_")}_gitdiagram.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  return (
    <div className="flex flex-col border-2 border-black bg-surface-container-lowest brutal-shadow-lg overflow-hidden">
      {/* GITDIAGRAM TOP TOOLBAR (EXACT MATCHING UI) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#fbfbfe] border-b-2 border-black z-20">
        {/* Left: Repository Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black font-headline-sm text-xs uppercase font-bold brutal-shadow-sm text-black">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>{repoName}</span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ede8f5] border border-black text-[11px] font-bold text-[#6b21a8]">
            <span className="w-2 h-2 rounded-full bg-[#9333ea] animate-pulse"></span>
            <span>GITDIAGRAM VIEW</span>
          </div>
        </div>

        {/* Center: View Switcher */}
        <div className="inline-flex border-2 border-black bg-white">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1 font-label-sm text-[11px] font-bold uppercase transition-colors ${
              viewMode === "visual"
                ? "bg-black text-primary-container"
                : "text-black hover:bg-surface-container"
            }`}
          >
            Connected Graph
          </button>
          <button
            onClick={() => setViewMode("mermaid")}
            className={`px-3 py-1 font-label-sm text-[11px] font-bold uppercase border-l-2 border-black transition-colors ${
              viewMode === "mermaid"
                ? "bg-black text-primary-container"
                : "text-black hover:bg-surface-container"
            }`}
          >
            Mermaid Spec
          </button>
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center gap-2">
          {viewMode === "visual" && (
            <div className="inline-flex border-2 border-black bg-white items-center">
              <button
                onClick={zoomOut}
                className="px-2.5 py-1 font-bold hover:bg-surface-container text-xs border-r border-black"
                title="Zoom Out"
              >
                -
              </button>
              <span className="px-2.5 font-mono text-[11px] font-bold">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="px-2.5 py-1 font-bold hover:bg-surface-container text-xs border-l border-black"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={fitView}
                className="px-2 py-1 font-label-sm text-[10px] uppercase font-bold hover:bg-surface-container border-l border-black"
                title="Fit to screen"
              >
                FIT
              </button>
              <button
                onClick={resetZoom}
                className="px-2 py-1 font-label-sm text-[10px] uppercase font-bold hover:bg-surface-container border-l border-black"
                title="Reset zoom"
              >
                100%
              </button>
            </div>
          )}

          {/* Export & Action Buttons */}
          <button
            onClick={exportSvg}
            className="px-3 py-1 bg-surface-container-lowest text-black font-label-sm text-[11px] font-bold uppercase border-2 border-black hover:bg-black hover:text-white brutal-shadow-sm flex items-center gap-1"
            title="Download SVG Diagram"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>{copiedSvg ? "SAVED!" : "EXPORT SVG"}</span>
          </button>

          <button
            onClick={copySpec}
            className="px-3 py-1 bg-primary-container text-black font-label-sm text-[11px] font-bold uppercase border-2 border-black hover:bg-black hover:text-primary-container brutal-shadow-sm flex items-center gap-1"
            title="Copy Mermaid Specification"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>{copied ? "COPIED!" : "COPY SPEC"}</span>
          </button>

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-2.5 py-1 bg-white text-black font-label-sm text-[11px] font-bold uppercase border-2 border-black hover:bg-black hover:text-white brutal-shadow-sm"
              title="Regenerate Diagram"
            >
              <span className="material-symbols-outlined text-[15px] align-middle">refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* CANVAS VIEWPORT (SOFT PASTEL PURPLE/LILAC BACKGROUND LIKE GITDIAGRAM) */}
      {viewMode === "visual" ? (
        <div
          className="relative w-full h-[600px] overflow-hidden select-none"
          style={{
            backgroundColor: "#ede8f5", // Exact soft lilac/lavender canvas from GitDiagram screenshot
            backgroundImage: "radial-gradient(rgba(147, 51, 234, 0.15) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Instructions Overlay Hint */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-black/20 px-3 py-1 rounded-full text-[11px] text-slate-700 font-medium shadow-sm">
            <span className="material-symbols-outlined text-[14px] text-primary">touch_app</span>
            <span>Drag to pan canvas • Scroll to zoom • Click boxes to inspect</span>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xs z-20">
              <div className="flex items-center gap-3 bg-white border-2 border-black p-4 brutal-shadow-md">
                <span className="material-symbols-outlined animate-spin text-2xl text-primary">sync</span>
                <span className="font-headline-sm text-sm uppercase font-bold">
                  Synthesizing GitDiagram Flowchart...
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {renderError && (
            <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
              <div className="bg-red-50 border-2 border-black p-4 max-w-lg brutal-shadow-md">
                <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-xs mb-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>Mermaid Diagram Parsing Notice</span>
                </div>
                <p className="text-xs text-red-600 mb-3">{renderError}</p>
                <button
                  onClick={() => setViewMode("mermaid")}
                  className="px-3 py-1 bg-black text-white font-label-sm text-xs uppercase font-bold"
                >
                  Inspect Raw Spec
                </button>
              </div>
            </div>
          )}

          {/* SVG RENDERING CONTAINER WITH PAN & ZOOM TRANSFORM */}
          <div
            ref={containerRef}
            className="gitdiagram-svg w-full h-full flex items-center justify-center origin-center transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />

          {/* Canvas SVG element styled via globals.css */}
        </div>
      ) : (
        /* MERMAID CODE EDITOR / RAW SPEC VIEW */
        <div className="bg-[#111613] text-white p-4 font-mono text-xs flex flex-col gap-3 min-h-[500px]">
          <div className="flex items-center justify-between border-b border-[#2b3530] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-primary-container rounded-full"></span>
              <span className="font-bold text-primary-container uppercase text-xs">
                GITDIAGRAM MERMAID SPECIFICATION CODE
              </span>
            </div>
            <button
              onClick={copySpec}
              className="px-3 py-1 bg-primary-container text-black font-headline-sm text-xs font-bold uppercase border border-black flex items-center gap-1 hover:bg-white"
            >
              <span className="material-symbols-outlined text-[15px]">content_copy</span>
              <span>{copied ? "COPIED!" : "COPY SPEC"}</span>
            </button>
          </div>

          <pre className="p-4 bg-[#0a0d0b] border border-[#2b3530] overflow-x-auto text-secondary-fixed leading-relaxed text-xs">
            {cleanSpec(spec)}
          </pre>

          <div className="text-[11px] text-secondary-fixed-dim border-t border-[#2b3530] pt-2 flex items-center justify-between">
            <span>Directly compatible with gitdiagram.com, GitHub Markdown, and Mermaid Live Editor</span>
            <span className="text-primary-container font-bold">100% REPRODUCIBLE</span>
          </div>
        </div>
      )}

      {/* FOOTER LEGEND (EXPLAINING THE COLOR CODING OF GITDIAGRAM) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border-t-2 border-black text-xs font-label-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold uppercase text-black">COLOR TOPOLOGY:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-[#0284c7] bg-[#e0f2fe] inline-block"></span>
            <span className="text-slate-700 font-medium">Request Execution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-[#f43f5e] bg-[#ffe4e6] inline-block"></span>
            <span className="text-slate-700 font-medium">Protocols & Extensions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-[#16a34a] bg-[#dcfce7] inline-block"></span>
            <span className="text-slate-700 font-medium">API Documentation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-[#d97706] bg-[#fef3c7] inline-block"></span>
            <span className="text-slate-700 font-medium">Types & Security</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant font-medium">
          <span>INTERACTIVE SVG • PAN & ZOOM ENABLED</span>
        </div>
      </div>
    </div>
  );
}
