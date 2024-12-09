import { AbstractQuery } from "./abstract.query";

export class ScriptQuery extends AbstractQuery {
  constructor(
    private readonly source: string | undefined,
  ) {
    super();
  }

  getQuery(): any {
    return { script: { script: { source: this.source, lang: 'painless' } } };
  }
}
