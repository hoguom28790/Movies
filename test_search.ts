import { searchTopXXMovies } from "./src/services/api/topxx";

async function test() {
  try {
    const results = await searchTopXXMovies("Misono Waka", 1);
    console.log("Results found:", results.items.length);
    console.log("Pagination:", results.pagination);
  } catch (e) {
    console.error("CRASHED:", e);
  }
}

test();
