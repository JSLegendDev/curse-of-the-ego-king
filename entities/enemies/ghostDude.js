import { getGameManager } from "../../gameManager.js";
import { roomHeight, roomWidth, uiOffset } from "../../utils/constants.js";
import { clamp, lengthdir_x, lengthdir_y } from "../../utils/helpers.js";
import { addCorpse } from "../corpse.js";
import { addDust } from "../dust.js";
import { getHead } from "../head.js";
import { addHittable } from "../hittable.js";
import { getPlayer } from "../player.js";
import { addScoreBubble } from "../scoreBubble.js";

export const addGhostDude = ({ x, y }) => {
  let head = getHead();
  let player = getPlayer();
  let gm = getGameManager();

  let ghost = add([
    sprite("sprGhostDude"),
    layer("game"),
    pos(x, y),
    { hitBox: null },
    area(),
    "ghostDude",
    origin("center"),
    {
      dir: 0,
      targetPos: vec2(
        rand(uiOffset / 2, roomHeight - uiOffset / 2),
        rand(uiOffset, roomHeight - uiOffset / 4)
      ),
      hspd: 0,
      vspd: 0,
      fric: 0.1,
      xscale: 1,
      yscale: 1,
      health: 10,
      isHurt: false,
      hurtFrame: 10,
      dieWithPassion: false,
      specialHit: false,
      baseScore: 40,
      playing: true,
      normalSpd: 0.2,
      waiting: false,
      watingTimer: 0,
      shootTimer: 0,
      shooting: false,
      dirToShoot: 0,
      shootSpeed: 5,
      triggerShootTimer: 500,
      rot: 0,
    },
    {
      add: () => {
        for (let i = 0; i < 6; i++) {
          addDust({
            x: x + rand(-5, 5),
            y: y + rand(-5, 5),
            isSpawn: true,
            dir: -90,
            spd: 12,
          });
        }
      },
      update: (e) => {
        e.dir = e.shooting ? e.dirToShoot : e.targetPos.angle(e.pos);

        e.hspd = lengthdir_x(e.shooting ? e.shootSpeed : e.normalSpd, e.dir);
        e.vspd = lengthdir_y(e.shooting ? e.shootSpeed : e.normalSpd, e.dir);

        e.pos.x += e.hspd * e.playing * (!e.waiting || e.shooting);
        e.pos.y += e.vspd * e.playing * (!e.waiting || e.shooting);
        if (
          Math.floor(e.pos.dist(e.targetPos)) <= 20 &&
          !e.waiting &&
          !e.shooting
        ) {
          e.waiting = true;
          e.targetPos = vec2(
            rand(uiOffset + 14, roomWidth - uiOffset / 4),
            rand(uiOffset, roomHeight - uiOffset / 4)
          );
        }

        e.shootTimer += 1 * e.playing;
        if (e.shootTimer >= e.triggerShootTimer - 50) {
          e.rot += 30;
          if (Math.random() < 0.7) {
            addDust({
              x: e.pos.x + rand(-6, 6),
              y: e.pos.y + rand(-6, 6),
              spd: 20,
              dir: rand(0, 360),
            }).use(color(255, 0, 0));
          }
        }
        if (e.shootTimer >= e.triggerShootTimer) {
          e.shootTimer = 0;
          e.shooting = true;
          e.dirToShoot = player.pos.angle(e.pos);
          e.rot = e.dirToShoot + 90;
          e.triggerShootTimer = rand(260, 400);
        }

        if (e.waiting && !e.shooting) {
          e.watingTimer++;
          if (e.watingTimer >= 50) {
            e.watingTimer = 0;
            e.waiting = false;
          }
        }

        if (e.shooting) {
          addDust({ x: e.pos.x + rand(-3, 3), y: e.pos.y + rand(-3, 3) }).use(
            color(255, 0, 0)
          );
        }
        e.use(rotate(e.rot + wave(-15, 15, time() * 4)));

        if (e.isHurt) {
          if (e.hurtFrame === 10) {
            e.health -= 1;
          }
          e.hurtFrame -= 1;
          e.use(color(200, 0, 0));
          if (e.hurtFrame <= 0) {
            e.hurtFrame = 10;
            e.isHurt = false;
            e.unuse("color");
          }
        }

        if (e.health <= 0) {
          e.die(e?.dieWithPassion);
        }

        e.xscale = lerp(e.xscale, 1, 0.1);
        e.yscale = lerp(e.yscale, 1, 0.1);
        e.use(scale(vec2(e.xscale, e.yscale)));

        if (
          e.pos.x <= uiOffset / 2 + e.width / 2 + 9 ||
          e.pos.x >= roomWidth - e.width / 2 + uiOffset / 2 - 9 ||
          e.pos.y <= e.height / 2 + uiOffset / 2 + 22 ||
          e.pos.y >= roomHeight - e.height / 2 + uiOffset / 4 + 6
        ) {
          e.shooting = false;
          e.triggerShootTimer = rand(260, 400);
          e.shootTimer = 0;
          e.rot = 0;
          shake(1);
        }

        e.pos.x = clamp(
          e.pos.x,
          uiOffset / 2 + e.width / 2 + 9,
          roomWidth - e.width / 2 + uiOffset / 2 - 9
        );
        e.pos.y = clamp(
          e.pos.y,
          e.height / 2 + uiOffset / 2 + 22,
          roomHeight - e.height / 2 + uiOffset / 4 + 6
        );
      },
      hurt: (die) => {
        ghost.isHurt = true;
        ghost.dieWithPassion = die?.dieWithPassion;
        ghost.specialHit = die?.specialHit;
      },
      die: () => {
        addCorpse({
          x: ghost.pos.x,
          y: ghost.pos.y,
          dir: rand(0, 360),
          spd: head.spd * 4,
          poofSize: vec2(ghost.width, ghost.height),
          spr: "sprGhostDude",
          dieWithPassion: ghost.dieWithPassion,
        });
        let score = ghost.baseScore;
        if (head.hitWall) {
          score += 10;
        }
        if (ghost.dieWithPassion) {
          score += 5;
        }
        if (ghost.dieWithPassion && head.hitWall) {
          score += 15;
        }
        if (ghost.specialHit) {
          score += 25;
        }
        score = score * gm.combo;
        gm.combo++;
        gm.comboCoolDown = gm.maxCoolDown;
        gm.triggerCombo = true;
        addScoreBubble({
          x: head.pos.x,
          y: head.pos.y,
          amount: score,
        });
        gm.increaseScore(score);
        if (ghost.hitBox) {
          destroy(ghost.hitBox);
        }
        destroy(ghost);
      },
    },
  ]);

  let hittable = addHittable({
    parent: ghost,
    width: 6,
    height: 6,
    damagesPlayer: true,
  });
  ghost.hitBox = hittable;

  return ghost;
};
