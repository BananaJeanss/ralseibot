declare module "gif-encoder-2" {
  class GIFEncoder {
    constructor(width: number, height: number);
    setDelay(ms: number): void;
    setRepeat(repeat: number): void;
    setQuality(quality: number): void;
    setTransparent(color: number): void;
    start(): void;
    addFrame(ctx: any): void;
    finish(): void;
    out: { getData(): Uint8Array };
  }
  export default GIFEncoder;
}
