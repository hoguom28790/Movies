// src/app/api/javlibrary/actress/[id]/route.ts
// Robust Scraper Proxy for JAVLibrary (Primary) and JAVDB (Fallback)
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const JAVLIB_MIRRORS = [
  'https://www.javlibrary.com/en',
  'https://www.javlibrary.com/ja',
  'https://www.v28p.com/en',
];

const JAVDB_MIRRORS = [
  'https://javdb.com',
  'https://javdb36.com',
  'https://javdb00.com',
];

async function fetchWithRetry(urls: string[], path: string, options: any = {}, retries = 2) {
  const targetUrls = urls.length > 0 ? urls.map(u => `${u}${path}`) : [path];
  
  for (const fullUrl of targetUrls) {
    for (let i = 0; i <= retries; i++) {
        try {
            const res = await fetch(fullUrl, { 
                ...options, 
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    ...options.headers
                },
                signal: AbortSignal.timeout(10000) 
            });
            if (res.ok) return { html: await res.text(), mirror: urls.find(u => fullUrl.startsWith(u)) || fullUrl };
            if (res.status === 404) continue; // Try next mirror if 404
        } catch (e) {
            if (i === retries && fullUrl === targetUrls[targetUrls.length-1]) throw e;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
  }
  throw new Error("All mirrors failed");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: actressName } = await params;
  const name = decodeURIComponent(actressName);

  let data: any = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    source: 'fallback',
    realName: name,
    stageName: name,
    birthDate: '',
    measurements: '',
    height: '',
    profileImage: '',
    gallery: [],
    filmography: []
  };

  try {
    // 1. FAST PRIMARY: JAVDB (More reliable and faster for Bio)
    try {
        const javdbSearchPath = `/video_codes/search?q=${encodeURIComponent(name)}&f=all`;
        const { html: dbSearchHtml, mirror: dbMirror } = await fetchWithRetry(JAVDB_MIRRORS, javdbSearchPath, {}, 1); // Only 1 retry
        const $dbSearch = cheerio.load(dbSearchHtml);
        
        const dbStarLink = $dbSearch('a[href^="/actors/"]').first().attr('href');
        if (dbStarLink) {
            const { html: dbStarHtml } = await fetchWithRetry([dbMirror], dbStarLink, {}, 0); // No retry for details
            const $db = cheerio.load(dbStarHtml);
            
            data.source = 'javdb';
            $db('.panel-block').each((i, el) => {
                const label = $db(el).find('strong').text();
                const value = $db(el).text().replace(label, '').trim();
                
                if (label.includes('Birth Date')) data.birthDate = value;
                if (label.includes('Measurements')) data.measurements = value;
                if (label.includes('Height')) data.height = value;
                if (label.includes('Birthplace')) data.birthPlace = value;
            });

            data.profileImage = $db('.avatar').attr('src') || data.profileImage;
            
            $db('.actor-section-gallery img').each((i, el) => {
                const src = $db(el).attr('src');
                if (src) data.gallery.push(src);
            });

            $db('.video-tile').each((i, el) => {
               const $v = $db(el);
               data.filmography.push({
                   code: $v.find('.video-title').text().split(' ')[0],
                   title: $v.find('.video-title').text(),
                   poster: $v.find('img').attr('src') || '',
                   year: $v.find('.meta').text().trim(),
                   rating: 'N/A',
                   previewImage: $v.find('img').attr('src') || ''
               });
            });
        }
    } catch (e) {
        console.error("JAVDB Quick search failed", e);
    }

    // 2. ENRICHMENT/FALLBACK: JAVLibrary (if filmography is empty or explicitly needed)
    if (data.filmography.length === 0) {
        try {
            const searchPath = `/vl_star.php?&mode=&s=${encodeURIComponent(name)}`;
            const { html: searchHtml, mirror: libMirror } = await fetchWithRetry(JAVLIB_MIRRORS, searchPath, {}, 0); // Faster timeout
            const $search = cheerio.load(searchHtml);
            
            let actressUrl = '';
            const starLink = $search('.star a').first().attr('href');
            if (starLink) actressUrl = starLink.startsWith('http') ? starLink : `${libMirror}/${starLink}`;
            else if (searchHtml.includes('star_name')) {
                const anyStarLink = $search('a[href*="star="]').first().attr('href');
                if (anyStarLink) actressUrl = anyStarLink.startsWith('http') ? anyStarLink : `${libMirror}/${anyStarLink}`;
            }

            if (actressUrl) {
                const { html: actressHtml } = await fetchWithRetry([], actressUrl, {}, 0);
                const $ = cheerio.load(actressHtml);
                data.source = 'javlibrary';
                
                if (!data.profileImage) {
                   data.profileImage = $('.videothumblist .it .it2 img').first().attr('src') || '';
                }
                
                $('.videothumblist .videos .video').each((i, el) => {
                    const $el = $(el);
                    const code = $el.find('.id').text().trim();
                    if (!data.filmography.some((f: any) => f.code === code)) {
                        data.filmography.push({
                            code,
                            title: $el.find('.title').text().trim(),
                            poster: $el.find('img').attr('src') || '',
                            year: 'N/A',
                            rating: 'N/A',
                            previewImage: $el.find('img').attr('src') || ''
                        });
                    }
                });
            }
        } catch (e) {
            console.error("JAVLIB Fallback failed", e);
        }
    }

    // Final safety: if no data at all but we have a name, still return a success relative to the name
    return NextResponse.json(data);
  } catch (err) {
    console.error("SCRAPER API ERROR:", err);
    // Return partial data instead of error to prevent 504/crash
    return NextResponse.json(data);
  }
}
