
async function test() {
  const url = "https://ophim1.com/v1/api/phim/cuu-2026";
  try {
    const res = await fetch(url).then(r => r.json());
    console.log("Keys:", JSON.stringify(Object.keys(res)));
    if (res.data) console.log("Data Keys:", JSON.stringify(Object.keys(res.data)));
    if (res.movie) console.log("Movie Keys:", JSON.stringify(Object.keys(res.movie)));
  } catch (e) {
    console.error(e);
  }
}
test();
