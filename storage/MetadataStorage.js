const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice } = require("../scripts/sandbox/accounts");

module.exports = {
  owners: [alice.pkh],
  metadata: MichelsonMap.fromLiteral({
    "": Buffer("tezos-storage:here", "ascii").toString("hex"),
    here: Buffer(
      JSON.stringify({
        version: "v0.0.1",
        description: "Quipuswap Share Pool Token",
        name: "Quipu Token",
        authors: ["Madfish.Solutions"],
        homepage: "https://quipuswap.com/",
        source: {
          tools: ["Ligo", "Flextesa"],
          location: "https://ligolang.org/",
        },
        interfaces: ["TZIP-12", "TZIP-16"],
        errors: [],
        views: [
          {
            name: "token_metadata",
            implementations: [
              { prim: "DROP" },
              {
                prim: "EMPTY_MAP",
                args: [{ prim: "string" }, { prim: "bytes" }],
              },
              { prim: "PUSH", args: [{ prim: "bytes" }, { bytes: "515054" }] },
              { prim: "SOME" },
              {
                prim: "PUSH",
                args: [{ prim: "string" }, { string: "symbol" }],
              },
              { prim: "UPDATE" },
              {
                prim: "PUSH",
                args: [{ prim: "bytes" }, { bytes: "74727565" }],
              },
              { prim: "SOME" },
              {
                prim: "PUSH",
                args: [{ prim: "string" }, { string: "shouldPreferSymbol" }],
              },
              { prim: "UPDATE" },
              {
                prim: "PUSH",
                args: [
                  { prim: "bytes" },
                  { bytes: "5175697075204c5020546f6b656e" },
                ],
              },
              { prim: "SOME" },
              { prim: "PUSH", args: [{ prim: "string" }, { string: "name" }] },
              { prim: "UPDATE" },
              {
                prim: "PUSH",
                args: [
                  { prim: "bytes" },
                  {
                    bytes:
                      "51756970757377617020536861726520506f6f6c20546f6b656e",
                  },
                ],
              },
              { prim: "SOME" },
              {
                prim: "PUSH",
                args: [{ prim: "string" }, { string: "description" }],
              },
              { prim: "UPDATE" },
              { prim: "PUSH", args: [{ prim: "bytes" }, { bytes: "36" }] },
              { prim: "SOME" },
              {
                prim: "PUSH",
                args: [{ prim: "string" }, { string: "decimals" }],
              },
              { prim: "UPDATE" },
              { prim: "PUSH", args: [{ prim: "nat" }, { int: "0" }] },
              { prim: "PAIR" },
            ],
          },
        ],
        tokens: {
          dynamic: [
            {
              big_map: "token_metadata",
            },
          ],
        },
      }),
      "ascii"
    ).toString("hex"),
  }),
};
