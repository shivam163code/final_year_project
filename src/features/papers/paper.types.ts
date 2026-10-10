export type Paper = {
  id: string;
  title: string;
  authors: string[];
  publicationYear: number | null;
  abstract: string | null;
  citationCount: number;
  doi: string | null;
  sourceUrl: string | null;
  sourceName?: string | null;
};

export type PaperSearchResponse = {
  papers: Paper[];
  meta: {
    page: number;
    perPage: number;
    totalCount: number;
    lastPage: number;
  };
};
