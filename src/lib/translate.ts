export async function translateToVietnamese(text: string): Promise<string> {
  if (!text || text.trim() === "") return "";
  
  // Basic heuristic to skip if already Vietnamese
  const viRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  if (viRegex.test(text)) return text;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    // Google Translate returns an array of chunks
    if (data && data[0]) {
      return data[0].map((chunk: any) => chunk[0]).join("");
    }
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}
