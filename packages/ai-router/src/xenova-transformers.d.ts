/**
 * @xenova/transformers 타입 선언
 */

declare module '@xenova/transformers' {
  export interface PipelineOutput {
    tolist(): number[][];
  }

  export type Pipeline = (
    texts: string[],
    options?: { pooling?: string; normalize?: boolean }
  ) => Promise<PipelineOutput>;

  export function pipeline(
    task: string,
    model: string,
    options?: { quantized?: boolean }
  ): Promise<Pipeline>;
}
