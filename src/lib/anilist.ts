export const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

export const ANILIST_QUERIES = {
  SEARCH_MANGA: `
    query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: MANGA) {
          id
          title {
            romaji
            english
            native
          }
          format
          status
          description
          coverImage {
            large
          }
          averageScore
        }
      }
    }
  `,
  USER_PROGRESS: `
    query ($userId: Int, $mediaId: Int) {
      MediaList(userId: $userId, mediaId: $mediaId) {
        id
        status
        progress
        repeat
        media {
          id
          title {
            romaji
            english
          }
          chapters
        }
      }
    }
  `,
  VIEWER: `
    query {
      Viewer {
        id
        name
        avatar {
          large
        }
      }
    }
  `
};

export const ANILIST_MUTATIONS = {
  SAVE_MEDIA_LIST_ENTRY: `
    mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
      SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
        id
        progress
        status
      }
    }
  `
};

export interface AniListToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export async function fetchAniList(query: string, variables: any, token?: string) {
  const response = await fetch(ANILIST_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  return data.data;
}

export const getAniListAuthUrl = (state: string) => {
  const clientId = "37601";
  const redirectUri = "https://hophim.vercel.app/api/auth/anilist/callback";
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
};
