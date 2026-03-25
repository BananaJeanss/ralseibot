// fetcher for mediawiki, specifically either undertale/deltarune.wiki

export interface fetchWikiInteface {
  title: string;
  description: string;
  image?: string;
  extrafields?: {
    classification?: string;
    pronouns?: string[];
    type?: string[];
  };
  ogLink: string;
}

export function formatNameToWikiUrl(name: string, wiki: "deltarune" | "undertale"): string {
  // formats a name to a wiki url simple as
  return `https://${wiki}.wiki/api.php?action=parse&page=${name}&format=json`;
}

export async function randomWikiUrl(wiki: "deltarune" | "undertale"): Promise<string> {
  const result = await fetch(`https://${wiki}.wiki/api.php?action=query&list=random&rnnamespace=0&rnlimit=1&format=json`);
  if (!result.ok) {
    throw new Error(`Failed to fetch random wiki article: ${result.status} ${result.statusText}`);
  }

  const data: any = await result.json();
  const articleName = data.query.random[0].title;
  return articleName;
}


export async function searchWiki(search: string, wiki: "deltarune" | "undertale"): Promise<string | null> {
  // searches wiki, returns the page name for fetchWiki
  const apiUrl = `https://${wiki}.wiki/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    search,
  )}&format=json`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to search wiki: ${response.status} ${response.statusText}`,
    );
  }
  const jsresponse: any = await response.json();
  const searchResults = jsresponse.query.search;
  if (searchResults.length === 0) {
    return null;
  }

  // replace spaces with underscores for the page name
  const pageName = searchResults[0].title.replace(/ /g, "_");
  return pageName;
}

export async function fetchWiki(source: string, wiki: "deltarune" | "undertale"): Promise<fetchWikiInteface> {
  // assuming source is a mediawiki api always
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch wiki: ${response.status} ${response.statusText}`,
    );
  }

  const jsresponse: any = await response.json();

  const html = (jsresponse as any).parse.text["*"] as string;

  // if it has Redirect to:, then fetch the new page
  if (html.includes("Redirect to:")) {
    // find first <a href="..."> and extract the url
    // it'll include something like /w/Kris_Dreemurr so take that, and rewrite page=Kris
    const redirectMatch = html.match(/<a href="([^"]+)"/);
    console.log("🔄 Detected redirect, fetching new page:", redirectMatch?.[1]);
    if (redirectMatch) {
      const redirectUrl = source.replace(
        /page=[^&]+/,
        `page=${redirectMatch[1].split("/").pop()}`,
      );
      return fetchWiki(redirectUrl, wiki);
    }
  }

  const cleaned = new HTMLRewriter()
    .on(
      "aside, style, .hatnote, blockquote, .mw-empty-elt, .mw-references-wrap, sup",
      {
        element(el) {
          el.remove();
        },
      },
    )
    .transform(html);

  // title
  const title = jsresponse.parse.title as string;

  // collect paragraphs
  const paragraphs: string[] = [];
  let current = "";

  new HTMLRewriter()
    .on("p", {
      element(el) {
        current = "";
        el.onEndTag(() => {
          if (current.trim()) {
            paragraphs.push(current.trim());
          }
        });
      },
      text(t) {
        current += t.text;
      },
    })
    .transform(cleaned);

  const description = paragraphs
    .join("\n\n")
    .split("\n")[0]
    .replace(/\s+/g, " ")
    .trim();

  // wokey d. pronouns
  const infoboxHtml = new HTMLRewriter()
    .on("sup, style, .jumplink", {
      element(el) {
        el.remove();
      },
    })
    .transform(html);

  // classification
  let classification = "";
  new HTMLRewriter()
    .on('[data-source="classification"] .pi-data-value', {
      element(el) {
        el.onEndTag(() => {});
      },
      text(t) {
        classification += t.text;
      },
    })
    .transform(infoboxHtml);

  let pronouns = "";
  new HTMLRewriter()
    .on('[data-source="pronouns"] .pi-data-value', {
      element(el) {
        el.onEndTag(() => {});
      },
      text(t) {
        pronouns += t.text;
      },
    })
    .transform(infoboxHtml);

  // Type
  let typeStr = "";
  new HTMLRewriter()
    .on('[data-source="type"] .pi-data-value', {
      element(el) {
        el.onEndTag(() => {});
      },
      text(t) {
        typeStr += t.text;
        if (t.lastInTextNode) typeStr += "\n";
      },
    })
    .transform(infoboxHtml);
  const type = typeStr.split("\n").map((t) => t.trim()).filter(Boolean);

  // Image/thumbnail, get first in array
  let image: string | undefined = undefined;
  try {
    image = jsresponse.parse.images?.[0];
    // convert to thumbnail url
    if (image) {
      const thumbResponse = await fetch(
        `https://${wiki}.wiki/api.php?action=query&titles=File:${encodeURIComponent(image)}&prop=imageinfo&iiprop=url&format=json`,
      );
      if (thumbResponse.ok) {
        const thumbJson: any = await thumbResponse.json();
        const pages = thumbJson.query.pages;
        const pageKey = Object.keys(pages)[0];
        image = pages[pageKey].imageinfo[0].url;
      } else {
        console.warn(
          `Failed to fetch thumbnail for image ${image}: ${thumbResponse.status} ${thumbResponse.statusText}`,
        );
      }
    }
  } catch (error) {
    console.error("Error fetching image:", error);
  }

  // og link for source
  const ogLink = `https://${wiki}.wiki/w/${title.replace(/ /g, "_")}`;

  return {
    title,
    description,
    image,
    extrafields: {
      classification: classification ? classification.trim() : undefined,
      pronouns: pronouns ? [pronouns.trim()] : undefined,
      type: type.length > 0 ? type.map((t) => t.trim()).filter(Boolean) : undefined,
    },
    ogLink,
  };
}
