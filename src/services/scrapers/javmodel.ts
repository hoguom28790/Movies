export interface ActressProfile {
  stageName: string;
  realName?: string;
  profileImage: string;
  birthDate: string;
  measurements: string;
  bust: string;
  waist: string;
  hips: string;
  cupSize?: string;
  height: string;
  weight?: string;
  bloodType: string;
  birthPlace?: string;
  nationality: string;
  ethnicity: string;
  yearsActive?: string;
  studio?: string;
  debutYear?: string;
  status: string;
  bodyType?: string;
  eyeColor?: string;
  hairColor?: string;
  underarmHair?: string;
  pubicHair?: string;
  boobsType: string;
  performanceShown?: string;
  performanceSolo?: string;
  performanceBoyGirl?: string;
  instagram?: string;
  gallery: string[];
}

const JAVMODEL_BASE = "https://javmodel.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
};

/**
 * Scraper for JavModel.com - A premium JAV database with high quality profile images
 * This is now the primary source for actress biographical info and images.
 */
export async function getJavModelProfile(name: string): Promise<Partial<ActressProfile> | null> {
  try {
    const parts = name.toLowerCase().trim().split(/[\s\-_]+/);
    const slug1 = parts.join("-");
    const slug2 = [...parts].reverse().join("-");
    
    // Slugs: yua-mikami, mikami-yua
    const slugs = [slug1];
    if (slug2 !== slug1) slugs.push(slug2);

    let html = "";
    let finalSlug = slug1;

    for (const slug of slugs) {
      const url = `${JAVMODEL_BASE}/jav/${slug}/`;
      console.log(`[JAVMODEL] Fetching: ${url}`);
      const res = await fetch(url, { headers: HEADERS });
      
      if (res.ok) {
        html = await res.text();
        // Check if we actually found a model page
        if (html.includes("Birthday") || html.includes("Blood Type")) {
          finalSlug = slug;
          break;
        }
      }
    }

    if (!html || (!html.includes("Birthday") && !html.includes("Blood Type"))) {
        console.log(`[JAVMODEL] No profile found for: ${name} (tried ${slugs.join(", ")})`);
        return null;
    }

    const extractStat = (label: string) => {
        // Find label followed by content
        // Example: <strong>Birthday:</strong> 08/16/1993
        const regex = new RegExp(`(?:<strong>|<b>)${label}:?<\\/(?:strong|b)>\\s*([^<]*)`, "i");
        const match = html.match(regex);
        if (match) return match[1].trim();
        
        // Alternative: Label on one line, value on next (markdown-like)
        const altRegex = new RegExp(`${label}\\s*\\n\\s*([^\\n]+)`, "i");
        const altMatch = html.match(altRegex);
        return altMatch ? altMatch[1].trim() : "";
    };

    const birthDate = extractStat("Birthday");
    const bloodType = extractStat("Blood Type") || extractStat("Blood Group");
    const bust = extractStat("Breast");
    const waist = extractStat("Waist");
    const hips = extractStat("Hips");
    const height = extractStat("Height");
    
    // Extract real/stage names from title or h1
    // Example: <title>Yua Mikami ...</title>
    const titleMatch = html.match(/<title>([^|<-]+)/i);
    const stageName = titleMatch ? titleMatch[1].trim() : name;

    // Extract large profile image
    // Typically: <img class="img-fluid" src="https://javmodel.com/javdata/uploads/yua_mikami150.jpg" ...>
    const imgMatch = html.match(/class=\"img-fluid\" src=\"([^\"]+\.(jpg|png|webp))/i);
    let profileImage = imgMatch ? imgMatch[1] : "";
    
    // Ensure absolute URL
    if (profileImage && !profileImage.startsWith("http")) {
        profileImage = `${JAVMODEL_BASE}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`;
    }

    const measurements = (bust && waist && hips) ? `${bust}-${waist}-${hips} cm` : "";
    
    // Gallery can be extracted from thumbnails below
    // <a href="https://javmodel.com/hd/ssis834/"><img ... src="https://..." ></a>
    const galleryMatches = Array.from(html.matchAll(/src=\"(https?:\/\/[^\"]+\.(jpg|png|webp))/gi));
    const gallery = galleryMatches
        .map(m => m[1])
        .filter(url => url.includes('/thumbs/') || url.includes('/uploads/'))
        .slice(0, 15);

    return {
      stageName: stageName,
      profileImage: profileImage,
      birthDate: birthDate,
      measurements: measurements,
      bust: bust,
      waist: waist,
      hips: hips,
      height: height ? (height.includes('cm') ? height : `${height} cm`) : "",
      bloodType: bloodType,
      ethnicity: "Asian",
      nationality: "Japanese",
      boobsType: "Natural", 
      gallery: gallery.length > 0 ? gallery : (profileImage ? [profileImage] : []),
    };
  } catch (error) {
    console.error("[JAVMODEL] Error:", error);
    return null;
  }
}
