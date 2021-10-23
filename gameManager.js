// enemyTypes
/*
slime - move towards you and touches you, damages you - 0
flying skele head - moves towards you and stays at a distance and fires a bullet occasionally - 1
spike traps - spikes at the bottom, you can't break it - 2
auto shooter - a machine that shoots projectiles in four directions, you can break it but hard to break - 3
*/

import { addDust } from "./entities/dust.js";
import { addSkeleHead } from "./entities/enemies/skeleHead.js";
import { addSlime } from "./entities/enemies/slime.js";
import { addSpike } from "./entities/enemies/spike.js";
import { getHead } from "./entities/head.js";
import { getPlayer } from "./entities/player.js";
import { uiOffset, roomWidth, roomHeight } from "./utils/constants.js";
import { clamp, getActualCenter } from "./utils/helpers.js";

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
let randDeg = getRandomArbitrary(0, 360);

const putSpikes = ({
  xAmount,
  yAmount,
  x = getActualCenter().x,
  y = getActualCenter().y,
  shouldPlace,
}) => {
  let spikes = [];
  let spikeSize = 16;
  let startAtX = x - (xAmount * spikeSize) / 2 + 10;
  let startAtY = y - (yAmount * spikeSize) / 2 + 10;
  let iCount = 0;
  let jCount = 0;
  for (let i = startAtX; i < startAtX + xAmount * spikeSize; i += spikeSize) {
    iCount++;
    for (let j = startAtY; j < startAtY + yAmount * spikeSize; j += spikeSize) {
      jCount++;
      if (shouldPlace(iCount, jCount)) {
        spikes.push({
          name: "spike",
          props: {
            x: i,
            y: j,
          },
        });
      }
    }
    jCount = 0;
  }
  return spikes;
};

const waves = [
  {
    enemies: [
      {
        name: "slime",
        props: {
          x: getActualCenter().x + Math.cos(randDeg) * 70,
          y: getActualCenter().y + Math.sin(randDeg) * 70,
        },
      },
      {
        name: "slime",
        props: {
          x: getActualCenter().x + Math.cos(randDeg) * -70,
          y: getActualCenter().y + Math.sin(randDeg) * -70,
        },
      },
    ],
  },
  {
    enemies: [
      {
        name: "slime",
        props: {
          x: getActualCenter().x + Math.cos(randDeg) * 70,
          y: getActualCenter().y + Math.sin(randDeg) * -70,
        },
      },
      {
        name: "skeleHead",
        props: {
          x: getActualCenter().x,
          y: getActualCenter().y,
          r: roomHeight / 2 - 30,
          xspd: 1,
          yspd: 1,
        },
      },
      {
        name: "skeleHead",
        props: {
          x: getActualCenter().x,
          y: getActualCenter().y,
          r: 60,
          xspd: -1,
          yspd: -1,
        },
      },
    ],
  },
  {
    hazards: putSpikes({
      xAmount: 8,
      yAmount: 8,
      shouldPlace: (i, j) => {
        return i === 1 || j === 1 || i === 8 || j === 8;
      },
    }),
    enemies: [
      {
        name: "skeleHead",
        props: {
          x: getActualCenter().x,
          y: getActualCenter().y,
          r: 50,
          xvary: 1,
          yvary: 2,
          xspd: 1,
          yspd: 1,
        },
      },
      {
        name: "skeleHead",
        props: {
          x: getActualCenter().x,
          y: getActualCenter().y,
          r: roomHeight - 150,
          xvary: 2,
          yvary: 2,
          xspd: -1,
          yspd: -1,
        },
      },
      {
        name: "skeleHead",
        props: {
          x: getActualCenter().x,
          y: getActualCenter().y,
          r: 70,
          xvary: 3,
          yvary: 1,
          xspd: -1,
          yspd: -1,
        },
      },
    ],
  },
];

export const addGameManager = () => {
  let waveBanner = add([
    rect(roomWidth, uiOffset / 2 + 10),
    layer("uiOverlay"),
    z(100000),
    color(0, 0, 0),
    origin("center"),
    pos(roomWidth / 2 + uiOffset / 2, -14),
    {
      wave: 0,
      stayTimer: 200,
      targetY: uiOffset / 2 - 4,
      toggleOpen: true,
      closeTarget: -14,
      openTarget: uiOffset / 2 - 4,
      text: "",
      juicy: false,
    },
    {
      update: (e) => {
        e.pos.y = lerp(e.pos.y, e.targetY, 0.1);
        if (e.toggleOpen) {
          e.stayTimer--;
          if (e.stayTimer <= 0) {
            e.targetY = waveBanner.closeTarget;
            e.stayTimer = 200;
            e.toggleOpen = false;
            e.juicy = false;
          }
        }
      },
      open: () => {
        waveBanner.toggleOpen = true;
        waveBanner.targetY = waveBanner.openTarget;
        waveBanner.stayTimer = 200;
      },
      close: () => {
        waveBanner.toggleOpen = false;
        waveBanner.targetY = waveBanner.closeTarget;
        waveBanner.juicy = false;
        waveBanner.stayTimer = 200;
      },
    },
    {
      draw: () => {
        let col = rgb(213, 60, 106);
        if ((time() * 45) % 10 < 5) {
          col = rgb(213, 60, 106);
        } else {
          col = rgb(178, 217, 66);
        }
        if (waveBanner.juicy) {
          for (let i = 0; i < roomWidth + uiOffset; i += 6) {
            pushTransform();
            pushTranslate(
              waveBanner.pos.x - roomWidth / 2 - uiOffset / 2 + i,
              waveBanner.pos.y + wave(-5, 5, time() * 2 + i)
            );
            drawCircle({
              radius: 0.6,
              origin: "center",
              opacity: 0.4,
              color: col,
            });
            popTransform();
          }
        }
        pushTransform();
        pushTranslate(waveBanner.pos.x, waveBanner.pos.y);
        drawText({
          text: waveBanner.text,
          font: "sink",
          origin: "center",
          color: waveBanner.juicy ? col : rgb(255, 255, 255),
          transform: (i) => {
            if (waveBanner.juicy) {
              return {
                pos: vec2(0, wave(-2, 2, time() * 4 + i / 4)),
              };
            }
          },
        });
        popTransform();
      },
    },
  ]);

  let player = null;
  let head = null;

  let gm = add([
    "gm",
    {
      score: 0,
      currWave: 0,
      currWaveSpawned: false,
      currEntities: [],
      spawnGap: 200,
      triggerPlay: false,
      triggerNextWave: false,
      nextWaveGap: 300,
      combo: 1,
      maxCombo: 1,
      triggerCombo: false,
      maxCoolDown: 670,
      comboCoolDown: 670,
      playerIsDead: false,
    },
    {
      update: (e) => {
        if (!player) {
          player = getPlayer();
        }

        if (!head) {
          head = getHead();
        }

        if (e.triggerCombo) {
          e.comboCoolDown -= clamp(e.combo, 1, 3);
          if (e.comboCoolDown <= 0) {
            e.triggerCombo = false;
            e.combo = 1;
            gm.trigger("updateScoreIndicator");
            e.comboCoolDown = e.maxCoolDown;
          }
        }

        e.maxCombo = Math.max(e.maxCombo, e.combo);

        if (!e.currWaveSpawned) {
          let thingsToSpawn = waves[e.currWave];
          let enemies = thingsToSpawn?.enemies;
          let hazards = thingsToSpawn?.hazards;
          enemies?.forEach((enemy) => {
            switch (enemy?.name) {
              case "slime": {
                e.currEntities.push(addSlime(enemy.props));
                break;
              }
              case "skeleHead": {
                e.currEntities.push(addSkeleHead(enemy.props));
                break;
              }
            }
          });
          hazards?.forEach((hazard) => {
            switch (hazard?.name) {
              case "spike": {
                e.currEntities.push(addSpike(hazard.props));
                break;
              }
            }
          });
          e.currWaveSpawned = true;
          e.triggerPlay = true;
        }

        let noOfEnemies = get("enemy")?.length || 0;
        if (noOfEnemies <= 0 && e.currWave < waves.length) {
          e.comboCoolDown = e.maxCoolDown;
          e.nextWaveGap--;
          // show wave complete
          if (e.nextWaveGap <= 175) {
            waveBanner.text = "WAVE COMPLETE";
            waveBanner.juicy = true;
            waveBanner.open();
            every("hazard", (h) => {
              for (let i = 0; i < 2; i++) {
                addDust({
                  x: h.pos.x + rand(-7, 7),
                  y: h.pos.y + rand(-7, 7),
                  isSpawn: true,
                });
              }
              destroy(h);
            });
          }
          // move player and head to center
          if (e.nextWaveGap <= 100 && e.nextWaveGap >= 0) {
            player.playing = false;
            head.playing = false;
            head.spd = 0;
            head.vspd = 0;
            head.hspd = 0;
            player.pos.x = lerp(player?.pos.x, getActualCenter().x, 0.05);
            player.pos.y = lerp(player?.pos.y, getActualCenter().y + 13, 0.05);

            head.pos.x = lerp(head?.pos.x, getActualCenter().x, 0.05);
            head.pos.y = lerp(head?.pos.y, getActualCenter().y, 0.05);
            head.rot = 0;

            if (Math.random() < 0.2) {
              addDust({
                x: player.pos.x + rand(-6, 6),
                y: player.pos.y + rand(-6, 6),
                isSpawn: true,
              });
            }

            if (Math.random() < 0.2) {
              addDust({
                x: head.pos.x + rand(-10, 10),
                y: head.pos.y + rand(-10, 10),
                isSpawn: true,
              });
            }
          }
          // show next wave
          if (e.nextWaveGap <= -120) {
            waveBanner.close();
            e.currWave++;
            waveBanner.text = "WAVE " + e.currWave;
            waveBanner.open();
            player.playing = true;
            head.playing = true;
            e.nextWaveGap = 300;
            e.triggerNextWave = true;
            e.currWaveSpawned = false;
            e.currEntities = [];
          }
        }

        if (e.triggerPlay) {
          e.spawnGap--;
          if (e.spawnGap <= 0) {
            e.triggerPlay = false;
            e.spawnGap = 200;
            player.hurt();
            e.currEntities?.forEach((ent) => {
              ent.playing = true;
            });
          }
        }
      },
    },
    {
      increaseScore: (amnt) => {
        gm.score += amnt;
        gm.trigger("updateScoreIndicator");
      },
    },
    {
      decreaseScore: (amnt) => {
        gm.score -= amnt;
        gm.trigger("updateScoreIndicator");
      },
    },
  ]);

  waveBanner.text = "WAVE " + gm.currWave;

  return gm;
};

export const getGameManager = () => {
  return get("gm")?.[0];
};
