import JDBArray from "./JDB.js";
import JiliArray from "./JiliGames.js";
import SpribeArray from "./Spribe.js";
import { PgsoftArray } from "./PgSoft.js";
import { Microgaming } from "./Microgaming.js";
import { mircrogamingArray } from "./Microgame.js";

export const updatedMicrogamingArray = mircrogamingArray
   .map(microItem => {
      const matchingGame = Microgaming.find(game => game.gameNameEn === microItem.name);

      if (!matchingGame || !matchingGame.img) {
         return null;
      }

      return {
         ...microItem,
         img: matchingGame.img,
      };
   })
   .filter(Boolean);

export const AllSlots = [ ...SpribeArray.slice(0, 5), ...JiliArray.slice(0, 6), ...JDBArray.slice(0, 7), ...PgsoftArray.slice(0, 8),...updatedMicrogamingArray.slice(0, 4),].map(item => ({
   ...item,
   tag: ["slots"],
}));
