# CLAUDE.md — Disney Villainous Digital

## Progetto
Implementazione digitale multiplayer del gioco da tavolo Disney Villainous.
Fedeltà alle regole ufficiali Ravensburger/Disney è la priorità assoluta.

## Stack
- Frontend: React + Tailwind CSS (Vite)
- Backend: Supabase (PostgreSQL + Realtime WebSocket)
- Deploy: Vercel (produzione continua)
- Repo: GitHub

## Struttura cartelle
```
src/
  data/
    villains.js        ← fonte di verità per tutte le carte e i luoghi
  components/
    Game.jsx           ← logica principale partita
    PlayerBoard.jsx    ← plancia giocatore
    Location.jsx       ← rendering luoghi
  engine/
    gameEngine.js      ← motore di gioco (modifiche richiedono segnalazione esplicita)
supabase/
  schema.sql           ← schema DB (non modificare senza approvazione)
```

## Ultimo aggiornamento dati carte
2026-06-12 — aggiornati costi, forze, nomi ed effetti di tutte le carte dei 6 villain base in `src/data/villains.js` per allineamento al testo ufficiale Ravensburger.
2026-06-12 — implementata regola "puoi" in `gameEngine.js` (`canPlayCard`): effetti obbligatori bloccano la giocata se le pre-condizioni non sono soddisfatte.

## Villain implementati (tutti in versione bozza — da migliorare)
- [ ] Capitan Uncino
- [ ] Malefica
- [ ] Ursula
- [ ] Principe Giovanni
- [ ] Jafar
- [ ] Regina di Cuori

## Villain da aggiungere (espansioni)
- [ ] Ade (richiede meccanica Titani)
- [ ] Regina cattiva (richiede meccanica gettoni veleno e conversione di gettoni potere in gettoni veleno)
- [ ] Dr. Facilier (richiede meccanica Pila della Sorte)
- [ ] Scar (richiede meccanica Pila della successione)
- [ ] Rattigan (richiede meccanica del doppio obiettivo vittoria)
- [ ] Yzma (richiede meccanica mazzo fato diviso in 4)
- [ ] Crudelia de Mon (richiede meccanica segnalini cucciolo)
- [ ] Madre Gothel (richiede meccanica Rapunzel carta fissa che si muove ogni fine turno di 1 verso corona)
- [ ] Gambadilegno (richiede meccanica segnalini obiettivo coperti)
- [ ] Gaston (richiede meccanica segnalini bestia da rimuovere dalla plancia)
- [ ] Matrigna (richiede meccanica intrappolamento eroi e manipolazione del fato)
- [ ] Re Cornelius (richiede meccanica della pentola a due facce)
- [ ] Syndrome (richiede meccanica traformazioni omnidroidi)
- [ ] Lotso (richiede meccanica azzeramento potenza eroi)
- [ ] Maga Magò (richiede meccanica mazzo trasformazioni e trasformazioni alleate)
- [ ] Bau Bau (richiede meccanica dadi)
- [ ] Sher Khan (richiede meccanica segnalini fuoco)
- [ ] Re Candito (richiede meccanica corsa con segnalino e plancia unica nel suo genere a forma di pista)
- [ ] Davy Jones (richiede meccanica segnalini tesoro da conquistare tramite scontri)
- [ ] Tamatoa (richiede meccanica mazzo Maoui)

## Stato funzionalità core
- [x] Struttura realm/location per ogni villain
- [x] Multiplayer Realtime via Supabase
- [x] Deploy Vercel funzionante
- [ ] Meccanica carte Condizione — da implementare correttamente
- [ ] Azione Attivare — da migliorare
- [ ] Carte tipo speciale per villain (es. Maledizioni Malefica, Titani Ade)
- [ ] Fix meccaniche specifiche carte singole
- [ ] Grafica e UI — da rifare completamente (priorità bassa, ultima fase)

## Priorità di sviluppo
1. Fix funzionamento carte e meccaniche per i 6 villain esistenti
2. Implementazione tipi carta speciali per villain (Maledizioni, Titani, ecc.)
3. Aggiunta villain espansioni
4. Restyling grafico completo (non toccare prima che il motore sia stabile)

## Regole tecniche — rispetta sempre
- La fonte di verità per le regole di gioco sono i file in `src/data/`
- In caso di dubbio su una regola, chiedi prima di implementare
- Il layout delle location/realm non va modificato — è strutturalmente corretto
- Ogni fix deve essere un file completo e copiabile senza modifiche
- Se una modifica tocca `gameEngine.js`, segnalalo esplicitamente prima di procedere
- Non modificare `supabase/schema.sql` senza approvazione esplicita

## Regola "puoi" — obbligatorietà degli effetti (FONDAMENTALE, vale per TUTTE le carte)

Questa regola si applica a ogni carta villain e fate, presente e futura.

**Principio:** la parola "puoi" nell'effetto di una carta rende l'azione FACOLTATIVA.
Se "puoi" è assente, l'azione è OBBLIGATORIA.

**Conseguenza diretta:** una carta con effetto obbligatorio NON PUÒ essere giocata
se la sua pre-condizione non è soddisfatta dallo stato del gioco.

| Testo effetto | Tipo | Comportamento |
|---|---|---|
| "Scarta un Alleato o un Oggetto e ottieni 3 Potere" | Obbligatorio (no "puoi") | Non giocabile se nessun Alleato/Oggetto nel Reame |
| "Sconfiggi un Eroe con Forza 4 o inferiore" | Obbligatorio | Non giocabile se nessun Eroe ≤4 Forza nel Reame |
| "Puoi muovere un Alleato in un Luogo qualsiasi" | Facoltativo | Sempre giocabile; il movimento è opzionale |
| "Puoi muovere un Eroe... Puoi muovere un Alleato..." | Facoltativo (entrambe) | Sempre giocabile; il giocatore può non fare niente |

**Casi reali implementati in `canPlayCard` (gameEngine.js):**
- `jaf_e_sac_*` Sacrificio Necessario → ≥1 Alleato o Oggetto nel Reame
- `jaf_e_ser_*` Ah, Sarei un Serpente? → ≥1 Eroe Forza ≤4 nel Luogo corrente di Jafar
- `jaf_e_ipn_*` Ipnotizzare → ≥1 Eroe nel Reame
- `jaf_o_lam` Lampada Magica → Jafar deve essere nella Caverna delle Meraviglie
- `hk_e_sig_*` Signorsì Signore! → ≥1 Alleato nel Reame
- `urs_a_flo` / `urs_a_jet` Flotsam / Jetsam → ≥1 Eroe nel Reame
- `urs_e_opp_*` Opportunista → ≥1 Oggetto o Effetto nella **pila degli scarti**
- `urs_e_vor_*` Vortice → ≥1 Eroe nel Reame
- `pj_e_imp_*` Imprigionare → ≥1 Eroe nel Reame
- `pj_e_trap_*` Tendere una Trappola → ≥1 Eroe + ≥1 Alleato nel Reame (per lo Scontro obbligatorio)
- `pj_e_int` Intimidire → ≥1 Eroe + ≥1 Alleato nel Reame
- `qh_e_tes_*` Tagliategli la Testa! → ≥1 Eroe Forza ≤4 nel Reame
- `qh_e_tir_*` Tirare → Archetto in ogni Luogo del Reame

**Implementazione tecnica:** `canPlayCard(state, playerId, cardId)` in `gameEngine.js`
restituisce `{ canPlay: true }` o `{ canPlay: false, reason: '...' }`.
Ogni nuova carta con effetti obbligatori DEVE avere la sua logica aggiunta in questa funzione.

## Meccaniche critiche da tenere a mente
- Le carte Condizione hanno un timing specifico — si attivano solo in determinati momenti del turno
- L'azione Attivare è villain-specific e va trattata caso per caso
- Le carte speciali per villain (Maledizioni, Titani, ecc.) richiedono tipi dedicati nel engine
- Le carte Fate hanno un flusso separato rispetto alle carte villain

## Known issues attivi
- Azione Attivare non funziona correttamente
- Carte Condizione non gestite correttamente
- Meccaniche carte speciali per villain non ancora implementate
- Varie fix su carte singole da scoprire durante il testing

## Procedura post-modifica (OBBLIGATORIA dopo ogni sessione di lavoro)

Dopo ogni modifica al progetto eseguire automaticamente, nell'ordine:

```
1. git add <file modificati>
2. git commit -m "descrizione significativa"
3. git push origin main          ← GitHub aggiornato
4. Vercel rileva il push e fa il deploy automatico in produzione
```

Vercel è collegato al repo GitHub con **auto-deploy su push a `main`**:
non serve lanciare `vercel --prod` manualmente — il push è sufficiente.

Verificare l'esito del deploy tramite le API Vercel MCP (`list_deployments`) o
aprendo il link dell'inspector restituito dall'ultimo deployment.

Aggiornare anche questo file (CLAUDE.md):
- sezione "Ultimo aggiornamento dati carte" con data e descrizione della modifica
- sezione "Known issues attivi" se un bug è stato risolto
- sezione "Stato funzionalità core" se una feature è completa

## Come lavorare in questa codebase
- Leggi sempre questo file prima di iniziare qualsiasi task
- Per ogni fix su una carta specifica, chiedi il testo ufficiale della carta se non è già in `src/data/`
- Non mischiare fix funzionali e modifiche grafiche nella stessa sessione
- Aggiorna la sezione "Known issues attivi" quando un bug viene risolto
- Aggiorna le checkbox dello "Stato funzionalità core" quando una feature è completa

# Carte Disney Villainous — Primi 6 Personaggi

Database delle carte dei primi 6 personaggi del gioco fisico *Disney Villainous*. Effetto e costo letti dalle immagini delle carte nelle guide ufficiali; effetto riportato in inglese originale e in traduzione italiana.

**Legenda:** le carte del Mazzo Fato non hanno costo in Potere (N.A.); le Condizioni si giocano gratis. La *Forza* è indicata per Alleati ed Eroi.


## Capitan Uncino

### Mazzo Cattivo

#### Banda d'arrembaggio (Boarding Party)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** When performing a Vanquish action, Boarding Party may be used to defeat a Hero at their location or at an adjacent unlocked location.
- **Effetto (IT):** Durante un'azione Sconfiggere, la Banda d'arrembaggio può essere usata per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente sbloccato.

#### Smargiasso (Swashbuckler)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 1 · **Forza:** 2
- **Effetto (EN):** No additional Ability.
- **Effetto (IT):** Nessuna abilità aggiuntiva.

#### Bruto Pirata (Pirate Brute)
- **Tipo:** Alleato · **Copie:** 2 · **Costo:** 3 · **Forza:** 4
- **Effetto (EN):** No additional Ability.
- **Effetto (IT):** Nessuna abilità aggiuntiva.

#### Mr. Starkey (Mr. Starkey)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** When Mr. Starkey is played, you may move a Hero from his location to an adjacent unlocked location.
- **Effetto (IT):** Quando Mr. Starkey viene giocato, puoi muovere un Eroe dal suo Luogo a un Luogo adiacente sbloccato.

#### Spugna (Smee)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** Smee gets +2 Strength if he is at the Jolly Roger.
- **Effetto (IT):** Spugna ottiene +2 Forza se si trova alla Jolly Roger.

#### Degno Avversario (Worthy Opponent)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 0
- **Effetto (EN):** Gain 2 Power. Reveal cards from the top of your Fate deck until you reveal a Hero. Play that Hero and discard the rest.
- **Effetto (IT):** Ottieni 2 Potere. Rivela carte dalla cima del tuo Mazzo Fato finché non riveli un Eroe. Gioca quell'Eroe e scarta le altre.

#### Spaventare (Give Them a Scare)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Look at the top two cards of your Fate deck. Either discard both cards or return them to the top in any order.
- **Effetto (IT):** Guarda le prime due carte del tuo Mazzo Fato. Scartale entrambe oppure rimettile in cima nell'ordine che preferisci.

#### Signore
- **Tipo:** Signorsì Signore! (Aye, Aye, Sir!), Effetto · **Copie:** 2 · **Costo:** 1
- **Effetto (EN):** Move an Ally to an adjacent unlocked location. That Ally gets +2 Strength until the end of your turn.
- **Effetto (IT):** Muovi un Alleato in un Luogo adiacente sbloccato. Quell'Alleato ottiene +2 Forza fino alla fine del turno.

#### Cannone (Cannon)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** 2
- **Effetto (EN):** This location gains: [Vanquish action].
- **Effetto (IT):** Questo Luogo ottiene: [azione Sconfiggere].

#### Sciabola (Cutlass)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** 1
- **Effetto (EN):** When Cutlass is played, attach it to an Ally. That Ally gets +2 Strength.
- **Effetto (IT):** Quando la Sciabola viene giocata, assegnala a un Alleato. Quell'Alleato ottiene +2 Forza.

#### Uncino da Cerimonia (Hook's Case)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** 2
- **Effetto (EN):** This location gains: [Gain 1 Power].
- **Effetto (IT):** Questo Luogo ottiene: [Ottieni 1 Potere].

#### Dispositivo Ingegnoso (Ingenious Device)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 2
- **Effetto (EN):** This location gains two Move a Hero actions.
- **Effetto (IT):** Questo Luogo ottiene due azioni Muovere un Eroe.

#### Mappa dell'Isola Che Non C'è (Never Land Map)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 4
- **Effetto (EN):** When Never Land Map is played, unlock Hangman's Tree. When you play an Item, you may discard Never Land Map instead of paying the Item's Cost.
- **Effetto (IT):** Quando la Mappa viene giocata, sblocca l'Albero dell'Impiccato. Quando giochi un Oggetto, puoi scartare la Mappa invece di pagarne il Costo.

#### Astuzia (Cunning)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has an Ally with a Strength of 4 or more in their Realm, you may play Cunning. Play an Ally from your hand for free.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha nel Reame un Alleato con Forza 4 o più, puoi giocare Astuzia. Gioca gratis un Alleato dalla tua mano.

#### Ossessione (Obsession)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player defeats a Hero with a Strength of 4 or more, you may play Obsession. Reveal cards from the top of your Fate deck until you reveal a Hero. Either play or discard that Hero. Discard the rest.
- **Effetto (IT):** Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Ossessione. Rivela carte dalla cima del Mazzo Fato finché non riveli un Eroe. Gioca o scarta quell'Eroe. Scarta le altre.

### Mazzo Fato

#### Polvere di Fata (Pixie Dust)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** N.A.
- **Effetto (EN):** When Pixie Dust is played, attach it to a Hero. That Hero gets +2 Strength.
- **Effetto (IT):** Quando la Polvere di Fata viene giocata, assegnala a un Eroe. Quell'Eroe ottiene +2 Forza.

#### Schernire (Taunt)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** When Taunt is played, attach it to a Hero. Captain Hook must defeat Heroes with Taunt before defeating other Heroes.
- **Effetto (IT):** Quando lo Schernire viene giocato, assegnalo a un Eroe. Capitan Uncino deve sconfiggere gli Eroi con Schernire prima degli altri Eroi.

#### Terribile Mal di Testa (Splitting Headache)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Discard an Item from Captain Hook's Realm.
- **Effetto (IT):** Scarta un Oggetto dal Reame di Capitan Uncino.

#### Peter Pan (Peter Pan)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 8
- **Effetto (EN):** When Peter Pan is revealed, you MUST IMMEDIATELY PLAY HIM to Hangman's Tree, even if it is locked. Any other Fate cards revealed during this action are discarded.
- **Effetto (IT):** Quando Peter Pan viene rivelato, DEVE essere giocato IMMEDIATAMENTE all'Albero dell'Impiccato, anche se bloccato. Ogni altra carta Fato rivelata durante questa azione viene scartata.

#### Gianni (John)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** John gets +1 Strength if he has any Items attached to him.
- **Effetto (IT):** Gianni ottiene +1 Forza se ha almeno un Oggetto assegnato.

#### I Bimbi Sperduti (Lost Boys)
- **Tipo:** Eroe · **Copie:** 2 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** When performing a Vanquish action to defeat Lost Boys, at least two Allies must be used.
- **Effetto (IT):** Per sconfiggere i Bimbi Sperduti con un'azione Sconfiggere, bisogna usare almeno due Alleati.

#### Michele (Michael)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 1
- **Effetto (EN):** Michael gets +1 Strength for each location in Captain Hook's Realm that has a Hero, including Michael's location.
- **Effetto (IT):** Michele ottiene +1 Forza per ogni Luogo del Reame di Capitan Uncino che contiene un Eroe, incluso il suo.

#### Tic Tac (Tick Tock)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** If Captain Hook moves to Tick Tock's location, Captain Hook must immediately discard his hand.
- **Effetto (IT):** Se Capitan Uncino si muove nel Luogo di Tic Tac, deve scartare immediatamente la sua mano.

#### Trilli (Tinker Bell)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When Tinker Bell is played, you may discard one Ally from her location.
- **Effetto (IT):** Quando Trilli viene giocata, puoi scartare un Alleato dal suo Luogo.

#### Wendy (Wendy)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** All other Heroes in Captain Hook's Realm get +1 Strength.
- **Effetto (IT):** Tutti gli altri Eroi nel Reame di Capitan Uncino ottengono +1 Forza.


## Jafar

### Mazzo Cattivo

#### Lampada Magica (Magic Lamp)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 4
- **Effetto (EN):** Magic Lamp may only be played to the Cave of Wonders. When Magic Lamp is played, find Genie and play him to the Cave of Wonders.
- **Effetto (IT):** La Lampada Magica può essere giocata solo nella Caverna delle Meraviglie. Quando viene giocata, trova il Genio e giocalo nella Caverna delle Meraviglie.

#### Amuleto dello Scarabeo (Scarab Pendant)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 3
- **Effetto (EN):** When Scarab Pendant is played, unlock the Cave of Wonders. At the end of each turn, draw until you have five cards in your hand.
- **Effetto (IT):** Quando l'Amuleto viene giocato, sblocca la Caverna delle Meraviglie. Alla fine di ogni turno, pesca fino ad avere cinque carte in mano.

#### Bastone del Serpente (Snake Staff)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 2
- **Effetto (EN):** [Activate]: Pay 1 Power. Put a Hypnotize that is in your discard pile into your hand.
- **Effetto (IT):** [Attiva]: Paga 1 Potere. Prendi una carta Ipnotizzare dalla tua pila degli scarti e mettila in mano.

#### Clessidra Gigante (Giant Hourglass)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** 1
- **Effetto (EN):** [Activate]: Heroes at this location get -2 Strength until the end of your turn.
- **Effetto (IT):** [Attiva]: Gli Eroi in questo Luogo ottengono -2 Forza fino alla fine del turno.

#### Scimitarra (Scimitar)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** 0
- **Effetto (EN):** When Scimitar is played, attach it to an Ally. That Ally gets +1 Strength.
- **Effetto (IT):** Quando la Scimitarra viene giocata, assegnala a un Alleato. Quell'Alleato ottiene +1 Forza.

#### Chiaroveggenza (Scrying)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Choose either Item or Ally. Reveal cards from the top of your deck until you reveal a card of the chosen type. Put that card into your hand. Discard the rest.
- **Effetto (IT):** Scegli Oggetto o Alleato. Rivela carte dalla cima del tuo mazzo finché non riveli una carta del tipo scelto. Mettila in mano e scarta il resto.

#### Ah
- **Tipo:** Sarei un Serpente? (A Snake, Am I?), Effetto · **Copie:** 2 · **Costo:** 2
- **Effetto (EN):** Defeat a Hero with a Strength of 4 or less at Jafar's location.
- **Effetto (IT):** Sconfiggi un Eroe con Forza 4 o inferiore nel Luogo di Jafar.

#### Sacrificio Necessario (Necessary Sacrifice)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 0
- **Effetto (EN):** Discard any Ally or Item under your control and gain 3 Power.
- **Effetto (IT):** Scarta un Alleato o un Oggetto sotto il tuo controllo e ottieni 3 Potere.

#### Ipnotizzare (Hypnotize)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** X (= Forza dell'Eroe)
- **Effetto (EN):** Defeat a Hero and move them to the bottom of your Board. That Hero is under your control and treated as an Ally with the same Strength. Ignore their Ability. The Cost to play Hypnotize is equal to the Hero's Strength.
- **Effetto (IT):** Sconfiggi un Eroe e spostalo in fondo alla tua plancia. Quell'Eroe è sotto il tuo controllo e trattato come un Alleato con la stessa Forza. Ignora la sua abilità. Il costo per giocare Ipnotizzare è pari alla Forza dell'Eroe.

#### Potere dello Stregone (Sorcerous Power)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** 2
- **Effetto (EN):** You may move a Hero to any unlocked location. You may move an Ally to any unlocked location.
- **Effetto (IT):** Puoi muovere un Eroe in un qualsiasi Luogo sbloccato. Puoi muovere un Alleato in un qualsiasi Luogo sbloccato.

#### Iago (Iago)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 1 · **Forza:** 1
- **Effetto (EN):** [Activate]: Pay 1 Power. Move Iago and one unattached Item at his location to an adjacent unlocked location.
- **Effetto (IT):** [Attiva]: Paga 1 Potere. Muovi Iago e un Oggetto non assegnato presente nel suo Luogo in un Luogo adiacente sbloccato.

#### Razoul (Razoul)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 3 · **Forza:** 3
- **Effetto (EN):** The Cost to play Allies to Razoul's location is reduced by 1 Power.
- **Effetto (IT):** Il costo per giocare Alleati nel Luogo di Razoul è ridotto di 1 Potere.

#### Gazeem (Gazeem)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** When Gazeem is discarded from your Realm, you may choose an Item from your discard pile and put it into your hand.
- **Effetto (IT):** Quando Gazeem viene scartato dal tuo Reame, puoi scegliere un Oggetto dalla pila degli scarti e metterlo in mano.

#### Guardia di Palazzo (Palace Guard)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 1 · **Forza:** 2
- **Effetto (EN):** No additional Ability.
- **Effetto (IT):** Nessuna abilità aggiuntiva.

#### Inganno (Deception)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has two or more Items in their Realm, you may play Deception. Reveal and play the top card of that player's Fate deck.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha due o più Oggetti nel Reame, puoi giocare Inganno. Rivela e gioca la prima carta del suo Mazzo Fato.

#### Manipolazione (Manipulation)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has three or more Allies in their Realm, you may play Manipulation. Choose any card from your discard pile and put it into your hand.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Manipolazione. Scegli una carta dalla tua pila degli scarti e mettila in mano.

### Mazzo Fato

#### Desiderio (Wish)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** N.A.
- **Effetto (EN):** When Wish is played, attach it to a Hero. That Hero gets +2 Strength.
- **Effetto (IT):** Quando il Desiderio viene giocato, assegnalo a un Eroe. Quell'Eroe ottiene +2 Forza.

#### Brutto Colpo (Crushing Blow)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Discard an Ally with a Strength of 3 or less from Jafar's Realm.
- **Effetto (IT):** Scarta un Alleato con Forza 3 o inferiore dal Reame di Jafar.

#### C'è Mancato Poco (Narrow Escape)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Choose and play a Hero from Jafar's Fate discard pile.
- **Effetto (IT):** Scegli e gioca un Eroe dalla pila degli scarti del Mazzo Fato di Jafar.

#### Tradimento (Treachery)
- **Tipo:** Effetto · **Copie:** 1 · **Costo:** N.A.
- **Effetto (EN):** Jafar loses up to 2 Power.
- **Effetto (IT):** Jafar perde fino a 2 Potere.

#### Aladdin (Aladdin)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** When Aladdin is played, you may choose any Item at his location and attach it to him. Jafar cannot use the Item. When Aladdin is defeated, the Item is returned to Jafar at the same location.
- **Effetto (IT):** Quando Aladdin viene giocato, puoi scegliere un Oggetto nel suo Luogo e assegnarlo a lui. Jafar non può usare quell'Oggetto. Quando Aladdin viene sconfitto, l'Oggetto torna a Jafar nello stesso Luogo.

#### Genio (Genie)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 6
- **Effetto (EN):** Genie gets +2 Strength if Magic Lamp is at his location.
- **Effetto (IT):** Il Genio ottiene +2 Forza se la Lampada Magica si trova nel suo Luogo.

#### Tappeto (Carpet)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** Jafar must defeat Carpet before defeating other Heroes.
- **Effetto (IT):** Jafar deve sconfiggere Tappeto prima degli altri Eroi.

#### Rajah (Rajah)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** Rajah gets +2 Strength if Princess Jasmine is in Jafar's Realm.
- **Effetto (IT):** Rajah ottiene +2 Forza se la Principessa Jasmine è nel Reame di Jafar.

#### Abu (Abu)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When Abu is played, you may choose any Item at his location and attach it to him. Jafar cannot use the Item. When Abu is defeated, the Item is returned to Jafar at the same location.
- **Effetto (IT):** Quando Abu viene giocato, puoi scegliere un Oggetto nel suo Luogo e assegnarlo a lui. Jafar non può usarlo. Quando Abu viene sconfitto, l'Oggetto torna a Jafar nello stesso Luogo.

#### Principessa Jasmine (Princess Jasmine)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** When Jafar draws cards at the end of each turn, he draws one less card.
- **Effetto (IT):** Quando Jafar pesca carte alla fine di ogni turno, ne pesca una in meno.

#### Sultano (Sultan)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** Palace Guards cannot be used to defeat Sultan.
- **Effetto (IT):** Le Guardie di Palazzo non possono essere usate per sconfiggere il Sultano.


## Malefica

### Mazzo Cattivo

#### Sonno Senza Sogni (Dreamless Sleep)
- **Tipo:** Maledizione · **Copie:** 2 · **Costo:** 3
- **Effetto (EN):** Heroes at this location get -2 Strength. Discard this Curse when an Ally is played to this location.
- **Effetto (IT):** Gli Eroi in questo Luogo ottengono -2 Forza. Scarta questa Maledizione quando un Alleato viene giocato in questo Luogo.

#### Foresta di Rovi (Forest of Thorns)
- **Tipo:** Maledizione · **Copie:** 3 · **Costo:** 2
- **Effetto (EN):** Heroes must have a Strength of 4 or more to be played to this location. Discard this Curse when a Hero is played to this location.
- **Effetto (IT):** Gli Eroi devono avere Forza 4 o più per essere giocati in questo Luogo. Scarta questa Maledizione quando un Eroe viene giocato qui.

#### Fuoco Verde (Green Fire)
- **Tipo:** Maledizione · **Copie:** 3 · **Costo:** 3
- **Effetto (EN):** Heroes cannot be played to this location. Discard this Curse if Maleficent moves to this location.
- **Effetto (IT):** Gli Eroi non possono essere giocati in questo Luogo. Scarta questa Maledizione se Malefica si muove in questo Luogo.

#### Arcolaio (Spinning Wheel)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 1
- **Effetto (EN):** If a Hero is defeated at this location, gain Power equal to the Hero's Strength minus 1.
- **Effetto (IT):** Se un Eroe viene sconfitto in questo Luogo, ottieni Potere pari alla Forza dell'Eroe meno 1.

#### Bastone (Staff)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 1
- **Effetto (EN):** If Maleficent is at this location, the Cost to play an Effect or Curse is reduced by 1 Power.
- **Effetto (IT):** Se Malefica si trova in questo Luogo, il costo per giocare un Effetto o una Maledizione è ridotto di 1 Potere.

#### Corvo (Raven)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 3 · **Forza:** 1
- **Effetto (EN):** Before Maleficent moves, you may move Raven to any location and perform one available action at his new location. Raven cannot perform Fate actions.
- **Effetto (IT):** Prima che Malefica si muova, puoi muovere il Corvo in un Luogo qualsiasi ed eseguire un'azione disponibile nel suo nuovo Luogo. Il Corvo non può eseguire azioni Fato.

#### Scagnozzo Gracchiante (Cackling Goon)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 1 · **Forza:** 1
- **Effetto (EN):** Cackling Goon gets +1 Strength for each Hero at his location.
- **Effetto (IT):** Lo Scagnozzo Gracchiante ottiene +1 Forza per ogni Eroe presente nel suo Luogo.

#### Scagnozzo Selvaggio (Savage Goon)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 3 · **Forza:** 4
- **Effetto (EN):** No additional Ability.
- **Effetto (IT):** Nessuna abilità aggiuntiva.

#### Scagnozzo Sinistro (Sinister Goon)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 2 · **Forza:** 3
- **Effetto (EN):** Sinister Goon gets +1 Strength if there are any Curses at his location.
- **Effetto (IT):** Lo Scagnozzo Sinistro ottiene +1 Forza se ci sono Maledizioni nel suo Luogo.

#### Forma di Drago (Dragon Form)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 3
- **Effetto (EN):** Defeat a Hero with a Strength of 3 or less. If a Fate action targets you before your next turn, gain 3 Power.
- **Effetto (IT):** Sconfiggi un Eroe con Forza 3 o inferiore. Se un'azione Fato ti colpisce prima del tuo prossimo turno, ottieni 3 Potere.

#### Svanire (Vanish)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 0
- **Effetto (EN):** On your next turn, Maleficent does not have to move to a new location.
- **Effetto (IT):** Nel tuo prossimo turno, Malefica non è obbligata a muoversi in un nuovo Luogo.

#### Tirannia (Tyranny)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has three or more Allies in their Realm, you may play Tyranny. Draw three cards into your hand, then discard any three cards.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Tirannia. Pesca tre carte, poi scarta tre carte a tua scelta.

#### Malignità (Malice)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player defeats a Hero with a Strength of 4 or more, you may play Malice. Defeat a Hero with a Strength of 4 or less.
- **Effetto (IT):** Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Malignità. Sconfiggi un Eroe con Forza 4 o inferiore.

### Mazzo Fato

#### C'era una Volta in un Sogno (Once Upon a Dream)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Discard a Curse from a location in Maleficent's Realm that has a Hero.
- **Effetto (IT):** Scarta una Maledizione da un Luogo del Reame di Malefica che contiene un Eroe.

#### Spada della Verità (Sword of Truth)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** N.A.
- **Effetto (EN):** When Sword of Truth is played, attach it to a Hero with no other attached Items. That Hero gets +2 Strength. The Cost to play a Curse to this location is increased by 2 Power.
- **Effetto (IT):** Quando la Spada della Verità viene giocata, assegnala a un Eroe senza altri Oggetti assegnati. Quell'Eroe ottiene +2 Forza. Il costo per giocare una Maledizione in questo Luogo aumenta di 2 Potere.

#### Aurora (Aurora)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** When Aurora is played, reveal the top card of Maleficent's Fate deck. If it is a Hero, play it. Otherwise, return it to the top of the deck.
- **Effetto (IT):** Quando Aurora viene giocata, rivela la prima carta del Mazzo Fato di Malefica. Se è un Eroe, giocalo. Altrimenti, rimettila in cima al mazzo.

#### Fauna (Fauna)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When Fauna is played, you may discard Dreamless Sleep from her location.
- **Effetto (IT):** Quando Fauna viene giocata, puoi scartare un Sonno Senza Sogni dal suo Luogo.

#### Flora (Flora)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** When Flora is played, Maleficent must reveal her hand. Until Flora is defeated, Maleficent must play with her hand revealed.
- **Effetto (IT):** Quando Flora viene giocata, Malefica deve rivelare la sua mano. Finché Flora non viene sconfitta, Malefica gioca a carte scoperte.

#### Re Uberto (King Hubert)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** When King Hubert is played, you may move one Ally from each adjacent location to his location.
- **Effetto (IT):** Quando Re Uberto viene giocato, puoi muovere un Alleato da ogni Luogo adiacente al suo Luogo.

#### Re Stefano (King Stefan)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** When King Stefan is played, you may move Maleficent to any location.
- **Effetto (IT):** Quando Re Stefano viene giocato, puoi muovere Malefica in un Luogo qualsiasi.

#### Guardie (Guards)
- **Tipo:** Eroe · **Copie:** 3 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When performing a Vanquish action to defeat Guards, at least two Allies must be used.
- **Effetto (IT):** Per sconfiggere le Guardie con un'azione Sconfiggere, bisogna usare almeno due Alleati.

#### Serena (Merryweather)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** Curses cannot be played to Merryweather's location.
- **Effetto (IT):** Le Maledizioni non possono essere giocate nel Luogo di Serena.

#### Principe Filippo (Prince Phillip)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** When Prince Phillip is played, you may discard all Allies from his location.
- **Effetto (IT):** Quando il Principe Filippo viene giocato, puoi scartare tutti gli Alleati dal suo Luogo.


## Principe Giovanni

### Mazzo Cattivo

#### Guardie Rinoceronte (Rhino Guards)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 3 · **Forza:** 4
- **Effetto (EN):** No additional Ability.
- **Effetto (IT):** Nessuna abilità aggiuntiva.

#### Arcieri Lupo (Wolf Archers)
- **Tipo:** Alleato · **Copie:** 3 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** When performing a Vanquish action, Wolf Archers may be used to defeat a Hero at their location or at an adjacent location.
- **Effetto (IT):** Durante un'azione Sconfiggere, gli Arcieri Lupo possono essere usati per sconfiggere un Eroe nel loro Luogo o in un Luogo adiacente.

#### Tonto (Nutsy)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** All other Allies at Nutsy's location get +1 Strength.
- **Effetto (IT):** Tutti gli altri Alleati nel Luogo di Tonto ottengono +1 Forza.

#### Sceriffo di Nottingham (Sheriff of Nottingham)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 3 · **Forza:** 3
- **Effetto (EN):** Before Prince John moves, you may move Sheriff of Nottingham to any location and gain 1 Power if there are any Heroes at his new location.
- **Effetto (IT):** Prima che il Principe Giovanni si muova, puoi muovere lo Sceriffo di Nottingham in un Luogo qualsiasi e ottenere 1 Potere se ci sono Eroi nel suo nuovo Luogo.

#### Sir Biss (Sir Hiss)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** If Prince John is at Sir Hiss's location, you may perform one action that is covered by a Hero at that location.
- **Effetto (IT):** Se il Principe Giovanni si trova nel Luogo di Sir Biss, puoi eseguire un'azione coperta da un Eroe in quel Luogo.

#### Crucco (Trigger)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 4
- **Effetto (EN):** All other Allies at Trigger's location get -1 Strength.
- **Effetto (IT):** Tutti gli altri Alleati nel Luogo di Crucco ottengono -1 Forza.

#### Imprigionare (Imprison)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 2
- **Effetto (EN):** Move a Hero to The Jail.
- **Effetto (IT):** Muovi un Eroe alla Prigione.

#### Tendere una Trappola (Set a Trap)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** 1
- **Effetto (EN):** You may move an Ally to any location. Perform a Vanquish action.
- **Effetto (IT):** Puoi muovere un Alleato in un Luogo qualsiasi. Esegui un'azione Sconfiggere.

#### Intimidire (Intimidation)
- **Tipo:** Effetto · **Copie:** 1 · **Costo:** 2
- **Effetto (EN):** Perform a Vanquish action, but do not discard the Ally used to defeat the Hero.
- **Effetto (IT):** Esegui un'azione Sconfiggere, ma non scartare l'Alleato usato per sconfiggere l'Eroe.

#### Bellissime
- **Tipo:** Adorabili Tasse (Beautiful, Lovely Taxes), Effetto · **Copie:** 3 · **Costo:** 0
- **Effetto (EN):** Gain 1 Power for each Hero in your Realm.
- **Effetto (IT):** Ottieni 1 Potere per ogni Eroe nel tuo Reame.

#### Taglia (Warrant)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Gain 2 Power each time a Hero is played to this location.
- **Effetto (IT):** Ottieni 2 Potere ogni volta che un Eroe viene giocato in questo Luogo.

#### Arco e Frecce (Bow and Arrows)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** 1
- **Effetto (EN):** When Bow and Arrows is played, attach it to an Ally. That Ally gets +1 Strength. When that Ally would be discarded, discard this Item instead.
- **Effetto (IT):** Quando l'Arco e Frecce viene giocato, assegnalo a un Alleato. Quell'Alleato ottiene +1 Forza. Quando quell'Alleato dovrebbe essere scartato, scarta invece questo Oggetto.

#### Freccia Dorata (Golden Arrow)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 0
- **Effetto (EN):** When Golden Arrow is played, attach it to an Ally. When that Ally is used to defeat a Hero, gain 2 Power.
- **Effetto (IT):** Quando la Freccia Dorata viene giocata, assegnala a un Alleato. Quando quell'Alleato viene usato per sconfiggere un Eroe, ottieni 2 Potere.

#### La Corona di Re Riccardo (King Richard's Crown)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 1
- **Effetto (EN):** If Prince John is at this location, all card Costs are reduced by 1 Power.
- **Effetto (IT):** Se il Principe Giovanni si trova in questo Luogo, il costo di tutte le carte è ridotto di 1 Potere.

#### Codardia (Cowardice)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has three or more Heroes in their Realm, you may play Cowardice. Play an Ally from your hand for free.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha tre o più Eroi nel Reame, puoi giocare Codardia. Gioca gratis un Alleato dalla tua mano.

#### Avidità (Greed)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has 6 or more Power, you may play Greed. Gain 3 Power.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha 6 o più Potere, puoi giocare Avidità. Ottieni 3 Potere.

### Mazzo Fato

#### Travestimento (Clever Disguise)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** N.A.
- **Effetto (EN):** When Clever Disguise is played, attach it to a Hero. That Hero cannot be defeated. At any time, Prince John may pay 2 Power to discard Clever Disguise.
- **Effetto (IT):** Quando il Travestimento viene giocato, assegnalo a un Eroe. Quell'Eroe non può essere sconfitto. In qualsiasi momento, il Principe Giovanni può pagare 2 Potere per scartare il Travestimento.

#### Rubare ai Ricchi (Steal from the Rich)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** N.A.
- **Effetto (EN):** Take up to 4 Power from Prince John and put it on any one Hero. When that Hero is defeated, the Power is returned to Prince John.
- **Effetto (IT):** Prendi fino a 4 Potere dal Principe Giovanni e mettilo su un singolo Eroe. Quando quell'Eroe viene sconfitto, il Potere torna al Principe Giovanni.

#### Robin Hood (Robin Hood)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** The amount of Power that Prince John gains from each card or action is reduced by 1 Power.
- **Effetto (IT):** Il Potere che il Principe Giovanni ottiene da ogni carta o azione è ridotto di 1 Potere.

#### Re Riccardo (King Richard)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** Prince John cannot play Effects.
- **Effetto (IT):** Il Principe Giovanni non può giocare Effetti.

#### Little John (Little John)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** When Little John is played, you may take up to 4 Power from Prince John and put it on Little John. When Little John is defeated, the Power is returned to Prince John.
- **Effetto (IT):** Quando Little John viene giocato, puoi prendere fino a 4 Potere dal Principe Giovanni e metterlo su Little John. Quando viene sconfitto, il Potere torna al Principe Giovanni.

#### Lady Cocca (Lady Kluck)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 6
- **Effetto (EN):** Lady Kluck cannot be played or moved to The Jail.
- **Effetto (IT):** Lady Cocca non può essere giocata o spostata alla Prigione.

#### Fra Tac (Friar Tuck)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** When Friar Tuck is played, you may discard all Warrants from his location. Prince John does not gain any Power from them.
- **Effetto (IT):** Quando Fra Tac viene giocato, puoi scartare tutte le Taglie dal suo Luogo. Il Principe Giovanni non ottiene Potere da esse.

#### Saetta (Skippy)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** Wolf Archers cannot be used to defeat Skippy.
- **Effetto (IT):** Gli Arcieri Lupo non possono essere usati per sconfiggere Saetta.

#### Cantagallo (Alan-A-Dale)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** All other Heroes in Prince John's Realm get +1 Strength.
- **Effetto (IT):** Tutti gli altri Eroi nel Reame del Principe Giovanni ottengono +1 Forza.

#### Lady Marian (Maid Marian)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** When Maid Marian is defeated, find Robin Hood and play him to the same location.
- **Effetto (IT):** Quando Lady Marian viene sconfitta, trova Robin Hood e giocalo nello stesso Luogo.

#### Tobia (Toby)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When Toby is defeated, shuffle him back into Prince John's Fate deck.
- **Effetto (IT):** Quando Tobia viene sconfitto, rimescolalo nel Mazzo Fato del Principe Giovanni.


## Regina di Cuori

### Mazzo Cattivo

#### Guardia di Carta: Fiori (Card Guard: Club)
- **Tipo:** Alleato · **Copie:** 2 · **Costo:** 1 · **Forza:** 2
- **Effetto (EN):** [Activate]: Pay 1 Power. Convert this Card Guard to a Wicket or back to a Card Guard.
- **Effetto (IT):** [Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.

#### Guardia di Carta: Quadri (Card Guard: Diamond)
- **Tipo:** Alleato · **Copie:** 2 · **Costo:** 1 · **Forza:** 2
- **Effetto (EN):** [Activate]: Pay 1 Power. Convert this Card Guard to a Wicket or back to a Card Guard.
- **Effetto (IT):** [Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.

#### Guardia di Carta: Cuori (Card Guard: Heart)
- **Tipo:** Alleato · **Copie:** 2 · **Costo:** 2 · **Forza:** 3
- **Effetto (EN):** [Activate]: Pay 1 Power. Convert this Card Guard to a Wicket or back to a Card Guard.
- **Effetto (IT):** [Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.

#### Guardia di Carta: Picche (Card Guard: Spade)
- **Tipo:** Alleato · **Copie:** 2 · **Costo:** 2 · **Forza:** 3
- **Effetto (EN):** [Activate]: Pay 1 Power. Convert this Card Guard to a Wicket or back to a Card Guard.
- **Effetto (IT):** [Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.

#### Il Re (The King)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 2
- **Effetto (EN):** The Cost to play Card Guards is reduced by 1 Power.
- **Effetto (IT):** Il costo per giocare le Guardie di Carta è ridotto di 1 Potere.

#### Pinco Panco e Panco Pinco (Tweedle Dee & Tweedle Dum)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 3 · **Forza:** 2
- **Effetto (EN):** Tweedle Dee and Tweedle Dum are not discarded when they are used to defeat a Hero.
- **Effetto (IT):** Pinco Panco e Panco Pinco non vengono scartati quando vengono usati per sconfiggere un Eroe.

#### Tagliategli la Testa! (Off with Your Head!)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 3
- **Effetto (EN):** Defeat a Hero with a Strength of 4 or less.
- **Effetto (IT):** Sconfiggi un Eroe con Forza 4 o inferiore.

#### Per Ordine della Regina (By Order of the Queen)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** 2
- **Effetto (EN):** Convert up to two Card Guards to Wickets.
- **Effetto (IT):** Trasforma fino a due Guardie di Carta in Archetti.

#### Tirare (Take the Shot)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 4
- **Effetto (EN):** If there is a Wicket at each location, reveal the top five cards of your deck. If the total Cost is less than the total Strength of all your Wickets, you make the shot and win the game. If not, discard the five revealed cards.
- **Effetto (IT):** Se c'è un Archetto in ogni Luogo, rivela le prime cinque carte del tuo mazzo. Se il Costo totale è inferiore alla Forza totale di tutti i tuoi Archetti, fai centro e vinci la partita. Altrimenti, scarta le cinque carte rivelate.

#### Un Buon Non Compleanno (Very Merry Unbirthday)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** 0
- **Effetto (EN):** Gain 1 Power for each Ally in your Realm.
- **Effetto (IT):** Ottieni 1 Potere per ogni Alleato nel tuo Reame.

#### Ti Fa Più Piccola (Makes You Smaller)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** 2
- **Effetto (EN):** Either Shrink a Hero or turn an Enlarged Hero back to normal.
- **Effetto (IT):** Rimpicciolisci un Eroe oppure riporta alla normalità un Eroe Ingrandito.

#### Lancia (Spear)
- **Tipo:** Oggetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** When Spear is played, attach it to an Ally. That Ally gets +1 Strength.
- **Effetto (IT):** Quando la Lancia viene giocata, assegnala a un Alleato. Quell'Alleato ottiene +1 Forza.

#### Orologio (Stopwatch)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 1
- **Effetto (EN):** [Activate]: Gain 1 Power for each Wicket in your Realm.
- **Effetto (IT):** [Attiva]: Ottieni 1 Potere per ogni Archetto nel tuo Reame.

#### Furia (Fury)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player defeats a Hero with a Strength of 4 or more, you may play Fury. Shrink up to two Heroes.
- **Effetto (IT):** Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Furia. Rimpicciolisci fino a due Eroi.

#### Processo (Judgment)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has three or more Allies in their Realm, you may play Judgment. Gain 3 Power.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Processo. Ottieni 3 Potere.

### Mazzo Fato

#### Nella Tana del Bianconiglio (Down the Rabbit Hole)
- **Tipo:** Effetto · **Copie:** 1 · **Costo:** N.A.
- **Effetto (EN):** If Alice is in Queen of Hearts' Realm, discard an Ally from her location. Otherwise, find Alice and play her.
- **Effetto (IT):** Se Alice è nel Reame della Regina di Cuori, scarta un Alleato dal suo Luogo. Altrimenti, trova Alice e giocala.

#### È Tardi! È Tardi! (I'm Late! I'm Late!)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Choose and play a Hero with a Strength of 3 or less from Queen of Hearts' Fate discard pile.
- **Effetto (IT):** Scegli e gioca un Eroe con Forza 3 o inferiore dalla pila degli scarti del Mazzo Fato della Regina di Cuori.

#### Ti Fa Più Grande (Makes You Larger)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Either Enlarge a Hero or turn a Shrunken Hero back to normal.
- **Effetto (IT):** Ingrandisci un Eroe oppure riporta alla normalità un Eroe Rimpicciolito.

#### Palmipedoni (Mome Raths)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** Move an Ally to any location.
- **Effetto (IT):** Muovi un Alleato in un Luogo qualsiasi.

#### Alice (Alice)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** Queen of Hearts cannot move Allies or Items.
- **Effetto (IT):** La Regina di Cuori non può muovere Alleati o Oggetti.

#### Lo Stregatto (Cheshire Cat)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 5
- **Effetto (EN):** When Cheshire Cat is played, you may convert up to two Wickets to Card Guards. When Cheshire Cat is defeated, Queen of Hearts may convert up to two Card Guards to Wickets.
- **Effetto (IT):** Quando lo Stregatto viene giocato, puoi trasformare fino a due Archetti in Guardie di Carta. Quando lo Stregatto viene sconfitto, la Regina di Cuori può trasformare fino a due Guardie di Carta in Archetti.

#### Capitan Libeccio (Dodo)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** Card Guards at Dodo's location cannot be converted to Wickets.
- **Effetto (IT):** Le Guardie di Carta nel Luogo di Capitan Libeccio non possono essere trasformate in Archetti.

#### Cappellaio Matto (Mad Hatter)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** Mad Hatter gets +2 Strength if March Hare is in Queen of Hearts' Realm.
- **Effetto (IT):** Il Cappellaio Matto ottiene +2 Forza se il Leprotto Bisestile è nel Reame della Regina di Cuori.

#### Brucaliffo (Caterpillar)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** All Allies at Caterpillar's location get -1 Strength.
- **Effetto (IT):** Tutti gli Alleati nel Luogo del Brucaliffo ottengono -1 Forza.

#### Toperchio (Dormouse)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 1
- **Effetto (EN):** Dormouse cannot be Shrunk.
- **Effetto (IT):** Il Toperchio non può essere Rimpicciolito.

#### Il Leprotto Bisestile (March Hare)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** March Hare gets +2 Strength if Mad Hatter is in Queen of Hearts' Realm.
- **Effetto (IT):** Il Leprotto Bisestile ottiene +2 Forza se il Cappellaio Matto è nel Reame della Regina di Cuori.

#### Il Bianconiglio (White Rabbit)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** The Cost to Activate Card Guards and Wickets is increased by 1 Power.
- **Effetto (IT):** Il costo per Attivare le Guardie di Carta e gli Archetti aumenta di 1 Potere.


## Ursula

### Mazzo Cattivo

#### Contratto Vincolante (Binding Contract)
- **Tipo:** Oggetto · **Copie:** 6 [varianti per Luogo: Covo di Ursula x1, Nave di Eric x2, Riva x2, Palazzo x1] · **Costo:** 2
- **Effetto (EN):** When Binding Contract is played, attach it to a Hero that is not at the location named on the card. That Hero is defeated if they are moved to that location.
- **Effetto (IT):** Quando il Contratto Vincolante viene giocato, assegnalo a un Eroe che non sia nel [Luogo indicato sulla carta]. Quell'Eroe è sconfitto se mosso nel [Luogo indicato sulla carta].

#### Corona (Crown)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 4
- **Effetto (EN):** [Activate]: Look at the top two cards of your Fate deck. Either discard both or return them to the top in any order.
- **Effetto (IT):** [Attiva]: Guarda le prime due carte del tuo Mazzo Fato. Scartale entrambe o rimettile in cima nell'ordine che preferisci.

#### Tridente (Trident)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 4
- **Effetto (EN):** When Trident is played, find King Triton and play him to this location. Attach Trident to him. When King Triton is defeated, Trident is returned to Ursula at the same location.
- **Effetto (IT):** Quando il Tridente viene giocato, trova Re Tritone e giocalo in questo Luogo. Assegnagli il Tridente. Quando Re Tritone viene sconfitto, il Tridente torna a Ursula nello stesso Luogo.

#### Calderone (Cauldron)
- **Tipo:** Oggetto · **Copie:** 1 · **Costo:** 1
- **Effetto (EN):** Gain 1 Power for each Binding Contract in your Realm.
- **Effetto (IT):** Ottieni 1 Gettone Potere per ogni Contratto Vincolante nel tuo Reame.

#### Flotsam (Flotsam)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 4
- **Effetto (EN):** Move a Hero from Flotsam's location to an adjacent unlocked location.
- **Effetto (IT):** Muovi un Eroe dal Luogo in cui si trova Flotsam a un Luogo adiacente non bloccato.

#### Jetsam (Jetsam)
- **Tipo:** Alleato · **Copie:** 1 · **Costo:** 2 · **Forza:** 4
- **Effetto (EN):** Move a Hero from Jetsam's location to an adjacent unlocked location.
- **Effetto (IT):** Muovi un Eroe dal Luogo in cui si trova Jetsam a un Luogo adiacente non bloccato.

#### Trasformazione (Transformation)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Move the Lock token from The Palace to Ursula's Lair, or vice versa.
- **Effetto (IT):** Muovi il Segnalino Lucchetto dal Palazzo al Covo di Ursula, o viceversa.

#### Diventare Gigantesca (Unleash the Power)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Perform one of the available actions at a location adjacent to Ursula's location, even if it is locked.
- **Effetto (IT):** Svolgi una delle azioni disponibili in un Luogo adiacente a quello in cui si trova Ursula, anche se bloccato.

#### Opportunista (Opportunistic)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Choose an Item or Effect from your discard pile and put it into your hand.
- **Effetto (IT):** Scegli un Oggetto o un Effetto dalla tua pila degli scarti e aggiungilo alla tua mano.

#### Vortice (Whirlpool)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** 1
- **Effetto (EN):** Move a Hero to an unlocked location of your choice.
- **Effetto (IT):** Muovi un Eroe in un Luogo sbloccato a tua scelta.

#### Divinazione (Divination)
- **Tipo:** Effetto · **Copie:** 2 · **Costo:** 1
- **Effetto (EN):** Reveal cards from the top of your deck until you find a Binding Contract. Put it into your hand and discard the rest.
- **Effetto (IT):** Rivela carte dalla cima del tuo mazzo finché non trovi un Contratto Vincolante. Aggiungilo alla tua mano e scarta il resto.

#### Tristi Anime Sole (Poor Unfortunate Souls)
- **Tipo:** Effetto · **Copie:** 1 · **Costo:** 2
- **Effetto (EN):** You may move each Hero to an adjacent unlocked location.
- **Effetto (IT):** Puoi muovere ogni Eroe in un Luogo adiacente non bloccato.

#### Arroganza (Arrogance)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player defeats a Hero with a Strength of 4 or more, you may play Arrogance. Draw three cards, then discard any three cards from your hand.
- **Effetto (IT):** Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o superiore, puoi giocare Arroganza. Pesca tre carte dal mazzo, poi scarta tre carte a scelta dalla tua mano.

#### Inganno (Deception)
- **Tipo:** Condizione · **Copie:** 2 · **Costo:** nessuno
- **Effetto (EN):** During their turn, if another player has 6 or more Power, you may play Deception. Reveal and play the top card of that player's Fate deck.
- **Effetto (IT):** Durante il turno di un altro giocatore, se ha 6 o più Gettoni Potere, puoi giocare Inganno. Rivela e gioca la prima carta del Mazzo Fato di quel giocatore.

### Mazzo Fato

#### Riprendere Forma (Reincarnation)
- **Tipo:** Effetto · **Copie:** 3 · **Costo:** N.A.
- **Effetto (EN):** Choose a Hero with a Strength of 4 or less from Ursula's Fate discard pile. Play that Hero to Ursula's location.
- **Effetto (IT):** Scegli un Eroe con Forza 4 o inferiore dalla pila degli scarti del Mazzo Fato di Ursula. Gioca quell'Eroe nel Luogo in cui si trova Ursula.

#### Arricciaspiccia (Dinglehopper)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** When Dinglehopper is played, attach it to a Hero. Each time Ursula moves to this location, she loses 1 Power.
- **Effetto (IT):** Quando l'Arricciaspiccia viene giocato, assegnalo a un Eroe. Ogni volta che Ursula si muove in questo Luogo, perde 1 Gettone Potere.

#### Soffia Bla-Bla (Snarfblat)
- **Tipo:** Oggetto · **Copie:** 2 · **Costo:** N.A.
- **Effetto (EN):** When Snarfblat is played, attach it to a Hero. The Cost to play a Binding Contract on that Hero is increased by 3 Power.
- **Effetto (IT):** Quando il Soffiablabla viene giocato, assegnalo a un Eroe. Il costo per giocare un Contratto Vincolante su quell'Eroe aumenta di 3.

#### Ariel (Ariel)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** When Ariel is played, you may move an unattached Item from any location to her location. Until Ariel is defeated, Ursula cannot perform the Move an Item or Ally action.
- **Effetto (IT):** Quando Ariel viene giocata, può muovere un Oggetto non assegnato da un Luogo qualsiasi al Luogo in cui si trova. Finché Ariel non viene sconfitta, Ursula non può svolgere l'azione Muovere un Oggetto o un Alleato.

#### Eric (Eric)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 4
- **Effetto (EN):** When Eric is played, you may move a Hero to any unlocked location.
- **Effetto (IT):** Quando Eric viene giocato, puoi muovere un Eroe in un qualsiasi Luogo non bloccato.

#### Flounder (Flounder)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 1
- **Effetto (EN):** When Flounder is played, you may shuffle Ursula's discard pile into her Villain deck.
- **Effetto (IT):** Quando Flounder viene giocato, puoi rimescolare la pila degli scarti di Ursula nel suo Mazzo Cattivo.

#### Grimsby (Grimsby)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** When Grimsby is played, you may move the Lock token to either Ursula's Lair or The Palace.
- **Effetto (IT):** Quando Grimsby viene giocato, puoi spostare il Segnalino Lucchetto o nel Covo di Ursula o nel Palazzo.

#### Re Tritone (King Triton)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 6
- **Effetto (EN):** The Cost to play Binding Contracts or Effects that target King Triton is increased by 1 Power.
- **Effetto (IT):** Il costo per giocare i Contratti Vincolanti o gli Effetti che hanno come bersaglio Re Tritone aumenta di 1.

#### Max (Max)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 3
- **Effetto (EN):** If Max is played to Ursula's location, you may move Ursula to any unlocked location.
- **Effetto (IT):** Se Max viene giocato nel Luogo in cui si trova Ursula, puoi muovere Ursula in un qualsiasi Luogo non bloccato.

#### Scuttle (Scuttle)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When Scuttle is played, you may choose an Item from Ursula's Fate discard pile and attach it to Scuttle.
- **Effetto (IT):** Quando Scuttle viene giocato, puoi scegliere un Oggetto dalla pila degli scarti del Mazzo Fato di Ursula e assegnarlo a Scuttle.

#### Sebastian (Sebastian)
- **Tipo:** Eroe · **Copie:** 1 · **Costo:** N.A. · **Forza:** 2
- **Effetto (EN):** When Sebastian is played, you may choose a Binding Contract attached to a Hero at an unlocked location and attach it to Sebastian instead.
- **Effetto (IT):** Quando Sebastian viene giocato, puoi scegliere un Contratto Vincolante assegnato a un Eroe in un Luogo non bloccato e assegnarlo invece a Sebastian.

