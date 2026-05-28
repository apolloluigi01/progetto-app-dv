-- ============================================================
-- Disney Villainous — Digital Edition
-- Supabase Schema
-- ============================================================
-- Come applicarlo:
--   1. Apri il tuo progetto Supabase → SQL Editor
--   2. Incolla questo file ed esegui
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabella unica: tutto lo stato di gioco è un singolo JSONB.
-- Questo semplifica enormemente le subscription Realtime:
-- un solo canale, un solo payload.
CREATE TABLE IF NOT EXISTS games (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code  TEXT        UNIQUE NOT NULL,
  state      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);

-- Auto-aggiorna updated_at ad ogni UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: gioco peer-to-peer, accesso pubblico con anon key
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_access" ON games;
CREATE POLICY "public_access" ON games
  FOR ALL USING (true) WITH CHECK (true);

-- Abilita Realtime sulla tabella
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- ============================================================
-- Struttura dello state JSONB (documentazione):
-- {
--   "status": "lobby" | "villain_select" | "playing" | "game_over",
--   "currentPlayerIndex": 0,
--   "phase": "move" | "action" | "fate_choice" | "end_turn",
--   "actionQueue": [],        -- azioni ancora disponibili nel turno corrente
--   "pendingFate": null,      -- { targetPlayerId, cards: [...] }
--   "pendingInteraction": null,-- interazione card-specifica in attesa
--   "log": [],                 -- log eventi per i giocatori
--   "winnerId": null,
--   "players": [
--     {
--       "id": "uuid",
--       "sessionId": "...",
--       "name": "Luigi",
--       "villainId": "maleficent",
--       "isHost": true,
--       "power": 4,
--       "currentLocation": 0,
--       "lastLocation": -1,
--       "hand": ["card_id",...],
--       "villainDeck": ["card_id",...],
--       "fateDeck": ["card_id",...],
--       "villainDiscard": [],
--       "fateDiscard": [],
--       "hasWon": false,
--       "board": {
--         "locations": [
--           {
--             "id": "brughiera",
--             "allies": [],
--             "items": [],
--             "heroes": [],
--             "curses": [],
--             "coveredActionIndices": []
--           }
--         ]
--       }
--     }
--   ]
-- }
-- ============================================================
