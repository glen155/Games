import { useEffect, useState } from 'react';
import QR from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
}

/** Renders a QR code as an inline data-URL image (no network, no canvas refs). */
export function QRCode({ value, size = 176 }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QR.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className="qr-placeholder" style={{ width: size, height: size }} />;
  }
  return <img className="qr-image" src={dataUrl} alt="Scan to join" width={size} height={size} />;
}
