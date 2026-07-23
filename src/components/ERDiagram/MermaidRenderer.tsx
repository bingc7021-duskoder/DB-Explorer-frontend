import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface MermaidRendererProps {
  chart: string;
  onTableClick?: (tableName: string) => void;
  searchTerm?: string;
  highlightRelationships?: boolean;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  onTableClick,
  searchTerm = '',
  highlightRelationships = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Pan / Drag State for 1-finger and mouse dragging
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      er: {
        diagramPadding: 20,
        layoutDirection: 'TB',
        minEntityWidth: 160,
        minEntityHeight: 80,
        entityPadding: 18,
        stroke: '#0284c7',
        fill: '#0f172a',
        fontSize: 12,
        useMaxWidth: false,
      },
      themeVariables: {
        darkMode: true,
        background: '#030712',
        primaryColor: '#0f172a',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#0284c7',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#1e1b4b',
      },
    });
  }, []);

  // Intercept touchpad two-finger pinch-to-zoom events inside ERP box ONLY
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY;
        setZoomLevel((prev) => {
          if (delta < 0) {
            return Math.min(prev + 0.08, 3.0);
          } else {
            return Math.max(prev - 0.08, 0.4);
          }
        });
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart || chart.trim() === '') return;
      setIsRendering(true);
      setRenderError(null);

      try {
        const id = `mermaid-er-${Date.now()}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
          setIsRendering(false);
        }
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setRenderError('Unable to render ER Diagram. Verify table metadata relationships.');
          setIsRendering(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  // Inject SVG content and bind stationary hover highlights, high-contrast search, and click listeners
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const container = containerRef.current;
    container.innerHTML = svgContent;

    const svgElement = container.querySelector('svg');
    if (svgElement) {
      svgElement.style.width = '100%';
      svgElement.style.height = 'auto';
      svgElement.style.display = 'block';

      // Find entity nodes (table groups) in Mermaid ER output
      const entityNodes = svgElement.querySelectorAll('g[id*="entity-"], .entityBox, g.entityGroup');

      entityNodes.forEach((node) => {
        const element = node as SVGGraphicsElement;
        element.style.cursor = 'pointer';

        const textContent = element.textContent || '';
        const rects = element.querySelectorAll('rect, polygon, path');
        const textElements = element.querySelectorAll('text, tspan');

        const isMatch =
          searchTerm.trim() !== '' &&
          textContent.toLowerCase().includes(searchTerm.trim().toLowerCase());

        // Apply Search Highlight with High Contrast (stationary, crisp white text)
        if (isMatch) {
          element.style.filter = 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.95))';
          rects.forEach((rect) => {
            const r = rect as HTMLElement;
            r.style.stroke = '#38bdf8';
            r.style.strokeWidth = '2.5px';
          });
          textElements.forEach((t) => {
            const txt = t as HTMLElement;
            txt.style.fill = '#ffffff';
            txt.style.fontWeight = '700';
          });
        } else {
          element.style.filter = 'none';
          textElements.forEach((t) => {
            const txt = t as HTMLElement;
            txt.style.fill = '#f8fafc';
            txt.style.fontWeight = '500';
          });
          rects.forEach((rect) => {
            const r = rect as HTMLElement;
            r.style.stroke = '#0284c7';
            r.style.strokeWidth = '1px';
          });
        }

        // Stationary Mouse Hover Highlight (border & glow only, NO movement/scaling)
        element.onmouseenter = () => {
          element.style.filter = 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.85))';
          rects.forEach((rect) => {
            const r = rect as HTMLElement;
            r.style.stroke = '#38bdf8';
            r.style.strokeWidth = '2.5px';
          });
          textElements.forEach((t) => {
            const txt = t as HTMLElement;
            txt.style.fill = '#ffffff';
            txt.style.fontWeight = '700';
          });
        };

        element.onmouseleave = () => {
          if (isMatch) {
            element.style.filter = 'drop-shadow(0 0 14px rgba(56, 189, 248, 0.95))';
            rects.forEach((rect) => {
              const r = rect as HTMLElement;
              r.style.stroke = '#38bdf8';
              r.style.strokeWidth = '2.5px';
            });
            textElements.forEach((t) => {
              const txt = t as HTMLElement;
              txt.style.fill = '#ffffff';
              txt.style.fontWeight = '700';
            });
          } else {
            element.style.filter = 'none';
            rects.forEach((rect) => {
              const r = rect as HTMLElement;
              r.style.stroke = '#0284c7';
              r.style.strokeWidth = '1px';
            });
            textElements.forEach((t) => {
              const txt = t as HTMLElement;
              txt.style.fill = '#f8fafc';
              txt.style.fontWeight = '500';
            });
          }
        };

        element.onclick = (e) => {
          e.stopPropagation();
          const match = textContent.match(/([a-zA-Z0-9_]+)/);
          if (match && onTableClick) {
            onTableClick(match[1]);
          }
        };
      });
    }
  }, [svgContent, searchTerm, onTableClick]);

  // Pan Mouse & Touch Drag Handlers (1-finger / double click move)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!viewportRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !viewportRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    viewportRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    viewportRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && viewportRef.current) {
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        scrollLeft: viewportRef.current.scrollLeft,
        scrollTop: viewportRef.current.scrollTop,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && viewportRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      viewportRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
      viewportRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.4));
  const handleResetZoom = () => setZoomLevel(1.0);

  const handleExportSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erp-schema-diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`relative w-full h-full bg-slate-950 flex flex-col overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-slate-950' : ''
        }`}
    >
      {/* Viewport Floating Control Bar (Fixed to diagram section only) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-2xl text-slate-300 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In (+25%)"
          className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (-25%)"
          className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom (100%)"
          className="px-2.5 py-1.5 hover:bg-slate-800 hover:text-white rounded-lg transition-colors text-xs font-mono font-semibold"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <div className="w-px h-5 bg-slate-800 mx-1" />
        <button
          onClick={handleExportSVG}
          title="Export SVG File"
          className="p-2 hover:bg-slate-800 hover:text-emerald-400 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          className="p-2 hover:bg-slate-800 hover:text-brand-400 rounded-lg transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Top-Aligned Diagram Viewport Container with 1-finger / double-click pan dragging */}
      <div
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 w-full h-full overflow-auto p-4 flex items-start justify-center ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
          }`}
      >
        {isRendering ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 my-auto">
            <RefreshCw className="w-6 h-6 text-brand-500 animate-spin mb-2" />
            <p className="text-xs font-medium">Rendering ER Diagram SVG...</p>
          </div>
        ) : renderError ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl max-w-md text-center my-auto">
            <p className="text-sm font-semibold text-rose-400 mb-2">ER Diagram Notice</p>
            <p className="text-xs text-slate-400">{renderError}</p>
          </div>
        ) : (
          <div
            className="origin-top transition-transform duration-150 ease-out min-w-full flex items-start justify-center pt-2 pointer-events-auto"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <div ref={containerRef} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
