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
        // More robust pattern for different table layouts
        const regex = new RegExp(`<td[^>]*>[\\s\\S]*?${label}[\\s\\S]*?<\\/td>\\s*<td[^>]*>(?:<p>)?([^<]+)`, "i");
        const match = html.match(regex);
        if (match) return match[1].trim();
        
        const simpleRegex = new RegExp(`(?:<strong>|<b>|<span>)${label}:?<\\/(?:strong|b|span)>\\s*([^<]*)`, "i");
        const simpleMatch = html.match(simpleRegex);
        return simpleMatch ? simpleMatch[1].trim() : "";
    };

    const birthDate = extractStat("Birthday");
    const bloodType = extractStat("Blood Type") || extractStat("Blood Group");
    const bust = extractStat("Breast");
    const waist = extractStat("Waist");
    const hips = extractStat("Hips");
    const height = extractStat("Height");
    
    // Extract Model's Style tags
    // <td class="flq-color-meta"><p>Model's Style</p></td>\s*<td><a ...>Cute</a> ...
    const styleMatch = html.match(/Model's Style<\/p><\/td>\s*<td>([\s\S]*?)<\/td>/i);
    const styles: string[] = [];
    if (styleMatch) {
        const styleHtml = styleMatch[1];
        const styleTags = Array.from(styleHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/gi));
        styleTags.forEach(m => styles.push(m[1].trim()));
    }

    // Extract real/stage names from title or h1
    const titleMatch = html.match(/<title>([^|<-]+)/i);
    const stageName = titleMatch ? titleMatch[1].trim() : name;

    // Extract large profile image
    // Extract large profile image from meta og:image (most reliable)
    const ogImgMatch = html.match(/property=\"og:image\" content=\"([^\"]+\.(jpg|png|webp))/i);
    let profileImage = ogImgMatch ? ogImgMatch[1] : "";
    
    if (!profileImage) {
        // Fallback: search for any images in the uploads directory
        const imgMatches = Array.from(html.matchAll(/src=\"([^\"]+javdata\/uploads\/[^\"]+\.(jpg|png|webp))/gi));
        if (imgMatches.length > 0) {
            const mainImg = imgMatches.find(m => !m[1].includes('/thumb/')) || imgMatches[0];
            profileImage = mainImg[1];
        }
    }
    
    // Ensure absolute URL
    if (profileImage && !profileImage.startsWith("http")) {
        profileImage = `${JAVMODEL_BASE}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`;
    }

    const measurements = (bust && waist && hips) ? `${bust}-${waist}-${hips} cm` : "";
    
    // Gallery can be extracted from thumbnails below
    const galleryMatches = Array.from(html.matchAll(/src=\"([^\"]+javdata\/uploads\/[^\"]+\.(jpg|png|webp))/gi));
    const gallery = galleryMatches
        .map(m => m[1])
        .filter(url => url.includes('/thumb/'))
        .map(url => url.startsWith('http') ? url : `${JAVMODEL_BASE}${url.startsWith('/') ? '' : '/'}${url}`)
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
      boobsType: styles.includes("Beautiful Breasts") ? "Beautiful" : "Natural", 
      bodyType: styles.join(", "), // Use styles as body type/style tags
      gallery: gallery.length > 0 ? gallery : (profileImage ? [profileImage] : []),
    };
  } catch (error) {
    console.error("[JAVMODEL] Error:", error);
    return null;
  }
}
