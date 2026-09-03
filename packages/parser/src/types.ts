import { Presentation } from '@yumia/ast';

export interface ParserOptions {
  strict?: boolean;
}

export interface YumiaParser {
  parse(source: string, options?: ParserOptions): Presentation;
}
