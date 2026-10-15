// Presentation helpers only: no new entities or relationship records.
export function detailsWidth(requested,available,docked=false){
  const maximum=Math.max(160,available-(docked?Math.min(280,available*.4):24));
  const minimum=Math.min(available<600?180:320,maximum);
  return Math.round(Math.max(minimum,Math.min(maximum,Number(requested)||420)));
}
export function pairedRelationships(edges,edge){
  return edges.filter(other=>(other.source===edge.source&&other.target===edge.target)||(other.source===edge.target&&other.target===edge.source));
}
export const relationshipIcons={
  leadership:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 22v-3a8 8 0 0 1 16 0v3',
  board:'M5 9a3 3 0 1 0 0-6 3 3 0 1 0 0 6M19 9a3 3 0 1 0 0-6 3 3 0 1 0 0 6M1 19v-3a4 4 0 0 1 8 0v3M15 19v-3a4 4 0 0 1 8 0v3M9 12h6',
  partnership:'M3 8h5l4 4 4-4h5M3 16h5l4-4 4 4h5M3 5v14M21 5v14',
  affiliation:'M9 15l6-6M8 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 7l1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  money:'M18 6c-1-2-10-3-11 1-2 5 12 4 11 9-1 4-10 4-12 1M12 1v22',
  contract:'M6 2h9l4 4v16H6zM14 2v5h5M9 11h7M9 15h7M9 19h4',
  influence:'M3 9l9-6 9 6H3M6 10v9M12 10v9M18 10v9M2 22h20',
  control:'M8 2h8v6H8zM2 17h7v6H2zM15 17h7v6h-7zM12 8v5M5 17v-4h14v4',
  allegation:'M12 2L1 22h22L12 2M12 9v6M12 18v1',
  history:'M3 6V1M3 6h5M3 6a10 10 0 1 1-1 10M12 6v7l4 2',
  ownership:'M3 22V6h13v16M16 11h5v11M7 10h5M7 14h5M7 18h5',
  voting:'M8 3h8v9H8zM5 10l-3 6h20l-3-6M2 16v6h20v-6M10 7l2 2 3-4',
  content:'M12 11v11M7 22h10M12 5v1M8 8a6 6 0 0 0 0 8M16 8a6 6 0 0 1 0 8M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16',
  editorial:'M3 17l13-13 5 5L8 22H3v-5M13 7l5 5',
  endorsement:'M3 12l6 6L22 5',
  candidacy:'M5 3h14v19H5zM8 8l2 2 4-4M8 15h8M8 18h5',
  lobbying:'M3 9h6l12-6v18L9 15H3V9M7 15l2 7h4l-2-6',
  funding:'M8 2h8l-2 5c10 7 9 15-2 15S0 14 10 7L8 2M8 7h8M15 12c-5-2-8 2-3 3 6 1 2 5-3 3M12 10v10'
};
