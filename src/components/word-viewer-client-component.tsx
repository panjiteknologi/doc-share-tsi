import { useEffect } from 'react';

const WordViewer = ({ documentUrl }) => {
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Blok klik kanan di seluruh window
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    documentUrl && (
      <div style={{ width: "100%", height: "100%" }}>
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`}
          width="100%"
          height="100%"
          style={{ border: "none" }}
        />
      </div>
    )
  );
};
