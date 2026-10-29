import { type Finder, type FinderOptions, createFinder as create } from "../finder.ts";
import { german } from "./language.ts";

export type { Finder, FinderOptions, Hit, Match, SearchOptions } from "../finder.ts";
export type { Meanings } from "../meanings.ts";

/** A German finder over `names`, code to name: read once, searched often. */
export function createFinder(names: Record<string, string>, options?: FinderOptions): Finder {
  return create(names, german, options);
}
