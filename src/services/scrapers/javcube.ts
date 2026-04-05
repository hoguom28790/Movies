import { BoobpediaProfile } from "./boobpedia";

const JAVCUBE_BASE = "https://javcube.com";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
};

export async function getJavCubeProfile(name: string): Promise<Partial<BoobpediaProfile> | null> {
  try {
    const slug = name.toLowerCase().trim().replace(/[\s\-_]+/g, "-");
    const url = `${JAVCUBE_BASE}/jav/${slug}/`;
    console.log(`[JAVCUBE] Fetching: ${url}`);

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
        console.log(`[JAVCUBE] Failed to fetch for: ${name} (Status: ${res.status})`);
        return null;
    }

    const html = await res.text();
    if (!html.includes("BIOGRAPHY")) {
        console.log(`[JAVCUBE] No biography found for: ${name}`);
        return null;
    }

    const extractStat = (label: string) => {
        const regex = new RegExp(`<strong[^>]*>${label}:<\\/strong>\\s*([^<]*)`, "i");
        const match = html.match(regex);
        return match ? match[1].trim() : "";
    };

    const birthDate = extractStat("Birthday");
    const bloodType = extractStat("Blood Group");
    const bust = extractStat("BREAST");
    const waist = extractStat("Waist");
    const hips = extractStat("Hips");
    const height = extractStat("Height");

    // Extract large profile image
    const imgMatch = html.match(/class=\"img-fluid\" src=\"(https?:\/\/[^\"]+\.(jpg|png|webp))/i);
    const profileImage = imgMatch ? imgMatch[1] : "";

    const measurements = (bust && waist && hips) ? `${bust}-${waist}-${hips} cm` : "";
    
    return {
      profileImage: profileImage,
      birthDate: birthDate,
      measurements: measurements,
      bust: bust,
      waist: waist,
      hips: hips,
      height: height ? `${parseInt(height)/100} m (${(parseInt(height)*0.0328084).toFixed(1)} ft)` : "",
      bloodType: bloodType,
      ethnicity: "Asian",
      nationality: "Japanese",
      boobsType: "Natural", 
      cupSize: "", 
    };
  } catch (error) {
    console.error("[JAVCUBE] Error:", error);
    return null;
  }
}
