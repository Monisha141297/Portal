export type KbEntry = [string[], string];

export const AI_KB: Record<string, KbEntry[]> = {
  T1: [
    [['setting', 'set time', 'initial'], 'For Supergrade PPC under IS 1489 (Part 1):\n• Initial setting time — not less than 30 minutes\n• Final setting time — not more than 600 minutes\n\nThe gypsum added during finish grinding is what regulates this. Without it, the C₃A phase would cause a flash set.'],
    [['strength', 'mpa', 'compressive', '28'], 'Compressive strength requirements for PPC (IS 1489 Part 1):\n• 3 days — minimum 16 MPa\n• 7 days — minimum 22 MPa\n• 28 days — minimum 33 MPa\n\nRemember the sequence 16 / 22 / 33. PPC also continues gaining strength well beyond 28 days because the pozzolanic reaction is slower than primary hydration.'],
    [['curing', 'cure'], 'PPC concrete should be cured for 10 to 14 days — longer than OPC concrete.\n\nThe reason: the pozzolanic reaction between fly ash and free lime proceeds more slowly than primary hydration. Adequate moisture over a longer period lets that secondary C-S-H form, which is exactly what gives PPC its durability advantage.'],
    [['pozzolan', 'fly ash', 'composition', 'percent', '%'], 'PPC is made by inter-grinding OPC clinker with processed fly ash and gypsum.\n\nThe pozzolanic content is permitted between 15% and 35% by mass of the total cement, per IS 1489 (Part 1). The fly ash must itself conform to IS 3812 (Part 1).'],
    [['difference', 'ppc', 'opc', 'compare', 'vs', 'versus'], 'PPC vs OPC — the key differences:\n\n• Early strength: OPC is faster; PPC catches up by 28 days and keeps gaining\n• Heat of hydration: PPC is lower — better for mass pours\n• Permeability: PPC is lower — better durability in aggressive environments\n• Workability: PPC is better, due to spherical fly ash particles\n• Curing: PPC needs 10–14 days versus about 7 for OPC\n• Sustainability: PPC has a lower clinker factor and carbon footprint'],
    [['heat', 'hydration', 'mass', 'raft', 'thermal'], "Lower heat of hydration is one of PPC's strongest advantages.\n\nIn mass concrete — rafts, footings, dams, thick retaining walls — heat trapped in the core can create a temperature gradient above 20°C against the cooler surface, causing thermal cracking. PPC releases heat more slowly and at a lower peak, which reduces that gradient."],
    [['storage', 'store', 'stack', 'bag', 'warehouse'], 'Site storage rules for bagged cement:\n• Raised wooden platform, at least 200 mm above floor level\n• 300 mm clearance from external walls\n• Maximum 10 bags per stack to avoid warehouse set\n• First-in-first-out rotation\n• Use within 90 days of manufacture'],
    [['standard', 'is 1489', 'is code', 'indian standard', '1489'], 'The standards relevant to this topic:\n• IS 1489 (Part 1) — Portland Pozzolana Cement, fly ash based\n• IS 3812 (Part 1) — Pulverised fuel ash specification\n• IS 4031 — Methods of physical tests for hydraulic cement\n• IS 269 — Ordinary Portland Cement'],
    [['durab', 'chloride', 'sulphate', 'marine', 'coastal'], 'PPC performs well in aggressive environments.\n\nThe pozzolanic reaction consumes free lime — Ca(OH)₂ — which is the compound most vulnerable to chemical attack, and produces additional C-S-H that densifies the matrix. The result is lower permeability and better resistance to chloride and sulphate ingress. This is why PPC is often specified for coastal and marine works.'],
    [['weak', 'objection', 'customer', 'slow'], 'When a customer says PPC is "weaker" or "slower":\n\n1. Acknowledge that early strength gain is more gradual — that is factual.\n2. Point out that 28-day strengths are comparable, and PPC keeps gaining afterwards.\n3. Shift the conversation to lifecycle durability: lower permeability, better chemical resistance, less cracking in mass pours.\n4. Plan de-shuttering at 24–36 hours for vertical members; slabs as per design.'],
    [['c-s-h', 'csh', 'reaction', 'lime', 'calcium'], 'The pozzolanic reaction:\n\nCement + water → C-S-H gel + Ca(OH)₂ (free lime)\nFly ash + Ca(OH)₂ + water → additional C-S-H\n\nC-S-H is the compound that actually provides strength. Free lime contributes very little and is chemically vulnerable, so converting it into more C-S-H both strengthens and protects the concrete.'],
  ],
  T2: [
    [['kiln', 'temperature', '1450', 'burning'], 'The pyro-processing temperature profile:\n• Preheater — progressive heating of raw meal\n• Calciner at about 900°C — CaCO₃ → CaO + CO₂\n• Kiln burning zone at about 1450°C — clinkerisation\n• Cooler — rapid cooling locks in the desired mineral phases'],
    [['phase', 'c3s', 'alite', 'belite', 'clinker'], 'The four principal clinker phases:\n• C₃S (alite) — drives early strength\n• C₂S (belite) — drives later strength\n• C₃A — reacts fast, controlled by gypsum\n• C₄AF — contributes to colour and flux behaviour'],
    [['gypsum'], 'Gypsum is inter-ground with clinker to regulate setting time. Without it, the C₃A phase would hydrate almost instantly and the cement would flash-set, making it unusable.'],
    [['quality', 'test', 'control', 'sample'], 'Quality control checkpoints during finish grinding:\n• Continuous sampling at the mill outlet\n• Blaine fineness testing every shift\n• X-ray fluorescence for chemical composition\n• Compressive strength cubes at 3, 7 and 28 days'],
  ],
  T7: [
    [['ppe', 'helmet', 'protective', 'equipment'], 'Mandatory PPE in all operational areas:\n• Safety helmet with chin strap\n• Steel toe-cap safety shoes\n• High-visibility jacket\n• Safety goggles in dust-prone areas\n• Dust mask in packing and mill areas\n• Ear protection above 85 dB\n\nRemember: PPE is the last line of defence, not the first.'],
    [['permit', 'hot work', 'confined', 'height'], 'Written work permits are required for:\n• Hot work — welding, cutting, grinding\n• Confined space entry — silos, bunkers, ducts\n• Work at height — above 1.8 metres\n• Electrical isolation / LOTO'],
    [['emergency', 'siren', 'evacuat', 'assembly'], 'On hearing the emergency siren:\n1. Stop work immediately\n2. Isolate equipment where safe to do so\n3. Proceed to the nearest assembly point by the marked route\n4. Await roll call — do not leave the assembly point'],
  ],
};

export function aiAnswer(topicName: string, path: string, firstSlideTitles: string[], t: string, q: string): { text: string; confident: boolean } {
  const kb = AI_KB[t] || [];
  const s = q.toLowerCase();
  let best: string | null = null;
  let score = 0;
  kb.forEach(([keys, ans]) => {
    const hit = keys.filter((k) => s.includes(k)).length;
    if (hit > score) { score = hit; best = ans; }
  });
  if (best) return { text: best, confident: true };
  return {
    text: 'I answer only from the approved learning content for the currently selected topic:\n\n' + path +
      "\n\nI could not find an approved answer covering that specific point in this topic's knowledge base. I can help with " +
      firstSlideTitles.slice(0, 3).join(', ') + ' and related material for ' + topicName +
      '.\n\nIf you need a definitive answer, use "Ask an Expert" and a trainer will respond.',
    confident: false,
  };
}
