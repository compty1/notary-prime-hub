/**
 * NS-007: QR code and share button for notary pages
 */
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, QrCode, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";

interface NotaryPageQRShareProps {
  slug: string;
  displayName: string;
  themeColor: string;
}

export function NotaryPageQRShare({ slug, displayName, themeColor }: NotaryPageQRShareProps) {
  const [copied, setCopied] = useState(false);
  const pageUrl = `${window.location.origin}/n/${slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: displayName,
        text: `Professional notary services by ${displayName}`,
        url: pageUrl,
      });
    } else {
      handleCopy();
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("notary-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `${slug}-qr-code.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs"
        onClick={handleShare}
      >
        <Share2 className="h-3 w-3" /> Share
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            <QrCode className="h-3 w-3" /> QR Code
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Share {displayName}'s Page</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl border-2 p-4" style={{ borderColor: `${themeColor}40` }}>
              <QRCodeSVG
                id="notary-qr-svg"
                value={pageUrl}
                size={200}
                fgColor={themeColor}
                level="M"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan to visit {displayName}'s professional page
            </p>
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Button
                className="flex-1 gap-1"
                style={{ backgroundColor: themeColor }}
                onClick={handleDownloadQR}
              >
                <Download className="h-4 w-4" /> Download QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
