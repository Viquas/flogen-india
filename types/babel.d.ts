declare module '@babel/standalone' {
  interface TransformOptions {
    presets?: Array<string | [string, Record<string, unknown>]>
    filename?: string
    configFile?: boolean
    babelrc?: boolean
  }

  interface TransformResult {
    code: string
    map?: unknown
    ast?: unknown
  }

  export function transform(code: string, options?: TransformOptions): TransformResult
  export function registerPlugin(name: string, plugin: unknown): void
  export function registerPreset(name: string, preset: unknown): void
}
