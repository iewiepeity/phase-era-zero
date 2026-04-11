/**
 * 行動建議選項 — 場景探索 + NPC 對話的建議文字
 *
 * 設計哲學：選項是「新手輔助輪」，不是強制路線。
 * 文字風格：東野圭吾式——像角色腦中冒出的念頭，不像遊戲指令。
 *
 * 維護規則：
 *  - 場景選項 → SCENE_ACTIONS[sceneId]
 *  - NPC 對話選項 → NPC_CHAT_OPTIONS[npcId].initial / trusted / deep
 *  - 線索/道具後的建議 → POST_EVENT_OPTIONS
 */

// ── 型別 ──────────────────────────────────────────────────────

export type ActionOptionType = "explore" | "chat" | "navigate" | "leave";

export interface ActionOption {
  id:           string;
  label:        string;       // 顯示在按鈕上的短文字
  type:         ActionOptionType;
  targetItemId?: string;      // explore 類型：場景中對應的物件 id（用來 highlight）
  chatText?:    string;       // chat 類型：填入對話框的建議文字
  npcId?:       string;       // navigate 類型：前往哪個 NPC
}

// ── 場景探索建議 ──────────────────────────────────────────────
// 進入場景後顯示的初始行動建議

export const SCENE_ACTIONS: Record<string, ActionOption[]> = {

  chen_jie_noodles: [
    {
      id:           "cjn_talk_chen",
      label:        "跟陳姐說說話",
      type:         "navigate",
      npcId:        "chen_jie",
    },
    {
      id:           "cjn_newspaper",
      label:        "那份報紙——有人翻過它",
      type:         "explore",
      targetItemId: "newspaper",
    },
    {
      id:           "cjn_coat",
      label:        "角落那件外套是誰的",
      type:         "explore",
      targetItemId: "forgotten_coat",
    },
    {
      id:           "cjn_footprints",
      label:        "地板有什麼不對勁",
      type:         "explore",
      targetItemId: "floor_footprints",
    },
    {
      id:           "cjn_leave",
      label:        "先離開",
      type:         "leave",
    },
  ],

  crime_scene: [
    {
      id:           "cs_talk_han",
      label:        "韓卓在記錄什麼",
      type:         "navigate",
      npcId:        "hanzhuo",
    },
    {
      id:           "cs_outline",
      label:        "那個輪廓，哪裡不對",
      type:         "explore",
      targetItemId: "chalk_outline",
    },
    {
      id:           "cs_camera",
      label:        "監視器是真的壞了嗎",
      type:         "explore",
      targetItemId: "broken_camera",
    },
    {
      id:           "cs_smell",
      label:        "空氣裡有什麼氣味",
      type:         "explore",
      targetItemId: "chemical_smell",
    },
    {
      id:           "cs_leave",
      label:        "先離開",
      type:         "leave",
    },
  ],

  foggy_port: [
    {
      id:           "fp_talk_zhuang",
      label:        "莊河，他在等什麼",
      type:         "navigate",
      npcId:        "zhuanghe",
    },
    {
      id:           "fp_lock",
      label:        "那個門鎖——被撬過",
      type:         "explore",
      targetItemId: "forced_lock",
    },
    {
      id:           "fp_drag",
      label:        "地面有拖行的痕跡",
      type:         "explore",
      targetItemId: "drag_marks",
    },
    {
      id:           "fp_notebook",
      label:        "那本溼透的筆記本",
      type:         "explore",
      targetItemId: "wet_notebook",
    },
    {
      id:           "fp_leave",
      label:        "先離開",
      type:         "leave",
    },
  ],

  ninth_precinct: [
    {
      id:           "np_talk_yu",
      label:        "余霜，她在等誰",
      type:         "navigate",
      npcId:        "yushuang",
    },
    {
      id:           "np_board",
      label:        "案件公告板上貼了什麼",
      type:         "explore",
      targetItemId: "case_board",
    },
    {
      id:           "np_whiteboard",
      label:        "白板上擦掉的東西",
      type:         "explore",
      targetItemId: "erased_whiteboard",
    },
    {
      id:           "np_document",
      label:        "那些被撕碎的文件",
      type:         "explore",
      targetItemId: "torn_document",
    },
    {
      id:           "np_leave",
      label:        "先離開",
      type:         "leave",
    },
  ],
};

// ── NPC 對話建議 ───────────────────────────────────────────────
// 分三個信任等級：initial（初次）/ trusted（已建立關係）/ deep（高度信任）
// 文字是建議填入對話框的句子，玩家可以修改

export const NPC_CHAT_OPTIONS: Record<string, {
  initial:  ActionOption[];
  trusted:  ActionOption[];
  deep:     ActionOption[];
}> = {

  chen_jie: {
    initial: [
      { id: "cj_i1", label: "點碗麵，閒聊一下",       type: "chat", chatText: "麵館開了多久了？我今天路過，覺得味道不一樣。" },
      { id: "cj_i2", label: "提到失蹤的事",           type: "chat", chatText: "最近中城這邊說是有人失蹤，你這邊有聽說嗎？" },
      { id: "cj_i3", label: "問最近的客人",           type: "chat", chatText: "你的常客最近都還在嗎？有沒有誰比較久沒出現了？" },
      { id: "cj_i4", label: "告辭離開",               type: "chat", chatText: "麵好吃，下次再來。謝謝你。" },
    ],
    trusted: [
      { id: "cj_t1", label: "問她有沒有注意到什麼",   type: "chat", chatText: "你開店這麼久，有沒有發現什麼事情——說不上來哪裡不對，但就是怪？" },
      { id: "cj_t2", label: "問那件外套",             type: "chat", chatText: "角落那件外套，是誰的？放了多久了？" },
      { id: "cj_t3", label: "問牆上的照片",           type: "chat", chatText: "牆上那張照片，旁邊那個人——你們認識嗎？" },
      { id: "cj_t4", label: "直接問案子",             type: "chat", chatText: "有些事我需要直接問你。關於最近失蹤的人，你知道比你說的更多，對嗎？" },
    ],
    deep: [
      { id: "cj_d1", label: "問她最後看到那人的情況", type: "chat", chatText: "你說有人往反方向走。他走的時候，臉上是什麼表情？有沒有回頭？" },
      { id: "cj_d2", label: "問那個在外面等的人",     type: "chat", chatText: "等他的那個人——你有沒有印象，大概是什麼身形？穿什麼顏色的衣服？" },
      { id: "cj_d3", label: "問收銀台的便條",         type: "chat", chatText: "收銀台旁邊那張紙，22:40，是你寫的嗎？還是別人留的？" },
    ],
  },

  hanzhuo: {
    initial: [
      { id: "hz_i1", label: "說明來意",               type: "chat", chatText: "我只是想了解一下案發現場的情況。你是負責記錄的嗎？" },
      { id: "hz_i2", label: "問現場有什麼異常",       type: "chat", chatText: "這個現場和一般的案子有什麼不一樣的地方嗎？" },
      { id: "hz_i3", label: "問他的身份",             type: "chat", chatText: "你是警察嗎？還是獨立調查的？" },
      { id: "hz_i4", label: "先離開這個話題",         type: "chat", chatText: "好，我知道了。不打擾你了。" },
    ],
    trusted: [
      { id: "hz_t1", label: "問那晚他在不在現場",     type: "chat", chatText: "第十四號失蹤案，你那晚有沒有在現場附近？" },
      { id: "hz_t2", label: "問他簽的保密協議",       type: "chat", chatText: "聽說你簽過一份東西，不是第九分局的。那是什麼？" },
      { id: "hz_t3", label: "問那個「機構」",         type: "chat", chatText: "那個機構——你可以告訴我名字嗎？或者至少說說那份協議的內容？" },
    ],
    deep: [
      { id: "hz_d1", label: "問他看到了什麼",         type: "chat", chatText: "你說你看到了不該看的東西。現在我需要你告訴我，那是什麼。" },
      { id: "hz_d2", label: "問他為什麼沒有說出來",   type: "chat", chatText: "如果你知道，你為什麼這麼久沒有說出來？是因為那份協議？還是別的原因？" },
    ],
  },

  yushuang: {
    initial: [
      { id: "ys_i1", label: "問她在等誰",             type: "chat", chatText: "你在等什麼人嗎？還是在等什麼消息？" },
      { id: "ys_i2", label: "問她是這裡的人嗎",       type: "chat", chatText: "你是第九分局的工作人員嗎？還是來辦事的？" },
      { id: "ys_i3", label: "提到林淵",               type: "chat", chatText: "你認識林淵嗎？那個——據說覺醒了的孩子。" },
      { id: "ys_i4", label: "先離開",                 type: "chat", chatText: "不好意思打擾了。先這樣。" },
    ],
    trusted: [
      { id: "ys_t1", label: "問她照顧林淵的情況",     type: "chat", chatText: "林淵在醫院的時候，你是他的護士。那段時間他有什麼不尋常的地方嗎？" },
      { id: "ys_t2", label: "問她對失蹤案的看法",     type: "chat", chatText: "失蹤的那些人——你認識幾個？你覺得他們失蹤跟林淵有關係嗎？" },
      { id: "ys_t3", label: "問她購買的藥物",         type: "chat", chatText: "白秋說有一個護士在買某種劑量不對的藥。那個人是你嗎？" },
    ],
    deep: [
      { id: "ys_d1", label: "問她真正的目的",         type: "chat", chatText: "你說你相信林淵覺醒有意義。那些消失的人，在你的想法裡，他們為什麼應該消失？" },
      { id: "ys_d2", label: "問她最後那晚",           type: "chat", chatText: "第十四號失蹤的那個晚上，你在哪裡？" },
    ],
  },

  zhengbo: {
    initial: [
      { id: "zb_i1", label: "坐下來，先聊聊",         type: "chat", chatText: "你在等什麼人嗎？還是就是在這裡坐著？" },
      { id: "zb_i2", label: "問他是什麼工作",         type: "chat", chatText: "你做什麼工作的？看起來不像這一帶的人。" },
      { id: "zb_i3", label: "提到保險理賠",           type: "chat", chatText: "你在做什麼案子的理賠調查嗎？我聽說有保險公司最近在查中城區的案件。" },
      { id: "zb_i4", label: "先離開",                 type: "chat", chatText: "打擾了，我先走。" },
    ],
    trusted: [
      { id: "zb_t1", label: "問他妻子的事",           type: "chat", chatText: "聽說你妻子也是失蹤案的受害者。你願意說說她的事嗎？" },
      { id: "zb_t2", label: "問他在調查什麼",         type: "chat", chatText: "你在這裡坐著，不是在等人，是在盯著什麼人。是誰？" },
      { id: "zb_t3", label: "問他那份名單",           type: "chat", chatText: "你去過白秋的藥局。你在找一份名單——那份名單上有誰？" },
    ],
    deep: [
      { id: "zb_d1", label: "問他的計劃",             type: "chat", chatText: "你已經把所有人的事查得很清楚了。你打算怎麼做？" },
      { id: "zb_d2", label: "問他那晚的事",           type: "chat", chatText: "第十四個人消失的那晚，你有沒有在中城區？" },
    ],
  },

  it: {
    initial: [
      { id: "it_i1", label: "試著搭話",               type: "chat", chatText: "你也在等什麼嗎？" },
      { id: "it_i2", label: "問他叫什麼名字",         type: "chat", chatText: "我可以知道你的名字嗎？" },
      { id: "it_i3", label: "問他為什麼在這裡",       type: "chat", chatText: "你在這裡等很久了嗎？" },
      { id: "it_i4", label: "直接問他感知的事",       type: "chat", chatText: "你跟別人感知世界的方式不一樣，對嗎？" },
    ],
    trusted: [
      { id: "it_t1", label: "問他覺醒的事",           type: "chat", chatText: "你的覺醒——你是什麼時候發現的？你記得那一刻嗎？" },
      { id: "it_t2", label: "問他失蹤案",             type: "chat", chatText: "那些消失的人，你說你找什麼東西。你在找他們嗎？" },
      { id: "it_t3", label: "問他的動機",             type: "chat", chatText: "你說「找人」和「等人」不一樣。你是哪一種？" },
    ],
    deep: [
      { id: "it_d1", label: "問他那樣東西是什麼",     type: "chat", chatText: "你在找的東西——是一個人，還是一件事，還是別的什麼？" },
      { id: "it_d2", label: "問他那晚的行蹤",         type: "chat", chatText: "每個失蹤的人，覺醒之前都有一段記憶空缺。那段時間，你在哪裡？" },
    ],
  },

  baiqiu: {
    initial: [
      { id: "bq_i1", label: "說明來意",               type: "chat", chatText: "我只是想問幾個問題。不會耽誤你太久。" },
      { id: "bq_i2", label: "問她那些顧客",           type: "chat", chatText: "失蹤的那些人，有幾個是你的顧客嗎？" },
      { id: "bq_i3", label: "問她藥局的事",           type: "chat", chatText: "你的藥局有沒有人最近來問過一些特殊的藥物？" },
      { id: "bq_i4", label: "先離開",                 type: "chat", chatText: "好。謝謝你。" },
    ],
    trusted: [
      { id: "bq_t1", label: "問那種感知抑制劑",       type: "chat", chatText: "你說那些顧客都買了同一類藥。那是什麼藥？為什麼要買？" },
      { id: "bq_t2", label: "問她弟弟的事",           type: "chat", chatText: "你弟弟也是失蹤者之一嗎？他失蹤之前有沒有說過什麼？" },
      { id: "bq_t3", label: "問那個找她的人",         type: "chat", chatText: "你說有人找過你，要你修改藥品記錄。那個人是誰？" },
    ],
    deep: [
      { id: "bq_d1", label: "問那份進貨被追蹤的事",   type: "chat", chatText: "追蹤你進貨的那個人，你有沒有辦法查到是誰？" },
      { id: "bq_d2", label: "直接問她的立場",         type: "chat", chatText: "你知道的比你說的還要多。你現在站在哪一邊？" },
    ],
  },

  zhuanghe: {
    initial: [
      { id: "zh_i1", label: "坐下喝茶，慢慢聊",       type: "chat", chatText: "您好。茶不忙，我只是路過，想問幾件事。" },
      { id: "zh_i2", label: "說是在查失蹤案",         type: "chat", chatText: "我在查那十四個失蹤的人。聽說你以前是刑警，也許你知道什麼。" },
      { id: "zh_i3", label: "問他退休的原因",         type: "chat", chatText: "你是什麼時候退休的？自願的，還是……不是自願的？" },
      { id: "zh_i4", label: "先離開",                 type: "chat", chatText: "好，我先這樣。謝謝你的茶。" },
    ],
    trusted: [
      { id: "zh_t1", label: "問那份目擊者名單",       type: "chat", chatText: "你說名單上的人一個一個不見了。那份名單——你現在還記得上面有誰嗎？" },
      { id: "zh_t2", label: "問案子被移交的事",       type: "chat", chatText: "你說資料消失了，約談也停了。命令是從哪個層級下來的？" },
      { id: "zh_t3", label: "問那個下命令的機構",     type: "chat", chatText: "比分局長更高的層級——你說不想說名字。但那個名字，是我聽過的嗎？" },
    ],
    deep: [
      { id: "zh_d1", label: "問他知道的比他說的多",   type: "chat", chatText: "你知道的比你告訴我的更多。我需要你說清楚——那份名單上的人，是誰決定讓他們消失的？" },
      { id: "zh_d2", label: "直接問他是不是在清除知情者", type: "chat", chatText: "你說知道太多的人活得辛苦。你說的，是你自己嗎？還是你在警告我？" },
    ],
  },

  linzhixia: {
    initial: [
      { id: "lx_i1", label: "問她在記錄什麼",         type: "chat", chatText: "你在寫什麼？是研究嗎，還是個人的紀錄？" },
      { id: "lx_i2", label: "問她為什麼在案發現場",   type: "chat", chatText: "這裡是封鎖區。你為什麼會在這裡？" },
      { id: "lx_i3", label: "問她知道林淵嗎",         type: "chat", chatText: "你聽過林淵這個名字嗎？" },
      { id: "lx_i4", label: "先離開",                 type: "chat", chatText: "好，我先走了。注意安全。" },
    ],
    trusted: [
      { id: "lx_t1", label: "問她來現場的真正目的",   type: "chat", chatText: "你說在做現場紀錄。但你記的不是案件細節——你在記什麼？" },
      { id: "lx_t2", label: "問她對覺醒的看法",       type: "chat", chatText: "你說你崇拜的不是林淵這個人。那你崇拜的是什麼？" },
      { id: "lx_t3", label: "問那晚的儀式",           type: "chat", chatText: "你重現了那晚的場景。那是什麼意思？你在儀式中扮演什麼角色？" },
    ],
    deep: [
      { id: "lx_d1", label: "問那些消失的人跟她的關係", type: "chat", chatText: "那些消失的人，在你的儀式裡，他們是什麼？必要的犧牲，還是別的什麼？" },
      { id: "lx_d2", label: "直接問她的行動",         type: "chat", chatText: "第十四號案發的那晚，你在哪裡？你做了什麼？" },
    ],
  },

  taosheng: {
    initial: [
      { id: "ts_i1", label: "說明來意",               type: "chat", chatText: "我不是閒人。我在查一些事，需要問你幾個問題。" },
      { id: "ts_i2", label: "問工地的情況",           type: "chat", chatText: "這個工地做了多久了？夜裡會有其他人在這附近嗎？" },
      { id: "ts_i3", label: "問他有沒有注意到異常",   type: "chat", chatText: "碼頭這邊最近有沒有什麼不對勁的事？你在這裡工作，應該比外人更清楚。" },
      { id: "ts_i4", label: "先離開",                 type: "chat", chatText: "好，這樣就夠了。謝謝你。" },
    ],
    trusted: [
      { id: "ts_t1", label: "問那個倉庫",             type: "chat", chatText: "碼頭旁邊那個倉庫，門鎖被撬過。你知道是誰進去的嗎？" },
      { id: "ts_t2", label: "問夜裡的拖行痕跡",       type: "chat", chatText: "地面那些拖行的痕跡是最近才有的。那晚你在嗎？你看到什麼了嗎？" },
      { id: "ts_t3", label: "問他的覺醒",             type: "chat", chatText: "你說有時候會做一些事，但不記得自己做過。那種感覺——是什麼時候開始的？" },
    ],
    deep: [
      { id: "ts_d1", label: "問那段沒有記憶的時間",   type: "chat", chatText: "那段你不記得的時間裡，你的身體去了哪裡？有沒有人告訴過你，他們看到了你？" },
      { id: "ts_d2", label: "問他是不是覺醒者",       type: "chat", chatText: "你有沒有去做過相位偏移的檢測？你自己懷疑嗎？" },
    ],
  },
};

// ── 事件後建議 ────────────────────────────────────────────────
// 玩家拾取道具或發現線索後的後續建議

export const POST_EVENT_OPTIONS: {
  afterPickup: ActionOption[];
  afterClue:   ActionOption[];
  afterTalk:   ActionOption[];
} = {
  afterPickup: [
    { id: "pe_p1", label: "去問問有沒有人知道這東西",  type: "chat", chatText: "我找到了一樣東西——你認識嗎？" },
    { id: "pe_p2", label: "先記下來，繼續探索",        type: "leave" },
    { id: "pe_p3", label: "去線索頁面整理一下",        type: "navigate", npcId: undefined },
  ],
  afterClue: [
    { id: "pe_c1", label: "去問問有沒有人能解釋",      type: "chat", chatText: "我注意到了一件事——" },
    { id: "pe_c2", label: "繼續在這裡找",              type: "leave" },
    { id: "pe_c3", label: "這條線索指向誰",            type: "leave" },
  ],
  afterTalk: [
    { id: "pe_t1", label: "他說的話，我需要再想想",    type: "leave" },
    { id: "pe_t2", label: "去找另一個人核實一下",      type: "leave" },
    { id: "pe_t3", label: "去整理一下目前拿到的線索",  type: "leave" },
  ],
};
