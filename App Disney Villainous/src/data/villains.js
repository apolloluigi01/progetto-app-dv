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
        { type: 'move' },
        { type: 'play_card' },
        { type: 'gain_power', value: 1 },
        { type: 'fate' },
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
      effect: 'Gli Eroi in questo Luogo ottengono -2 Forza. Scarta questa Maledizione quando un Alleato viene giocato in questo Luogo.' },
    { id: 'mal_c_son_2', name: 'Sonno Senza Sogni', type: 'curse', cost: 3,
      effect: 'Gli Eroi in questo Luogo ottengono -2 Forza. Scarta questa Maledizione quando un Alleato viene giocato in questo Luogo.' },
    { id: 'mal_c_roi_1', name: 'Foresta di Rovi', type: 'curse', cost: 2,
      effect: 'Gli Eroi devono avere Forza 4 o più per essere giocati in questo Luogo. Scarta questa Maledizione quando un Eroe viene giocato qui.' },
    { id: 'mal_c_roi_2', name: 'Foresta di Rovi', type: 'curse', cost: 2,
      effect: 'Gli Eroi devono avere Forza 4 o più per essere giocati in questo Luogo. Scarta questa Maledizione quando un Eroe viene giocato qui.' },
    { id: 'mal_c_roi_3', name: 'Foresta di Rovi', type: 'curse', cost: 2,
      effect: 'Gli Eroi devono avere Forza 4 o più per essere giocati in questo Luogo. Scarta questa Maledizione quando un Eroe viene giocato qui.' },
    { id: 'mal_c_fuo_1', name: 'Fuoco Verde', type: 'curse', cost: 3,
      effect: 'Gli Eroi non possono essere giocati in questo Luogo. Scarta questa Maledizione se Malefica si muove in questo Luogo.' },
    { id: 'mal_c_fuo_2', name: 'Fuoco Verde', type: 'curse', cost: 3,
      effect: 'Gli Eroi non possono essere giocati in questo Luogo. Scarta questa Maledizione se Malefica si muove in questo Luogo.' },
    { id: 'mal_c_fuo_3', name: 'Fuoco Verde', type: 'curse', cost: 3,
      effect: 'Gli Eroi non possono essere giocati in questo Luogo. Scarta questa Maledizione se Malefica si muove in questo Luogo.' },
    // ALLEATI (10)
    { id: 'mal_a_cor', name: 'Corvo', type: 'ally', cost: 3, strength: 1,
      effect: 'Prima che Malefica si muova, puoi muovere il Corvo in un Luogo qualsiasi ed eseguire un\'azione disponibile nel suo nuovo Luogo. Il Corvo non può eseguire azioni Fato.' },
    { id: 'mal_a_gra_1', name: 'Scagnozzo Gracchiante', type: 'ally', cost: 1, strength: 1,
      effect: 'Ottiene +1 Forza per ogni Eroe nel suo Luogo.' },
    { id: 'mal_a_gra_2', name: 'Scagnozzo Gracchiante', type: 'ally', cost: 1, strength: 1,
      effect: 'Ottiene +1 Forza per ogni Eroe nel suo Luogo.' },
    { id: 'mal_a_gra_3', name: 'Scagnozzo Gracchiante', type: 'ally', cost: 1, strength: 1,
      effect: 'Ottiene +1 Forza per ogni Eroe nel suo Luogo.' },
    { id: 'mal_a_sel_1', name: 'Scagnozzo Selvaggio', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'mal_a_sel_2', name: 'Scagnozzo Selvaggio', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'mal_a_sel_3', name: 'Scagnozzo Selvaggio', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'mal_a_sin_1', name: 'Scagnozzo Sinistro', type: 'ally', cost: 2, strength: 3,
      effect: 'Ottiene +1 Forza se ci sono Maledizioni nel suo Luogo.' },
    { id: 'mal_a_sin_2', name: 'Scagnozzo Sinistro', type: 'ally', cost: 2, strength: 3,
      effect: 'Ottiene +1 Forza se ci sono Maledizioni nel suo Luogo.' },
    { id: 'mal_a_sin_3', name: 'Scagnozzo Sinistro', type: 'ally', cost: 2, strength: 3,
      effect: 'Ottiene +1 Forza se ci sono Maledizioni nel suo Luogo.' },
    // OGGETTI (2)
    { id: 'mal_o_arc', name: 'Arcolaio', type: 'item', cost: 1,
      effect: 'Se un Eroe viene sconfitto in questo Luogo, ottieni Potere pari alla Forza ATTUALE dell\'Eroe meno 1 (considera modificatori come Sonno Senza Sogni -2).' },
    { id: 'mal_o_bas', name: 'Bastone', type: 'item', cost: 1,
      effect: 'Se Malefica è in questo Luogo, il costo per giocare un Effetto o una Maledizione è ridotto di 1 Potere.' },
    // EFFETTI (6)
    { id: 'mal_e_dra_1', name: 'Forma di Drago', type: 'effect', cost: 3,
      effect: 'Sconfiggi un Eroe con Forza 3 o inferiore. Se un\'azione Fato ti colpisce prima del tuo prossimo turno, ottieni 3 Potere.' },
    { id: 'mal_e_dra_2', name: 'Forma di Drago', type: 'effect', cost: 3,
      effect: 'Sconfiggi un Eroe con Forza 3 o inferiore. Se un\'azione Fato ti colpisce prima del tuo prossimo turno, ottieni 3 Potere.' },
    { id: 'mal_e_dra_3', name: 'Forma di Drago', type: 'effect', cost: 3,
      effect: 'Sconfiggi un Eroe con Forza 3 o inferiore. Se un\'azione Fato ti colpisce prima del tuo prossimo turno, ottieni 3 Potere.' },
    { id: 'mal_e_sva_1', name: 'Svanire', type: 'effect', cost: 0,
      effect: 'Al tuo prossimo turno, Malefica non è obbligata a spostarsi in un nuovo Luogo.' },
    { id: 'mal_e_sva_2', name: 'Svanire', type: 'effect', cost: 0,
      effect: 'Al tuo prossimo turno, Malefica non è obbligata a spostarsi in un nuovo Luogo.' },
    { id: 'mal_e_sva_3', name: 'Svanire', type: 'effect', cost: 0,
      effect: 'Al tuo prossimo turno, Malefica non è obbligata a spostarsi in un nuovo Luogo.' },
    // CONDIZIONI (4)
    { id: 'mal_k_tir_1', name: 'Tirannia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Tirannia. Pesca tre carte, poi scarta due carte a tua scelta (incluse quelle già in mano).' },
    { id: 'mal_k_tir_2', name: 'Tirannia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Tirannia. Pesca tre carte, poi scarta due carte a tua scelta (incluse quelle già in mano).' },
    { id: 'mal_k_mal_1', name: 'Malignità', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Malignità. Sconfiggi un Eroe con Forza 4 o inferiore.' },
    { id: 'mal_k_mal_2', name: 'Malignità', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Malignità. Sconfiggi un Eroe con Forza 4 o inferiore.' },
  ],

  // ── Mazzo Fato (15 carte) ─────────────────────────────────
  fateDeck: [
    // EROI (10)
    { id: 'fmal_aurora',   name: 'Aurora',           type: 'hero', strength: 4,
      effect: 'Quando Aurora viene giocata, rivela la prima carta del Mazzo Fato di Malefica. Se è un Eroe, giocalo. Altrimenti, rimettila in cima al mazzo.' },
    { id: 'fmal_fauna',    name: 'Fauna',             type: 'hero', strength: 2,
      effect: 'Quando Fauna viene giocata, scarta il Sonno Senza Sogni nel suo Luogo (se presente).' },
    { id: 'fmal_flora',    name: 'Flora',             type: 'hero', strength: 3,
      effect: 'Quando Flora viene giocata, Malefica deve rivelare la sua mano. Finché Flora non viene sconfitta, Malefica gioca a carte scoperte.' },
    { id: 'fmal_serena',   name: 'Serena',            type: 'hero', strength: 4,
      effect: 'Le Maledizioni non possono essere giocate nel Luogo di Serena.' },
    { id: 'fmal_stefano',  name: 'Re Stefano',        type: 'hero', strength: 4,
      effect: 'Quando Re Stefano viene giocato, puoi muovere Malefica in un Luogo qualsiasi.' },
    { id: 'fmal_uberto',   name: 'Re Uberto',         type: 'hero', strength: 3,
      effect: 'Quando Re Uberto viene giocato, puoi spostare un Alleato da un Luogo adiacente nel suo Luogo.' },
    { id: 'fmal_filippo',  name: 'Principe Filippo',  type: 'hero', strength: 5,
      effect: 'Quando il Principe Filippo viene giocato, puoi scartare tutti gli Alleati presenti nel suo stesso Luogo.' },
    { id: 'fmal_guard_1',  name: 'Guardie',           type: 'hero', strength: 2,
      effect: 'Per sconfiggere le Guardie con un\'azione Sconfiggere, bisogna usare almeno due Alleati.' },
    { id: 'fmal_guard_2',  name: 'Guardie',           type: 'hero', strength: 2,
      effect: 'Per sconfiggere le Guardie con un\'azione Sconfiggere, bisogna usare almeno due Alleati.' },
    { id: 'fmal_guard_3',  name: 'Guardie',           type: 'hero', strength: 2,
      effect: 'Per sconfiggere le Guardie con un\'azione Sconfiggere, bisogna usare almeno due Alleati.' },
    // OGGETTI FATO (3)
    { id: 'fmal_spada_1',  name: 'Spada della Verità', type: 'fate_item',
      effect: 'Assegna a un Eroe senza altri Oggetti assegnati. Quell\'Eroe ottiene +2 Forza. Il costo per giocare una Maledizione in questo Luogo aumenta di 2 Potere.' },
    { id: 'fmal_spada_2',  name: 'Spada della Verità', type: 'fate_item',
      effect: 'Assegna a un Eroe senza altri Oggetti assegnati. Quell\'Eroe ottiene +2 Forza. Il costo per giocare una Maledizione in questo Luogo aumenta di 2 Potere.' },
    { id: 'fmal_spada_3',  name: 'Spada della Verità', type: 'fate_item',
      effect: 'Assegna a un Eroe senza altri Oggetti assegnati. Quell\'Eroe ottiene +2 Forza. Il costo per giocare una Maledizione in questo Luogo aumenta di 2 Potere.' },
    // EFFETTI FATO (2)
    { id: 'fmal_sogno_1',  name: 'C\'era una Volta in un Sogno', type: 'fate_effect',
      effect: 'Scarta una Maledizione da un Luogo del Reame di Malefica che contiene un Eroe.' },
    { id: 'fmal_sogno_2',  name: 'C\'era una Volta in un Sogno', type: 'fate_effect',
      effect: 'Scarta una Maledizione da un Luogo del Reame di Malefica che contiene un Eroe.' },
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
    { id: 'jaf_o_lam', name: 'Lampada Magica', type: 'item', cost: 4,
      effect: 'Può essere giocata solo nella Caverna delle Meraviglie. Quando viene giocata, trova il Genio e giocalo nella Caverna delle Meraviglie.' },
    { id: 'jaf_o_amu', name: 'Amuleto dello Scarabeo', type: 'item', cost: 3,
      effect: 'Quando viene giocato, sblocca la Caverna delle Meraviglie. Alla fine di ogni turno, pesca fino ad avere cinque carte in mano.' },
    { id: 'jaf_o_bas', name: 'Bastone del Serpente', type: 'item', cost: 2,
      effect: '[Attiva]: Paga 1 Potere. Prendi una carta Ipnotizzare dalla tua pila degli scarti e mettila in mano.' },
    { id: 'jaf_o_cle_1', name: 'Clessidra Gigante', type: 'item', cost: 1,
      effect: '[Attiva]: Gli Eroi in questo Luogo ottengono -2 Forza fino alla fine del turno.' },
    { id: 'jaf_o_cle_2', name: 'Clessidra Gigante', type: 'item', cost: 1,
      effect: '[Attiva]: Gli Eroi in questo Luogo ottengono -2 Forza fino alla fine del turno.' },
    { id: 'jaf_o_sci_1', name: 'Scimitarra', type: 'item', cost: 0,
      effect: 'Quando la Scimitarra viene giocata, assegnala a un Alleato. Quell\'Alleato ottiene +1 Forza.' },
    { id: 'jaf_o_sci_2', name: 'Scimitarra', type: 'item', cost: 0,
      effect: 'Quando la Scimitarra viene giocata, assegnala a un Alleato. Quell\'Alleato ottiene +1 Forza.' },
    { id: 'jaf_o_sci_3', name: 'Scimitarra', type: 'item', cost: 0,
      effect: 'Quando la Scimitarra viene giocata, assegnala a un Alleato. Quell\'Alleato ottiene +1 Forza.' },
    // EFFETTI (12)
    { id: 'jaf_e_sac_1', name: 'Sacrificio Necessario', type: 'effect', cost: 0,
      effect: 'Scarta un Alleato o un Oggetto sotto il tuo controllo e ottieni 3 Potere.' },
    { id: 'jaf_e_sac_2', name: 'Sacrificio Necessario', type: 'effect', cost: 0,
      effect: 'Scarta un Alleato o un Oggetto sotto il tuo controllo e ottieni 3 Potere.' },
    { id: 'jaf_e_sac_3', name: 'Sacrificio Necessario', type: 'effect', cost: 0,
      effect: 'Scarta un Alleato o un Oggetto sotto il tuo controllo e ottieni 3 Potere.' },
    { id: 'jaf_e_chi_1', name: 'Chiaroveggenza', type: 'effect', cost: 1,
      effect: 'Scegli Oggetto o Alleato. Rivela carte dalla cima del tuo mazzo finché non riveli una carta del tipo scelto. Mettila in mano e scarta il resto.' },
    { id: 'jaf_e_chi_2', name: 'Chiaroveggenza', type: 'effect', cost: 1,
      effect: 'Scegli Oggetto o Alleato. Rivela carte dalla cima del tuo mazzo finché non riveli una carta del tipo scelto. Mettila in mano e scarta il resto.' },
    { id: 'jaf_e_chi_3', name: 'Chiaroveggenza', type: 'effect', cost: 1,
      effect: 'Scegli Oggetto o Alleato. Rivela carte dalla cima del tuo mazzo finché non riveli una carta del tipo scelto. Mettila in mano e scarta il resto.' },
    { id: 'jaf_e_ser_1', name: 'Ah, Sarei un Serpente?', type: 'effect', cost: 2,
      effect: 'Sconfiggi un Eroe con Forza 4 o inferiore nel Luogo di Jafar.' },
    { id: 'jaf_e_ser_2', name: 'Ah, Sarei un Serpente?', type: 'effect', cost: 2,
      effect: 'Sconfiggi un Eroe con Forza 4 o inferiore nel Luogo di Jafar.' },
    { id: 'jaf_e_ipn_1', name: 'Ipnotizzare', type: 'effect', cost: 0,
      effect: 'Sconfiggi un Eroe e spostalo in fondo alla tua plancia. Quell\'Eroe è sotto il tuo controllo e trattato come un Alleato con la stessa Forza. Ignora la sua abilità. Il costo per giocare Ipnotizzare è pari alla Forza dell\'Eroe.' },
    { id: 'jaf_e_ipn_2', name: 'Ipnotizzare', type: 'effect', cost: 0,
      effect: 'Sconfiggi un Eroe e spostalo in fondo alla tua plancia. Quell\'Eroe è sotto il tuo controllo e trattato come un Alleato con la stessa Forza. Ignora la sua abilità. Il costo per giocare Ipnotizzare è pari alla Forza dell\'Eroe.' },
    { id: 'jaf_e_str_1', name: 'Potere dello Stregone', type: 'effect', cost: 2,
      effect: 'Puoi muovere un Eroe in un qualsiasi Luogo sbloccato. Puoi muovere un Alleato in un qualsiasi Luogo sbloccato.' },
    { id: 'jaf_e_str_2', name: 'Potere dello Stregone', type: 'effect', cost: 2,
      effect: 'Puoi muovere un Eroe in un qualsiasi Luogo sbloccato. Puoi muovere un Alleato in un qualsiasi Luogo sbloccato.' },
    // ALLEATI (6)
    { id: 'jaf_a_iago', name: 'Iago', type: 'ally', cost: 1, strength: 1,
      effect: '[Attiva]: Paga 1 Potere. Muovi Iago e un Oggetto non assegnato presente nel suo Luogo in un Luogo adiacente sbloccato.' },
    { id: 'jaf_a_raz', name: 'Razoul', type: 'ally', cost: 3, strength: 3,
      effect: 'Il costo per giocare Alleati nel Luogo di Razoul è ridotto di 1 Potere.' },
    { id: 'jaf_a_gaz', name: 'Gazeem', type: 'ally', cost: 2, strength: 2,
      effect: 'Quando Gazeem viene scartato dal tuo Reame, puoi scegliere un Oggetto dalla pila degli scarti e metterlo in mano.' },
    { id: 'jaf_a_gua_1', name: 'Guardia di Palazzo', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'jaf_a_gua_2', name: 'Guardia di Palazzo', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'jaf_a_gua_3', name: 'Guardia di Palazzo', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessuna abilità aggiuntiva.' },
    // CONDIZIONI (4)
    { id: 'jaf_k_ing_1', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha due o più Oggetti nel Reame, puoi giocare Inganno. Rivela e gioca la prima carta del suo Mazzo Fato.' },
    { id: 'jaf_k_ing_2', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha due o più Oggetti nel Reame, puoi giocare Inganno. Rivela e gioca la prima carta del suo Mazzo Fato.' },
    { id: 'jaf_k_man_1', name: 'Manipolazione', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Manipolazione. Scegli una carta dalla tua pila degli scarti e mettila in mano.' },
    { id: 'jaf_k_man_2', name: 'Manipolazione', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Manipolazione. Scegli una carta dalla tua pila degli scarti e mettila in mano.' },
  ],

  fateDeck: [
    // EROI (7)
    { id: 'fjaf_aladdin', name: 'Aladdin', type: 'hero', strength: 4,
      effect: 'Quando Aladdin viene giocato, puoi scegliere un Oggetto nel suo Luogo e assegnarlo a lui. Jafar non può usare quell\'Oggetto. Quando Aladdin viene sconfitto, l\'Oggetto torna a Jafar nello stesso Luogo.' },
    { id: 'fjaf_genio', name: 'Genio', type: 'hero', strength: 6,
      effect: 'Il Genio ottiene +2 Forza se la Lampada Magica si trova nel suo Luogo.' },
    { id: 'fjaf_tappeto', name: 'Tappeto', type: 'hero', strength: 2,
      effect: 'Jafar deve sconfiggere Tappeto prima di sconfiggere altri Eroi.' },
    { id: 'fjaf_rajah', name: 'Rajah', type: 'hero', strength: 4,
      effect: 'Rajah ottiene +2 Forza se la Principessa Jasmine è nel Reame di Jafar.' },
    { id: 'fjaf_abu', name: 'Abu', type: 'hero', strength: 2,
      effect: 'Quando Abu viene giocato, puoi scegliere un Oggetto nel suo Luogo e assegnarlo a lui. Jafar non può usarlo. Quando Abu viene sconfitto, l\'Oggetto torna a Jafar nello stesso Luogo.' },
    { id: 'fjaf_jasmine', name: 'Principessa Jasmine', type: 'hero', strength: 3,
      effect: 'Quando Jafar pesca carte alla fine di ogni turno, ne pesca una in meno.' },
    { id: 'fjaf_sultano', name: 'Il Sultano', type: 'hero', strength: 2,
      effect: 'Le Guardie di Palazzo non possono essere usate per sconfiggere il Sultano.' },
    // OGGETTI FATO (3)
    { id: 'fjaf_des_1', name: 'Desiderio', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fjaf_des_2', name: 'Desiderio', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fjaf_des_3', name: 'Desiderio', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    // EFFETTI FATO (5)
    { id: 'fjaf_bru_1', name: 'Brutto Colpo', type: 'fate_effect',
      effect: 'Scarta un Alleato con Forza 3 o inferiore dal Reame di Jafar.' },
    { id: 'fjaf_bru_2', name: 'Brutto Colpo', type: 'fate_effect',
      effect: 'Scarta un Alleato con Forza 3 o inferiore dal Reame di Jafar.' },
    { id: 'fjaf_man_1', name: 'C\'è Mancato Poco', type: 'fate_effect',
      effect: 'Scegli e gioca un Eroe dalla pila degli scarti del Mazzo Fato di Jafar.' },
    { id: 'fjaf_man_2', name: 'C\'è Mancato Poco', type: 'fate_effect',
      effect: 'Scegli e gioca un Eroe dalla pila degli scarti del Mazzo Fato di Jafar.' },
    { id: 'fjaf_tra', name: 'Tradimento', type: 'fate_effect',
      effect: 'Jafar perde fino a 2 Potere.' },
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
      effect: 'Durante un\'azione Sconfiggere, può essere usata per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente sbloccato.' },
    { id: 'hk_a_ban_2', name: 'Banda d\'Arrembaggio', type: 'ally', cost: 2, strength: 2,
      effect: 'Durante un\'azione Sconfiggere, può essere usata per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente sbloccato.' },
    { id: 'hk_a_ban_3', name: 'Banda d\'Arrembaggio', type: 'ally', cost: 2, strength: 2,
      effect: 'Durante un\'azione Sconfiggere, può essere usata per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente sbloccato.' },
    { id: 'hk_a_sma_1', name: 'Smargiasso', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'hk_a_sma_2', name: 'Smargiasso', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'hk_a_sma_3', name: 'Smargiasso', type: 'ally', cost: 1, strength: 2,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'hk_a_bru_1', name: 'Bruto Pirata', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'hk_a_bru_2', name: 'Bruto Pirata', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'hk_a_sta', name: 'Mr. Starkey', type: 'ally', cost: 2, strength: 2,
      effect: 'Quando Mr. Starkey viene giocato, puoi muovere un Eroe dal suo Luogo a un Luogo adiacente sbloccato.' },
    { id: 'hk_a_spu', name: 'Spugna', type: 'ally', cost: 2, strength: 2,
      effect: 'Spugna ottiene +2 Forza se si trova alla Jolly Roger.' },
    // OGGETTI (7)
    { id: 'hk_o_can_1', name: 'Cannone', type: 'item', cost: 2,
      effect: 'Questo Luogo ottiene: [azione Sconfiggere].' },
    { id: 'hk_o_can_2', name: 'Cannone', type: 'item', cost: 2,
      effect: 'Questo Luogo ottiene: [azione Sconfiggere].' },
    { id: 'hk_o_sci_1', name: 'Sciabola', type: 'item', cost: 1,
      effect: 'Quando la Sciabola viene giocata, assegnala a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'hk_o_sci_2', name: 'Sciabola', type: 'item', cost: 1,
      effect: 'Quando la Sciabola viene giocata, assegnala a un Alleato. Quell\'Alleato ottiene +2 Forza.' },
    { id: 'hk_o_unc_1', name: 'Uncino da Cerimonia', type: 'item', cost: 2,
      effect: 'Questo Luogo ottiene: [Ottieni 1 Potere].' },
    { id: 'hk_o_unc_2', name: 'Uncino da Cerimonia', type: 'item', cost: 2,
      effect: 'Questo Luogo ottiene: [Ottieni 1 Potere].' },
    { id: 'hk_o_dis', name: 'Dispositivo Ingegnoso', type: 'item', cost: 2,
      effect: 'Questo Luogo ottiene due azioni Muovere un Eroe.' },
    { id: 'hk_o_map', name: 'Mappa dell\'Isola Che Non C\'è', type: 'item', cost: 4,
      effect: 'Quando viene giocata, sblocca l\'Albero dell\'Impiccato. Quando giochi un Oggetto, puoi scartare la Mappa invece di pagarne il Costo.' },
    // EFFETTI (8)
    { id: 'hk_e_deg_1', name: 'Degno Avversario', type: 'effect', cost: 0,
      effect: 'Ottieni 2 Potere. Rivela carte dalla cima del tuo Mazzo Fato finché non riveli un Eroe. Gioca quell\'Eroe e scarta le altre.' },
    { id: 'hk_e_deg_2', name: 'Degno Avversario', type: 'effect', cost: 0,
      effect: 'Ottieni 2 Potere. Rivela carte dalla cima del tuo Mazzo Fato finché non riveli un Eroe. Gioca quell\'Eroe e scarta le altre.' },
    { id: 'hk_e_deg_3', name: 'Degno Avversario', type: 'effect', cost: 0,
      effect: 'Ottieni 2 Potere. Rivela carte dalla cima del tuo Mazzo Fato finché non riveli un Eroe. Gioca quell\'Eroe e scarta le altre.' },
    { id: 'hk_e_spa_1', name: 'Spaventare', type: 'effect', cost: 1,
      effect: 'Guarda le prime due carte del tuo Mazzo Fato. Scartale entrambe oppure rimettile in cima nell\'ordine che preferisci.' },
    { id: 'hk_e_spa_2', name: 'Spaventare', type: 'effect', cost: 1,
      effect: 'Guarda le prime due carte del tuo Mazzo Fato. Scartale entrambe oppure rimettile in cima nell\'ordine che preferisci.' },
    { id: 'hk_e_spa_3', name: 'Spaventare', type: 'effect', cost: 1,
      effect: 'Guarda le prime due carte del tuo Mazzo Fato. Scartale entrambe oppure rimettile in cima nell\'ordine che preferisci.' },
    { id: 'hk_e_sig_1', name: 'Signorsì Signore!', type: 'effect', cost: 1,
      effect: 'Muovi un Alleato in un Luogo adiacente sbloccato. Quell\'Alleato ottiene +2 Forza fino alla fine del turno.' },
    { id: 'hk_e_sig_2', name: 'Signorsì Signore!', type: 'effect', cost: 1,
      effect: 'Muovi un Alleato in un Luogo adiacente sbloccato. Quell\'Alleato ottiene +2 Forza fino alla fine del turno.' },
    // CONDIZIONI (4)
    { id: 'hk_k_ast_1', name: 'Astuzia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha nel Reame un Alleato con Forza 4 o più, puoi giocare Astuzia. Gioca gratis un Alleato dalla tua mano.' },
    { id: 'hk_k_ast_2', name: 'Astuzia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha nel Reame un Alleato con Forza 4 o più, puoi giocare Astuzia. Gioca gratis un Alleato dalla tua mano.' },
    { id: 'hk_k_oss_1', name: 'Ossessione', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Ossessione. Rivela carte dalla cima del Mazzo Fato finché non riveli un Eroe. Gioca o scarta quell\'Eroe. Scarta le altre.' },
    { id: 'hk_k_oss_2', name: 'Ossessione', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Ossessione. Rivela carte dalla cima del Mazzo Fato finché non riveli un Eroe. Gioca o scarta quell\'Eroe. Scarta le altre.' },
  ],

  fateDeck: [
    // EROI (8)
    { id: 'fhk_peter', name: 'Peter Pan', type: 'hero', strength: 8,
      effect: 'Quando Peter Pan viene rivelato, DEVE essere giocato IMMEDIATAMENTE all\'Albero dell\'Impiccato, anche se bloccato. Ogni altra carta Fato rivelata durante questa azione viene scartata.' },
    { id: 'fhk_gianni', name: 'Gianni', type: 'hero', strength: 2,
      effect: 'Gianni ottiene +1 Forza se ha almeno un Oggetto assegnato.' },
    { id: 'fhk_bimbi_1', name: 'I Bimbi Sperduti', type: 'hero', strength: 4,
      effect: 'Per sconfiggere i Bimbi Sperduti con un\'azione Sconfiggere, bisogna usare almeno due Alleati.' },
    { id: 'fhk_bimbi_2', name: 'I Bimbi Sperduti', type: 'hero', strength: 4,
      effect: 'Per sconfiggere i Bimbi Sperduti con un\'azione Sconfiggere, bisogna usare almeno due Alleati.' },
    { id: 'fhk_michele', name: 'Michele', type: 'hero', strength: 1,
      effect: 'Michele ottiene +1 Forza per ogni Luogo del Reame di Capitan Uncino che contiene un Eroe, incluso il suo.' },
    { id: 'fhk_tictac', name: 'Tic Tac', type: 'hero', strength: 5,
      effect: 'Se Capitan Uncino si muove nel Luogo di Tic Tac, deve scartare immediatamente tutta la sua mano.' },
    { id: 'fhk_trilli', name: 'Trilli', type: 'hero', strength: 2,
      effect: 'Quando Trilli viene giocata, puoi scartare un Alleato dal suo Luogo.' },
    { id: 'fhk_wendy', name: 'Wendy', type: 'hero', strength: 3,
      effect: 'Tutti gli altri Eroi nel Reame di Capitan Uncino ottengono +1 Forza.' },
    // OGGETTI FATO (5)
    { id: 'fhk_polv_1', name: 'Polvere di Fata', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fhk_polv_2', name: 'Polvere di Fata', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fhk_polv_3', name: 'Polvere di Fata', type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe ottiene +2 Forza.' },
    { id: 'fhk_sch_1', name: 'Schernire', type: 'fate_item',
      effect: 'Assegna a un Eroe. Capitan Uncino deve sconfiggere gli Eroi con Schernire prima degli altri Eroi.' },
    { id: 'fhk_sch_2', name: 'Schernire', type: 'fate_item',
      effect: 'Assegna a un Eroe. Capitan Uncino deve sconfiggere gli Eroi con Schernire prima degli altri Eroi.' },
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
      effect: 'Assegna a un Eroe che non sia alla Riva. Quell\'Eroe è sconfitto se viene spostato alla Riva.' },
    { id: 'urs_o_con_2', name: 'Contratto Vincolante (Riva)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe che non sia alla Riva. Quell\'Eroe è sconfitto se viene spostato alla Riva.' },
    { id: 'urs_o_con_3', name: 'Contratto Vincolante (Nave di Eric)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe che non sia alla Nave di Eric. Quell\'Eroe è sconfitto se viene spostato alla Nave di Eric.' },
    { id: 'urs_o_con_4', name: 'Contratto Vincolante (Nave di Eric)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe che non sia alla Nave di Eric. Quell\'Eroe è sconfitto se viene spostato alla Nave di Eric.' },
    { id: 'urs_o_con_5', name: 'Contratto Vincolante (Covo)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe che non sia al Covo di Ursula. Quell\'Eroe è sconfitto se viene spostato al Covo di Ursula.' },
    { id: 'urs_o_con_6', name: 'Contratto Vincolante (Palazzo)', type: 'item', cost: 2,
      effect: 'Assegna a un Eroe che non sia al Palazzo. Quell\'Eroe è sconfitto se viene spostato al Palazzo.' },
    { id: 'urs_o_cor', name: 'Corona', type: 'item', cost: 4,
      effect: '[Attiva]: Guarda le prime due carte del tuo Mazzo Fato. Scartale entrambe o rimettile in cima nell\'ordine che preferisci.' },
    { id: 'urs_o_tri', name: 'Tridente', type: 'item', cost: 4,
      effect: 'Quando il Tridente viene giocato, trova Re Tritone e giocalo in questo Luogo. Assegnagli il Tridente. Quando Re Tritone viene sconfitto, il Tridente torna a Ursula nello stesso Luogo.' },
    { id: 'urs_o_cal', name: 'Calderone', type: 'item', cost: 1,
      effect: 'Ottieni 1 Potere per ogni Contratto Vincolante nel tuo Reame.' },
    // ALLEATI (2)
    { id: 'urs_a_flo', name: 'Flotsam', type: 'ally', cost: 2, strength: 4,
      effect: 'Muovi un Eroe dal Luogo di Flotsam a un Luogo adiacente non bloccato.' },
    { id: 'urs_a_jet', name: 'Jetsam', type: 'ally', cost: 2, strength: 4,
      effect: 'Muovi un Eroe dal Luogo di Jetsam a un Luogo adiacente non bloccato.' },
    // EFFETTI (14)
    { id: 'urs_e_tra_1', name: 'Trasformazione', type: 'effect', cost: 1,
      effect: 'Muovi il Segnalino Lucchetto dal Palazzo al Covo di Ursula, o viceversa.' },
    { id: 'urs_e_tra_2', name: 'Trasformazione', type: 'effect', cost: 1,
      effect: 'Muovi il Segnalino Lucchetto dal Palazzo al Covo di Ursula, o viceversa.' },
    { id: 'urs_e_tra_3', name: 'Trasformazione', type: 'effect', cost: 1,
      effect: 'Muovi il Segnalino Lucchetto dal Palazzo al Covo di Ursula, o viceversa.' },
    { id: 'urs_e_gig_1', name: 'Diventare Gigantesca', type: 'effect', cost: 1,
      effect: 'Svolgi una delle azioni disponibili in un Luogo adiacente a quello di Ursula, anche se bloccato.' },
    { id: 'urs_e_gig_2', name: 'Diventare Gigantesca', type: 'effect', cost: 1,
      effect: 'Svolgi una delle azioni disponibili in un Luogo adiacente a quello di Ursula, anche se bloccato.' },
    { id: 'urs_e_gig_3', name: 'Diventare Gigantesca', type: 'effect', cost: 1,
      effect: 'Svolgi una delle azioni disponibili in un Luogo adiacente a quello di Ursula, anche se bloccato.' },
    { id: 'urs_e_opp_1', name: 'Opportunista', type: 'effect', cost: 1,
      effect: 'Scegli un Oggetto o un Effetto dalla tua pila degli scarti e aggiungilo alla tua mano.' },
    { id: 'urs_e_opp_2', name: 'Opportunista', type: 'effect', cost: 1,
      effect: 'Scegli un Oggetto o un Effetto dalla tua pila degli scarti e aggiungilo alla tua mano.' },
    { id: 'urs_e_opp_3', name: 'Opportunista', type: 'effect', cost: 1,
      effect: 'Scegli un Oggetto o un Effetto dalla tua pila degli scarti e aggiungilo alla tua mano.' },
    { id: 'urs_e_vor_1', name: 'Vortice', type: 'effect', cost: 1,
      effect: 'Muovi un Eroe in un Luogo sbloccato a tua scelta.' },
    { id: 'urs_e_vor_2', name: 'Vortice', type: 'effect', cost: 1,
      effect: 'Muovi un Eroe in un Luogo sbloccato a tua scelta.' },
    { id: 'urs_e_vor_3', name: 'Vortice', type: 'effect', cost: 1,
      effect: 'Muovi un Eroe in un Luogo sbloccato a tua scelta.' },
    { id: 'urs_e_div_1', name: 'Divinazione', type: 'effect', cost: 1,
      effect: 'Rivela carte dalla cima del tuo mazzo finché non trovi un Contratto Vincolante. Aggiungilo alla tua mano e scarta il resto.' },
    { id: 'urs_e_div_2', name: 'Divinazione', type: 'effect', cost: 1,
      effect: 'Rivela carte dalla cima del tuo mazzo finché non trovi un Contratto Vincolante. Aggiungilo alla tua mano e scarta il resto.' },
    { id: 'urs_e_tri', name: 'Tristi Anime Sole', type: 'effect', cost: 2,
      effect: 'Puoi muovere ogni Eroe in un Luogo adiacente non bloccato.' },
    // CONDIZIONI (4)
    { id: 'urs_k_arr_1', name: 'Arroganza', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o superiore, puoi giocare Arroganza. Pesca tre carte dal mazzo, poi scarta tre carte a scelta dalla tua mano.' },
    { id: 'urs_k_arr_2', name: 'Arroganza', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o superiore, puoi giocare Arroganza. Pesca tre carte dal mazzo, poi scarta tre carte a scelta dalla tua mano.' },
    { id: 'urs_k_ing_1', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha 6 o più Potere, puoi giocare Inganno. Rivela e gioca la prima carta del Mazzo Fato di quel giocatore.' },
    { id: 'urs_k_ing_2', name: 'Inganno', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha 6 o più Potere, puoi giocare Inganno. Rivela e gioca la prima carta del Mazzo Fato di quel giocatore.' },
  ],

  fateDeck: [
    // EROI (8)
    { id: 'furs_ariel',    name: 'Ariel',      type: 'hero', strength: 4,
      effect: 'Quando Ariel viene giocata, puoi muovere un Oggetto non assegnato da un Luogo qualsiasi al suo Luogo. Finché Ariel non viene sconfitta, Ursula non può svolgere l\'azione Muovere un Oggetto o un Alleato.' },
    { id: 'furs_eric',     name: 'Eric',       type: 'hero', strength: 4,
      effect: 'Quando Eric viene giocato, puoi muovere un Eroe in un qualsiasi Luogo non bloccato.' },
    { id: 'furs_flounder', name: 'Flounder',   type: 'hero', strength: 1,
      effect: 'Quando Flounder viene giocato, puoi rimescolare la pila degli scarti di Ursula nel suo Mazzo Cattivo.' },
    { id: 'furs_grimsby',  name: 'Grimsby',    type: 'hero', strength: 3,
      effect: 'Quando Grimsby viene giocato, puoi spostare il Segnalino Lucchetto al Covo di Ursula oppure al Palazzo.' },
    { id: 'furs_tritone',  name: 'Re Tritone',  type: 'hero', strength: 6,
      effect: 'Il costo per giocare i Contratti Vincolanti o gli Effetti che hanno come bersaglio Re Tritone aumenta di 1 Potere.' },
    { id: 'furs_max',      name: 'Max',        type: 'hero', strength: 3,
      effect: 'Se Max viene giocato nel Luogo di Ursula, puoi muovere Ursula in un qualsiasi Luogo non bloccato.' },
    { id: 'furs_scuttle',  name: 'Scuttle',    type: 'hero', strength: 2,
      effect: 'Quando Scuttle viene giocato, puoi scegliere un Oggetto dalla pila degli scarti del Mazzo Fato di Ursula e assegnarlo a Scuttle.' },
    { id: 'furs_sebas',    name: 'Sebastian',  type: 'hero', strength: 2,
      effect: 'Quando Sebastian viene giocato, puoi scegliere un Contratto Vincolante assegnato a un Eroe in un Luogo non bloccato e riassegnarlo a Sebastian.' },
    // OGGETTI FATO (4)
    { id: 'furs_arr_1', name: 'Arricciaspiccia', type: 'fate_item',
      effect: 'Assegna a un Eroe. Ogni volta che Ursula si muove in questo Luogo, perde 1 Potere.' },
    { id: 'furs_arr_2', name: 'Arricciaspiccia', type: 'fate_item',
      effect: 'Assegna a un Eroe. Ogni volta che Ursula si muove in questo Luogo, perde 1 Potere.' },
    { id: 'furs_sof_1', name: 'Soffia Bla-Bla', type: 'fate_item',
      effect: 'Assegna a un Eroe. Il costo per giocare un Contratto Vincolante su quell\'Eroe aumenta di 3 Potere.' },
    { id: 'furs_sof_2', name: 'Soffia Bla-Bla', type: 'fate_item',
      effect: 'Assegna a un Eroe. Il costo per giocare un Contratto Vincolante su quell\'Eroe aumenta di 3 Potere.' },
    // EFFETTI FATO (3)
    { id: 'furs_rip_1', name: 'Riprendere Forma', type: 'fate_effect',
      effect: 'Scegli un Eroe con Forza 4 o inferiore dalla pila degli scarti del Mazzo Fato di Ursula. Gioca quell\'Eroe nel Luogo di Ursula.' },
    { id: 'furs_rip_2', name: 'Riprendere Forma', type: 'fate_effect',
      effect: 'Scegli un Eroe con Forza 4 o inferiore dalla pila degli scarti del Mazzo Fato di Ursula. Gioca quell\'Eroe nel Luogo di Ursula.' },
    { id: 'furs_rip_3', name: 'Riprendere Forma', type: 'fate_effect',
      effect: 'Scegli un Eroe con Forza 4 o inferiore dalla pila degli scarti del Mazzo Fato di Ursula. Gioca quell\'Eroe nel Luogo di Ursula.' },
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
      actions: [
        { type: 'gain_power', value: 3 },
        { type: 'play_card' },
        { type: 'discard' },
      ],
    },
  ],

  villainDeck: [
    // ALLEATI (10)
    { id: 'pj_a_rino_1', name: 'Guardia Rinoceronte', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'pj_a_rino_2', name: 'Guardia Rinoceronte', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'pj_a_rino_3', name: 'Guardia Rinoceronte', type: 'ally', cost: 3, strength: 4,
      effect: 'Nessuna abilità aggiuntiva.' },
    { id: 'pj_a_arc_1', name: 'Arciere Lupo', type: 'ally', cost: 2, strength: 2,
      effect: 'Durante un\'azione Sconfiggere, può essere usato per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente.' },
    { id: 'pj_a_arc_2', name: 'Arciere Lupo', type: 'ally', cost: 2, strength: 2,
      effect: 'Durante un\'azione Sconfiggere, può essere usato per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente.' },
    { id: 'pj_a_arc_3', name: 'Arciere Lupo', type: 'ally', cost: 2, strength: 2,
      effect: 'Durante un\'azione Sconfiggere, può essere usato per sconfiggere un Eroe nel suo Luogo o in un Luogo adiacente.' },
    { id: 'pj_a_ton', name: 'Tonto', type: 'ally', cost: 2, strength: 2,
      effect: 'Tutti gli altri Alleati nel Luogo di Tonto ottengono +1 Forza.' },
    { id: 'pj_a_sce', name: 'Sceriffo di Nottingham', type: 'ally', cost: 3, strength: 3,
      effect: 'Prima che il Principe Giovanni si muova, puoi muovere lo Sceriffo di Nottingham in un Luogo qualsiasi e ottenere 1 Potere se ci sono Eroi nel suo nuovo Luogo.' },
    { id: 'pj_a_bis', name: 'Sir Biss', type: 'ally', cost: 2, strength: 2,
      effect: 'Se il Principe Giovanni si trova nel Luogo di Sir Biss, puoi eseguire un\'azione coperta da un Eroe in quel Luogo.' },
    { id: 'pj_a_cru', name: 'Crucco', type: 'ally', cost: 2, strength: 4,
      effect: 'Tutti gli altri Alleati nel Luogo di Crucco ottengono -1 Forza.' },
    // OGGETTI (7)
    { id: 'pj_o_tag_1', name: 'Taglia', type: 'item', cost: 1,
      effect: 'Ottieni 2 Potere ogni volta che un Eroe viene giocato in questo Luogo.' },
    { id: 'pj_o_tag_2', name: 'Taglia', type: 'item', cost: 1,
      effect: 'Ottieni 2 Potere ogni volta che un Eroe viene giocato in questo Luogo.' },
    { id: 'pj_o_tag_3', name: 'Taglia', type: 'item', cost: 1,
      effect: 'Ottieni 2 Potere ogni volta che un Eroe viene giocato in questo Luogo.' },
    { id: 'pj_o_arc_1', name: 'Arco e Frecce', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +1 Forza. Quando quell\'Alleato dovrebbe essere scartato, scarta invece questo Oggetto.' },
    { id: 'pj_o_arc_2', name: 'Arco e Frecce', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +1 Forza. Quando quell\'Alleato dovrebbe essere scartato, scarta invece questo Oggetto.' },
    { id: 'pj_o_fre', name: 'Freccia Dorata', type: 'item', cost: 0,
      effect: 'Assegna a un Alleato. Quando quell\'Alleato viene usato per sconfiggere un Eroe, ottieni 2 Potere.' },
    { id: 'pj_o_cor', name: 'La Corona di Re Riccardo', type: 'item', cost: 1,
      effect: 'Se il Principe Giovanni si trova in questo Luogo, il costo di tutte le carte è ridotto di 1 Potere.' },
    // EFFETTI (9)
    { id: 'pj_e_tas_1', name: 'Bellissime, Adorabili Tasse', type: 'effect', cost: 0,
      effect: 'Ottieni 1 Potere per ogni Eroe nel tuo Reame.' },
    { id: 'pj_e_tas_2', name: 'Bellissime, Adorabili Tasse', type: 'effect', cost: 0,
      effect: 'Ottieni 1 Potere per ogni Eroe nel tuo Reame.' },
    { id: 'pj_e_tas_3', name: 'Bellissime, Adorabili Tasse', type: 'effect', cost: 0,
      effect: 'Ottieni 1 Potere per ogni Eroe nel tuo Reame.' },
    { id: 'pj_e_imp_1', name: 'Imprigionare', type: 'effect', cost: 2,
      effect: 'Muovi un Eroe alla Prigione.' },
    { id: 'pj_e_imp_2', name: 'Imprigionare', type: 'effect', cost: 2,
      effect: 'Muovi un Eroe alla Prigione.' },
    { id: 'pj_e_imp_3', name: 'Imprigionare', type: 'effect', cost: 2,
      effect: 'Muovi un Eroe alla Prigione.' },
    { id: 'pj_e_trap_1', name: 'Tendere una Trappola', type: 'effect', cost: 1,
      effect: 'Puoi muovere un Alleato in un Luogo qualsiasi. Esegui un\'azione Sconfiggere.' },
    { id: 'pj_e_trap_2', name: 'Tendere una Trappola', type: 'effect', cost: 1,
      effect: 'Puoi muovere un Alleato in un Luogo qualsiasi. Esegui un\'azione Sconfiggere.' },
    { id: 'pj_e_int', name: 'Intimidire', type: 'effect', cost: 2,
      effect: 'Esegui un\'azione Sconfiggere, ma non scartare l\'Alleato usato per sconfiggere l\'Eroe.' },
    // CONDIZIONI (4)
    { id: 'pj_k_cod_1', name: 'Codardia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Eroi nel Reame, puoi giocare Codardia. Gioca gratis un Alleato dalla tua mano.' },
    { id: 'pj_k_cod_2', name: 'Codardia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Eroi nel Reame, puoi giocare Codardia. Gioca gratis un Alleato dalla tua mano.' },
    { id: 'pj_k_avi_1', name: 'Avidità', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha 6 o più Potere, puoi giocare Avidità. Ottieni 3 Potere.' },
    { id: 'pj_k_avi_2', name: 'Avidità', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha 6 o più Potere, puoi giocare Avidità. Ottieni 3 Potere.' },
  ],

  fateDeck: [
    // EROI (9)
    { id: 'fpj_robin',   name: 'Robin Hood',   type: 'hero', strength: 5,
      effect: 'Il Potere che il Principe Giovanni ottiene da ogni carta o azione è ridotto di 1 Potere.' },
    { id: 'fpj_riccardo', name: 'Re Riccardo', type: 'hero', strength: 5,
      effect: 'Il Principe Giovanni non può giocare carte Effetto.' },
    { id: 'fpj_little',  name: 'Little John',  type: 'hero', strength: 5,
      effect: 'Quando Little John viene giocato, puoi prendere fino a 4 Potere dal Principe Giovanni e metterlo su Little John. Quando Little John viene sconfitto, il Potere torna al Principe Giovanni.' },
    { id: 'fpj_canta',   name: 'Cantagallo',   type: 'hero', strength: 2,
      effect: 'Tutti gli altri Eroi nel Reame del Principe Giovanni ottengono +1 Forza.' },
    { id: 'fpj_fratac',  name: 'Fra Tac',       type: 'hero', strength: 3,
      effect: 'Quando Fra Tac viene giocato, puoi scartare tutte le Taglie dal suo Luogo. Il Principe Giovanni non ottiene Potere da esse.' },
    { id: 'fpj_cocca',   name: 'Lady Cocca',    type: 'hero', strength: 6,
      effect: 'Lady Cocca non può essere giocata o spostata alla Prigione.' },
    { id: 'fpj_marian',  name: 'Lady Marian',   type: 'hero', strength: 3,
      effect: 'Quando Lady Marian viene sconfitta, trova Robin Hood e giocalo nello stesso Luogo.' },
    { id: 'fpj_saetta',  name: 'Saetta',        type: 'hero', strength: 2,
      effect: 'Gli Arcieri Lupo non possono essere usati per sconfiggere Saetta.' },
    { id: 'fpj_tobia',   name: 'Tobia',         type: 'hero', strength: 2,
      effect: 'Quando Tobia viene sconfitto, rimescolalo nel Mazzo Fato del Principe Giovanni.' },
    // OGGETTI FATO (3)
    { id: 'fpj_tras_1',  name: 'Travestimento',  type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe non può essere sconfitto. In qualsiasi momento, il Principe Giovanni può pagare 2 Potere per scartare il Travestimento.' },
    { id: 'fpj_tras_2',  name: 'Travestimento',  type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe non può essere sconfitto. In qualsiasi momento, il Principe Giovanni può pagare 2 Potere per scartare il Travestimento.' },
    { id: 'fpj_tras_3',  name: 'Travestimento',  type: 'fate_item',
      effect: 'Assegna a un Eroe. Quell\'Eroe non può essere sconfitto. In qualsiasi momento, il Principe Giovanni può pagare 2 Potere per scartare il Travestimento.' },
    // EFFETTI FATO (3)
    { id: 'fpj_rub_1', name: 'Rubare ai Ricchi', type: 'fate_effect',
      effect: 'Prendi fino a 4 Potere dal Principe Giovanni e mettilo su un singolo Eroe. Quando quell\'Eroe viene sconfitto, il Potere torna al Principe Giovanni.' },
    { id: 'fpj_rub_2', name: 'Rubare ai Ricchi', type: 'fate_effect',
      effect: 'Prendi fino a 4 Potere dal Principe Giovanni e mettilo su un singolo Eroe. Quando quell\'Eroe viene sconfitto, il Potere torna al Principe Giovanni.' },
    { id: 'fpj_rub_3', name: 'Rubare ai Ricchi', type: 'fate_effect',
      effect: 'Prendi fino a 4 Potere dal Principe Giovanni e mettilo su un singolo Eroe. Quando quell\'Eroe viene sconfitto, il Potere torna al Principe Giovanni.' },
  ],
}

// ═══════════════════════════════════════════════════════════
// 6. REGINA DI CUORI  (Alice nel Paese delle Meraviglie)
// Obiettivo: avere un Archetto in ogni luogo + giocare Tirare con successo
// ═══════════════════════════════════════════════════════════
const queen_of_hearts = {
  id: 'queen_of_hearts',
  name: 'Regina di Cuori',
  title: 'La Regina di Cuori',
  movie: 'Alice nel Paese delle Meraviglie',
  color: '#8B0000', colorLight: '#CC2222', colorDark: '#5C0000', textColor: '#FFD5D5',
  startingPower: 3,
  handSize: 4,
  winCondition: 'Avere un Archetto in ogni Luogo, poi giocare Tirare con successo: il Costo totale delle 5 carte rivelate deve essere inferiore alla Forza totale di tutti gli Archetti.',
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
    // ALLEATI — GUARDIE DI CARTA (8) + Il Re (1) + Pinco Panco e Panco Pinco (1)
    { id: 'qh_a_fio_1', name: 'Guardia di Carta: Fiori', type: 'ally', cost: 1, strength: 2,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_fio_2', name: 'Guardia di Carta: Fiori', type: 'ally', cost: 1, strength: 2,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_qua_1', name: 'Guardia di Carta: Quadri', type: 'ally', cost: 1, strength: 2,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_qua_2', name: 'Guardia di Carta: Quadri', type: 'ally', cost: 1, strength: 2,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_cuo_1', name: 'Guardia di Carta: Cuori', type: 'ally', cost: 2, strength: 3,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_cuo_2', name: 'Guardia di Carta: Cuori', type: 'ally', cost: 2, strength: 3,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_pic_1', name: 'Guardia di Carta: Picche', type: 'ally', cost: 2, strength: 3,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_pic_2', name: 'Guardia di Carta: Picche', type: 'ally', cost: 2, strength: 3,
      effect: '[Attiva]: Paga 1 Potere. Trasforma questa Guardia di Carta in un Archetto, o di nuovo in una Guardia di Carta.' },
    { id: 'qh_a_re', name: 'Il Re', type: 'ally', cost: 2, strength: 2,
      effect: 'Il costo per giocare le Guardie di Carta è ridotto di 1 Potere.' },
    { id: 'qh_a_pin', name: 'Pinco Panco e Panco Pinco', type: 'ally', cost: 3, strength: 2,
      effect: 'Pinco Panco e Panco Pinco non vengono scartati quando vengono usati per sconfiggere un Eroe.' },
    // EFFETTI (12)
    { id: 'qh_e_tir_1', name: 'Tirare', type: 'effect', cost: 4,
      effect: 'Se c\'è un Archetto in ogni Luogo, rivela le prime cinque carte del tuo mazzo. Se il Costo totale è inferiore alla Forza totale di tutti i tuoi Archetti, vinci la partita. Altrimenti, scarta le cinque carte rivelate.' },
    { id: 'qh_e_tir_2', name: 'Tirare', type: 'effect', cost: 4,
      effect: 'Se c\'è un Archetto in ogni Luogo, rivela le prime cinque carte del tuo mazzo. Se il Costo totale è inferiore alla Forza totale di tutti i tuoi Archetti, vinci la partita. Altrimenti, scarta le cinque carte rivelate.' },
    { id: 'qh_e_tir_3', name: 'Tirare', type: 'effect', cost: 4,
      effect: 'Se c\'è un Archetto in ogni Luogo, rivela le prime cinque carte del tuo mazzo. Se il Costo totale è inferiore alla Forza totale di tutti i tuoi Archetti, vinci la partita. Altrimenti, scarta le cinque carte rivelate.' },
    { id: 'qh_e_tes_1', name: 'Tagliategli la Testa!', type: 'effect', cost: 3,
      effect: 'Sconfiggi un Eroe con Forza 4 o inferiore.' },
    { id: 'qh_e_tes_2', name: 'Tagliategli la Testa!', type: 'effect', cost: 3,
      effect: 'Sconfiggi un Eroe con Forza 4 o inferiore.' },
    { id: 'qh_e_tes_3', name: 'Tagliategli la Testa!', type: 'effect', cost: 3,
      effect: 'Sconfiggi un Eroe con Forza 4 o inferiore.' },
    { id: 'qh_e_ord_1', name: 'Per Ordine della Regina', type: 'effect', cost: 2,
      effect: 'Trasforma fino a due Guardie di Carta in Archetti.' },
    { id: 'qh_e_ord_2', name: 'Per Ordine della Regina', type: 'effect', cost: 2,
      effect: 'Trasforma fino a due Guardie di Carta in Archetti.' },
    { id: 'qh_e_com_1', name: 'Un Buon Non Compleanno', type: 'effect', cost: 0,
      effect: 'Ottieni 1 Potere per ogni Alleato nel tuo Reame.' },
    { id: 'qh_e_com_2', name: 'Un Buon Non Compleanno', type: 'effect', cost: 0,
      effect: 'Ottieni 1 Potere per ogni Alleato nel tuo Reame.' },
    { id: 'qh_e_pic_1', name: 'Ti Fa Più Piccola', type: 'effect', cost: 2,
      effect: 'Rimpicciolisci un Eroe oppure riporta alla normalità un Eroe Ingrandito.' },
    { id: 'qh_e_pic_2', name: 'Ti Fa Più Piccola', type: 'effect', cost: 2,
      effect: 'Rimpicciolisci un Eroe oppure riporta alla normalità un Eroe Ingrandito.' },
    // OGGETTI (4)
    { id: 'qh_o_lan_1', name: 'Lancia', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +1 Forza.' },
    { id: 'qh_o_lan_2', name: 'Lancia', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +1 Forza.' },
    { id: 'qh_o_lan_3', name: 'Lancia', type: 'item', cost: 1,
      effect: 'Assegna a un Alleato. Quell\'Alleato ottiene +1 Forza.' },
    { id: 'qh_o_oro', name: 'Orologio', type: 'item', cost: 1,
      effect: '[Attiva]: Ottieni 1 Potere per ogni Archetto nel tuo Reame.' },
    // CONDIZIONI (4)
    { id: 'qh_k_fur_1', name: 'Furia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Furia. Rimpicciolisci fino a due Eroi.' },
    { id: 'qh_k_fur_2', name: 'Furia', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se sconfigge un Eroe con Forza 4 o più, puoi giocare Furia. Rimpicciolisci fino a due Eroi.' },
    { id: 'qh_k_pro_1', name: 'Processo', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Processo. Ottieni 3 Potere.' },
    { id: 'qh_k_pro_2', name: 'Processo', type: 'condition', cost: 0,
      effect: 'Durante il turno di un altro giocatore, se ha tre o più Alleati nel Reame, puoi giocare Processo. Ottieni 3 Potere.' },
  ],

  fateDeck: [
    // EROI (8)
    { id: 'fqh_alice',    name: 'Alice',              type: 'hero', strength: 5,
      effect: 'La Regina di Cuori non può muovere Alleati o Oggetti.' },
    { id: 'fqh_bruca',    name: 'Il Brucaliffo',      type: 'hero', strength: 2,
      effect: 'Tutti gli Alleati nel Luogo del Brucaliffo ottengono -1 Forza.' },
    { id: 'fqh_strega',   name: 'Lo Stregatto',       type: 'hero', strength: 5,
      effect: 'Quando lo Stregatto viene giocato, puoi trasformare fino a due Archetti in Guardie di Carta. Quando lo Stregatto viene sconfitto, la Regina di Cuori può trasformare fino a due Guardie di Carta in Archetti.' },
    { id: 'fqh_libec',    name: 'Capitan Libeccio',   type: 'hero', strength: 3,
      effect: 'Le Guardie di Carta nel Luogo di Capitan Libeccio non possono essere trasformate in Archetti.' },
    { id: 'fqh_tope',     name: 'Toperchio',          type: 'hero', strength: 1,
      effect: 'Il Toperchio non può essere Rimpicciolito.' },
    { id: 'fqh_cappel',   name: 'Il Cappellaio Matto', type: 'hero', strength: 3,
      effect: 'Il Cappellaio Matto ottiene +2 Forza se il Leprotto Bisestile è nel Reame della Regina di Cuori.' },
    { id: 'fqh_lepre',    name: 'Il Leprotto Bisestile', type: 'hero', strength: 3,
      effect: 'Il Leprotto Bisestile ottiene +2 Forza se il Cappellaio Matto è nel Reame della Regina di Cuori.' },
    { id: 'fqh_bianc',    name: 'Il Bianconiglio',    type: 'hero', strength: 2,
      effect: 'Il costo per Attivare le Guardie di Carta e gli Archetti aumenta di 1 Potere.' },
    // EFFETTI FATO (7)
    { id: 'fqh_tana',     name: 'Nella Tana del Bianconiglio', type: 'fate_effect',
      effect: 'Se Alice è nel Reame della Regina di Cuori, scarta un Alleato dal suo Luogo. Altrimenti, trova Alice e giocala.' },
    { id: 'fqh_tard_1',   name: 'È Tardi! È Tardi!', type: 'fate_effect',
      effect: 'Scegli e gioca un Eroe con Forza 3 o inferiore dalla pila degli scarti del Mazzo Fato della Regina di Cuori.' },
    { id: 'fqh_tard_2',   name: 'È Tardi! È Tardi!', type: 'fate_effect',
      effect: 'Scegli e gioca un Eroe con Forza 3 o inferiore dalla pila degli scarti del Mazzo Fato della Regina di Cuori.' },
    { id: 'fqh_gran_1',   name: 'Ti Fa Più Grande',  type: 'fate_effect',
      effect: 'Ingrandisci un Eroe oppure riporta alla normalità un Eroe Rimpicciolito.' },
    { id: 'fqh_gran_2',   name: 'Ti Fa Più Grande',  type: 'fate_effect',
      effect: 'Ingrandisci un Eroe oppure riporta alla normalità un Eroe Rimpicciolito.' },
    { id: 'fqh_palm_1',   name: 'Palmipedoni',       type: 'fate_effect',
      effect: 'Muovi un Alleato in un Luogo qualsiasi.' },
    { id: 'fqh_palm_2',   name: 'Palmipedoni',       type: 'fate_effect',
      effect: 'Muovi un Alleato in un Luogo qualsiasi.' },
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
