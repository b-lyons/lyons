declare module "heic-convert" {
  /** Decodes HEIC/HEIF, including the HEVC-coded files iPhones produce. */
  export default function heicConvert(options: {
    buffer: Buffer;
    format: "JPEG" | "PNG";
    quality?: number;
  }): Promise<ArrayBuffer>;
}
