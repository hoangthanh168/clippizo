import { basehub as basehubClient, fragmentOn } from "basehub";
import { keys } from "./keys";
import "./basehub.config";

const basehub = basehubClient({
  token: keys().BASEHUB_TOKEN,
});

/* -------------------------------------------------------------------------------------------------
 * Common Fragments
 * -----------------------------------------------------------------------------------------------*/

const imageFragment = fragmentOn("BlockImage", {
  url: true,
  width: true,
  height: true,
  alt: true,
  blurDataURL: true,
});

/* -------------------------------------------------------------------------------------------------
 * Blog Fragments & Queries
 * -----------------------------------------------------------------------------------------------*/

const postMetaFragment = fragmentOn("PostsItem", {
  _slug: true,
  _title: true,
  authors: {
    _title: true,
    avatar: imageFragment,
    xUrl: true,
  },
  categories: {
    _title: true,
  },
  date: true,
  description: true,
  image: imageFragment,
});

const postFragment = fragmentOn("PostsItem", {
  _slug: true,
  _title: true,
  authors: {
    _title: true,
    avatar: imageFragment,
    xUrl: true,
  },
  categories: {
    _title: true,
  },
  date: true,
  description: true,
  image: imageFragment,
  body: {
    plainText: true,
    json: {
      content: true,
      toc: true,
    },
    readingTime: true,
  },
});

// Define types based on fragment selections
export type PostMeta = {
  _slug: string;
  _title: string;
  authors: Array<{
    _title: string;
    avatar: {
      url: string;
      width: number;
      height: number;
      alt: string | null;
      blurDataURL: string;
    };
    xUrl: string | null;
  }>;
  categories: Array<{ _title: string }> | null;
  date: string;
  description: string;
  image: {
    url: string;
    width: number;
    height: number;
    alt: string | null;
    blurDataURL: string;
  };
};

type RichTextContent = Array<{
  type: string;
  children?: unknown[];
  [key: string]: unknown;
}>;

type RichTextToc = Array<{
  id: string;
  title: string;
  depth: number;
}>;

export type Post = PostMeta & {
  body: {
    plainText: string;
    json: {
      content: RichTextContent;
      toc: RichTextToc;
    };
    readingTime: number;
  };
};

export const blog = {
  postsQuery: fragmentOn("Query", {
    blog: {
      posts: {
        items: postMetaFragment,
      },
    },
  }),

  latestPostQuery: fragmentOn("Query", {
    blog: {
      posts: {
        __args: {
          orderBy: "_sys_createdAt__DESC",
        },
        item: postFragment,
      },
    },
  }),

  postQuery: (slug: string) => ({
    blog: {
      posts: {
        __args: {
          filter: {
            _sys_slug: { eq: slug },
          },
        },
        item: postFragment,
      },
    },
  }),

  getPosts: async (): Promise<PostMeta[]> => {
    const data = await basehub.query(blog.postsQuery);

    return data.blog.posts.items;
  },

  getLatestPost: async (): Promise<Post | null> => {
    const data = await basehub.query(blog.latestPostQuery);

    return data.blog.posts.item;
  },

  getPost: async (slug: string): Promise<Post | null> => {
    const query = blog.postQuery(slug);
    const data = await basehub.query(query);

    return data.blog.posts.item;
  },
};

/* -------------------------------------------------------------------------------------------------
 * Legal Fragments & Queries
 * -----------------------------------------------------------------------------------------------*/

const legalPostMetaFragment = fragmentOn("LegalPagesItem", {
  _slug: true,
  _title: true,
  description: true,
});

const legalPostFragment = fragmentOn("LegalPagesItem", {
  _slug: true,
  _title: true,
  description: true,
  body: {
    plainText: true,
    json: {
      content: true,
      toc: true,
    },
    readingTime: true,
  },
});

// Define types based on fragment selections
export type LegalPostMeta = {
  _slug: string;
  _title: string;
  description: string;
};

export type LegalPost = LegalPostMeta & {
  body: {
    plainText: string;
    json: {
      content: RichTextContent;
      toc: RichTextToc;
    };
    readingTime: number;
  };
};

export const legal = {
  postsQuery: fragmentOn("Query", {
    legalPages: {
      items: legalPostFragment,
    },
  }),

  latestPostQuery: fragmentOn("Query", {
    legalPages: {
      __args: {
        orderBy: "_sys_createdAt__DESC",
      },
      item: legalPostFragment,
    },
  }),

  postQuery: (slug: string) =>
    fragmentOn("Query", {
      legalPages: {
        __args: {
          filter: {
            _sys_slug: { eq: slug },
          },
        },
        item: legalPostFragment,
      },
    }),

  getPosts: async (): Promise<LegalPost[]> => {
    const data = await basehub.query(legal.postsQuery);

    return data.legalPages.items;
  },

  getLatestPost: async (): Promise<LegalPost | null> => {
    const data = await basehub.query(legal.latestPostQuery);

    return data.legalPages.item;
  },

  getPost: async (slug: string): Promise<LegalPost | null> => {
    const query = legal.postQuery(slug);
    const data = await basehub.query(query);

    return data.legalPages.item;
  },
};
