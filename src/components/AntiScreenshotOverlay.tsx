interface AntiScreenshotOverlayProps {
  watermarkText?: string;
}

// Tiled, traceable watermark rendered above a document viewer. Must be a
// child of a `position: relative` container so it can cover the full area.
export default function AntiScreenshotOverlay({
  watermarkText = "Confidential",
}: AntiScreenshotOverlayProps) {
  const tileCount = 80;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        overflow: "hidden",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          alignContent: "space-evenly",
          justifyItems: "center",
          transform: "rotate(-30deg)",
        }}
      >
        {Array.from({ length: tileCount }).map((_, i) => (
          <div
            key={i}
            style={{
              whiteSpace: "nowrap",
              fontSize: "0.65rem",
              fontWeight: 600,
              color: "red",
              opacity: 0.12,
            }}
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
}
