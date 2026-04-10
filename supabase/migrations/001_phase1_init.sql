-- ============================================================
-- 相變世紀：Zero — Phase 1 初始化 Schema
-- 執行環境：Supabase SQL Editor
-- ============================================================

-- ──────────────────────────────────────────
-- 1. profiles（玩家基本資料，對應 auth.users）
-- ──────────────────────────────────────────
create table if not exists profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text,
  username   text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "players can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "players can update own profile"
  on profiles for update using (auth.uid() = id);

-- ──────────────────────────────────────────
-- 2. game_sessions（一局遊戲的主記錄）
-- ──────────────────────────────────────────
create table if not exists game_sessions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references profiles(id) on delete set null,
  guest_id      text,                    -- 訪客用，localStorage UUID
  current_act   int not null default 1,  -- 1–10
  player_route  text not null default 'A', -- 'A' 普通人類 | 'B' 第二相體
  difficulty    text not null default 'normal',
  truth_string  text,                    -- P3A1B2-7788-3-R7-D2-M1E3（只在後端存）
  status        text not null default 'active', -- active | completed | abandoned
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table game_sessions enable row level security;

-- 訪客或本人都能讀自己的場次
create policy "session owner can view"
  on game_sessions for select
  using (
    auth.uid() = profile_id
    or guest_id is not null  -- 訪客允許讀（前端用 guest_id 篩選）
  );

create policy "session owner can update"
  on game_sessions for update
  using (auth.uid() = profile_id);

-- ──────────────────────────────────────────
-- 3. conversations（對話場次，一個 NPC 一個）
-- ──────────────────────────────────────────
create table if not exists conversations (
  id              uuid primary key default gen_random_uuid(),
  game_session_id uuid references game_sessions(id) on delete cascade,
  npc_id          text not null,  -- 'chen_jie' | 'shen_yi' | 'scotland'...
  created_at      timestamptz default now()
);

alter table conversations enable row level security;

create policy "conversation is readable via session"
  on conversations for select
  using (
    exists (
      select 1 from game_sessions gs
      where gs.id = game_session_id
        and (auth.uid() = gs.profile_id or gs.guest_id is not null)
    )
  );

-- ──────────────────────────────────────────
-- 4. messages（對話訊息）
-- ──────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'npc')),
  content         text not null,
  created_at      timestamptz default now()
);

alter table messages enable row level security;

create policy "messages readable via conversation"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      join game_sessions gs on gs.id = c.game_session_id
      where c.id = conversation_id
        and (auth.uid() = gs.profile_id or gs.guest_id is not null)
    )
  );

-- ──────────────────────────────────────────
-- 5. npc_states（NPC 狀態，每局每個 NPC 一筆）
-- ──────────────────────────────────────────
create table if not exists npc_states (
  id              uuid primary key default gen_random_uuid(),
  game_session_id uuid references game_sessions(id) on delete cascade,
  npc_id          text not null,
  affinity        int not null default 0,    -- -100 到 +100
  shared_clues    text[] default '{}',       -- 已說過的線索 ID
  is_exposed      boolean default false,     -- 是否被識破
  last_seen_act   int default 0,
  unique (game_session_id, npc_id)
);

alter table npc_states enable row level security;

create policy "npc_states readable via session"
  on npc_states for select
  using (
    exists (
      select 1 from game_sessions gs
      where gs.id = game_session_id
        and (auth.uid() = gs.profile_id or gs.guest_id is not null)
    )
  );

-- ──────────────────────────────────────────
-- 6. player_clues（玩家已取得的線索）
-- ──────────────────────────────────────────
create table if not exists player_clues (
  id              uuid primary key default gen_random_uuid(),
  game_session_id uuid references game_sessions(id) on delete cascade,
  clue_id         text not null,
  obtained_at     timestamptz default now(),
  unique (game_session_id, clue_id)
);

alter table player_clues enable row level security;

create policy "player_clues readable via session"
  on player_clues for select
  using (
    exists (
      select 1 from game_sessions gs
      where gs.id = game_session_id
        and (auth.uid() = gs.profile_id or gs.guest_id is not null)
    )
  );

-- ──────────────────────────────────────────
-- 7. auto-update trigger for game_sessions.updated_at
-- ──────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger game_sessions_updated_at
  before update on game_sessions
  for each row execute function update_updated_at();
