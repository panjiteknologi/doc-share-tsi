interface AntiScreenshotOverlayProps {
  watermarkText?: string;
}

// Tiled, traceable watermark rendered above a document viewer. Must be a
// child of a `position: relative` container so it can cover the full area.
export default function AntiScreenshotOverlay({
  watermarkText = "Confidential",
}: AntiScreenshotOverlayProps) {
  const tileCount = 32;

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
          gridTemplateColumns: "repeat(4, 1fr)",
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
              fontSize: "1.1rem",
              fontWeight: 600,
              color: "red",
              opacity: 0.15,
            }}
          >
            {watermarkText}
          </div>
        ))}
      </div>

      {/* An even row/column count in the tiled grid above always lands a
          gap dead center — pin one bigger mark exactly there so there's
          always a clearly visible watermark where the eye naturally
          focuses, regardless of grid math. */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-30deg)",
          whiteSpace: "nowrap",
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "red",
          opacity: 0.18,
        }}
      >
        {watermarkText}
      </div>
    </div>
  );
}
