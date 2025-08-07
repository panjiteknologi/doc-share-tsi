import { useEffect } from "react";

interface AntiScreenshotOverlayProps {
  watermarkText?: string;
}

export default function AntiScreenshotOverlay({ watermarkText = "Confidential" }: AntiScreenshotOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const keyCombo = `${e.metaKey ? "Meta+" : ""}${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.altKey ? "Alt+" : ""}${e.key}`;
      const key = e.key.toLowerCase();

      const blockedCombos = [
        "Meta+Shift+S",
        "Ctrl+Shift+S",
        "PrintScreen",
        "Meta",
        "Meta+S",
        "Ctrl+S",
        "Ctrl+Alt+S",
        "Ctrl+Shift+I",
        "F12",
        "Meta+Option+I",
      ];

      const isPrintScreen =
        key === "printscreen" ||
        e.keyCode === 44 ||
        e.code.toLowerCase().includes("printscreen");

      if (blockedCombos.includes(keyCombo) || isPrintScreen) {
        document.body.innerHTML =
          "<div style='position:fixed;top:0;left:0;width:100vw;height:100vh;background:black;z-index:9999;'></div>";
        setTimeout(() => location.reload(), 1000);
      }
    };

    document.addEventListener("keydown", handler);
    document.addEventListener("keyup", handler);

    return () => {
      document.removeEventListener("keydown", handler);
      document.removeEventListener("keyup", handler);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        flexWrap: "wrap",
        gap: "10vw",
        opacity: 0.1,
        fontSize: "6vw",
        color: "red",
        transform: "rotate(-30deg)",
        userSelect: "none",
      }}
    >
      {/* {Array.from({ length: 20 }).map((_, i=1) => ( */}
        <div>{watermarkText}</div>
      {/* ))} */}
    </div>
  );
}
