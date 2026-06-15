// Static placeholder content. Pure data — swap these for real posts later.
// There is intentionally no fetching or state here; this file only shapes
// what the styled components render.

export type Post = {
  id: string
  title: string
  ago: string   // relative time, shown in the mono "log" voice
  date: string  // absolute date stamp
}

export type Month = {
  id: string
  name: string
  posts: Post[]
}

export const months: Month[] = [
  {
    id: 'junho',
    name: 'Junho',
    posts: [
      { id: 'j1', title: 'Ceguidão.', ago: 'há 2 horas atrás', date: '14 jun 26' },
      { id: 'j2', title: 'Ceguidão.', ago: 'há 5 horas atrás', date: '14 jun 26' },
      { id: 'j3', title: 'Ceguidão.', ago: 'ontem', date: '13 jun 26' },
      { id: 'j4', title: 'Ceguidão.', ago: 'há 4 dias', date: '10 jun 26' },
    ],
  },
  {
    id: 'maio',
    name: 'Maio',
    posts: [
      { id: 'm1', title: 'Ceguidão.', ago: 'há 3 semanas', date: '24 mai 26' },
      { id: 'm2', title: 'Ceguidão.', ago: 'há 3 semanas', date: '21 mai 26' },
      { id: 'm3', title: 'Ceguidão.', ago: 'há 1 mês', date: '12 mai 26' },
      { id: 'm4', title: 'Ceguidão.', ago: 'há 1 mês', date: '03 mai 26' },
    ],
  },
]
