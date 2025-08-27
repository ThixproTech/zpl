import LuckySports from "./luckysports.js";
import SabaSports from "./sabasports.js";

export const AllSports = [...LuckySports, ...SabaSports].map((item) => ({
  ...item,
  tag: ["sports"],
}));
