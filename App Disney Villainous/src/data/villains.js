// ============================================================
// Disney Villainous — Dati Villain
// Prima espansione: "The Worst Takes It All"
// Fonte: regolamento ufficiale + guide personaggi
// ============================================================
// NOTE SULLE CARTE:
//   - I nomi sono in italiano (edizione Ravensburger Italia)
//   - Gli effetti sono testo descrittivo: la UI li mostra,
//     il giocatore li applica manualmente (come nel digitale di KONAMI)
//   - Le meccaniche automatizzate dall'engine sono:
//       gain_power, draw, discard, move_villain, vanquish, fate
//   - Effetti card-specifici: semi-automatizzati con prompt
// ============================================================

// ─── TIPI DI AZIONE SULLE PLANCE ────────────────────────────
// 'gain_power'   → guadagna N gettoni potere
// 'play_card'    → gioca una carta dalla mano (pagando il costo)
// 'fate'         → pesca 2 carte dal mazzo Fato di un avversario, ne gioca 1
// 'activate'     → attiva un oggetto o alleato in questo luogo
// 'move'         → sposta un oggetto o alleato in un luogo adiacente
// 'vanquish'     → sconfiggi un Eroe usando alleati (forza ≥ forza Eroe)
// 'discard'      → scarta carte dalla mano
// 'draw'         → pesca carte fino alla dimensione mano

// ─── TIPI DI CARTA ─────────────────────────────────────────
// Mazzo Villain: 'ally' | 'item' | 'effect' | 'curse'
// Mazzo Fato:    'hero' | 'fate_item' | 'fate_effect'

// ─── STRUTTURA CARTA ───────────────────────────────────────
// {
//   id:             stringa unica
//   name:           nome italiano
//   type:           tipo carta
//   cost:           costo in potere (null = zero/immediato/Fato)
//   strength:       forza in combattimento (ally/hero)
//   targetLocation: per 'curse' → id del luogo dove va posizionata
//   coversAction:   per 'hero' → indice dell'azione che blocca (o null)
//   effect:         testo dell'effetto (stringa)
//   flavor:         testo ambientazione (opzionale)
// }

// ═══════════════════════════════════════════════════════════
// 1. MALEFICA  (La Bella Addormentata nel Bosco)
// ═══════════════════════════════════════════════════════════
const malefica = {
  id: 'maleficent',
  name: 'Malefica',
  title: 'Signora di Tutto il Male',
  movie: 'La Bella Addormentata nel Bosco',
  color: '#4B0082',
  colorLight: '#7B2FBE',
  colorDark: '#2D0050',
  textColor: '#E8D5FF',
  startingPower: 4,
  handSize: 4,
  winCondition: 'Inizia il tuo turno con almeno una Maledizione in ciascuno dei 4 luoghi del tuo regno.',
  winConditionId: 'curse_all_locations',

  // ── Plancia ──────────────────────────────────────────────
  locations: [
    {
      id: 'brughiera',
      name: 'Brughiera',
      index: 0,
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'castello_stefano',
      name: 'Castello di Re Stefano',
      index: 1,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'fate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'foresta_spine',
      name: 'Foresta di Spine',
      index: 2,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'monte_proibito',
      name: 'Monte Proibito',
      index: 3,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'activate' },
        { type: 'move' },
      ],
    },
  ],

  // ── Mazzo Villain (30 carte) ──────────────────────────────
  villainDeck: [
    // ALLEATI
    { id: 'mal_corvo_1',   name: 'Corvo',                type: 'ally', cost: 3, strength: 4,
      effect: 'Attivazione: sposta il Corvo in qualsiasi luogo. Poi pesca 2 carte.' },
    { id: 'mal_corvo_2',   name: 'Corvo',                type: 'ally', cost: 3, strength: 4,
      effect: 'Attivazione: sposta il Corvo in qualsiasi luogo. Poi pesca 2 carte.' },
    { id: 'mal_sgh_1',     name: 'Sgherri',              type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'mal_sgh_2',     name: 'Sgherri',              type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'mal_sgh_3',     name: 'Sgherri',              type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'mal_sgh_4',     name: 'Sgherri',              type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'mal_drago',     name: 'Malefica come Drago',  type: 'ally', cost: 8, strength: 7,
      effect: 'Quando questa carta sconfigge un Eroe, scartalo e poi pesca 2 carte.' },

    // OGGETTI
    { id: 'mal_bastone',   name: 'Bastone di Malefica',  type: 'item', cost: 3, strength: null,
      effect: 'Attivazione: sposta una Maledizione dalla tua mano nel suo luogo designato.' },

    // MALEDIZIONI (vanno nel luogo indicato su targetLocation)
    { id: 'mal_mal_son_1', name: 'Maledizione del Sonno', type: 'curse', cost: 2, targetLocation: 'castello_stefano',
      effect: 'Gioca questa carta nel Castello di Re Stefano.' },
    { id: 'mal_mal_son_2', name: 'Maledizione del Sonno', type: 'curse', cost: 2, targetLocation: 'castello_stefano',
      effect: 'Gioca questa carta nel Castello di Re Stefano.' },
    { id: 'mal_mal_spi_1', name: 'Maledizione delle Spine', type: 'curse', cost: 3, targetLocation: 'foresta_spine',
      effect: 'Gioca questa carta nella Foresta di Spine.' },
    { id: 'mal_mal_spi_2', name: 'Maledizione delle Spine', type: 'curse', cost: 3, targetLocation: 'foresta_spine',
      effect: 'Gioca questa carta nella Foresta di Spine.' },
    { id: 'mal_mal_bru_1', name: 'Maledizione della Brughiera', type: 'curse', cost: 3, targetLocation: 'brughiera',
      effect: 'Gioca questa carta nella Brughiera.' },
    { id: 'mal_mal_bru_2', name: 'Maledizione della Brughiera', type: 'curse', cost: 3, targetLocation: 'brughiera',
      effect: 'Gioca questa carta nella Brughiera.' },
    { id: 'mal_mal_mon',   name: 'Maledizione del Monte', type: 'curse', cost: 4, targetLocation: 'monte_proibito',
      effect: 'Gioca questa carta nel Monte Proibito.' },

    // EFFETTI
    { id: 'mal_tir_1',     name: 'Tirannia',             type: 'effect', cost: 0,
      effect: 'Rimuovi fino a 3 gettoni Potere da qualsiasi giocatore.' },
    { id: 'mal_tir_2',     name: 'Tirannia',             type: 'effect', cost: 0,
      effect: 'Rimuovi fino a 3 gettoni Potere da qualsiasi giocatore.' },
    { id: 'mal_osc_1',     name: 'Oscurità',             type: 'effect', cost: 3,
      effect: 'Sposta tutte le Maledizioni dalla tua mano nei loro luoghi designati.' },
    { id: 'mal_osc_2',     name: 'Oscurità',             type: 'effect', cost: 3,
      effect: 'Sposta tutte le Maledizioni dalla tua mano nei loro luoghi designati.' },
    { id: 'mal_pau_1',     name: 'Seminare Paura',        type: 'effect', cost: 0,
      effect: 'Sposta una Maledizione dalla tua mano nel suo luogo designato.' },
    { id: 'mal_pau_2',     name: 'Seminare Paura',        type: 'effect', cost: 0,
      effect: 'Sposta una Maledizione dalla tua mano nel suo luogo designato.' },
    { id: 'mal_dis_1',     name: 'Distruzione',           type: 'effect', cost: 4,
      effect: 'Rimuovi qualsiasi Eroe da qualsiasi luogo e rimettilo nel mazzo Fato del suo proprietario.' },
    { id: 'mal_dis_2',     name: 'Distruzione',           type: 'effect', cost: 4,
      effect: 'Rimuovi qualsiasi Eroe da qualsiasi luogo e rimettilo nel mazzo Fato del suo proprietario.' },
    { id: 'mal_mag',       name: 'Magia Oscura',          type: 'effect', cost: 3,
      effect: 'Sposta una Maledizione dalla tua pila degli scarti nel suo luogo designato.' },
    { id: 'mal_pre',       name: 'Presagio',              type: 'effect', cost: 1,
      effect: 'Guarda le prime 3 carte del tuo mazzo Villain. Rimettile nell\'ordine che vuoi.' },
    { id: 'mal_mal_1',     name: 'Malizia',               type: 'effect', cost: 2,
      effect: 'Pesca 2 carte. Poi scarta 1 carta.' },
    { id: 'mal_mal_2',     name: 'Malizia',               type: 'effect', cost: 2,
      effect: 'Pesca 2 carte. Poi scarta 1 carta.' },
    { id: 'mal_inc_1',     name: 'Incantesimo',           type: 'effect', cost: 2,
      effect: 'Sposta un alleato dal tuo luogo attuale in qualsiasi altro luogo.' },
    { id: 'mal_inc_2',     name: 'Incantesimo',           type: 'effect', cost: 2,
      effect: 'Sposta un alleato dal tuo luogo attuale in qualsiasi altro luogo.' },
    { id: 'mal_tor',       name: 'Tormento',              type: 'effect', cost: 1,
      effect: 'Rimuovi 1 gettone Potere da qualsiasi giocatore per ogni Maledizione nei luoghi del tuo regno.' },
  ],

  // ── Mazzo Fato ───────────────────────────────────────────
  fateDeck: [
    // EROI
    { id: 'fmal_aurora',   name: 'Aurora (Rosaspina)',   type: 'hero', strength: 4, coversAction: 0,
      effect: 'Copre la prima azione del luogo dove viene giocata. Se nel Castello di Re Stefano, copri anche la seconda azione.' },
    { id: 'fmal_filippo',  name: 'Principe Filippo',     type: 'hero', strength: 5, coversAction: null,
      effect: 'Quando viene giocato in un luogo con una Maledizione, rimuovi quella Maledizione.' },
    { id: 'fmal_flora',    name: 'Flora',                type: 'hero', strength: 3, coversAction: 1,
      effect: 'Copre la seconda azione del luogo dove viene giocata. Attivazione: cura un altro Eroe in questo luogo (+2 forza).' },
    { id: 'fmal_fauna',    name: 'Fauna',                type: 'hero', strength: 3, coversAction: null,
      effect: 'Attivazione: pesca 2 carte dal mazzo Fato.' },
    { id: 'fmal_serafina', name: 'Serafina',             type: 'hero', strength: 3, coversAction: null,
      effect: 'Attivazione: sposta qualsiasi Eroe in qualsiasi luogo.' },
    // OGGETTI FATO
    { id: 'fmal_spada',    name: 'Spada della Verità',   type: 'fate_item', strength: null,
      effect: 'Assegna a un Eroe. Quando quell\'Eroe combatte, sconfigge automaticamente qualsiasi Alleato, indipendentemente dalla forza.' },
    { id: 'fmal_scudo',    name: 'Scudo delle Virtù',    type: 'fate_item', strength: null,
      effect: 'Assegna a un Eroe. Quel Eroe non può essere sconfitto dagli Alleati di Malefica.' },
    // EFFETTI FATO
    { id: 'fmal_amor_1',   name: 'Il Vero Amore',        type: 'fate_effect',
      effect: 'Rimuovi una Maledizione da qualsiasi luogo del regno di Malefica.' },
    { id: 'fmal_amor_2',   name: 'Il Vero Amore',        type: 'fate_effect',
      effect: 'Rimuovi una Maledizione da qualsiasi luogo del regno di Malefica.' },
    { id: 'fmal_bacio',    name: 'Bacio del Vero Amore', type: 'fate_effect',
      effect: 'Rimuovi tutte le Maledizioni da un luogo a scelta del regno di Malefica.' },
    { id: 'fmal_fata',     name: 'Dono delle Fate',       type: 'fate_effect',
      effect: 'Sposta un Eroe in qualsiasi luogo del regno di Malefica.' },
    { id: 'fmal_bosco',    name: 'Foresta Incantata',     type: 'fate_effect',
      effect: 'Rimuovi tutti gli Alleati da un luogo a scelta del regno di Malefica.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 2. JAFAR  (Aladdin)
// ═══════════════════════════════════════════════════════════
const jafar = {
  id: 'jafar',
  name: 'Jafar',
  title: 'Visir Reale di Agrabah',
  movie: 'Aladdin',
  color: '#8B1A00',
  colorLight: '#C42900',
  colorDark: '#5C1000',
  textColor: '#FFE4B5',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Inizia il tuo turno con la Lampada Magica nel Palazzo del Sultano E il Genio Soggiogato.',
  winConditionId: 'lamp_and_genie',

  locations: [
    {
      id: 'grotta_meraviglie',
      name: 'Grotta delle Meraviglie',
      index: 0,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'strade_agrabah',
      name: 'Strade di Agrabah',
      index: 1,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'play_card' },
        { type: 'fate' },
      ],
    },
    {
      id: 'prigione_palazzo',
      name: 'Prigione del Palazzo',
      index: 2,
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'palazzo_sultano',
      name: 'Palazzo del Sultano',
      index: 3,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'activate' },
        { type: 'play_card' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI
    { id: 'jaf_razul_1',   name: 'Razoul',               type: 'ally', cost: 3, strength: 4,
      effect: 'Quando viene giocato: sposta qualsiasi Eroe in qualsiasi luogo.' },
    { id: 'jaf_razul_2',   name: 'Razoul',               type: 'ally', cost: 3, strength: 4,
      effect: 'Quando viene giocato: sposta qualsiasi Eroe in qualsiasi luogo.' },
    { id: 'jaf_guardie_1', name: 'Guardie del Palazzo',  type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'jaf_guardie_2', name: 'Guardie del Palazzo',  type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'jaf_guardie_3', name: 'Guardie del Palazzo',  type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'jaf_jafar_ser', name: 'Jafar come Serpente',  type: 'ally', cost: 6, strength: 6,
      effect: 'Quando viene giocato nel Palazzo del Sultano: scarta tutti gli Eroi in quel luogo.' },
    // OGGETTI
    { id: 'jaf_lampada',   name: 'Lampada Magica',       type: 'item', cost: 4, strength: null,
      effect: 'Condizione di vittoria: deve trovarsi nel Palazzo del Sultano. Attivazione: guadagna 2 Potere.' },
    { id: 'jaf_serpente',  name: 'Bastone-Serpente',     type: 'item', cost: 2, strength: null,
      effect: 'Attivazione: sconfiggi qualsiasi Alleato in questo luogo (tuo o altrui).' },
    { id: 'jaf_sca_1',     name: 'Scarabeo d\'Oro',      type: 'item', cost: 0, strength: null,
      effect: 'Quando giocato: guadagna 3 Potere.' },
    { id: 'jaf_sca_2',     name: 'Scarabeo d\'Oro',      type: 'item', cost: 0, strength: null,
      effect: 'Quando giocato: guadagna 3 Potere.' },
    // EFFETTI
    { id: 'jaf_obt_1',     name: 'Obbedisci',            type: 'effect', cost: 0,
      effect: 'Sposta il Genio in qualsiasi luogo del tuo regno.' },
    { id: 'jaf_obt_2',     name: 'Obbedisci',            type: 'effect', cost: 0,
      effect: 'Sposta il Genio in qualsiasi luogo del tuo regno.' },
    { id: 'jaf_des_1',     name: 'Desiderio',            type: 'effect', cost: 3,
      effect: 'Guadagna 5 Potere.' },
    { id: 'jaf_des_2',     name: 'Desiderio',            type: 'effect', cost: 3,
      effect: 'Guadagna 5 Potere.' },
    { id: 'jaf_ipn_1',     name: 'Ipnosi',               type: 'effect', cost: 2,
      effect: 'Sposta la Lampada Magica in qualsiasi luogo del tuo regno (se è in gioco).' },
    { id: 'jaf_ipn_2',     name: 'Ipnosi',               type: 'effect', cost: 2,
      effect: 'Sposta la Lampada Magica in qualsiasi luogo del tuo regno (se è in gioco).' },
    { id: 'jaf_tra_1',     name: 'Tradimento',           type: 'effect', cost: 1,
      effect: 'Guarda la mano di qualsiasi giocatore. Poi scarta 1 carta dalla tua mano.' },
    { id: 'jaf_tra_2',     name: 'Tradimento',           type: 'effect', cost: 1,
      effect: 'Guarda la mano di qualsiasi giocatore. Poi scarta 1 carta dalla tua mano.' },
    { id: 'jaf_man_1',     name: 'Manipolazione',        type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Eroe da un luogo del tuo regno in un altro luogo del tuo regno.' },
    { id: 'jaf_man_2',     name: 'Manipolazione',        type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Eroe da un luogo del tuo regno in un altro luogo del tuo regno.' },
    { id: 'jaf_pot_1',     name: 'Potere Immenso',       type: 'effect', cost: 0,
      effect: 'Pesca 2 carte.' },
    { id: 'jaf_pot_2',     name: 'Potere Immenso',       type: 'effect', cost: 0,
      effect: 'Pesca 2 carte.' },
    { id: 'jaf_sog',       name: 'Soggiogare il Genio',  type: 'effect', cost: 5,
      effect: 'Il Genio diventa Soggiogato (condizione di vittoria). Questo effetto si annulla se il Genio lascia il Palazzo del Sultano.' },
    { id: 'jaf_lib',       name: 'Liberare il Genio',    type: 'effect', cost: 0,
      effect: 'Sposta il Genio dalla pila degli scarti al tuo luogo attuale (se è stato scartato).' },
    { id: 'jaf_arr',       name: 'Arrestato!',           type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi personaggio (Eroe o Alleato) nella Prigione del Palazzo.' },
    { id: 'jaf_sor',       name: 'Sorcerer Jafar',       type: 'effect', cost: 4,
      effect: 'Rimuovi tutti gli Eroi dal Palazzo del Sultano.' },
    { id: 'jaf_int',       name: 'Intrigo',              type: 'effect', cost: 1,
      effect: 'Rimuovi 2 Potere da qualsiasi giocatore.' },
  ],

  fateDeck: [
    { id: 'fjaf_aladdin',  name: 'Aladdin',              type: 'hero', strength: 5, coversAction: 2,
      effect: 'Copre la terza azione del luogo dove viene giocato. Attivazione: sposta la Lampada Magica in qualsiasi luogo.' },
    { id: 'fjaf_jasmine',  name: 'Jasmine',              type: 'hero', strength: 4, coversAction: null,
      effect: 'Quando viene giocata nel Palazzo del Sultano: il Genio non può essere Soggiogato questo turno.' },
    { id: 'fjaf_abu',      name: 'Abù',                  type: 'hero', strength: 2, coversAction: null,
      effect: 'Attivazione: sposta qualsiasi oggetto in qualsiasi luogo.' },
    { id: 'fjaf_genie',    name: 'Genio (Libero)',        type: 'hero', strength: 6, coversAction: 1,
      effect: 'Copre la seconda azione del luogo dove viene giocato. Non può essere Soggiogato mentre è in gioco come Eroe.' },
    { id: 'fjaf_sultano',  name: 'Il Sultano',           type: 'hero', strength: 3, coversAction: 0,
      effect: 'Copre la prima azione del luogo dove viene giocato.' },
    { id: 'fjaf_tappeto',  name: 'Tappeto Volante',      type: 'fate_item', strength: null,
      effect: 'Assegna a un Eroe. Quel Eroe può essere spostato in qualsiasi luogo come azione gratuita una volta per turno.' },
    { id: 'fjaf_libert_1', name: 'Libertà!',             type: 'fate_effect',
      effect: 'Rimuovi lo stato Soggiogato dal Genio (se è Soggiogato).' },
    { id: 'fjaf_libert_2', name: 'Libertà!',             type: 'fate_effect',
      effect: 'Rimuovi lo stato Soggiogato dal Genio (se è Soggiogato).' },
    { id: 'fjaf_fuga',     name: 'La Fuga',              type: 'fate_effect',
      effect: 'Sposta la Lampada Magica dalla Grotta delle Meraviglie o Prigione al Palazzo del Sultano.' },
    { id: 'fjaf_riv',      name: 'Rivelazione',          type: 'fate_effect',
      effect: 'Guarda la mano di Jafar. Puoi scartare una carta dalla sua mano.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 3. CAPITAN UNCINO  (Peter Pan)
// ═══════════════════════════════════════════════════════════
const hook = {
  id: 'hook',
  name: 'Capitan Uncino',
  title: 'Terrore dei Sette Mari',
  movie: 'Peter Pan',
  color: '#1B3A6B',
  colorLight: '#2E5FA3',
  colorDark: '#0F2040',
  textColor: '#B8D4FF',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Inizia il tuo turno con Peter Pan sconfitto sulla Jolly Roger.',
  winConditionId: 'defeat_peter_pan',

  locations: [
    {
      id: 'roccia_teschio',
      name: 'Roccia del Teschio',
      index: 0,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'fate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'laguna_sirene',
      name: 'Laguna delle Sirene',
      index: 1,
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'jolly_roger',
      name: 'Jolly Roger',
      index: 2,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'vanquish' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'isola_che_non_ce',
      name: 'Isola che non c\'è',
      index: 3,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'play_card' },
        { type: 'activate' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI
    { id: 'hk_smee_1',     name: 'Mister Smee',          type: 'ally', cost: 2, strength: 2,
      effect: 'Attivazione: guadagna 2 Potere.' },
    { id: 'hk_smee_2',     name: 'Mister Smee',          type: 'ally', cost: 2, strength: 2,
      effect: 'Attivazione: guadagna 2 Potere.' },
    { id: 'hk_pir_1',      name: 'Pirata Deckhand',      type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'hk_pir_2',      name: 'Pirata Deckhand',      type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'hk_pir_3',      name: 'Pirata Deckhand',      type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'hk_pir_4',      name: 'Pirata Deckhand',      type: 'ally', cost: 2, strength: 3, effect: null },
    { id: 'hk_cocco',      name: 'Coccodrillo Tic Toc',  type: 'ally', cost: 4, strength: 5,
      effect: 'Quando viene giocato: sposta un Eroe dalla Jolly Roger nella Laguna delle Sirene.' },
    // OGGETTI
    { id: 'hk_cannone',    name: 'Cannone della Jolly Roger', type: 'item', cost: 3, strength: null,
      effect: 'Attivazione: rimuovi qualsiasi Eroe dalla Jolly Roger.' },
    { id: 'hk_orologio',   name: 'Orologio Rubato',       type: 'item', cost: 0, strength: null,
      effect: 'Quando giocato: pesca 2 carte.' },
    // EFFETTI
    { id: 'hk_bomb_1',     name: 'Imboscata',             type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Eroe dalla Jolly Roger in qualsiasi altro luogo.' },
    { id: 'hk_bomb_2',     name: 'Imboscata',             type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Eroe dalla Jolly Roger in qualsiasi altro luogo.' },
    { id: 'hk_fug_1',      name: 'Nessuna Fuga!',         type: 'effect', cost: 1,
      effect: 'Sposta qualsiasi personaggio (Eroe o Alleato) nella Jolly Roger.' },
    { id: 'hk_fug_2',      name: 'Nessuna Fuga!',         type: 'effect', cost: 1,
      effect: 'Sposta qualsiasi personaggio (Eroe o Alleato) nella Jolly Roger.' },
    { id: 'hk_bott_1',     name: 'Bottino',               type: 'effect', cost: 0,
      effect: 'Guadagna 1 Potere per ogni Pirata Alleato in gioco nel tuo regno.' },
    { id: 'hk_bott_2',     name: 'Bottino',               type: 'effect', cost: 0,
      effect: 'Guadagna 1 Potere per ogni Pirata Alleato in gioco nel tuo regno.' },
    { id: 'hk_sab_1',      name: 'Sabotaggio',            type: 'effect', cost: 3,
      effect: 'Rimuovi tutti gli Alleati di un avversario da qualsiasi luogo.' },
    { id: 'hk_sab_2',      name: 'Sabotaggio',            type: 'effect', cost: 3,
      effect: 'Rimuovi tutti gli Alleati di un avversario da qualsiasi luogo.' },
    { id: 'hk_pan_trak_1', name: 'Sulle Tracce di Pan',   type: 'effect', cost: 0,
      effect: 'Se Peter Pan è nel mazzo Fato: guadagna 4 Potere.' },
    { id: 'hk_pan_trak_2', name: 'Sulle Tracce di Pan',   type: 'effect', cost: 0,
      effect: 'Se Peter Pan è nel mazzo Fato: guadagna 4 Potere.' },
    { id: 'hk_vendetta',   name: 'Vendetta!',             type: 'effect', cost: 2,
      effect: 'Pesca 2 carte. Se hai meno di 5 Potere, guadagna 2 Potere.' },
    { id: 'hk_manif',      name: 'Manifesto dei Pirati',  type: 'effect', cost: 1,
      effect: 'Pesca 3 carte e poi scarta 1.' },
    { id: 'hk_temp',       name: 'Tempesta Perfetta',      type: 'effect', cost: 4,
      effect: 'Sposta tutti gli Eroi dalla Jolly Roger in altri luoghi (uno ciascuno).' },
    { id: 'hk_fama',       name: 'Famigerato',            type: 'effect', cost: 0,
      effect: 'Rimuovi 2 Potere da qualsiasi giocatore.' },
    { id: 'hk_tick_tock',  name: 'Tic Toc',               type: 'effect', cost: 1,
      effect: 'Guadagna 3 Potere.' },
  ],

  fateDeck: [
    { id: 'fhk_pan',       name: 'Peter Pan',             type: 'hero', strength: 6, coversAction: 1,
      effect: 'CONDIZIONE SPECIALE: deve essere sconfitto sulla Jolly Roger da Hook. Copre la seconda azione del luogo dove viene giocato.' },
    { id: 'fhk_wendy',     name: 'Wendy Darling',         type: 'hero', strength: 3, coversAction: null,
      effect: 'Attivazione: sposta Peter Pan in qualsiasi luogo.' },
    { id: 'fhk_tiger_lily',name: 'Tiger Lily',            type: 'hero', strength: 4, coversAction: 0,
      effect: 'Copre la prima azione del luogo dove viene giocata.' },
    { id: 'fhk_john',      name: 'Piccolo John',          type: 'hero', strength: 3, coversAction: null,
      effect: 'Quando viene giocato: rimuovi il Cannone della Jolly Roger (se è in gioco).' },
    { id: 'fhk_trilli',    name: 'Trilli',                type: 'hero', strength: 2, coversAction: null,
      effect: 'Attivazione: guadagna 3 Potere.' },
    { id: 'fhk_bimbi',     name: 'Bimbi Sperduti',        type: 'hero', strength: 3, coversAction: null,
      effect: 'Quando viene giocato: rimuovi un Alleato Pirata dalla Jolly Roger.' },
    { id: 'fhk_polvere',   name: 'Polvere di Fata',       type: 'fate_item', strength: null,
      effect: 'Assegna a Peter Pan. La sua forza aumenta di 3 (+3 forza totale = 9).' },
    { id: 'fhk_volare_1',  name: 'Volare!',               type: 'fate_effect',
      effect: 'Sposta Peter Pan (o qualsiasi Eroe) in qualsiasi luogo del regno di Uncino.' },
    { id: 'fhk_volare_2',  name: 'Volare!',               type: 'fate_effect',
      effect: 'Sposta Peter Pan (o qualsiasi Eroe) in qualsiasi luogo del regno di Uncino.' },
    { id: 'fhk_isola',     name: 'L\'Isola Chiama',        type: 'fate_effect',
      effect: 'Rimuovi tutti gli Alleati dalla Jolly Roger.' },
    { id: 'fhk_sogno',     name: 'Sogni e Avventure',     type: 'fate_effect',
      effect: 'Rimuovi 3 Potere da Capitan Uncino.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 4. URSULA  (La Sirenetta)
// ═══════════════════════════════════════════════════════════
const ursula = {
  id: 'ursula',
  name: 'Ursula',
  title: 'La Strega del Mare',
  movie: 'La Sirenetta',
  color: '#2D1B69',
  colorLight: '#4A2EA8',
  colorDark: '#1A0F40',
  textColor: '#DDD0FF',
  startingPower: 4,
  handSize: 4,
  winCondition: 'Inizia il tuo turno con il Tridente E la Corona di Re Tritone in tuo possesso (nella tua area o nel tuo luogo attuale).',
  winConditionId: 'trident_and_crown',

  locations: [
    {
      id: 'tana_ursula',
      name: 'Tana di Ursula',
      index: 0,
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'activate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'acque_scure',
      name: 'Le Acque Scure',
      index: 1,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'fate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'spiaggia',
      name: 'La Spiaggia',
      index: 2,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'castello_eric',
      name: 'Castello del Principe Eric',
      index: 3,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'play_card' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI
    { id: 'urs_flotsam_1', name: 'Flotsam',              type: 'ally', cost: 2, strength: 3,
      effect: 'Attivazione: sposta qualsiasi Oggetto in questo luogo.' },
    { id: 'urs_flotsam_2', name: 'Flotsam',              type: 'ally', cost: 2, strength: 3,
      effect: 'Attivazione: sposta qualsiasi Oggetto in questo luogo.' },
    { id: 'urs_jetsam_1',  name: 'Jetsam',               type: 'ally', cost: 2, strength: 3,
      effect: 'Attivazione: spia: guarda la mano di qualsiasi avversario.' },
    { id: 'urs_jetsam_2',  name: 'Jetsam',               type: 'ally', cost: 2, strength: 3,
      effect: 'Attivazione: spia: guarda la mano di qualsiasi avversario.' },
    { id: 'urs_vanessa',   name: 'Vanessa',              type: 'ally', cost: 5, strength: 4,
      effect: 'Quando giocata nel Castello del Principe Eric: guadagna 4 Potere e pesca 2 carte.' },
    { id: 'urs_serpenti',  name: 'Serpenti Marini',       type: 'ally', cost: 3, strength: 4, effect: null },
    { id: 'urs_paura',     name: 'Polpo Abissale',        type: 'ally', cost: 5, strength: 6,
      effect: 'Quando sconfigge un Eroe: Ursula guadagna 2 Potere.' },
    // OGGETTI
    { id: 'urs_tridente',  name: 'Tridente di Tritone',   type: 'item', cost: 5, strength: null,
      effect: 'CONDIZIONE DI VITTORIA: deve rimanere in possesso di Ursula. Attivazione: guadagna 3 Potere.' },
    { id: 'urs_corona',    name: 'Corona di Re Tritone',  type: 'item', cost: 4, strength: null,
      effect: 'CONDIZIONE DI VITTORIA: deve rimanere in possesso di Ursula. Attivazione: pesca 2 carte.' },
    { id: 'urs_conchiglia',name: 'Conchiglia Magica',     type: 'item', cost: 2, strength: null,
      effect: 'Attivazione: un avversario a tua scelta perde 3 Potere.' },
    // EFFETTI
    { id: 'urs_pat_1',     name: 'Patto con Ursula',      type: 'effect', cost: 1,
      effect: 'Pesca 2 carte.' },
    { id: 'urs_pat_2',     name: 'Patto con Ursula',      type: 'effect', cost: 1,
      effect: 'Pesca 2 carte.' },
    { id: 'urs_mal_1',     name: 'Maleficio',             type: 'effect', cost: 3,
      effect: 'Rimuovi un Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'urs_mal_2',     name: 'Maleficio',             type: 'effect', cost: 3,
      effect: 'Rimuovi un Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'urs_ond_1',     name: 'Onde Scure',            type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Oggetto in qualsiasi luogo del tuo regno.' },
    { id: 'urs_ond_2',     name: 'Onde Scure',            type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Oggetto in qualsiasi luogo del tuo regno.' },
    { id: 'urs_int_1',     name: 'Ingannare',             type: 'effect', cost: 0,
      effect: 'Rimuovi 2 Potere da qualsiasi giocatore.' },
    { id: 'urs_int_2',     name: 'Ingannare',             type: 'effect', cost: 0,
      effect: 'Rimuovi 2 Potere da qualsiasi giocatore.' },
    { id: 'urs_bur_1',     name: 'Burrasca',              type: 'effect', cost: 4,
      effect: 'Sposta tutti gli Eroi dal tuo regno nella pila degli scarti del Fato.' },
    { id: 'urs_bur_2',     name: 'Burrasca',              type: 'effect', cost: 4,
      effect: 'Sposta tutti gli Eroi dal tuo regno nella pila degli scarti del Fato.' },
    { id: 'urs_str',       name: 'Stratagemma',           type: 'effect', cost: 2,
      effect: 'Guarda le prime 4 carte del tuo mazzo Villain. Prendine 1 in mano, rimetti le altre.' },
    { id: 'urs_dom',       name: 'Dominio dei Mari',      type: 'effect', cost: 5,
      effect: 'Guadagna 6 Potere.' },
    { id: 'urs_pot',       name: 'Potere Oscuro',         type: 'effect', cost: 0,
      effect: 'Pesca 1 carta per ogni Oggetto che possiedi.' },
  ],

  fateDeck: [
    { id: 'furs_ariel',    name: 'Ariel',                type: 'hero', strength: 4, coversAction: 0,
      effect: 'Copre la prima azione della Tana di Ursula se giocata lì. Attivazione: sposta un Oggetto dalla Tana di Ursula in qualsiasi luogo.' },
    { id: 'furs_eric',     name: 'Principe Eric',        type: 'hero', strength: 5, coversAction: null,
      effect: 'Quando viene giocato nel Castello del Principe Eric: rimuovi Vanessa (se è in gioco).' },
    { id: 'furs_tritone',  name: 'Re Tritone',           type: 'hero', strength: 6, coversAction: 1,
      effect: 'Copre la seconda azione del luogo dove viene giocato. Quando è in gioco, Ursula non può usare il Tridente.' },
    { id: 'furs_sebastian',name: 'Sebastian',            type: 'hero', strength: 2, coversAction: null,
      effect: 'Attivazione: sposta qualsiasi Eroe in qualsiasi luogo del regno di Ursula.' },
    { id: 'furs_flounder', name: 'Flounder',             type: 'hero', strength: 2, coversAction: null,
      effect: 'Attivazione: pesca 2 carte dal mazzo Fato.' },
    { id: 'furs_tridente', name: 'Il Tridente Recuperato', type: 'fate_item', strength: null,
      effect: 'Assegna a Re Tritone. Il Tridente di Tritone viene spostato nella pila degli scarti di Ursula.' },
    { id: 'furs_lib_1',    name: 'Libertà per le Anime', type: 'fate_effect',
      effect: 'Rimuovi il Tridente o la Corona dal possesso di Ursula.' },
    { id: 'furs_lib_2',    name: 'Libertà per le Anime', type: 'fate_effect',
      effect: 'Rimuovi il Tridente o la Corona dal possesso di Ursula.' },
    { id: 'furs_bacio',    name: 'Il Bacio di Eric',     type: 'fate_effect',
      effect: 'Rimuovi Vanessa (se è in gioco in qualsiasi luogo).' },
    { id: 'furs_temp',     name: 'Tempesta',             type: 'fate_effect',
      effect: 'Rimuovi tutti gli Alleati da un luogo a scelta del regno di Ursula.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 5. PRINCIPE GIOVANNI  (Robin Hood)
// ═══════════════════════════════════════════════════════════
const princeJohn = {
  id: 'prince_john',
  name: 'Principe Giovanni',
  title: 'Il Re Senza Scrupoli',
  movie: 'Robin Hood',
  color: '#5C4000',
  colorLight: '#8B6914',
  colorDark: '#3A2800',
  textColor: '#FFE090',
  startingPower: 0,
  handSize: 4,
  winCondition: 'Inizia il tuo turno con almeno 20 gettoni Potere.',
  winConditionId: 'twenty_power',

  locations: [
    {
      id: 'foresta_sherwood',
      name: 'Foresta di Sherwood',
      index: 0,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'villaggio',
      name: 'Villaggio di Nottingham',
      index: 1,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'fate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'castello_nottingham',
      name: 'Castello di Nottingham',
      index: 2,
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'palazzo_reale',
      name: 'Palazzo Reale',
      index: 3,
      actions: [
        { type: 'gain_power', value: 4 },
        { type: 'activate' },
        { type: 'play_card' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI
    { id: 'pj_sceriffo_1', name: 'Sceriffo di Nottingham', type: 'ally', cost: 3, strength: 4,
      effect: 'Attivazione: ruba 3 Potere da qualsiasi giocatore.' },
    { id: 'pj_sceriffo_2', name: 'Sceriffo di Nottingham', type: 'ally', cost: 3, strength: 4,
      effect: 'Attivazione: ruba 3 Potere da qualsiasi giocatore.' },
    { id: 'pj_guardie_1',  name: 'Guardie del Re',         type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'pj_guardie_2',  name: 'Guardie del Re',         type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'pj_guardie_3',  name: 'Guardie del Re',         type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'pj_guardie_4',  name: 'Guardie del Re',         type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'pj_principe',   name: 'Principe Giovanni in Trono', type: 'ally', cost: 6, strength: 1,
      effect: 'Quando è in gioco: guadagna 2 Potere all\'inizio di ogni tuo turno.' },
    // OGGETTI
    { id: 'pj_corona',     name: 'Corona di Re Riccardo', type: 'item', cost: 4, strength: null,
      effect: 'Attivazione: guadagna 5 Potere.' },
    { id: 'pj_cofanetto',  name: 'Cofanetto dell\'Oro',    type: 'item', cost: 2, strength: null,
      effect: 'Attivazione: guadagna 3 Potere.' },
    // EFFETTI
    { id: 'pj_tas_1',      name: 'Tassazione!',            type: 'effect', cost: 0,
      effect: 'Ruba 2 Potere da qualsiasi giocatore.' },
    { id: 'pj_tas_2',      name: 'Tassazione!',            type: 'effect', cost: 0,
      effect: 'Ruba 2 Potere da qualsiasi giocatore.' },
    { id: 'pj_tas_3',      name: 'Tassazione!',            type: 'effect', cost: 0,
      effect: 'Ruba 2 Potere da qualsiasi giocatore.' },
    { id: 'pj_oro_1',      name: 'Oro per il Re!',         type: 'effect', cost: 0,
      effect: 'Guadagna 1 Potere per ogni Alleato in gioco nel tuo regno.' },
    { id: 'pj_oro_2',      name: 'Oro per il Re!',         type: 'effect', cost: 0,
      effect: 'Guadagna 1 Potere per ogni Alleato in gioco nel tuo regno.' },
    { id: 'pj_ava_1',      name: 'Avarizia',               type: 'effect', cost: 0,
      effect: 'Guadagna 3 Potere.' },
    { id: 'pj_ava_2',      name: 'Avarizia',               type: 'effect', cost: 0,
      effect: 'Guadagna 3 Potere.' },
    { id: 'pj_int_1',      name: 'Intimidazione',           type: 'effect', cost: 2,
      effect: 'Rimuovi 3 Potere da qualsiasi giocatore.' },
    { id: 'pj_int_2',      name: 'Intimidazione',           type: 'effect', cost: 2,
      effect: 'Rimuovi 3 Potere da qualsiasi giocatore.' },
    { id: 'pj_ric_1',      name: 'Ricatto',                type: 'effect', cost: 1,
      effect: 'Pesca 2 carte.' },
    { id: 'pj_ric_2',      name: 'Ricatto',                type: 'effect', cost: 1,
      effect: 'Pesca 2 carte.' },
    { id: 'pj_dec_1',      name: 'Decreto Reale',          type: 'effect', cost: 2,
      effect: 'Rimuovi un Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'pj_dec_2',      name: 'Decreto Reale',          type: 'effect', cost: 2,
      effect: 'Rimuovi un Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'pj_cud',        name: 'Cuddly Snake',           type: 'effect', cost: 0,
      effect: 'Sposta qualsiasi Alleato o Eroe in qualsiasi luogo del tuo regno.' },
    { id: 'pj_torr',       name: 'Torneo',                 type: 'effect', cost: 3,
      effect: 'Guadagna 5 Potere. Poi un avversario perde 2 Potere.' },
    { id: 'pj_sen',        name: 'Sentenza di Morte',       type: 'effect', cost: 4,
      effect: 'Rimuovi tutti gli Eroi da un luogo del tuo regno. Pesca 1 carta per ogni Eroe rimosso.' },
    { id: 'pj_mal',        name: 'Il Malvagio Principe',   type: 'effect', cost: 0,
      effect: 'Se hai 15 o più Potere: guadagna altri 3 Potere.' },
    { id: 'pj_bef',        name: 'Beffe Reali',            type: 'effect', cost: 1,
      effect: 'Ruba 1 Potere da ogni altro giocatore.' },
  ],

  fateDeck: [
    { id: 'fpj_robin',     name: 'Robin Hood',             type: 'hero', strength: 5, coversAction: 3,
      effect: 'Copre la quarta azione del luogo dove viene giocato. Attivazione: ruba 3 Potere dal Principe Giovanni.' },
    { id: 'fpj_piccolo',   name: 'Piccolo Giovanni',       type: 'hero', strength: 4, coversAction: null,
      effect: 'Attivazione: sposta qualsiasi Eroe in qualsiasi luogo del regno del Principe Giovanni.' },
    { id: 'fpj_fratino',   name: 'Frate Tuck',             type: 'hero', strength: 3, coversAction: 2,
      effect: 'Copre la terza azione del luogo dove viene giocato. Quando giocato: il Principe Giovanni perde 2 Potere.' },
    { id: 'fpj_marian',    name: 'Lady Marion',            type: 'hero', strength: 3, coversAction: null,
      effect: 'Quando viene giocata: il Principe Giovanni perde 1 Potere per ogni Eroe in gioco nel suo regno.' },
    { id: 'fpj_skip',      name: 'Sceriffo Disarmato',     type: 'hero', strength: 2, coversAction: null,
      effect: 'Quando viene giocato: rimuovi lo Sceriffo di Nottingham (se è in gioco).' },
    { id: 'fpj_rubato_1',  name: 'Rubato dal Re!',         type: 'fate_effect',
      effect: 'Il Principe Giovanni perde 3 Potere.' },
    { id: 'fpj_rubato_2',  name: 'Rubato dal Re!',         type: 'fate_effect',
      effect: 'Il Principe Giovanni perde 3 Potere.' },
    { id: 'fpj_rubato_3',  name: 'Rubato dal Re!',         type: 'fate_effect',
      effect: 'Il Principe Giovanni perde 3 Potere.' },
    { id: 'fpj_riccardo',  name: 'Re Riccardo Ritorna',    type: 'fate_effect',
      effect: 'Il Principe Giovanni perde metà del suo Potere (arrotondato per difetto).' },
    { id: 'fpj_rivolta',   name: 'Rivolta dei Sudditi',    type: 'fate_effect',
      effect: 'Rimuovi tutti gli Alleati da un luogo del regno del Principe Giovanni.' },
    { id: 'fpj_freq',      name: 'Frecce di Robin Hood',   type: 'fate_item', strength: null,
      effect: 'Assegna a Robin Hood. La sua forza aumenta di 3 (+3, totale 8).' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 6. REGINA DI CUORI  (Alice nel Paese delle Meraviglie)
// ═══════════════════════════════════════════════════════════
const queensOfHearts = {
  id: 'queen_of_hearts',
  name: 'Regina di Cuori',
  title: 'La Regina Furiosa',
  movie: 'Alice nel Paese delle Meraviglie',
  color: '#7A0000',
  colorLight: '#CC0000',
  colorDark: '#4A0000',
  textColor: '#FFD0D0',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Inizia il tuo turno con una carta "Wicket" in ciascuno dei 4 luoghi del tuo regno.',
  winConditionId: 'wicket_all_locations',

  locations: [
    {
      id: 'giardino_rose',
      name: 'Giardino delle Rose',
      index: 0,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'cortile',
      name: 'Il Cortile',
      index: 1,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'fate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'palazzo_cuori',
      name: 'Palazzo dei Cuori',
      index: 2,
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'activate' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'campo_croquet',
      name: 'Campo da Croquet',
      index: 3,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI
    { id: 'qh_card_sol_1', name: 'Soldato di Carte (♥)',  type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'qh_card_sol_2', name: 'Soldato di Carte (♥)',  type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'qh_card_sol_3', name: 'Soldato di Carte (♦)',  type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'qh_card_sol_4', name: 'Soldato di Carte (♦)',  type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'qh_card_sol_5', name: 'Soldato di Carte (♣)',  type: 'ally', cost: 1, strength: 2, effect: null },
    { id: 'qh_bruco',      name: 'Bruco Azzurro',         type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: pesca 2 carte.' },
    { id: 'qh_bianconiglio',name: 'Bianconiglio',        type: 'ally', cost: 2, strength: 2,
      effect: 'Quando viene giocato: pesca 1 carta. Attivazione: sposta un Wicket in qualsiasi luogo.' },
    // OGGETTI WICKET (Condizione di vittoria)
    { id: 'qh_wk_ros',     name: 'Wicket — Giardino',    type: 'wicket', cost: 3, targetLocation: 'giardino_rose',
      effect: 'CONDIZIONE DI VITTORIA: deve rimanere nel Giardino delle Rose.' },
    { id: 'qh_wk_cor',     name: 'Wicket — Cortile',     type: 'wicket', cost: 3, targetLocation: 'cortile',
      effect: 'CONDIZIONE DI VITTORIA: deve rimanere nel Cortile.' },
    { id: 'qh_wk_pal',     name: 'Wicket — Palazzo',     type: 'wicket', cost: 3, targetLocation: 'palazzo_cuori',
      effect: 'CONDIZIONE DI VITTORIA: deve rimanere nel Palazzo dei Cuori.' },
    { id: 'qh_wk_cam',     name: 'Wicket — Campo',       type: 'wicket', cost: 3, targetLocation: 'campo_croquet',
      effect: 'CONDIZIONE DI VITTORIA: deve rimanere nel Campo da Croquet.' },
    // ALTRI OGGETTI
    { id: 'qh_mazza',      name: 'Mazza da Croquet (Fenicottero)', type: 'item', cost: 2, strength: null,
      effect: 'Attivazione: sposta un Wicket in qualsiasi luogo.' },
    // EFFETTI
    { id: 'qh_testa_1',    name: 'Via la Testa!',         type: 'effect', cost: 0,
      effect: 'Rimuovi qualsiasi Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'qh_testa_2',    name: 'Via la Testa!',         type: 'effect', cost: 0,
      effect: 'Rimuovi qualsiasi Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'qh_testa_3',    name: 'Via la Testa!',         type: 'effect', cost: 0,
      effect: 'Rimuovi qualsiasi Eroe da qualsiasi luogo del tuo regno.' },
    { id: 'qh_ord_1',      name: 'Ordine della Regina!',  type: 'effect', cost: 1,
      effect: 'Pesca 2 carte.' },
    { id: 'qh_ord_2',      name: 'Ordine della Regina!',  type: 'effect', cost: 1,
      effect: 'Pesca 2 carte.' },
    { id: 'qh_sen_1',      name: 'Sentenza Immediata',    type: 'effect', cost: 2,
      effect: 'Rimuovi tutti gli Eroi da un luogo a scelta del tuo regno.' },
    { id: 'qh_sen_2',      name: 'Sentenza Immediata',    type: 'effect', cost: 2,
      effect: 'Rimuovi tutti gli Eroi da un luogo a scelta del tuo regno.' },
    { id: 'qh_furiosa_1',  name: 'Furia Reale',           type: 'effect', cost: 0,
      effect: 'Rimuovi 2 Potere da qualsiasi giocatore.' },
    { id: 'qh_furiosa_2',  name: 'Furia Reale',           type: 'effect', cost: 0,
      effect: 'Rimuovi 2 Potere da qualsiasi giocatore.' },
    { id: 'qh_pro_1',      name: 'Processo Farsa',        type: 'effect', cost: 1,
      effect: 'Sposta qualsiasi Eroe dal tuo regno nella pila degli scarti del Fato del suo proprietario.' },
    { id: 'qh_pro_2',      name: 'Processo Farsa',        type: 'effect', cost: 1,
      effect: 'Sposta qualsiasi Eroe dal tuo regno nella pila degli scarti del Fato del suo proprietario.' },
    { id: 'qh_reg',        name: 'Regola Numero Quattro!', type: 'effect', cost: 3,
      effect: 'Scegli un luogo: tutti gli Eroi in quel luogo vengono rimossi.' },
    { id: 'qh_cro',        name: 'Croquet!',              type: 'effect', cost: 2,
      effect: 'Sposta un Wicket in qualsiasi luogo del tuo regno.' },
  ],

  fateDeck: [
    { id: 'fqh_alice',     name: 'Alice',                 type: 'hero', strength: 4, coversAction: 2,
      effect: 'Copre la terza azione del luogo dove viene giocata. Attivazione: sposta un Wicket dalla sua posizione in qualsiasi altro luogo.' },
    { id: 'fqh_cappellaio',name: 'Cappellaio Matto',      type: 'hero', strength: 3, coversAction: null,
      effect: 'Attivazione: rimuovi un Wicket da qualsiasi luogo.' },
    { id: 'fqh_gatto',     name: 'Stregatto (Cheshire Cat)', type: 'hero', strength: 2, coversAction: null,
      effect: 'Attivazione: sposta in qualsiasi luogo e poi copri un\'azione di quel luogo.' },
    { id: 'fqh_bruchino',  name: 'Bruchino',              type: 'hero', strength: 2, coversAction: null,
      effect: 'Quando viene giocato: rimuovi un Wicket dal luogo in cui è giocato (se presente).' },
    { id: 'fqh_tortle',    name: 'Mock Turtle',           type: 'hero', strength: 3, coversAction: 0,
      effect: 'Copre la prima azione del luogo dove viene giocato.' },
    { id: 'fqh_fiam_1',    name: 'Fenicottero Rivoltoso', type: 'fate_item', strength: null,
      effect: 'Assegna a un Eroe. Attivazione: sposta un Wicket dalla sua posizione in qualsiasi altro luogo.' },
    { id: 'fqh_perc_1',    name: 'Perdere la Testa!',     type: 'fate_effect',
      effect: 'Rimuovi un Wicket da qualsiasi luogo del regno della Regina di Cuori.' },
    { id: 'fqh_perc_2',    name: 'Perdere la Testa!',     type: 'fate_effect',
      effect: 'Rimuovi un Wicket da qualsiasi luogo del regno della Regina di Cuori.' },
    { id: 'fqh_perc_3',    name: 'Perdere la Testa!',     type: 'fate_effect',
      effect: 'Rimuovi un Wicket da qualsiasi luogo del regno della Regina di Cuori.' },
    { id: 'fqh_nons',      name: 'Nonsense!',             type: 'fate_effect',
      effect: 'La Regina di Cuori non può usare azioni Activate questo turno.' },
    { id: 'fqh_sogno',     name: 'Era Solo un Sogno',     type: 'fate_effect',
      effect: 'Rimuovi tutti i Wicket da un luogo a scelta del regno della Regina di Cuori.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// EXPORT PRINCIPALE
// ═══════════════════════════════════════════════════════════
export const VILLAINS = {
  maleficent:     malefica,
  jafar:          jafar,
  hook:           hook,
  ursula:         ursula,
  prince_john:    princeJohn,
  queen_of_hearts: queensOfHearts,
}

export const VILLAIN_LIST = Object.values(VILLAINS)

// Helper: dato un villain id e un card id, restituisce la carta
export function findCard(villainId, cardId) {
  const villain = VILLAINS[villainId]
  if (!villain) return null
  return (
    villain.villainDeck.find(c => c.id === cardId) ||
    villain.fateDeck.find(c => c.id === cardId) ||
    null
  )
}

// Helper: restituisce il luogo dato il suo id sulla plancia di un villain
export function findLocation(villainId, locationId) {
  const villain = VILLAINS[villainId]
  if (!villain) return null
  return villain.locations.find(l => l.id === locationId) || null
}

// Etichette azioni per la UI
export const ACTION_LABELS = {
  gain_power:  (a) => `+${a.value} Potere`,
  play_card:   ()  => 'Gioca Carta',
  fate:        ()  => 'Fato',
  activate:    ()  => 'Attiva',
  move:        ()  => 'Sposta',
  vanquish:    ()  => 'Sconfiggi',
  discard:     ()  => 'Scarta',
  draw:        (a) => `Pesca ${a.value ?? ''}`,
}

export const ACTION_COLORS = {
  gain_power: 'bg-yellow-600',
  play_card:  'bg-blue-700',
  fate:       'bg-purple-700',
  activate:   'bg-green-700',
  move:       'bg-orange-600',
  vanquish:   'bg-red-700',
  discard:    'bg-gray-600',
  draw:       'bg-teal-600',
}

// Tipo carta → colore badge
export const CARD_TYPE_COLORS = {
  ally:        'bg-blue-800 text-blue-200',
  item:        'bg-amber-800 text-amber-200',
  effect:      'bg-purple-800 text-purple-200',
  curse:       'bg-indigo-900 text-indigo-200',
  wicket:      'bg-red-900 text-red-200',
  hero:        'bg-emerald-800 text-emerald-200',
  fate_item:   'bg-teal-800 text-teal-200',
  fate_effect: 'bg-fuchsia-900 text-fuchsia-200',
}

export const CARD_TYPE_LABELS = {
  ally:        'Alleato',
  item:        'Oggetto',
  effect:      'Effetto',
  curse:       'Maledizione',
  wicket:      'Wicket',
  hero:        'Eroe',
  fate_item:   'Oggetto Fato',
  fate_effect: 'Effetto Fato',
}
