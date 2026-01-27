export interface PostFrontMatter {
  layout: 'post' | 'page' | 'home' | 'hidden';
  title: string;
  date: string;
  categories?: string | string[];
  toc?: boolean;
  is_series?: boolean;
  series_title?: string;
  permalink?: string;
}

export interface Post {
  slug: string;
  frontMatter: PostFrontMatter;
  content: string;
  htmlContent: string;
  toc: TocItem[];
  url: string;
  date: Date;
  categories: string[];
}

export interface TocItem {
  depth: number;
  value: string;
  id: string;
  children: TocItem[];
}

export interface Series {
  title: string;
  slug: string;
  posts: Post[];
}
