import Evolution from "./Evolution.js";
import Ezugi from "./Ezugi.js";

export const AllCasino = [...Evolution, ...Ezugi, ].map((item) => ({
  ...item,
  tag: ["casino"],
}));
