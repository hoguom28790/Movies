/**
 * Minimal Protobuf Decoder specifically for MangaPlus
 * Field numbers are based on reverse engineering of MangaPlus Web API
 */

// Added MangaPlus (official Shueisha) as third source for high-quality official manga

export class MangaPlusService {
  private static PROXY_BASE = "/api/mangaplus";

  /**
   * Decodes a length-delimited field (Type 2) recursively or as string/buffer
   */
  private static decodeField(buffer: Uint8Array, start: number, end: number): any {
    const fields: Record<number, any[]> = {};
    let pos = start;

    while (pos < end) {
      const tag = buffer[pos++];
      const wireType = tag & 0x07;
      const fieldNum = tag >> 3;

      if (wireType === 0) { // Varint
        let value = 0;
        let shift = 0;
        while (buffer[pos] & 0x80) {
          value |= (buffer[pos++] & 0x7f) << shift;
          shift += 7;
        }
        value |= (buffer[pos++] & 0x7f) << shift;
        if (!fields[fieldNum]) fields[fieldNum] = [];
        fields[fieldNum].push(value);
      } else if (wireType === 2) { // Length-delimited
        let len = 0;
        let shift = 0;
        while (buffer[pos] & 0x80) {
          len |= (buffer[pos++] & 0x7f) << shift;
          shift += 7;
        }
        len |= (buffer[pos++] & 0x7f) << shift;
        
        const subContent = buffer.slice(pos, pos + len);
        pos += len;

        if (!fields[fieldNum]) fields[fieldNum] = [];
        
        // Try to decode as sub-message, if fails, treat as string/bytes
        try {
          // A very basic heuristic: if it looks like ASCII and has no binary junk, it might be a string
          const str = new TextDecoder().decode(subContent);
          if (/^[\x20-\x7E\s]*$/.test(str) && str.length > 0) {
             fields[fieldNum].push(str);
          } else {
             fields[fieldNum].push(subContent); // Keep as bytes for deeper decoding
          }
        } catch {
          fields[fieldNum].push(subContent);
        }
      } else {
        // Skip Fixed64 (1), Fixed32 (5), etc. for simplicity
        pos = end; // Break loop
      }
    }
    return fields;
  }

  static async getTitleDetail(titleId: string) {
    const res = await fetch(`${this.PROXY_BASE}/title_detail?title_id=${titleId}`);
    if (!res.ok) return null;
    
    const buffer = new Uint8Array(await res.arrayBuffer());
    // Root message -> field 1 (Success) -> field 1 (TitleDetailView)
    const root = this.decodeField(buffer, 0, buffer.length);
    const success = this.decodeField(root[1][0], 0, root[1][0].length);
    const detail = this.decodeField(success[1][0], 0, success[1][0].length);
    
    const titleObj = this.decodeField(detail[1][0], 0, detail[1][0].length);
    
    return {
      title: titleObj[2][0],
      author: titleObj[3][0],
      poster: titleObj[4][0],
      chapters: this.extractChapters(detail[10] || [])
    };
  }

  private static extractChapters(chapterGroups: Uint8Array[]) {
    const list: any[] = [];
    chapterGroups.forEach(groupRaw => {
        const group = this.decodeField(groupRaw, 0, groupRaw.length);
        const chapters = group[1] || [];
        chapters.forEach((chapRaw: Uint8Array) => {
            const chap = this.decodeField(chapRaw, 0, chapRaw.length);
            list.push({
                id: chap[1][0].toString(),
                name: chap[2][0],
                subTitle: chap[3][0],
                isFree: true // Simplified logic
            });
        });
    });
    return list;
  }

  static async getPages(chapterId: string) {
    const res = await fetch(`${this.PROXY_BASE}/manga_viewer?chapter_id=${chapterId}&split=yes&img_quality=high`);
    if (!res.ok) return [];
    
    const buffer = new Uint8Array(await res.arrayBuffer());
    const root = this.decodeField(buffer, 0, buffer.length);
    const success = this.decodeField(root[1][0], 0, root[1][0].length);
    const viewer = this.decodeField(success[1][0], 0, success[1][0].length);
    
    const pagesRaw = viewer[1] || [];
    const images: string[] = [];
    
    pagesRaw.forEach((pageRaw: Uint8Array) => {
        const page = this.decodeField(pageRaw, 0, pageRaw.length);
        if (page[1] && page[1][0]) {
            const pageImage = this.decodeField(page[1][0], 0, page[1][0].length);
            const url = pageImage[1][0];
            if (typeof url === 'string' && url.startsWith('http')) {
                images.push(url);
            }
        }
    });
    
    return images;
  }

  /**
   * Search for a title on MangaPlus (Local filter because MangaPlus doesn't have a direct search API)
   */
  static async searchTitle(query: string) {
    const res = await fetch(`${this.PROXY_BASE}/title_list/all`);
    if (!res.ok) return null;
    
    const buffer = new Uint8Array(await res.arrayBuffer());
    const root = this.decodeField(buffer, 0, buffer.length);
    const success = this.decodeField(root[1][0], 0, root[1][0].length);
    const list = this.decodeField(success[1][0], 0, success[1][0].length);
    
    const titles = list[1] || [];
    for (const titleRaw of titles) {
        const title = this.decodeField(titleRaw, 0, titleRaw.length);
        const name = title[2][0];
        if (typeof name === 'string' && name.toLowerCase().includes(query.toLowerCase())) {
            return {
                id: title[1][0].toString(),
                name: name
            };
        }
    }
    return null;
  }
}
