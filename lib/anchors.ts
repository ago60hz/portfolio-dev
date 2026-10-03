/**
 * The id a case-study still is given in the article.
 *
 * The infinite gallery links a tile to the exact picture it shows rather than to
 * the top of the study, so every image on a study page needs a stable id and
 * both ends have to agree on it without a shared table. Deriving it from the
 * file path is what guarantees that: the tile and the article start from the
 * same `media.src`, so a renamed asset moves both together or neither.
 *
 * `-still` is stripped because a recording is one picture served as two files
 * -- the GIF in the article and its first frame under reduced motion -- and
 * they must not resolve to two different anchors.
 */
export const mediaAnchor = (src: string) =>
  `media-${src.split("/").pop()!.replace(/\.[a-z0-9]+$/i, "").replace(/-still$/, "")}`;
