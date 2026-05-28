import { useNavigate } from 'react-router-dom'

const sections = [
  {
    title: 'Obiettivo del Gioco',
    content: `Ogni giocatore controlla un Cattivo Disney con uno scopo unico e asimmetrico.
Il primo giocatore a soddisfare la propria condizione di vittoria all'inizio del suo turno vince la partita.
Non esistono vittorie di squadra: si gioca tutti contro tutti.`
  },
  {
    title: 'Struttura del Turno',
    content: `1. SPOSTA il tuo Cattivo in un qualsiasi luogo del tuo regno (non puoi restare dove sei).
2. VERIFICA la tua condizione di vittoria: se è soddisfatta, hai vinto!
3. ESEGUI le azioni del luogo in cui ti trovi (nell'ordine mostrato, puoi saltarne).
4. PESCA carte fino alla dimensione massima della mano (di solito 4).
Poi passa il turno al giocatore successivo.`
  },
  {
    title: 'Tipi di Azione',
    items: [
      { icon: '⚡', name: 'Guadagna Potere', desc: 'Prendi il numero di gettoni Potere indicato dalla riserva centrale.' },
      { icon: '🃏', name: 'Gioca Carta', desc: 'Gioca una carta dalla tua mano pagando il suo costo in Potere. Alleati e Oggetti si posizionano nel luogo corrente; le Maledizioni/Wicket vanno nel loro luogo designato; gli Effetti si risolvono subito e vanno negli scarti.' },
      { icon: '🔮', name: 'Fato', desc: 'Pesca 2 carte dal mazzo Fato di un avversario a scelta, giocane 1 (restituisci l\'altra allo scarto di quel giocatore). Gli Eroi vengono posizionati su un luogo del regno avversario.' },
      { icon: '✨', name: 'Attiva', desc: 'Usa l\'abilità di attivazione di un Oggetto o Alleato che si trova nel tuo luogo corrente.' },
      { icon: '🔄', name: 'Sposta', desc: 'Sposta un tuo Alleato o Oggetto in un luogo adiacente della tua plancia.' },
      { icon: '⚔️', name: 'Sconfiggi', desc: 'Usa i tuoi Alleati per sconfiggere un Eroe nel tuo luogo corrente. La forza totale degli Alleati usati deve essere ≥ alla forza dell\'Eroe. Gli Alleati usati restano in gioco.' },
    ]
  },
  {
    title: 'Eroi e Azioni Coperte',
    content: `Quando un Eroe viene giocato tramite Fato su un luogo del tuo regno, alcune azioni di quel luogo possono essere "coperte" (bloccate). Le azioni coperte non possono essere eseguite finché l'Eroe rimane in quel luogo. Per rimuovere un Eroe devi Sconfiggerlo usando l'apposita azione.`
  },
  {
    title: 'Mazzo Esaurito',
    content: `Se il tuo mazzo Villain è esaurito quando devi pescare, rimescola la tua pila degli scarti per formare un nuovo mazzo. Lo stesso vale per i mazzi Fato.`
  },
  {
    title: 'Condizioni di Vittoria',
    items: [
      { icon: '🧙‍♀️', name: 'Malefica', desc: 'Inizia il turno con almeno 1 Maledizione in ciascuno dei 4 luoghi del suo regno.' },
      { icon: '🐍', name: 'Jafar', desc: 'Inizia il turno con la Lampada Magica nel Palazzo del Sultano E il Genio Soggiogato.' },
      { icon: '🏴‍☠️', name: 'Capitan Uncino', desc: 'Inizia il turno con Peter Pan sconfitto sulla Jolly Roger.' },
      { icon: '🐙', name: 'Ursula', desc: 'Inizia il turno con il Tridente E la Corona di Re Tritone in suo possesso.' },
      { icon: '👑', name: 'Principe Giovanni', desc: 'Inizia il turno con 20 o più gettoni Potere.' },
      { icon: '🃏', name: 'Regina di Cuori', desc: 'Inizia il turno con 1 Wicket in ciascuno dei 4 luoghi del suo regno.' },
    ]
  },
  {
    title: 'Regole Chiave',
    items: [
      { icon: '•', name: 'Non puoi restare', desc: 'Devi sempre spostarti in un luogo diverso da quello del turno precedente.' },
      { icon: '•', name: 'Azioni opzionali', desc: 'Puoi saltare qualsiasi azione del tuo turno, nella sequenza mostrata.' },
      { icon: '•', name: 'Potere negativo', desc: 'Il Potere non può scendere sotto 0.' },
      { icon: '•', name: 'Fato solo su avversari', desc: 'Non puoi usare Fato su te stesso.' },
      { icon: '•', name: 'Win check', desc: 'La condizione di vittoria si verifica all\'inizio del turno, prima di eseguire le azioni.' },
    ]
  }
]

export default function Regolamento() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="btn-secondary px-3 py-2 text-xs">
            ← Indietro
          </button>
          <h1 className="font-display text-3xl font-bold text-yellow-400">
            Regolamento
          </h1>
          <span className="text-gray-600 text-sm">Disney Villainous</span>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {sections.map((sec, i) => (
            <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="font-display text-lg font-bold text-yellow-300 mb-3">{sec.title}</h2>

              {sec.content && (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{sec.content}</p>
              )}

              {sec.items && (
                <ul className="flex flex-col gap-2.5">
                  {sec.items.map((item, j) => (
                    <li key={j} className="flex gap-3 text-sm">
                      <span className="text-lg leading-none mt-0.5 shrink-0">{item.icon}</span>
                      <span>
                        <span className="font-semibold text-gray-200">{item.name}: </span>
                        <span className="text-gray-400">{item.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/lobby')} className="btn-primary px-8">
            ⚔️ Inizia a Giocare
          </button>
        </div>
      </div>
    </div>
  )
}
