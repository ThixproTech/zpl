import JDBArray from "./slots/JDB.js";
import JiliArray from "./slots/JiliGames.js";
import SpribeArray from "./slots/Spribe.js";
import EvolutionArray from "./casino/Evolution.js";
import EzugiArray from "./casino/Ezugi.js";
import Luckysports from "./sports/luckysports.js";
import { PgsoftArray } from "./slots/PgSoft.js";
import { AllSlots } from "./slots/merger.js";
import { updatedMicrogamingArray } from "./slots/merger.js";

export const AllGames = [
   ...Luckysports.map(item => ({
      ...item,
      provider: "luckysports",
   })),
   // ...EzugiArray.map((item) => ({
   //   ...item,
   //   provider: "livecasino",
   // })),
   ...EvolutionArray.map(item => ({
      ...item,
      provider: "livecasino",
   })),
   ...SpribeArray.map(item => ({
      ...item,
      provider: "spribe",
   })),
   ...JiliArray.map(item => ({
      ...item,
      provider: "jili",
   })),
   ...JDBArray.map(item => ({
      ...item,
      provider: "jdb",
   })),
   ...PgsoftArray.map(item => ({
      ...item,
      provider: "pgsoft",
   })),
   ...updatedMicrogamingArray.map(item => ({
      ...item,
      provider: "MG",
   })),
].map(item => ({
   ...item,
   tag: ["slots"],
}));
