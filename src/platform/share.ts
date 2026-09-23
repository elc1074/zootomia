export interface SharePlatform {
  saveImage(png: Blob, fileName: string): Promise<"saved" | "cancelled" | "error">;
  openExternal(url: string): void;
  copyText(text: string): Promise<boolean>;
}

export function getSharePlatform(): SharePlatform {
  // @ts-ignore
  if (typeof window !== "undefined" && window.zootomiaDesktop) {
    // @ts-ignore
    return window.zootomiaDesktop as SharePlatform;
  }

  return {
    async saveImage(png: Blob, fileName: string) {
      try {
        const url = URL.createObjectURL(png);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return "saved";
      } catch (err) {
        return "error";
      }
    },
    openExternal(url: string) {
      window.open(url, "_blank", "noopener");
    },
    async copyText(text: string) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          document.body.removeChild(textarea);
          return true;
        } catch (e) {
          document.body.removeChild(textarea);
          return false;
        }
      }
    }
  };
}
