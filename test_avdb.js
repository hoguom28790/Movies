import { getMovieDetails } from "./src/services/api/index.js";

async function test() {
  const res = await getMovieDetails("av-12567");
  console.log(JSON.stringify(res, null, 2));
}

test();
