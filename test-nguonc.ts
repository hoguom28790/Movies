import { getMovieDetails } from './src/services/api/index';

async function test() {
  try {
    const res = await getMovieDetails("dai-hoc-chien-tranh-phan-3");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
