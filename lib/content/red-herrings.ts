/**
 * 紅鯡魚線索（誤導性線索）
 *
 * 每個 NPC 都持有幾條指向「無辜嫌疑人」的誤導性線索。
 * 這些線索在表面上看起來很可疑，但仔細分析會發現矛盾或合理解釋。
 *
 * 注入規則：
 * - 只在當前 NPC 不是兇手時注入（兇手 NPC 不需要誤導線索，它已有自己的偽裝）
 * - 紅鯡魚線索的 priority 都是 "minor"，且需要較高信任度才能觸發
 * - 玩家可以透過「梳理線索」功能把紅鯡魚 + 另一條線索合併，得出「這條路不通」的結論
 *
 * 文風：東野圭吾式——事實都是真的，但詮釋是錯的。
 */

import type { Clue } from "@/lib/npc-registry";
import type { CaseConfig } from "@/lib/case-config";

export interface RedHerringTemplate {
  id: string;
  /** 這條誤導線索指向哪個 NPC（讓玩家懷疑他）*/
  targetNpcId: string;
  /** 排除條件：若本局兇手正是 targetNpcId，則不注入（避免反而變成真線索）*/
  excludeIfKiller: boolean;
  content: string;
  minAffinity: number;
  requiredAct: number;
}

// ── 紅鯡魚模板庫 ──────────────────────────────────────────────

const RED_HERRING_POOL: RedHerringTemplate[] = [
  // ── 指向韓卓（法醫助理）的誤導線索 ─────────────────────────
  {
    id: "rh_hanzhuo_01",
    targetNpcId: "hanzhuo",
    excludeIfKiller: true,
    content:
      "韓卓那段時間常常在下班後不回家。他說加班，但太平間的值班表上沒有他的名字。他到底去了哪裡，沒有人知道。",
    minAffinity: 45,
    requiredAct: 1,
  },
  {
    id: "rh_hanzhuo_02",
    targetNpcId: "hanzhuo",
    excludeIfKiller: true,
    content:
      "失蹤案發生之前，那個案子附近的監視器被覆寫了，格式很乾淨。太平間有存取市政網路的權限，韓卓是有能力做到的人之一。",
    minAffinity: 60,
    requiredAct: 2,
  },

  // ── 指向余霜（分局探員）的誤導線索 ─────────────────────────
  {
    id: "rh_yushuang_01",
    targetNpcId: "yushuang",
    excludeIfKiller: true,
    content:
      "余霜的案件紀錄有幾頁是後來補進去的，不是原件。一個老同事說，她申請閱覽原始卷宗，被拒了，但她的鑰匙卡記錄顯示她進過那個存放原件的房間。",
    minAffinity: 50,
    requiredAct: 2,
  },

  // ── 指向鄭博（常客）的誤導線索 ──────────────────────────────
  {
    id: "rh_zhengbo_01",
    targetNpcId: "zhengbo",
    excludeIfKiller: true,
    content:
      "鄭博的電話在失蹤案發生的那天晚上，有個非常規的基地台跳轉紀錄，從中城區跳到了碼頭附近，然後又跳回來。他說他那天都在麵館，但訊號說他曾經到過別的地方。",
    minAffinity: 40,
    requiredAct: 1,
  },

  // ── 指向謝先生（IT 匿名者）的誤導線索 ──────────────────────
  {
    id: "rh_it_01",
    targetNpcId: "it",
    excludeIfKiller: true,
    content:
      "那段時間的系統日誌裡，有幾次不尋常的存取，時間都在深夜，來源 IP 被代理過，但跳轉模式跟謝先生平常用的代理工具很像。",
    minAffinity: 55,
    requiredAct: 2,
  },

  // ── 指向白秋（藥局老闆）的誤導線索 ─────────────────────────
  {
    id: "rh_baiqiu_01",
    targetNpcId: "baiqiu",
    excludeIfKiller: true,
    content:
      "白秋的某幾種藥，在案發前後有個異常的進貨紀錄，量比平常多了三倍，但賣出去的量沒有跟上。那些多進的藥去了哪裡，他說不清楚。",
    minAffinity: 40,
    requiredAct: 1,
  },

  // ── 指向莊河（碼頭茶攤）的誤導線索 ─────────────────────────
  {
    id: "rh_zhuanghe_01",
    targetNpcId: "zhuanghe",
    excludeIfKiller: true,
    content:
      "莊河的茶攤在霧港碼頭待了三年，但他沒有任何租約或許可文件。像他這樣沒有在地記錄的人，通常是有什麼原因不想被查到。",
    minAffinity: 35,
    requiredAct: 1,
  },

  // ── 指向林知夏（科研人員）的誤導線索 ───────────────────────
  {
    id: "rh_linzhixia_01",
    targetNpcId: "linzhixia",
    excludeIfKiller: true,
    content:
      "林知夏的實驗室申請過一批特殊化合物的取用許可，用途欄寫的是「神經抑制研究」。那種化合物在高劑量下，會讓人在短時間內喪失反抗能力，而且事後的驗屍報告很難發現。",
    minAffinity: 55,
    requiredAct: 2,
  },

  // ── 指向陶生（碼頭工人）的誤導線索 ─────────────────────────
  {
    id: "rh_taosheng_01",
    targetNpcId: "taosheng",
    excludeIfKiller: true,
    content:
      "陶生在失蹤案發生的那幾個月，每週有兩三個晚上會消失在碼頭的盲區，沒有人知道他去哪裡，他說去喝酒，但沒有人陪他去，也沒有人見過他回來。",
    minAffinity: 35,
    requiredAct: 1,
  },

  // ── 指向陳姐（麵館老闆）的誤導線索 ─────────────────────────
  {
    id: "rh_chenjie_01",
    targetNpcId: "chen_jie",
    excludeIfKiller: true,
    content:
      "那幾個失蹤者，最後一個共同點是他們都去過陳姐的麵館，而且都是在去過麵館之後沒幾天就消失了。這個規律太清楚了，讓人很難不注意到。",
    minAffinity: 30,
    requiredAct: 1,
  },
];

// ── 注入函式 ──────────────────────────────────────────────────

/**
 * 為指定 NPC 生成紅鯡魚線索清單。
 *
 * @param npcId         當前 NPC
 * @param config        本局 CaseConfig（用來確認真正的兇手）
 * @param maxCount      最多注入幾條（預設 2）
 */
export function buildRedHerringClues(
  npcId: string,
  config: CaseConfig,
  maxCount = 2,
): Clue[] {
  const realKillerId = config.killerId;

  // 過濾：
  // 1. 不能是「指向自己」的線索
  // 2. 若 excludeIfKiller=true 且 targetNpcId === realKillerId，跳過（避免誤導線索指向真兇，反而變真線索）
  // 3. 若目標就是當前 NPC（chen_jie 不給指向 chen_jie 的線索）
  const eligible = RED_HERRING_POOL.filter((rh) => {
    if (rh.targetNpcId === npcId) return false;
    if (rh.excludeIfKiller && rh.targetNpcId === realKillerId) return false;
    return true;
  });

  // 用 seed 確定性選取（避免每次隨機影響遊戲一致性）
  const seedVal = config.seed % eligible.length || 0;
  const selected = [
    eligible[seedVal % eligible.length],
    eligible[(seedVal + 1) % eligible.length],
  ].filter(Boolean).slice(0, maxCount);

  return selected.map((rh) => ({
    id: `${npcId}_${rh.id}`,
    content: rh.content,
    triggerCondition: {
      minAffinity:  rh.minAffinity,
      requiredAct:  rh.requiredAct,
    },
    priority: "minor" as const,
  }));
}
