import { useEffect } from "react";

type WordViewerProps = {
  documentUrl: string;
};

const WordViewer = ({ documentUrl }: WordViewerProps) => {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <iframe
      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        documentUrl
      )}`}
      width="100%"
      height="600px"
      frameBorder="0"
    />
  );
};

export default WordViewer;
