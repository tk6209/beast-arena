import pantherImg from "@/assets/monsters/panther.png";
import bananaImg from "@/assets/monsters/banana.png";
import macacoImg from "@/assets/monsters/macaco.png";
import morcegoImg from "@/assets/monsters/morcego.png";
import sproutsImg from "@/assets/monsters/sprouts.png";
import drakoImg from "@/assets/monsters/drako.png";
import crystalImg from "@/assets/monsters/crystal.png";
import phantomImg from "@/assets/monsters/phantom.png";
import tsunamiImg from "@/assets/monsters/tsunami.png";
import voltImg from "@/assets/monsters/volt.png";

import pantherSideImg from "@/assets/monsters/panther-side.png";
import bananaSideImg from "@/assets/monsters/banana-side.png";
import macacoSideImg from "@/assets/monsters/macaco-side.png";
import morcegoSideImg from "@/assets/monsters/morcego-side.png";
import sproutsSideImg from "@/assets/monsters/sprouts-side.png";
import drakoSideImg from "@/assets/monsters/drako-side.png";
import crystalSideImg from "@/assets/monsters/crystal-side.png";
import phantomSideImg from "@/assets/monsters/phantom-side.png";
import tsunamiSideImg from "@/assets/monsters/tsunami-side.png";
import voltSideImg from "@/assets/monsters/volt-side.png";

import pantherBackImg from "@/assets/monsters/panther-back.png";
import bananaBackImg from "@/assets/monsters/banana-back.png";
import macacoBackImg from "@/assets/monsters/macaco-back.png";
import morcegoBackImg from "@/assets/monsters/morcego-back.png";
import sproutsBackImg from "@/assets/monsters/sprouts-back.png";
import drakoBackImg from "@/assets/monsters/drako-back.png";
import crystalBackImg from "@/assets/monsters/crystal-back.png";
import phantomBackImg from "@/assets/monsters/phantom-back.png";
import tsunamiBackImg from "@/assets/monsters/tsunami-back.png";
import voltBackImg from "@/assets/monsters/volt-back.png";

export const MONSTER_IMAGES: Record<string, string> = {
  panther: pantherImg,
  banana: bananaImg,
  macaco: macacoImg,
  morcego: morcegoImg,
  sprouts: sproutsImg,
  drako: drakoImg,
  crystal: crystalImg,
  phantom: phantomImg,
  tsunami: tsunamiImg,
  volt: voltImg,
};

export const MONSTER_IMAGES_SIDE: Record<string, string> = {
  panther: pantherSideImg,
  banana: bananaSideImg,
  macaco: macacoSideImg,
  morcego: morcegoSideImg,
  sprouts: sproutsSideImg,
  drako: drakoSideImg,
  crystal: crystalSideImg,
  phantom: phantomSideImg,
  tsunami: tsunamiSideImg,
  volt: voltSideImg,
};

export const MONSTER_IMAGES_BACK: Record<string, string> = {
  panther: pantherBackImg,
  banana: bananaBackImg,
  macaco: macacoBackImg,
  morcego: morcegoBackImg,
  sprouts: sproutsBackImg,
  drako: drakoBackImg,
  crystal: crystalBackImg,
  phantom: phantomBackImg,
  tsunami: tsunamiBackImg,
  volt: voltBackImg,
};

/** Returns the correct image for a monster based on rotation angle (0-360) */
export function getMonsterImageForAngle(key: string, angleDeg: number): string {
  const norm = (((angleDeg % 360) + 360) % 360);
  // Front: 0-45, 315-360
  if (norm < 45 || norm >= 315) return MONSTER_IMAGES[key];
  // Right side: 45-135
  if (norm >= 45 && norm < 135) return MONSTER_IMAGES_SIDE[key];
  // Back: 135-225
  if (norm >= 135 && norm < 225) return MONSTER_IMAGES_BACK[key];
  // Left side (mirrored): 225-315
  return MONSTER_IMAGES_SIDE[key];
}
