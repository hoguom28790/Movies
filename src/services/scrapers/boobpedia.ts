const BOOBPEDIA_BASE = "https://www.boobpedia.com";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&[a-z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function nameToWikiTitle(name: string): string {
  // Convert "Yua Mikami" -> "Yua_Mikami"
  return name.trim().replace(/\s+/g, "_");
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Reject Cloudflare challenge pages
    if (text.includes("Just a moment") || text.includes("cf-browser-verification") || text.length < 2000) {
      return null;
    }
    return text;
  } catch {
    return null;
  }
}

/** Extract a profile image URL from the actress page */
function extractProfileImage(html: string, actressSlug: string): string {
  // Try to find the file reference like /boobs/File:Yua_Mikami.jpg
  const fileMatch = html.match(/href="\/boobs\/File:([^"]+\.(jpg|jpeg|png|webp))"/i);
  if (fileMatch) {
    // The image is typically at /wiki/images/x/xx/Filename.ext
    // We need to follow the file page to get the real URL
    // But we can construct a predictable wiki image path:
    // /wiki/images/thumb/HASH/Filename.jpg/Wpx-Filename.jpg
    // Instead, return the boobpedia file page reference as indicator
    return `/boobs/File:${fileMatch[1]}`;
  }
  // Fallback: try infobox image
  const infoboxImg = html.match(/class="infobox[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>/i);
  if (infoboxImg) return infoboxImg[1];
  return "";
}

/** Resolve a boobpedia file page link to the actual image URL */
async function resolveBoobpediaImage(filePath: string): Promise<string> {
  if (!filePath.startsWith("/boobs/File:")) return filePath;
  const filePageUrl = `${BOOBPEDIA_BASE}${filePath}`;
  const html = await fetchHtml(filePageUrl);
  if (!html) return "";
  // Look for the full image href: href="/wiki/images/f/f6/Yua_Mikami.jpg"
  const fullImageMatch = html.match(/fullImageLink[^>]*>[\s\S]*?href="(\/wiki\/images\/[^"]+\.(jpg|jpeg|png|webp))"/i);
  if (fullImageMatch) return `${BOOBPEDIA_BASE}${fullImageMatch[1]}`;
  // Fallback: look for thumb src
  const thumbMatch = html.match(/src="(\/wiki\/images\/thumb\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i);
  if (thumbMatch) {
    // Convert thumb URL to full image: /wiki/images/thumb/x/xx/File.jpg/300px-File.jpg -> /wiki/images/x/xx/File.jpg
    const cleanUrl = thumbMatch[1].replace(/\/thumb\//, "/").replace(/\/\d+px-[^/]+$/, "");
    return `${BOOBPEDIA_BASE}${cleanUrl}`;
  }
  return "";
}

export interface BoobpediaProfile {
  source: string;
  stageName: string;
  realName: string;
  birthDate: string;
  measurements: string;
  bust: string;
  waist: string;
  hips: string;
  cupSize: string;
  height: string;
  weight: string;
  bloodType: string;
  birthPlace: string;
  nationality: string;
  ethnicity: string;
  yearsActive: string;
  studio: string;
  debutYear: string;
  status: string;
  profileImage: string;
  gallery: string[];
}

export async function getBoobpediaProfile(name: string): Promise<BoobpediaProfile | null> {
  try {
    const wikiTitle = nameToWikiTitle(name);
    const url = `${BOOBPEDIA_BASE}/boobs/${encodeURIComponent(wikiTitle)}`;
    console.log(`[BOOBPEDIA] Fetching: ${url}`);

    const html = await fetchHtml(url);
    if (!html) {
      console.log(`[BOOBPEDIA] Failed to fetch for: ${name}`);
      return null;
    }

    // Check if this is a valid actress page (not a redirect/error)
    if (!html.includes("infobox") && !html.includes("Measurements") && !html.includes("Birthday") && !html.includes("Born")) {
      console.log(`[BOOBPEDIA] No info found for: ${name}`);
      return null;
    }

    const profile: BoobpediaProfile = {
      source: "boobpedia",
      stageName: name,
      realName: "N/A",
      birthDate: "N/A",
      measurements: "N/A",
      bust: "N/A",
      waist: "N/A", 
      hips: "N/A",
      cupSize: "N/A",
      height: "N/A",
      weight: "N/A",
      bloodType: "N/A",
      birthPlace: "N/A",
      nationality: "N/A",
      ethnicity: "N/A",
      yearsActive: "N/A",
      studio: "N/A",
      debutYear: "N/A",
      status: "Active",
      profileImage: "",
      gallery: [],
    };

    // Extract all table rows from infobox
    // Pattern: <b>Label</b></td>\n<td>Value</td>
    const rowRegex = /<b>([^<]+)<\/b><\/td>[\s\S]*?<td>([\s\S]*?)<\/td>/gi;
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const label = stripHtml(match[1]).trim().toLowerCase().replace(/\u00a0/g, " ");
      const rawValue = match[2];
      const value = stripHtml(rawValue).trim();

      if (!value || value === "N/A") continue;

      if (label.includes("born") || label.includes("birthday")) {
        // Extract just the date part "August 16, 1993 (1993-08-16)"
        const dateMatch = value.match(/(\w+ \d+,\s*\d{4})/);
        if (dateMatch) profile.birthDate = dateMatch[1];
        else profile.birthDate = value.split("(")[0].trim();
        // Extract birthplace (last line after date)
        const placeMatch = value.match(/\d{4}\)\s*(.+)$/);
        if (placeMatch) profile.birthPlace = placeMatch[1].trim();
      } else if (label.includes("years") && label.includes("active")) {
        profile.yearsActive = value;
        if (value.match(/\d{4}/)) {
          profile.debutYear = value.match(/(\d{4})/)?.[1] || "N/A";
          profile.status = value.toLowerCase().includes("present") ? "Active" : "Retired";
        }
      } else if (label.includes("nationality")) {
        profile.nationality = value;
        if (!profile.birthPlace || profile.birthPlace === "N/A") profile.birthPlace = value;
      } else if (label.includes("ethnicity")) {
        profile.ethnicity = value;
      } else if (label.includes("measurement")) {
        // e.g., "83-57-88 cm33-22-35 in" -> "83-57-88 cm"
        const cmMatch = value.match(/([\d]+-[\d]+-[\d]+)\s*cm/i);
        if (cmMatch) {
          profile.measurements = cmMatch[1] + " cm";
          const parts = cmMatch[1].split("-");
          if (parts.length === 3) {
            profile.bust = parts[0] + " cm";
            profile.waist = parts[1] + " cm";
            profile.hips = parts[2] + " cm";
          }
        } else {
          profile.measurements = value.split(/\d+-\d+-\d+\s*in/)[0].trim();
        }
      } else if (label.includes("bra") || label.includes("cup")) {
        profile.cupSize = value.split(" ")[0]; // e.g., "F metric" -> "F"
      } else if (label.includes("height")) {
        // "1.59 m (5 ft 2⁄2 in)" -> "1.59 m"
        const heightMatch = value.match(/([\d.]+)\s*m/i);
        if (heightMatch) profile.height = heightMatch[1] + " m";
        else profile.height = value.split("(")[0].trim();
      } else if (label.includes("weight")) {
        profile.weight = value.split("(")[0].trim();
      } else if (label.includes("blood")) {
        profile.bloodType = value.replace(/\s*type/i, "").trim();
      } else if (label.includes("real name") || label.includes("birth name")) {
        profile.realName = value;
      }
    }

    // Get profile image
    const fileRef = extractProfileImage(html, wikiTitle);
    if (fileRef) {
      profile.profileImage = await resolveBoobpediaImage(fileRef);
    }

    // Measurements badge: merge bust/waist/hips if we got separate
    if (profile.bust !== "N/A" && profile.waist !== "N/A" && profile.hips !== "N/A") {
      profile.measurements = `B${profile.bust.replace(" cm", "")} / W${profile.waist.replace(" cm", "")} / H${profile.hips.replace(" cm", "")}`;
    }

    console.log(`[BOOBPEDIA] Success for ${name}:`, {
      birthDate: profile.birthDate,
      measurements: profile.measurements,
      cupSize: profile.cupSize,
      height: profile.height,
      profileImage: profile.profileImage,
    });

    return profile;
  } catch (err) {
    console.error("[BOOBPEDIA] Error:", err);
    return null;
  }
}
