// ============================================================
// Disney Villainous — Dati Villain
// Fonte: guide ufficiali Ravensburger Italia (PDF)
//        "Disney Villainous Italia" — impaginazione Marco Tieghi
// ============================================================
// STRUTTURA AZIONI LUOGO:
//   actions[0..1] → riga superiore (coperta dagli Eroi)
//   actions[2..3] → riga inferiore (sempre disponibili)
// TIPI AZIONE: gain_power | play_card | fate | activate |
//              move | vanquish | discard | move_hero
// TIPI CARTA villain: ally | item | effect | curse | condition
// TIPI CARTA fato:    hero | fate_item | fate_effect 
// ============================================================

// ─── Etichette UI ──────────────────────────────────────────
export const ACTION_LABELS = {
  gain_power : (a) => `Ottieni ${a.value} Potere`,
  play_card  : ()  => 'Gioca una carta',
  fate       : ()  => 'Fato',
  activate   : ()  => 'Attiva',
  move       : ()  => 'Muovi alleato/oggetto',
  vanquish   : ()  => 'Scontro',
  discard    : ()  => 'Scarta carte',
  move_hero  : ()  => 'Muovi un Eroe',
}

export const ACTION_COLORS = {
  gain_power : 'bg-yellow-700',
  play_card  : 'bg-blue-700',
  fate       : 'bg-purple-700',
  activate   : 'bg-teal-700',
  move       : 'bg-orange-700',
  vanquish   : 'bg-red-700',
  discard    : 'bg-gray-600',
  move_hero  : 'bg-pink-700',
}

export const CARD_TYPE_LABELS = {
  ally        : 'Alleato',
  item        : 'Oggetto',
  effect      : 'Effetto',
  curse       : 'Maledizione',
  condition   : 'Condizione',
  hero        : 'Eroe',
  fate_item   : 'Oggetto Fato',
  fate_effect : 'Effetto Fato',
}

export const CARD_TYPE_COLORS = {
  ally        : 'bg-blue-800 text-blue-200',
  item        : 'bg-amber-800 text-amber-200',
  effect      : 'bg-violet-800 text-violet-200',
  curse       : 'bg-indigo-900 text-indigo-200',
  condition   : 'bg-rose-900 text-rose-200',
  hero        : 'bg-emerald-800 text-emerald-200',
  fate_item   : 'bg-amber-700 text-amber-100',
  fate_effect : 'bg-violet-700 text-violet-100',
}

// ─── Helper ────────────────────────────────────────────────
export function findCard(villainId, cardId) {
  const v = VILLAINS[villainId]
  if (!v) return null
  return [...v.villainDeck, ...v.fateDeck].find(c => c.id === cardId) || null
}
export function findLocation(villainId, locationId) {
  return VILLAINS[villainId]?.locations.find(l => l.id === locationId) || null
}

// ═══════════════════════════════════════════════════════════
// 1. MALEFICA  (La Bella Addormentata nel Bosco)
// Obiettivo: iniziare il turno con ≥1 Maledizione in OGNI luogo
// ═══════════════════════════════════════════════════════════
const malefica = {
  id: 'maleficent',
  name: 'Malefica',
  title: 'Signora di Tutto il Male',
  movie: 'La Bella Addormentata nel Bosco',
  color: '#4B0082', colorLight: '#7B2FBE', colorDark: '#2D0050', textColor: '#E8D5FF',
  startingPower: 4,
  handSize: 4,
  winCondition: 'Inizia il turno con almeno una Maledizione in ciascuno dei 4 luoghi.',
  winConditionId: 'curse_all_locations',

  locations: [
    {
      id: 'montagna_proibita', name: 'La Montagna Proibita', index: 0,
      actions: [
        { type: 'move' },       // top-1 (coperta)
        { type: 'play_card' },  // top-2 (coperta)
        { type: 'gain_power', value: 1 }, // bottom-1
        { type: 'fate' },       // bottom-2
      ],
    },
    {
      id: 'casetta_rosaspina', name: 'La Casetta di Rosaspina', index: 1,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'move' },
        { type: 'play_card' },
        { type: 'discard' },
      ],
    },
    {
      id: 'foresta', name: 'La Foresta', index: 2,
      actions: [
        { type: 'discard' },
        { type: 'play_card' },
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'castello_stefano', name: 'Il Castello di Re Stefano', index: 3,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'fate' },
        { type: 'vanquish' },
        { type: 'play_card' },
      ],
    },
  ],

  // ── Mazzo Villain (30 carte) ──────────────────────────────
  villainDeck: [
    // MALEDIZIONI (8)
    { id: 'mal_c_son_1', name: 'Sonno Senza Sogni', type: 'curse', cost: 3,
      effect: 'Gli Eroi in questo luogo hanno Forza -2. Scarta questa Maledizione se il Corvo viene mosso qui, oppure se qui si trovano Eroi con Forza totale ≥4 (escluso il malus).' },
    { id: 'mal_c_son_2', name: 'Sonno Senza Sogni', type: 'curse', cost: 3,
      effect: 'Gli Eroi in questo luogo hanno Forza -2. Scarta questa Maledizione se il Corvo viene mosso qui, oppure se qui si trovano Eroi con Forza totale ≥4 (escluso il malus).' },
    { id: 'mal_c_roi_1', name: 'Foresta di Rovi', type: 'curse', cost: 2,
      effect: 'Gli Eroi con Forza <4 non possono essere giocati in questo luogo. Scarta questa Maledizione se un Eroe con Forza ≥4 viene giocato qui.' },
    { id: 'mal_c_roi_2', name: 'Foresta di Rovi', type: 'curse', cost: 2,
      effect: 'Gli Eroi con Forza <4 non possono essere giocati in questo luogo. Scarta questa Maledizione se un Eroe con Forza ≥4 viene giocato qui.' },
    { id: 'mal_c_roi_3', name: 'Foresta di Rovi', type: 'curse', cost: 2,
      effect: 'Gli Eroi con Forza <4 non possono essere giocati in questo luogo. Scarta questa Maledizione se un Eroe con Forza ≥4 viene giocato qui.' },
    { id: 'mal_c_fuo_1', name: 'Fuoco Verde', type: 'curse', cost: 3,
      effect: 'Gli Eroi non possono essere giocati in questo luogo. Malefica non può muoversi in questo luogo. Scarta questa Maledizione se Malefica si muove qui (per effetto di Re Stefano).' },
    { id: 'mal_c_fuo_2', name: 'Fuoco Verde', type: 'curse', cost: 3,
      effect: 'Gli Eroi non possono essere giocati in questo luogo. Malefica non può muoversi in questo luogo. Scarta questa Maledizione se Malefica si muove qui (per effetto di Re Stefano).' },
    { id: 'mal_c_fuo_3', name: 'Fuoco Verde', type: 'curse', cost: 3,
      effect: 'Gli Eroi non possono essere giocati in questo luogo. Malefica non può muoversi in questo luogo. Scarta questa Maledizione se Malefica si muove qui (per effetto di Re Stefano).' },
    // ALLEATI (7)
    { id: 'mal_a_cor', name: 'Corvo', type: 'ally', cost: 3, strength: 3,
      effect: 'Prima di muovere la pedina, puoi usare un\'azione disponibile nel luogo in cui si trova il Corvo.' },
    { id: 'mal_a_gra_1', name: 'Scagnozzo Gracchiante', type: 'ally', cost: 1, strength: 1,
      effect: 'Nessun effetto speciale.' },
    { id: 'mal_a_gra_2', name: 'Scagnozzo Gracchiante', type: 'ally', cost: 1, strength: 1,
      effect: 'Nessun effetto speciale.' },
    { id: 'mal_a_gra_3', name: 'Scagnozzo Gracchiante', type: 'ally', cost: 1, strength: 1,
      effect: 'Nessun effetto speciale.' },
    { id: 'mal_a_sel_1', name: 'Scagnozzo Selvaggio', type: 'ally', cost: 4, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'mal_a_sel_2', name: 'Scagnozzo Selvaggio', type: 'ally', cost: 4, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'mal_a_sel_3', name: 'Scagnozzo Selvaggio', type: 'ally', cost: 4, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'mal_a_sin_1', name: 'Scagnozzo Sinistro', type: 'ally', cost: 2, strength: 2,
      effect: 'Questo Alleato ottiene +1 Forza per ogni Maledizione nel suo luogo.' },
    { id: 'mal_a_sin_2', name: 'Scagnozzo Sinistro', type: 'ally', cost: 2, strength: 2,
      effect: 'Questo Alleato ottiene +1 Forza per ogni Maledizione nel suo luogo.' },
    { id: 'mal_a_sin_3', name: 'Scagnozzo Sinistro', type: 'ally', cost: 2, strength: 2,
      effect: 'Questo Alleato ottiene +1 Forza per ogni Maledizione nel suo luogo.' },
    // OGGETTI (2)
    { id: 'mal_o_arc', name: 'Arcolaio', type: 'item', cost: 1,
      effect: 'Quando un Eroe in questo luogo viene sconfitto, guadagna Potere pari alla Forza attuale di quell\'Eroe meno 1.' },
    { id: 'mal_o_bas', name: 'Bastone', type: 'item', cost: 2,
      effect: 'Le carte giocate nello stesso luogo costano 1 Potere in meno.' },
    // EFFETTI (6)
    { id: 'mal_e_dra_1', name: 'Forma di Drago', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe con Forza ≤3 in questo luogo. Poi, guadagna 3 Potere per ogni Fato che ti viene scagliato contro prima del tuo prossimo turno.' },
    { id: 'mal_e_dra_2', name: 'Forma di Drago', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe con Forza ≤3 in questo luogo. Poi, guadagna 3 Potere per ogni Fato che ti viene scagliato contro prima del tuo prossimo turno.' },
    { id: 'mal_e_dra_3', name: 'Forma di Drago', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe con Forza ≤3 in questo luogo. Poi, guadagna 3 Potere per ogni Fato che ti viene scagliato contro prima del tuo prossimo turno.' },
    { id: 'mal_e_sva_1', name: 'Svanire', type: 'effect', cost: 2,
      effect: 'Malefica non deve muoversi questo turno. Al tuo prossimo turno, esegui le azioni di questo luogo come se fossi appena arrivata (senza limite di movimento).' },
    { id: 'mal_e_sva_2', name: 'Svanire', type: 'effect', cost: 2,
      effect: 'Malefica non deve muoversi questo turno. Al tuo prossimo turno, esegui le azioni di questo luogo come se fossi appena arrivata (senza limite di movimento).' },
    { id: 'mal_e_sva_3', name: 'Svanire', type: 'effect', cost: 2,
      effect: 'Malefica non deve muoversi questo turno. Al tuo prossimo turno, esegui le azioni di questo luogo come se fossi appena arrivata (senza limite di movimento).' },
    // CONDIZIONI (4)
    { id: 'mal_k_tir_1', name: 'Tirannia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario non ha Alleati nel suo Reame. Effetto: guarda le prime 3 carte del tuo mazzo e metti in mano quelle che vuoi; scarta le altre.' },
    { id: 'mal_k_tir_2', name: 'Tirannia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario non ha Alleati nel suo Reame. Effetto: guarda le prime 3 carte del tuo mazzo e metti in mano quelle che vuoi; scarta le altre.' },
    { id: 'mal_k_mal_1', name: 'Malignità', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha almeno 4 Eroi nel suo Reame. Effetto: sconfiggi qualsiasi Eroe in qualsiasi luogo del tuo Reame.' },
    { id: 'mal_k_mal_2', name: 'Malignità', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha almeno 4 Eroi nel suo Reame. Effetto: sconfiggi qualsiasi Eroe in qualsiasi luogo del tuo Reame.' },
  ],

  // ── Mazzo Fato (15 carte) ─────────────────────────────────
  fateDeck: [
    // EROI (10)
    { id: 'fmal_aurora',   name: 'Aurora',           type: 'hero', strength: 4,
      effect: 'Quando viene giocata: rimuovi la Foresta di Rovi dal luogo in cui viene giocata. Poi rivela la prima carta del mazzo Fato: se è un Eroe, giocalo in qualsiasi luogo.' },
    { id: 'fmal_fauna',    name: 'Fauna',             type: 'hero', strength: 2,
      effect: 'Quando viene giocata: rimuovi un Sonno Senza Sogni dal luogo in cui viene giocata.' },
    { id: 'fmal_flora',    name: 'Flora',             type: 'hero', strength: 2,
      effect: 'Mentre è in campo: Malefica gioca con la mano scoperta (tutti i giocatori possono vedere le sue carte).' },
    { id: 'fmal_serena',   name: 'Serena',            type: 'hero', strength: 2,
      effect: 'Mentre è in campo: le Maledizioni non possono essere giocate nel luogo in cui si trova Serena.' },
    { id: 'fmal_stefano',  name: 'Re Stefano',        type: 'hero', strength: 3,
      effect: 'Quando viene giocato: rimuovi la Foresta di Rovi dal luogo in cui viene giocato. Poi sposta Malefica in qualsiasi altro luogo (rimuovendo un eventuale Fuoco Verde).' },
    { id: 'fmal_uberto',   name: 'Re Uberto',         type: 'hero', strength: 2,
      effect: 'Mentre è in campo: gli Alleati di Malefica non possono essere spostati in questo luogo.' },
    { id: 'fmal_filippo',  name: 'Principe Filippo',  type: 'hero', strength: 5,
      effect: 'Quando viene giocato: scarta il Corvo dal Reame di Malefica (se è in campo).' },
    { id: 'fmal_guard_1',  name: 'Guardie',           type: 'hero', strength: 3,
      effect: 'Per essere sconfitte servono almeno 2 Alleati.' },
    { id: 'fmal_guard_2',  name: 'Guardie',           type: 'hero', strength: 3,
      effect: 'Per essere sconfitte servono almeno 2 Alleati.' },
    { id: 'fmal_guard_3',  name: 'Guardie',           type: 'hero', strength: 3,
      effect: 'Per essere sconfitte servono almeno 2 Alleati.' },
    // OGGETTI FATO (3)
    { id: 'fmal_spada_1',  name: 'Spada della Verità', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza e le Maledizioni nel suo luogo costano 1 Potere in più.' },
    { id: 'fmal_spada_2',  name: 'Spada della Verità', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza e le Maledizioni nel suo luogo costano 1 Potere in più.' },
    { id: 'fmal_spada_3',  name: 'Spada della Verità', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza e le Maledizioni nel suo luogo costano 1 Potere in più.' },
    // EFFETTI FATO (2)
    { id: 'fmal_sogno_1',  name: 'C\'era una Volta in un Sogno', type: 'fate_effect',
      effect: 'Rimuovi una Maledizione per ogni Eroe nel Reame di Malefica.' },
    { id: 'fmal_sogno_2',  name: 'C\'era una Volta in un Sogno', type: 'fate_effect',
      effect: 'Rimuovi una Maledizione per ogni Eroe nel Reame di Malefica.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 2. JAFAR  (Aladdin)
// Obiettivo: Lampada Magica al Palazzo del Sultano +
//            Genio ipnotizzato all'inizio del turno
// ═══════════════════════════════════════════════════════════
const jafar = {
  id: 'jafar',
  name: 'Jafar',
  title: 'Visir Reale di Agrabah',
  movie: 'Aladdin',
  color: '#8B1A00', colorLight: '#C42900', colorDark: '#5C1000', textColor: '#FFE4B5',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Inizia il turno con la Lampada Magica al Palazzo del Sultano e il Genio ipnotizzato (sotto il tuo controllo).',
  winConditionId: 'lamp_and_genie',

  locations: [
    {
      id: 'palazzo_sultano', name: 'Il Palazzo del Sultano', index: 0,
      actions: [
        { type: 'play_card' },
        { type: 'activate' },
        { type: 'vanquish' },
        { type: 'fate' },
      ],
    },
    {
      id: 'strade_agrabah', name: 'Le Strade di Agrabah', index: 1,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'fate' },
        { type: 'discard' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'oasi', name: 'L\'Oasi', index: 2,
      actions: [
        { type: 'activate' },
        { type: 'play_card' },
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'caverna_meraviglie', name: 'La Caverna delle Meraviglie', index: 3,
      locked: true,
      unlockCard: 'jaf_o_amu',
      actions: [
        { type: 'discard' },
        { type: 'gain_power', value: 2 },
        { type: 'play_card' },
        { type: 'move' },
      ],
    },
  ],

  villainDeck: [
    // OGGETTI (8)
    { id: 'jaf_o_lam', name: 'Lampada Magica', type: 'item', cost: 5,
      effect: 'Condizione di vittoria: deve trovarsi al Palazzo del Sultano. Quando viene giocata: Trova il Genio nel mazzo Fato e posizionalo in questo luogo (scarta tutti gli oggetti che aveva assegnati).' },
    { id: 'jaf_o_amu', name: 'Amuleto dello Scarabeo', type: 'item', cost: 2,
      effect: 'Quando viene giocato: sblocca la Caverna delle Meraviglie. Da questo turno in poi pesca fino a 5 carte invece di 4.' },
    { id: 'jaf_o_bas', name: 'Bastone del Serpente', type: 'item', cost: 2,
      effect: 'Attivazione: recupera una copia di Ipnotizzare dalla pila degli scarti e mettila in mano.' },
    { id: 'jaf_o_cle_1', name: 'Clessidra Gigante', type: 'item', cost: 1,
      effect: 'Attivazione (valida solo fino alla fine del turno): un Eroe o Alleato in questo luogo ha Forza -2.' },
    { id: 'jaf_o_cle_2', name: 'Clessidra Gigante', type: 'item', cost: 1,
      effect: 'Attivazione (valida solo fino alla fine del turno): un Eroe o Alleato in questo luogo ha Forza -2.' },
    { id: 'jaf_o_sci_1', name: 'Scimitarra', type: 'item', cost: 0,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'jaf_o_sci_2', name: 'Scimitarra', type: 'item', cost: 0,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'jaf_o_sci_3', name: 'Scimitarra', type: 'item', cost: 0,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    // EFFETTI (12)
    { id: 'jaf_e_sac_1', name: 'Sacrificio Necessario', type: 'effect', cost: 2,
      effect: 'Scarta un Oggetto o Alleato dal tuo Reame. Guadagna 3 Potere.' },
    { id: 'jaf_e_sac_2', name: 'Sacrificio Necessario', type: 'effect', cost: 2,
      effect: 'Scarta un Oggetto o Alleato dal tuo Reame. Guadagna 3 Potere.' },
    { id: 'jaf_e_sac_3', name: 'Sacrificio Necessario', type: 'effect', cost: 2,
      effect: 'Scarta un Oggetto o Alleato dal tuo Reame. Guadagna 3 Potere.' },
    { id: 'jaf_e_chi_1', name: 'Chiaroveggenza', type: 'effect', cost: 1,
      effect: 'Rivela le prime 3 carte del tuo mazzo. Puoi prendere in mano un Oggetto o un Alleato. Rimetti le altre nell\'ordine che vuoi.' },
    { id: 'jaf_e_chi_2', name: 'Chiaroveggenza', type: 'effect', cost: 1,
      effect: 'Rivela le prime 3 carte del tuo mazzo. Puoi prendere in mano un Oggetto o un Alleato. Rimetti le altre nell\'ordine che vuoi.' },
    { id: 'jaf_e_chi_3', name: 'Chiaroveggenza', type: 'effect', cost: 1,
      effect: 'Rivela le prime 3 carte del tuo mazzo. Puoi prendere in mano un Oggetto o un Alleato. Rimetti le altre nell\'ordine che vuoi.' },
    { id: 'jaf_e_ser_1', name: 'Ah, Sarei un Serpente?', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe (eccetto il Genio) nel luogo in cui si trova Jafar.' },
    { id: 'jaf_e_ser_2', name: 'Ah, Sarei un Serpente?', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe (eccetto il Genio) nel luogo in cui si trova Jafar.' },
    { id: 'jaf_e_ipn_1', name: 'Ipnotizzare', type: 'effect', cost: 4,
      effect: 'Ipnotizza un Eroe nel tuo Reame: diventa un Alleato sotto il tuo controllo (mantieni la sua Forza). Scarta tutti gli Oggetti che aveva assegnati.' },
    { id: 'jaf_e_ipn_2', name: 'Ipnotizzare', type: 'effect', cost: 4,
      effect: 'Ipnotizza un Eroe nel tuo Reame: diventa un Alleato sotto il tuo controllo (mantieni la sua Forza). Scarta tutti gli Oggetti che aveva assegnati.' },
    { id: 'jaf_e_str_1', name: 'Potere dello Stregone', type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Alleato nel tuo Reame in qualsiasi luogo.' },
    { id: 'jaf_e_str_2', name: 'Potere dello Stregone', type: 'effect', cost: 2,
      effect: 'Sposta qualsiasi Alleato nel tuo Reame in qualsiasi luogo.' },
    // ALLEATI (6)
    { id: 'jaf_a_iago', name: 'Iago', type: 'ally', cost: 2, strength: 1,
      effect: 'Attivazione: sposta Iago e un Oggetto nel suo luogo in un luogo adiacente.' },
    { id: 'jaf_a_raz', name: 'Razoul', type: 'ally', cost: 4, strength: 5,
      effect: 'Gli Alleati giocati nel suo stesso luogo costano 2 Potere in meno.' },
    { id: 'jaf_a_gaz', name: 'Gazeem', type: 'ally', cost: 2, strength: 1,
      effect: 'Quando viene sconfitto o scartato: recupera un Oggetto dalla pila degli scarti e mettilo in mano.' },
    { id: 'jaf_a_gua_1', name: 'Guardia di Palazzo', type: 'ally', cost: 2, strength: 3,
      effect: 'Nessun effetto speciale. Non può sconfiggere il Sultano.' },
    { id: 'jaf_a_gua_2', name: 'Guardia di Palazzo', type: 'ally', cost: 2, strength: 3,
      effect: 'Nessun effetto speciale. Non può sconfiggere il Sultano.' },
    { id: 'jaf_a_gua_3', name: 'Guardia di Palazzo', type: 'ally', cost: 2, strength: 3,
      effect: 'Nessun effetto speciale. Non può sconfiggere il Sultano.' },
    // CONDIZIONI (4)
    { id: 'jaf_k_ing_1', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥2 Oggetti nel Reame. Effetto: scarta un Oggetto dal Reame di quell\'avversario.' },
    { id: 'jaf_k_ing_2', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥2 Oggetti nel Reame. Effetto: scarta un Oggetto dal Reame di quell\'avversario.' },
    { id: 'jaf_k_man_1', name: 'Manipolazione', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥3 Alleati nel Reame. Effetto: recupera qualsiasi carta dalla tua pila degli scarti e mettila in mano.' },
    { id: 'jaf_k_man_2', name: 'Manipolazione', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥3 Alleati nel Reame. Effetto: recupera qualsiasi carta dalla tua pila degli scarti e mettila in mano.' },
  ],

  fateDeck: [
    // EROI (7)
    { id: 'fjaf_aladdin', name: 'Aladdin', type: 'hero', strength: 3,
      effect: 'Quando viene giocato: ruba un Oggetto dal luogo in cui viene giocato (eccetto la Lampada se è ipnotizzato il Genio). Lo porta con sé.' },
    { id: 'fjaf_abu', name: 'Abu', type: 'hero', strength: 2,
      effect: 'Come Aladdin: ruba un Oggetto dal luogo in cui viene giocato.' },
    { id: 'fjaf_tappeto', name: 'Tappeto', type: 'hero', strength: 1,
      effect: 'Mentre è in campo: altri Eroi non possono essere sconfitti o ipnotizzati.' },
    { id: 'fjaf_genio', name: 'Genio', type: 'hero', strength: 6,
      effect: 'Forza molto alta. Quando la Lampada Magica viene giocata: rimuovi il Genio dal mazzo Fato e posizionalo nel luogo della Lampada.' },
    { id: 'fjaf_jasmine', name: 'Principessa Jasmine', type: 'hero', strength: 1,
      effect: 'Mentre è in campo (non ipnotizzata): Jafar pesca 1 carta in meno per turno.' },
    { id: 'fjaf_rajah', name: 'Rajah', type: 'hero', strength: 3,
      effect: 'Ottiene +2 Forza se la Principessa Jasmine è nel Reame (anche se ipnotizzata).' },
    { id: 'fjaf_sultano', name: 'Il Sultano', type: 'hero', strength: 1,
      effect: 'Non può essere sconfitto dalle Guardie di Palazzo.' },
    // OGGETTI FATO (3)
    { id: 'fjaf_des_1', name: 'Desiderio', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza. Con 1 Desiderio: immune ad Ah, Sarei un Serpente? Con 2 Desideri: immune anche a Ipnotizzare.' },
    { id: 'fjaf_des_2', name: 'Desiderio', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza. Con 1 Desiderio: immune ad Ah, Sarei un Serpente? Con 2 Desideri: immune anche a Ipnotizzare.' },
    { id: 'fjaf_des_3', name: 'Desiderio', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza. Con 1 Desiderio: immune ad Ah, Sarei un Serpente? Con 2 Desideri: immune anche a Ipnotizzare.' },
    // EFFETTI FATO (5)
    { id: 'fjaf_bru_1', name: 'Brutto Colpo', type: 'fate_effect',
      effect: 'Scarta qualsiasi Alleato dal Reame di Jafar (non è considerato sconfitto).' },
    { id: 'fjaf_bru_2', name: 'Brutto Colpo', type: 'fate_effect',
      effect: 'Scarta qualsiasi Alleato dal Reame di Jafar (non è considerato sconfitto).' },
    { id: 'fjaf_man_1', name: 'C\'è Mancato Poco', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe dalla pila degli scarti di Jafar nel luogo in cui si trova Jafar.' },
    { id: 'fjaf_man_2', name: 'C\'è Mancato Poco', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe dalla pila degli scarti di Jafar nel luogo in cui si trova Jafar.' },
    { id: 'fjaf_tra', name: 'Tradimento', type: 'fate_effect',
      effect: 'Jafar perde 3 Potere.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 3. CAPITAN UNCINO  (Peter Pan)
// Obiettivo: sconfiggere Peter Pan alla Jolly Roger
// ═══════════════════════════════════════════════════════════
const hook = {
  id: 'hook',
  name: 'Capitan Uncino',
  title: 'Il Capitano della Jolly Roger',
  movie: 'Peter Pan',
  color: '#1A3A5C', colorLight: '#2E6DA4', colorDark: '#0D1F33', textColor: '#B0D4F1',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Sconfiggi Peter Pan alla Jolly Roger usando Alleati con Forza totale ≥ Forza di Peter Pan.',
  winConditionId: 'defeat_peter_pan',

  locations: [
    {
      id: 'jolly_roger', name: 'La Jolly Roger', index: 0,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'discard' },
        { type: 'vanquish' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'roccia_teschio', name: 'La Roccia del Teschio', index: 1,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'play_card' },
        { type: 'fate' },
        { type: 'discard' },
      ],
    },
    {
      id: 'laguna_sirene', name: 'La Laguna delle Sirene', index: 2,
      actions: [
        { type: 'play_card' },
        { type: 'move' },
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'albero_impiccato', name: 'L\'Albero dell\'Impiccato', index: 3,
      locked: true,
      unlockCard: 'hk_o_map',
      actions: [
        { type: 'fate' },
        { type: 'gain_power', value: 2 },
        { type: 'move_hero' },
        { type: 'play_card' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI (10)
    { id: 'hk_a_ban_1', name: 'Banda d\'Arrembaggio', type: 'ally', cost: 2, strength: 2,
      effect: 'Può partecipare a Scontri in luoghi adiacenti al suo.' },
    { id: 'hk_a_ban_2', name: 'Banda d\'Arrembaggio', type: 'ally', cost: 2, strength: 2,
      effect: 'Può partecipare a Scontri in luoghi adiacenti al suo.' },
    { id: 'hk_a_ban_3', name: 'Banda d\'Arrembaggio', type: 'ally', cost: 2, strength: 2,
      effect: 'Può partecipare a Scontri in luoghi adiacenti al suo.' },
    { id: 'hk_a_sma_1', name: 'Smargiasso', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessun effetto speciale.' },
    { id: 'hk_a_sma_2', name: 'Smargiasso', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessun effetto speciale.' },
    { id: 'hk_a_sma_3', name: 'Smargiasso', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessun effetto speciale.' },
    { id: 'hk_a_bru_1', name: 'Bruto Pirata', type: 'ally', cost: 5, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'hk_a_bru_2', name: 'Bruto Pirata', type: 'ally', cost: 5, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'hk_a_sta', name: 'Mr. Starkey', type: 'ally', cost: 3, strength: 2,
      effect: 'Attivazione: sposta Peter Pan (se è nel Reame) in qualsiasi luogo.' },
    { id: 'hk_a_spu', name: 'Spugna', type: 'ally', cost: 4, strength: 4,
      effect: 'Quando viene giocato alla Jolly Roger: rimuovi uno Schernire da qualsiasi Eroe nel Reame.' },
    // OGGETTI (7)
    { id: 'hk_o_can_1', name: 'Cannone', type: 'item', cost: 3,
      effect: 'Il luogo in cui si trova ha l\'azione aggiuntiva Scontro (permette di combattere anche lì).' },
    { id: 'hk_o_can_2', name: 'Cannone', type: 'item', cost: 3,
      effect: 'Il luogo in cui si trova ha l\'azione aggiuntiva Scontro (permette di combattere anche lì).' },
    { id: 'hk_o_sci_1', name: 'Sciabola', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'hk_o_sci_2', name: 'Sciabola', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'hk_o_unc_1', name: 'Uncino da Cerimonia', type: 'item', cost: 2,
      effect: 'All\'inizio del tuo turno, guadagna 1 Potere.' },
    { id: 'hk_o_unc_2', name: 'Uncino da Cerimonia', type: 'item', cost: 2,
      effect: 'All\'inizio del tuo turno, guadagna 1 Potere.' },
    { id: 'hk_o_dis', name: 'Dispositivo Ingegnoso', type: 'item', cost: 4,
      effect: 'Il luogo in cui si trova ha 2 azioni Muovi un Eroe invece di 1.' },
    { id: 'hk_o_map', name: 'Mappa dell\'Isola Che Non C\'è', type: 'item', cost: 3,
      effect: 'Quando viene giocata: sblocca l\'Albero dell\'Impiccato. Puoi scartarla per giocare gratuitamente un Oggetto dalla tua mano.' },
    // EFFETTI (8)
    { id: 'hk_e_spa_1', name: 'Spaventare', type: 'effect', cost: 2,
      effect: 'Guarda le prime 2 carte del mazzo Fato di un avversario. Puoi scartarle o rimetterle nell\'ordine che vuoi.' },
    { id: 'hk_e_spa_2', name: 'Spaventare', type: 'effect', cost: 2,
      effect: 'Guarda le prime 2 carte del mazzo Fato di un avversario. Puoi scartarle o rimetterle nell\'ordine che vuoi.' },
    { id: 'hk_e_spa_3', name: 'Spaventare', type: 'effect', cost: 2,
      effect: 'Guarda le prime 2 carte del mazzo Fato di un avversario. Puoi scartarle o rimetterle nell\'ordine che vuoi.' },
    { id: 'hk_e_deg_1', name: 'Degno Avversario', type: 'effect', cost: 0,
      effect: 'Rivela la prima carta del mazzo Fato di un avversario. Se è un Eroe, giocalo nel luogo che preferisci. Guadagna 2 Potere.' },
    { id: 'hk_e_deg_2', name: 'Degno Avversario', type: 'effect', cost: 0,
      effect: 'Rivela la prima carta del mazzo Fato di un avversario. Se è un Eroe, giocalo nel luogo che preferisci. Guadagna 2 Potere.' },
    { id: 'hk_e_deg_3', name: 'Degno Avversario', type: 'effect', cost: 0,
      effect: 'Rivela la prima carta del mazzo Fato di un avversario. Se è un Eroe, giocalo nel luogo che preferisci. Guadagna 2 Potere.' },
    { id: 'hk_e_sig_1', name: 'Signore, Signorsì Signore!', type: 'effect', cost: 2,
      effect: 'Puoi spostare un Alleato in qualsiasi luogo. Poi esegui un\'azione Scontro (se possibile).' },
    { id: 'hk_e_sig_2', name: 'Signore, Signorsì Signore!', type: 'effect', cost: 2,
      effect: 'Puoi spostare un Alleato in qualsiasi luogo. Poi esegui un\'azione Scontro (se possibile).' },
    // CONDIZIONI (4)
    { id: 'hk_k_ast_1', name: 'Astuzia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha un Alleato con Forza ≥4 nel Reame. Effetto: gioca un Alleato dalla tua mano gratuitamente.' },
    { id: 'hk_k_ast_2', name: 'Astuzia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha un Alleato con Forza ≥4 nel Reame. Effetto: gioca un Alleato dalla tua mano gratuitamente.' },
    { id: 'hk_k_oss_1', name: 'Ossessione', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario sconfigge un Eroe con Forza ≥3. Effetto: guarda le prime 4 carte del mazzo Fato di un avversario. Rimettile nell\'ordine che vuoi.' },
    { id: 'hk_k_oss_2', name: 'Ossessione', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario sconfigge un Eroe con Forza ≥3. Effetto: guarda le prime 4 carte del mazzo Fato di un avversario. Rimettile nell\'ordine che vuoi.' },
  ],

  fateDeck: [
    // EROI (9)
    { id: 'fhk_peter', name: 'Peter Pan', type: 'hero', strength: 7,
      effect: 'Quando viene rivelato durante un Fato: scarta la seconda carta rivelata. Deve essere sconfitto alla Jolly Roger per far vincere Uncino.' },
    { id: 'fhk_gianni', name: 'Gianni', type: 'hero', strength: 1,
      effect: 'Ottiene +1 Forza se ha almeno un Oggetto assegnato.' },
    { id: 'fhk_bimbi_1', name: 'I Bimbi Sperduti', type: 'hero', strength: 3,
      effect: 'Per essere sconfitti servono almeno 2 Alleati.' },
    { id: 'fhk_bimbi_2', name: 'I Bimbi Sperduti', type: 'hero', strength: 3,
      effect: 'Per essere sconfitti servono almeno 2 Alleati.' },
    { id: 'fhk_michele', name: 'Michele', type: 'hero', strength: 1,
      effect: 'Ottiene +1 Forza per ogni luogo del Reame di Uncino che contiene almeno un Eroe (incluso il suo).' },
    { id: 'fhk_tictac', name: 'Tic Tac', type: 'hero', strength: 4,
      effect: 'Quando viene giocato: Capitan Uncino scarta una carta dalla sua mano.' },
    { id: 'fhk_trilli', name: 'Trilli', type: 'hero', strength: 2,
      effect: 'Quando viene giocata: scarta l\'Alleato con Forza più alta dal luogo in cui viene giocata.' },
    { id: 'fhk_wendy', name: 'Wendy', type: 'hero', strength: 2,
      effect: 'Mentre è in campo: tutti gli altri Eroi nel Reame ottengono +1 Forza.' },
    // OGGETTI FATO (5)
    { id: 'fhk_polv_1', name: 'Polvere di Fata', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fhk_polv_2', name: 'Polvere di Fata', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fhk_polv_3', name: 'Polvere di Fata', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fhk_sch_1', name: 'Schernire', type: 'fate_item',
      effect: 'Assegna a un Eroe. Uncino deve sconfiggere prima questo Eroe (con un\'azione Scontro) prima di poterne sconfiggere altri.' },
    { id: 'fhk_sch_2', name: 'Schernire', type: 'fate_item',
      effect: 'Assegna a un Eroe. Uncino deve sconfiggere prima questo Eroe (con un\'azione Scontro) prima di poterne sconfiggere altri.' },
    // EFFETTI FATO (2)
    { id: 'fhk_mal_1', name: 'Terribile Mal di Testa', type: 'fate_effect',
      effect: 'Scarta un Oggetto dal Reame di Capitan Uncino.' },
    { id: 'fhk_mal_2', name: 'Terribile Mal di Testa', type: 'fate_effect',
      effect: 'Scarta un Oggetto dal Reame di Capitan Uncino.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 4. URSULA  (La Sirenetta)
// Obiettivo: Corona E Tridente al Covo di Ursula all'inizio del turno
// ═══════════════════════════════════════════════════════════
const ursula = {
  id: 'ursula',
  name: 'Ursula',
  title: 'La Strega del Mare',
  movie: 'La Sirenetta',
  color: '#4A0050', colorLight: '#8B1A8C', colorDark: '#280030', textColor: '#E8D5FF',
  startingPower: 4,
  handSize: 4,
  winCondition: 'Inizia il turno con la Corona E il Tridente nel Covo di Ursula.',
  winConditionId: 'trident_and_crown',

  locations: [
    {
      id: 'covo_ursula', name: 'Il Covo di Ursula', index: 0,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'activate' },
        { type: 'move' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'nave_eric', name: 'La Nave di Eric', index: 1,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'play_card' },
        { type: 'fate' },
        { type: 'discard' },
      ],
    },
    {
      id: 'riva', name: 'La Riva', index: 2,
      actions: [
        { type: 'play_card' },
        { type: 'discard' },
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'palazzo_eric', name: 'Il Palazzo', index: 3,
      locked: true,
      unlockCard: 'urs_e_tra_1',
      actions: [
        { type: 'move' },
        { type: 'fate' },
        { type: 'move_hero' },
        { type: 'gain_power', value: 2 },
      ],
    },
  ],

  villainDeck: [
    // OGGETTI (9): 6 Contratti + Corona + Tridente + Calderone
    { id: 'urs_o_con_1', name: 'Contratto Vincolante (Riva)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe. Quel Eroe è sconfitto se viene spostato alla Riva.' },
    { id: 'urs_o_con_2', name: 'Contratto Vincolante (Riva)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe. Quel Eroe è sconfitto se viene spostato alla Riva.' },
    { id: 'urs_o_con_3', name: 'Contratto Vincolante (Nave di Eric)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe. Quel Eroe è sconfitto se viene spostato alla Nave di Eric.' },
    { id: 'urs_o_con_4', name: 'Contratto Vincolante (Nave di Eric)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe. Quel Eroe è sconfitto se viene spostato alla Nave di Eric.' },
    { id: 'urs_o_con_5', name: 'Contratto Vincolante (Covo)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe. Quel Eroe è sconfitto se viene spostato al Covo di Ursula.' },
    { id: 'urs_o_con_6', name: 'Contratto Vincolante (Palazzo)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe. Quel Eroe è sconfitto se viene spostato al Palazzo.' },
    { id: 'urs_o_cor', name: 'Corona', type: 'item', cost: 4,
      effect: 'Condizione di vittoria: deve trovarsi al Covo di Ursula. Attivazione: guarda la prossima carta del mazzo Fato di un avversario.' },
    { id: 'urs_o_tri', name: 'Tridente', type: 'item', cost: 4,
      effect: 'Condizione di vittoria: deve trovarsi al Covo di Ursula. Quando viene giocato: Trova Re Tritone nel mazzo Fato e posizionalo nel luogo del Tridente.' },
    { id: 'urs_o_cal', name: 'Calderone', type: 'item', cost: 2,
      effect: 'Quando un Eroe viene sconfitto nel tuo Reame: guadagna 1 Potere.' },
    // ALLEATI (2)
    { id: 'urs_a_flo', name: 'Flotsam', type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: sposta un Eroe con un Contratto Vincolante assegnato nel luogo indicato dal contratto (sconfiggendolo).' },
    { id: 'urs_a_jet', name: 'Jetsam', type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: sposta un Eroe con un Contratto Vincolante assegnato nel luogo indicato dal contratto (sconfiggendolo).' },
    // EFFETTI (14)
    { id: 'urs_e_tra_1', name: 'Trasformazione', type: 'effect', cost: 2,
      effect: 'Cambia lo stato del lucchetto: se il Palazzo è bloccato, sbloccalo e blocca il Covo (e viceversa).' },
    { id: 'urs_e_tra_2', name: 'Trasformazione', type: 'effect', cost: 2,
      effect: 'Cambia lo stato del lucchetto: se il Palazzo è bloccato, sbloccalo e blocca il Covo (e viceversa).' },
    { id: 'urs_e_tra_3', name: 'Trasformazione', type: 'effect', cost: 2,
      effect: 'Cambia lo stato del lucchetto: se il Palazzo è bloccato, sbloccalo e blocca il Covo (e viceversa).' },
    { id: 'urs_e_gig_1', name: 'Diventare Gigantesca', type: 'effect', cost: 2,
      effect: 'Esegui un\'azione di qualsiasi luogo adiacente a quello in cui si trova Ursula (incluse azioni Fato).' },
    { id: 'urs_e_gig_2', name: 'Diventare Gigantesca', type: 'effect', cost: 2,
      effect: 'Esegui un\'azione di qualsiasi luogo adiacente a quello in cui si trova Ursula (incluse azioni Fato).' },
    { id: 'urs_e_gig_3', name: 'Diventare Gigantesca', type: 'effect', cost: 2,
      effect: 'Esegui un\'azione di qualsiasi luogo adiacente a quello in cui si trova Ursula (incluse azioni Fato).' },
    { id: 'urs_e_opp_1', name: 'Opportunista', type: 'effect', cost: 1,
      effect: 'Recupera qualsiasi carta dalla tua pila degli scarti e mettila in mano.' },
    { id: 'urs_e_opp_2', name: 'Opportunista', type: 'effect', cost: 1,
      effect: 'Recupera qualsiasi carta dalla tua pila degli scarti e mettila in mano.' },
    { id: 'urs_e_opp_3', name: 'Opportunista', type: 'effect', cost: 1,
      effect: 'Recupera qualsiasi carta dalla tua pila degli scarti e mettila in mano.' },
    { id: 'urs_e_vor_1', name: 'Vortice', type: 'effect', cost: 2,
      effect: 'Sposta un Eroe dal Reame di Ursula in qualsiasi altro luogo del Reame.' },
    { id: 'urs_e_vor_2', name: 'Vortice', type: 'effect', cost: 2,
      effect: 'Sposta un Eroe dal Reame di Ursula in qualsiasi altro luogo del Reame.' },
    { id: 'urs_e_vor_3', name: 'Vortice', type: 'effect', cost: 2,
      effect: 'Sposta un Eroe dal Reame di Ursula in qualsiasi altro luogo del Reame.' },
    { id: 'urs_e_div_1', name: 'Divinazione', type: 'effect', cost: 2,
      effect: 'Guarda le prime 5 carte del tuo mazzo. Puoi prendere in mano tutti i Contratti Vincolanti trovati. Scarta il resto.' },
    { id: 'urs_e_div_2', name: 'Divinazione', type: 'effect', cost: 2,
      effect: 'Guarda le prime 5 carte del tuo mazzo. Puoi prendere in mano tutti i Contratti Vincolanti trovati. Scarta il resto.' },
    { id: 'urs_e_tri', name: 'Tristi Anime Sole', type: 'effect', cost: 3,
      effect: 'Sposta tutti gli Eroi con un Contratto Vincolante assegnato in un luogo adiacente al loro (possibile sconfitta).' },
    // CONDIZIONI (4)
    { id: 'urs_k_arr_1', name: 'Arroganza', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario sconfigge un Eroe con Forza ≥4. Effetto: guarda le prime 5 carte del tuo mazzo; puoi mettere in mano Corona o Tridente se trovate.' },
    { id: 'urs_k_arr_2', name: 'Arroganza', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario sconfigge un Eroe con Forza ≥4. Effetto: guarda le prime 5 carte del tuo mazzo; puoi mettere in mano Corona o Tridente se trovate.' },
    { id: 'urs_k_ing_1', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥6 Potere. Effetto: quell\'avversario perde 3 Potere.' },
    { id: 'urs_k_ing_2', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥6 Potere. Effetto: quell\'avversario perde 3 Potere.' },
  ],

  fateDeck: [
    // EROI (8)
    { id: 'furs_ariel',    name: 'Ariel',      type: 'hero', strength: 3,
      effect: 'Quando viene giocata: sposta la Corona o il Tridente (se in campo e non bloccati) alla Riva.' },
    { id: 'furs_eric',     name: 'Eric',       type: 'hero', strength: 2,
      effect: 'Quando viene giocato: puoi spostare un altro Eroe del Reame in un luogo adiacente.' },
    { id: 'furs_flounder', name: 'Flounder',   type: 'hero', strength: 1,
      effect: 'Quando viene giocato: rimischia la pila degli scarti di Ursula nel suo mazzo.' },
    { id: 'furs_grimsby',  name: 'Grimsby',    type: 'hero', strength: 1,
      effect: 'Quando viene giocato: usa la sua abilità di Trasformazione (cambia il lucchetto tra Covo e Palazzo).' },
    { id: 'furs_tritone',  name: 'Re Tritone',  type: 'hero', strength: 5,
      effect: 'Tutti gli Effetti e le carte che lo hanno come obiettivo costano 1 Potere in più. Quando il Tridente viene giocato: viene spostato nel luogo del Tridente (scartando tutti gli Oggetti assegnati).' },
    { id: 'furs_max',      name: 'Max',        type: 'hero', strength: 1,
      effect: 'Quando viene giocato: sposta Ursula in qualsiasi luogo del suo Reame.' },
    { id: 'furs_scuttle',  name: 'Scuttle',    type: 'hero', strength: 1,
      effect: 'Nessun effetto speciale.' },
    { id: 'furs_sebas',    name: 'Sebastian',  type: 'hero', strength: 1,
      effect: 'Mentre è in campo: i Contratti Vincolanti non possono essere assegnati a Re Tritone.' },
    // OGGETTI FATO (4)
    { id: 'furs_arr_1', name: 'Arricciaspiccia', type: 'fate_item',
      effect: 'Assegna a un Eroe. Ogni volta che Ursula visita il luogo di quell\'Eroe, perde 1 Potere.' },
    { id: 'furs_arr_2', name: 'Arricciaspiccia', type: 'fate_item',
      effect: 'Assegna a un Eroe. Ogni volta che Ursula visita il luogo di quell\'Eroe, perde 1 Potere.' },
    { id: 'furs_sof_1', name: 'Soffia Bla-Bla', type: 'fate_item',
      effect: 'Assegna a un Eroe. Assegnare un Contratto Vincolante a quell\'Eroe costa 3 Potere in più.' },
    { id: 'furs_sof_2', name: 'Soffia Bla-Bla', type: 'fate_item',
      effect: 'Assegna a un Eroe. Assegnare un Contratto Vincolante a quell\'Eroe costa 3 Potere in più.' },
    // EFFETTI FATO (3)
    { id: 'furs_rip_1', name: 'Riprendere Forma', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe dalla pila degli scarti di Ursula nel luogo in cui si trova Ursula.' },
    { id: 'furs_rip_2', name: 'Riprendere Forma', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe dalla pila degli scarti di Ursula nel luogo in cui si trova Ursula.' },
    { id: 'furs_rip_3', name: 'Riprendere Forma', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe dalla pila degli scarti di Ursula nel luogo in cui si trova Ursula.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 5. PRINCIPE GIOVANNI  (Robin Hood)
// Obiettivo: iniziare il turno con ≥20 Gettoni Potere
// ═══════════════════════════════════════════════════════════
const prince_john = {
  id: 'prince_john',
  name: 'Principe Giovanni',
  title: 'Principe d\'Inghilterra',
  movie: 'Robin Hood',
  color: '#5C3D00', colorLight: '#A06900', colorDark: '#3A2500', textColor: '#FFE4B5',
  startingPower: 7,
  handSize: 4,
  winCondition: 'Inizia il turno con almeno 20 Gettoni Potere.',
  winConditionId: 'twenty_power',

  locations: [
    {
      id: 'foresta_sherwood', name: 'La Foresta di Sherwood', index: 0,
      actions: [
        { type: 'gain_power', value: 1 },
        { type: 'discard' },
        { type: 'play_card' },
        { type: 'fate' },
      ],
    },
    {
      id: 'chiesa_fratac', name: 'La Chiesa di Fra Tac', index: 1,
      actions: [
        { type: 'gain_power', value: 2 },
        { type: 'play_card' },
        { type: 'play_card' },
        { type: 'move' },
      ],
    },
    {
      id: 'nottingham', name: 'Nottingham', index: 2,
      actions: [
        { type: 'fate' },
        { type: 'gain_power', value: 1 },
        { type: 'vanquish' },
        { type: 'play_card' },
      ],
    },
    {
      id: 'prigione', name: 'La Prigione', index: 3,
      // Nessuna azione superiore coperta: i 3 slot sono tutti "bottom"
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
        { type: 'discard' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI (10)
    { id: 'pj_a_rino_1', name: 'Guardia Rinoceronte', type: 'ally', cost: 6, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'pj_a_rino_2', name: 'Guardia Rinoceronte', type: 'ally', cost: 6, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'pj_a_rino_3', name: 'Guardia Rinoceronte', type: 'ally', cost: 6, strength: 5,
      effect: 'Nessun effetto speciale.' },
    { id: 'pj_a_arc_1', name: 'Arciere Lupo', type: 'ally', cost: 2, strength: 3,
      effect: 'Può partecipare a Scontri in luoghi adiacenti al suo.' },
    { id: 'pj_a_arc_2', name: 'Arciere Lupo', type: 'ally', cost: 2, strength: 3,
      effect: 'Può partecipare a Scontri in luoghi adiacenti al suo.' },
    { id: 'pj_a_arc_3', name: 'Arciere Lupo', type: 'ally', cost: 2, strength: 3,
      effect: 'Può partecipare a Scontri in luoghi adiacenti al suo.' },
    { id: 'pj_a_ton', name: 'Tonto', type: 'ally', cost: 3, strength: 2,
      effect: 'Mentre è in campo: tutti gli altri Alleati nel suo luogo ottengono +1 Forza. Non può partecipare a uno Scontro.' },
    { id: 'pj_a_sce', name: 'Sceriffo di Nottingham', type: 'ally', cost: 4, strength: 4,
      effect: 'All\'inizio del tuo turno: guadagna 1 Potere per ogni Eroe nel Reame. Prima di muovere la pedina, puoi spostare lo Sceriffo in un luogo adiacente.' },
    { id: 'pj_a_bis', name: 'Sir Biss', type: 'ally', cost: 3, strength: 1,
      effect: 'Mentre è nel luogo di Giovanni: puoi eseguire azioni coperte dagli Eroi in quel luogo (una sola volta ciascuna).' },
    { id: 'pj_a_cru', name: 'Crucco', type: 'ally', cost: 3, strength: 4,
      effect: 'Gli altri Alleati nel suo stesso luogo hanno -1 Forza.' },
    // OGGETTI (7)
    { id: 'pj_o_tag_1', name: 'Taglia', type: 'item', cost: 2,
      effect: 'Quando un Eroe viene giocato nel luogo in cui si trova: guadagna 2 Potere.' },
    { id: 'pj_o_tag_2', name: 'Taglia', type: 'item', cost: 2,
      effect: 'Quando un Eroe viene giocato nel luogo in cui si trova: guadagna 2 Potere.' },
    { id: 'pj_o_tag_3', name: 'Taglia', type: 'item', cost: 2,
      effect: 'Quando un Eroe viene giocato nel luogo in cui si trova: guadagna 2 Potere.' },
    { id: 'pj_o_arc_1', name: 'Arco e Frecce', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato non viene scartato dopo uno Scontro.' },
    { id: 'pj_o_arc_2', name: 'Arco e Frecce', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato non viene scartato dopo uno Scontro.' },
    { id: 'pj_o_fre', name: 'Freccia Dorata', type: 'item', cost: 0,
      effect: 'Assegna a un Alleato. Dopo uno Scontro vinto: guadagna 2 Potere. Viene scartata quando l\'Alleato assegnato viene scartato.' },
    { id: 'pj_o_cor', name: 'La Corona di Re Riccardo', type: 'item', cost: 3,
      effect: 'Le carte giocate nel luogo in cui si trova costano 1 Potere in meno.' },
    // EFFETTI (9)
    { id: 'pj_e_tas_1', name: 'Bellissime, Adorabili Tasse', type: 'effect', cost: 1,
      effect: 'Guadagna 1 Potere per ogni Eroe nel tuo Reame. (Non giocabile se Re Riccardo è in campo.)' },
    { id: 'pj_e_tas_2', name: 'Bellissime, Adorabili Tasse', type: 'effect', cost: 1,
      effect: 'Guadagna 1 Potere per ogni Eroe nel tuo Reame. (Non giocabile se Re Riccardo è in campo.)' },
    { id: 'pj_e_tas_3', name: 'Bellissime, Adorabili Tasse', type: 'effect', cost: 1,
      effect: 'Guadagna 1 Potere per ogni Eroe nel tuo Reame. (Non giocabile se Re Riccardo è in campo.)' },
    { id: 'pj_e_imp_1', name: 'Imprigionare', type: 'effect', cost: 2,
      effect: 'Rimuovi un Eroe dal tuo Reame e mettilo nella Prigione (non è sconfitto, ma è fuori gioco finché viene liberato).' },
    { id: 'pj_e_imp_2', name: 'Imprigionare', type: 'effect', cost: 2,
      effect: 'Rimuovi un Eroe dal tuo Reame e mettilo nella Prigione (non è sconfitto, ma è fuori gioco finché viene liberato).' },
    { id: 'pj_e_imp_3', name: 'Imprigionare', type: 'effect', cost: 2,
      effect: 'Rimuovi un Eroe dal tuo Reame e mettilo nella Prigione (non è sconfitto, ma è fuori gioco finché viene liberato).' },
    { id: 'pj_e_trap_1', name: 'Tendere una Trappola', type: 'effect', cost: 1,
      effect: 'Puoi spostare un Alleato in qualsiasi luogo. Poi devi eseguire un\'azione Scontro (obbligatoria).' },
    { id: 'pj_e_trap_2', name: 'Tendere una Trappola', type: 'effect', cost: 1,
      effect: 'Puoi spostare un Alleato in qualsiasi luogo. Poi devi eseguire un\'azione Scontro (obbligatoria).' },
    { id: 'pj_e_int', name: 'Intimidire', type: 'effect', cost: 3,
      effect: 'Tutti gli Alleati in un luogo a tua scelta partecipano a uno Scontro senza essere scartati al termine.' },
    // CONDIZIONI (4)
    { id: 'pj_k_cod_1', name: 'Codardia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥2 Alleati nel Reame. Effetto: gioca un Alleato dalla tua mano gratuitamente.' },
    { id: 'pj_k_cod_2', name: 'Codardia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥2 Alleati nel Reame. Effetto: gioca un Alleato dalla tua mano gratuitamente.' },
    { id: 'pj_k_avi_1', name: 'Avidità', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥6 Potere. Effetto: guadagna Potere pari a quello che ha quell\'avversario (max 6).' },
    { id: 'pj_k_avi_2', name: 'Avidità', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥6 Potere. Effetto: guadagna Potere pari a quello che ha quell\'avversario (max 6).' },
  ],

  fateDeck: [
    // EROI (9)
    { id: 'fpj_robin',   name: 'Robin Hood',   type: 'hero', strength: 4,
      effect: 'Mentre è in campo: i luoghi Foresta di Sherwood e Nottingham non danno Potere a Giovanni. L\'abilità dello Sceriffo di Nottingham è annullata.' },
    { id: 'fpj_riccardo', name: 'Re Riccardo', type: 'hero', strength: 4,
      effect: 'Mentre è in campo: Giovanni non può giocare carte Effetto.' },
    { id: 'fpj_little',  name: 'Little John',  type: 'hero', strength: 3,
      effect: 'All\'inizio di ogni turno di Giovanni: ruba 1 Potere a Giovanni e posizionalo su questa carta. Quando viene sconfitto: tutto il Potere accumulato torna a Giovanni.' },
    { id: 'fpj_canta',   name: 'Cantagallo',   type: 'hero', strength: 1,
      effect: 'Mentre è in campo: tutti gli altri Eroi nel Reame ottengono +1 Forza.' },
    { id: 'fpj_fratac',  name: 'Fra Tac',       type: 'hero', strength: 2,
      effect: 'Quando viene giocato: scarta una Taglia dal luogo in cui viene giocato (se presente).' },
    { id: 'fpj_cocca',   name: 'Lady Cocca',    type: 'hero', strength: 6,
      effect: 'Non può essere rimossa da Imprigionare.' },
    { id: 'fpj_marian',  name: 'Lady Marian',   type: 'hero', strength: 2,
      effect: 'Quando viene sconfitta: posiziona Robin Hood nel luogo in cui si trova (se Robin Hood è nel mazzo o scarti).' },
    { id: 'fpj_saetta',  name: 'Saetta',        type: 'hero', strength: 1,
      effect: 'Può essere sconfitta solo dalle Guardie Rinoceronte.' },
    { id: 'fpj_tobia',   name: 'Tobia',         type: 'hero', strength: 1,
      effect: 'Quando viene sconfitto: rimettilo nel mazzo Fato invece di scartarlo.' },
    // OGGETTI FATO (3)
    { id: 'fpj_tras_1',  name: 'Travestimento',  type: 'fate_item',
      effect: 'Assegna a un Eroe. Quando quell\'Eroe viene sconfitto: Giovanni perde 2 Potere.' },
    { id: 'fpj_tras_2',  name: 'Travestimento',  type: 'fate_item',
      effect: 'Assegna a un Eroe. Quando quell\'Eroe viene sconfitto: Giovanni perde 2 Potere.' },
    { id: 'fpj_tras_3',  name: 'Travestimento',  type: 'fate_item',
      effect: 'Assegna a un Eroe. Quando quell\'Eroe viene sconfitto: Giovanni perde 2 Potere.' },
    // EFFETTI FATO (3)
    { id: 'fpj_rub_1', name: 'Rubare ai Ricchi', type: 'fate_effect',
      effect: 'Scegli un Eroe nel Reame di Giovanni. Giovanni perde 2 Potere; quel Potere viene messo sull\'Eroe. Quando l\'Eroe viene sconfitto: tutto il Potere sull\'Eroe torna a Giovanni.' },
    { id: 'fpj_rub_2', name: 'Rubare ai Ricchi', type: 'fate_effect',
      effect: 'Scegli un Eroe nel Reame di Giovanni. Giovanni perde 2 Potere; quel Potere viene messo sull\'Eroe. Quando l\'Eroe viene sconfitto: tutto il Potere sull\'Eroe torna a Giovanni.' },
    { id: 'fpj_rub_3', name: 'Rubare ai Ricchi', type: 'fate_effect',
      effect: 'Scegli un Eroe nel Reame di Giovanni. Giovanni perde 2 Potere; quel Potere viene messo sull\'Eroe. Quando l\'Eroe viene sconfitto: tutto il Potere sull\'Eroe torna a Giovanni.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 6. REGINA DI CUORI  (Alice nel Paese delle Meraviglie)
// Obiettivo: avere un Archetto in ogni luogo + giocare Tirare
//            con successo (costo totale carte rivelate ≥8)
// ═══════════════════════════════════════════════════════════
const queen_of_hearts = {
  id: 'queen_of_hearts',
  name: 'Regina di Cuori',
  title: 'La Regina di Cuori',
  movie: 'Alice nel Paese delle Meraviglie',
  color: '#8B0000', colorLight: '#CC2222', colorDark: '#5C0000', textColor: '#FFD5D5',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Avere un Archetto in ogni luogo, poi giocare Tirare con successo (costo totale delle 5 carte rivelate ≥8).',
  winConditionId: 'wicket_all_locations',

  locations: [
    {
      id: 'giardino', name: 'Il Giardino', index: 0,
      actions: [
        { type: 'discard' },
        { type: 'move' },
        { type: 'gain_power', value: 2 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'labirinto_siepi', name: 'Il Labirinto di Siepi', index: 1,
      actions: [
        { type: 'play_card' },
        { type: 'activate' },
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
      ],
    },
    {
      id: 'foresta_tulgey', name: 'La Foresta di Tulgey', index: 2,
      actions: [
        { type: 'fate' },
        { type: 'play_card' },
        { type: 'discard' },
        { type: 'vanquish' },
      ],
    },
    {
      id: 'casa_bianconiglio', name: 'La Casa del Bianconiglio', index: 3,
      actions: [
        { type: 'play_card' },
        { type: 'gain_power', value: 1 },
        { type: 'activate' },
        { type: 'fate' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI - GUARDIE DI CARTA (8) + Il Re (1) + Pinco Panco e Panco Pinco (1)
    { id: 'qh_a_fio_1', name: 'Guardia di Carta: Fiori', type: 'ally', cost: 2, strength: 2,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto (Forza 2 come Archetto). Fa parte della condizione di vittoria.' },
    { id: 'qh_a_fio_2', name: 'Guardia di Carta: Fiori', type: 'ally', cost: 2, strength: 2,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto. Fa parte della condizione di vittoria.' },
    { id: 'qh_a_qua_1', name: 'Guardia di Carta: Quadri', type: 'ally', cost: 2, strength: 2,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto. Fa parte della condizione di vittoria.' },
    { id: 'qh_a_qua_2', name: 'Guardia di Carta: Quadri', type: 'ally', cost: 2, strength: 2,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto. Fa parte della condizione di vittoria.' },
    { id: 'qh_a_cuo_1', name: 'Guardia di Carta: Cuori', type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto (Forza 3). Fa parte della condizione di vittoria.' },
    { id: 'qh_a_cuo_2', name: 'Guardia di Carta: Cuori', type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto (Forza 3). Fa parte della condizione di vittoria.' },
    { id: 'qh_a_pic_1', name: 'Guardia di Carta: Picche', type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto (Forza 3). Fa parte della condizione di vittoria.' },
    { id: 'qh_a_pic_2', name: 'Guardia di Carta: Picche', type: 'ally', cost: 3, strength: 3,
      effect: 'Attivazione: ruota la carta di 90° → diventa un Archetto (Forza 3). Fa parte della condizione di vittoria.' },
    { id: 'qh_a_re', name: 'Il Re', type: 'ally', cost: 4, strength: 2,
      effect: 'Mentre è in campo: le Guardie di Carta costano 1 Potere in meno.' },
    { id: 'qh_a_pin', name: 'Pinco Panco e Panco Pinco', type: 'ally', cost: 5, strength: 6,
      effect: 'Nessun effetto speciale. Forza molto alta.' },
    // EFFETTI (12)
    { id: 'qh_e_tir_1', name: 'Tirare', type: 'effect', cost: 5,
      effect: 'Condizione di vittoria: devi avere almeno un Archetto in ogni luogo. Poi rivela le prime 5 carte del tuo mazzo: se il costo totale è ≥8, hai vinto! Altrimenti rimetti le carte in fondo al mazzo.' },
    { id: 'qh_e_tir_2', name: 'Tirare', type: 'effect', cost: 5,
      effect: 'Condizione di vittoria: devi avere almeno un Archetto in ogni luogo. Poi rivela le prime 5 carte del tuo mazzo: se il costo totale è ≥8, hai vinto! Altrimenti rimetti le carte in fondo al mazzo.' },
    { id: 'qh_e_tir_3', name: 'Tirare', type: 'effect', cost: 5,
      effect: 'Condizione di vittoria: devi avere almeno un Archetto in ogni luogo. Poi rivela le prime 5 carte del tuo mazzo: se il costo totale è ≥8, hai vinto! Altrimenti rimetti le carte in fondo al mazzo.' },
    { id: 'qh_e_tes_1', name: 'Tagliategli la Testa!', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe nel Reame della Regina (senza usare un\'azione Scontro).' },
    { id: 'qh_e_tes_2', name: 'Tagliategli la Testa!', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe nel Reame della Regina (senza usare un\'azione Scontro).' },
    { id: 'qh_e_tes_3', name: 'Tagliategli la Testa!', type: 'effect', cost: 3,
      effect: 'Sconfiggi qualsiasi Eroe nel Reame della Regina (senza usare un\'azione Scontro).' },
    { id: 'qh_e_ord_1', name: 'Per Ordine della Regina', type: 'effect', cost: 2,
      effect: 'Attiva qualsiasi numero di Guardie di Carta nel tuo Reame trasformandole in Archetti.' },
    { id: 'qh_e_ord_2', name: 'Per Ordine della Regina', type: 'effect', cost: 2,
      effect: 'Attiva qualsiasi numero di Guardie di Carta nel tuo Reame trasformandole in Archetti.' },
    { id: 'qh_e_com_1', name: 'Un Buon Non Compleanno', type: 'effect', cost: 1,
      effect: 'Guadagna 1 Potere per ogni Alleato nel tuo Reame.' },
    { id: 'qh_e_com_2', name: 'Un Buon Non Compleanno', type: 'effect', cost: 1,
      effect: 'Guadagna 1 Potere per ogni Alleato nel tuo Reame.' },
    { id: 'qh_e_pic_1', name: 'Ti Fa Più Piccola', type: 'effect', cost: 2,
      effect: 'Rimpicciolisci un Eroe: ruota la sua carta di 45° → copre solo 1 azione nella riga superiore anziché 2.' },
    { id: 'qh_e_pic_2', name: 'Ti Fa Più Piccola', type: 'effect', cost: 2,
      effect: 'Rimpicciolisci un Eroe: ruota la sua carta di 45° → copre solo 1 azione nella riga superiore anziché 2.' },
    // OGGETTI (4)
    { id: 'qh_o_lan_1', name: 'Lancia', type: 'item', cost: 2,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza (utile per aumentare la Forza degli Archetti).' },
    { id: 'qh_o_lan_2', name: 'Lancia', type: 'item', cost: 2,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'qh_o_lan_3', name: 'Lancia', type: 'item', cost: 2,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'qh_o_oro', name: 'Orologio', type: 'item', cost: 3,
      effect: 'Attivazione: guadagna 2 Potere.' },
    // CONDIZIONI (4)
    { id: 'qh_k_fur_1', name: 'Furia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario sconfigge un Eroe con Forza ≥3 mentre hai almeno 1 Eroe nel Reame. Effetto: guadagna 3 Potere.' },
    { id: 'qh_k_fur_2', name: 'Furia', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario sconfigge un Eroe con Forza ≥3 mentre hai almeno 1 Eroe nel Reame. Effetto: guadagna 3 Potere.' },
    { id: 'qh_k_pro_1', name: 'Processo', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥3 Alleati nel Reame. Effetto: guadagna 1 Potere per ogni Alleato di quell\'avversario.' },
    { id: 'qh_k_pro_2', name: 'Processo', type: 'condition', cost: 0,
      effect: 'Attiva quando: un avversario ha ≥3 Alleati nel Reame. Effetto: guadagna 1 Potere per ogni Alleato di quell\'avversario.' },
  ],

  fateDeck: [
    // EROI (8)
    { id: 'fqh_alice',    name: 'Alice',              type: 'hero', strength: 3,
      effect: 'Mentre è in campo: nessun Alleato (incluse le Guardie di Carta) può essere spostato.' },
    { id: 'fqh_bruca',    name: 'Il Brucaliffo',      type: 'hero', strength: 2,
      effect: 'Mentre è in campo: tutti gli Archetti nel suo luogo hanno Forza -2.' },
    { id: 'fqh_strega',   name: 'Lo Stregatto',       type: 'hero', strength: 2,
      effect: 'Attivazione: converte un Archetto nel suo luogo in Guardia di Carta (rimuove l\'effetto Archetto).' },
    { id: 'fqh_libec',    name: 'Capitan Libeccio',   type: 'hero', strength: 3,
      effect: 'Mentre è in campo: la Regina non può convertire Guardie di Carta in Archetti nel luogo in cui si trova.' },
    { id: 'fqh_tope',     name: 'Toperchio',          type: 'hero', strength: 1,
      effect: 'Deve essere sconfitto con uno Scontro (non con Tagliategli la Testa). Torna nel mazzo Fato invece di essere scartato.' },
    { id: 'fqh_cappel',   name: 'Il Cappellaio Matto', type: 'hero', strength: 1,
      effect: 'Ottiene +1 Forza per ogni carta Fato giocata contro la Regina di Cuori dall\'inizio della partita.' },
    { id: 'fqh_lepre',    name: 'Il Leprotto Bisestile', type: 'hero', strength: 1,
      effect: 'Mentre il Cappellaio Matto è in campo: entrambi ottengono +1 Forza aggiuntiva.' },
    { id: 'fqh_bianc',    name: 'Il Bianconiglio',    type: 'hero', strength: 2,
      effect: 'Mentre è in campo: tutte le azioni coperte da un Eroe costano 1 Potere in più da eseguire.' },
    // EFFETTI FATO (7)
    { id: 'fqh_tana',     name: 'Nella Tana del Bianconiglio', type: 'fate_effect',
      effect: 'Gioca Alice dal mazzo o scarti nel luogo in cui si trova la Regina. Se Alice è già in campo: scarta una Guardia di Carta o un Archetto dal suo luogo.' },
    { id: 'fqh_tard_1',   name: 'È Tardi! È Tardi!', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe con Forza ≤4 dalla pila degli scarti nel luogo in cui si trova la Regina.' },
    { id: 'fqh_tard_2',   name: 'È Tardi! È Tardi!', type: 'fate_effect',
      effect: 'Rimetti in campo un Eroe con Forza ≤4 dalla pila degli scarti nel luogo in cui si trova la Regina.' },
    { id: 'fqh_gran_1',   name: 'Ti Fa Più Grande',  type: 'fate_effect',
      effect: 'Ingrandisci un Eroe: ruota la carta di 90° → copre 1 azione nella riga superiore del suo luogo E 1 azione nella riga superiore di un luogo adiacente.' },
    { id: 'fqh_gran_2',   name: 'Ti Fa Più Grande',  type: 'fate_effect',
      effect: 'Ingrandisci un Eroe: ruota la carta di 90° → copre 1 azione nella riga superiore del suo luogo E 1 azione nella riga superiore di un luogo adiacente.' },
    { id: 'fqh_palm_1',   name: 'Palmipedoni',       type: 'fate_effect',
      effect: 'Sposta qualsiasi numero di Alleati e/o Eroi nel Reame della Regina in qualsiasi luogo.' },
    { id: 'fqh_palm_2',   name: 'Palmipedoni',       type: 'fate_effect',
      effect: 'Sposta qualsiasi numero di Alleati e/o Eroi nel Reame della Regina in qualsiasi luogo.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// ESPORTAZIONI
// ═══════════════════════════════════════════════════════════
export const VILLAINS = {
  maleficent:      malefica,
  jafar:           jafar,
  hook:            hook,
  ursula:          ursula,
  prince_john:     prince_john,
  queen_of_hearts: queen_of_hearts,
}

export const VILLAIN_LIST = Object.values(VILLAINS)
