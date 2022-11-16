const fs = require("fs");
const path = require("path");

const render = require("./render");
const traitsLib = require("./vendor/qql-traits.min.js");

async function main(args) {
  const [outdir, address, traitEncoding, count, extraArg] = args;
  if (outdir == null || address == null || traitEncoding == null || count == null || extraArg != null) {
    throw new Error("usage: render <outdir> <address> <traitEncoding>");
  }

  const end = parseInt(count);
  for (let i = 0; i < end; i++) {
    console.log(`Generating ${i + 1} of ${count}`);

    const seed = buildSeedWithRandomNonce(address, traitEncoding);
    console.log("Seed:", seed);

    const traits = traitsLib.extractTraits(seed);
    console.log("Traits:", JSON.stringify(traits, null, 2));

    const { imageData, renderData } = await render({ seed, width: 2400 });
    const basename = `${new Date().toISOString()}-${seed}.png`;
    const outfile = path.join(outdir, basename);
    await fs.promises.writeFile(outfile, imageData);

    console.log("Render data:", JSON.stringify(renderData, null, 2));
    console.log("Image:", outfile);
  }
}

// Example seed:
//
// 33c9371d25ce44a408f8a6473fbad86bf81e1a1769cde9ac759effff1291c8a0
// |--------------address-----------------||---nonce--||-s|v|--t--|
// |---------------160b-------------------||----48b---||16|4|-28b-|
//
// Where:
// s is the version sentinel (always ffff)
// v is the version (currently 1)
// t is the trait encoding, which should start with a 0 bit
//
// The trait encoding can be obtained by generating a QQL on qql.art with the
// desired traits and then extracting the last seven characters of the token (URL).
// Note that there is no ability to randomize elements of the traits with this version
// of the script.

function buildSeedWithRandomNonce(address, traitEncoding) {
  address = address.toLowerCase();
  if (!address.match(/^0x[0-9a-f]*$/)) {
    throw new Error("expected hex string for address; got: " + address);
  }
  const nonce = Buffer.from(Array(6).fill().map(() => Math.random() * 256)).toString("hex");
  return "0x" + address.slice(2) + nonce + 'ffff1' + traitEncoding;
}

main(process.argv.slice(2)).catch((e) => {
  process.exitCode = process.exitCode || 1;
  console.error(e);
});
