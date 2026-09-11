// Vercel Serverless Function: proxies the author's Medium RSS feed as JSON
// so the blog page can render real posts with no browser CORS issues.
//
// Feed: https://medium.com/feed/@randikasuridu
// Optional env var: MEDIUM_FEED_URL (defaults to the feed above)
// Optional query:   ?limit=n (default 6, max 10)

const DEFAULT_FEED = "https://medium.com/feed/@randikasuridu";

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripTags(s) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function firstImage(html) {
  const m = html.match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : null;
}

function parseItems(xml, limit) {
  const posts = [];
  const itemBlocks = xml.split("<item>").slice(1);
  for (const block of itemBlocks) {
    if (posts.length >= limit) break;
    const end = block.indexOf("</item>");
    const item = end === -1 ? block : block.slice(0, end);

    const pick = (tag) => {
      const m = item.match(new RegExp("<" + tag + ">(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</" + tag + ">"));
      return m ? decodeEntities(m[1].trim()) : "";
    };

    const title = pick("title");
    const link = pick("link");
    const pubDate = pick("pubDate");
    const content = pick("content:encoded") || pick("description");
    if (!title || !link) continue;

    const cats = [];
    const catRe = /<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g;
    let cm;
    while ((cm = catRe.exec(item)) !== null && cats.length < 3) {
      cats.push(decodeEntities(cm[1].trim()));
    }

    const text = stripTags(content);
    posts.push({
      title,
      link,
      pubDate,
      categories: cats,
      image: firstImage(content),
      excerpt: text.length > 180 ? text.slice(0, 180).trimEnd() + "..." : text,
    });
  }
  return posts;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const feedUrl = process.env.MEDIUM_FEED_URL || DEFAULT_FEED;
  const limit = Math.min(Math.max(parseInt((req.query && req.query.limit) || "6", 10) || 6, 1), 10);

  try {
    const r = await fetch(feedUrl, { headers: { "User-Agent": "portfolio-medium-proxy" } });
    if (!r.ok) throw new Error("Feed responded " + r.status);
    const xml = await r.text();
    const posts = parseItems(xml, limit);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ ok: true, posts });
  } catch (err) {
    console.error("Medium feed error:", err && err.message);
    return res.status(502).json({ ok: false, error: "Could not load Medium posts right now.", posts: [] });
  }
};
