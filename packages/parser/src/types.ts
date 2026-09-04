import { Presentation } from '@yumiamd/ast';

export interface ParserOptions {
  strict?: boolean;
}

export interface YumiaParser {
  parse(source: string, options?: ParserOptions): Presentation;
}
