import type { Question } from '../types';
import { TOPICS } from './catalog';

export const QT: Record<string, string> = {
  single: 'Multiple Choice – Single', multi: 'Multiple Choice – Multiple', tf: 'True / False', yn: 'Yes / No',
  fill: 'Fill in the Blank', image: 'Image-based', scenario: 'Scenario-based', match: 'Match the Following',
};

let qseq = 0;
function Q(o: Partial<Question> & Pick<Question, 'topic' | 'type' | 'text' | 'opts' | 'ans'>): Question {
  qseq++;
  return {
    id: 'Q' + qseq, marks: 1, time: null, mandatory: false, status: 'Active', by: 'Meenakshi Iyer',
    created: '2026-08-1' + (qseq % 9), diff: 'Medium', explain: '', pairs: undefined, img: undefined,
    ...o,
  } as Question;
}

export const QUESTIONS: Question[] = [];

QUESTIONS.push(
  Q({ topic: 'T1', type: 'single', text: 'Which Indian Standard governs Portland Pozzolana Cement (fly ash based)?', opts: ['IS 269', 'IS 1489 (Part 1)', 'IS 8112', 'IS 12269'], ans: [1], marks: 2, mandatory: true, diff: 'Easy', explain: 'IS 1489 (Part 1) specifically covers fly-ash based PPC. IS 269 covers OPC.' }),
  Q({ topic: 'T1', type: 'single', text: 'What is the permitted range of pozzolanic material in PPC, by mass?', opts: ['5% to 10%', '15% to 35%', '40% to 55%', '60% to 70%'], ans: [1], marks: 2, mandatory: true, diff: 'Medium', explain: 'IS 1489 permits 15–35% pozzolana by mass of the total cement.' }),
  Q({ topic: 'T1', type: 'single', text: 'The minimum compressive strength of PPC at 28 days is:', opts: ['16 MPa', '22 MPa', '33 MPa', '43 MPa'], ans: [2], marks: 2, mandatory: true, diff: 'Medium', explain: 'The IS 1489 requirement sequence is 16 / 22 / 33 MPa at 3 / 7 / 28 days.' }),
  Q({ topic: 'T1', type: 'multi', text: 'Select ALL genuine benefits of using PPC over plain OPC:', opts: ['Lower heat of hydration', 'Higher early (1-day) strength', 'Reduced permeability', 'Improved workability', 'Higher clinker factor'], ans: [0, 2, 3], marks: 5, mandatory: true, diff: 'Hard', explain: 'PPC does NOT give higher early strength, and its clinker factor is lower, not higher — that is precisely its sustainability advantage.' }),
  Q({ topic: 'T1', type: 'tf', text: 'PPC concrete requires a shorter curing period than OPC concrete.', opts: ['True', 'False'], ans: [1], marks: 1, mandatory: true, diff: 'Easy', explain: 'False. PPC requires LONGER curing — 10 to 14 days — because the pozzolanic reaction proceeds more slowly.' }),
  Q({ topic: 'T1', type: 'fill', text: 'The fly ash in PPC reacts with free ______ released during hydration to form additional C-S-H gel.', opts: [], ans: ['lime', 'calcium hydroxide', 'ca(oh)2', 'free lime'], marks: 2, diff: 'Medium', explain: 'Fly ash consumes the free lime — calcium hydroxide — producing secondary C-S-H.' }),
  Q({ topic: 'T1', type: 'yn', text: 'Is it acceptable to stack cement bags directly on a bare warehouse floor?', opts: ['Yes', 'No'], ans: [1], marks: 1, diff: 'Easy', explain: 'No. Bags must sit on a raised platform at least 200 mm above floor level to prevent moisture pick-up.' }),
  Q({ topic: 'T1', type: 'single', text: 'Maximum recommended stack height for cement bags in storage:', opts: ['5 bags', '10 bags', '15 bags', '20 bags'], ans: [1], marks: 1, diff: 'Easy', explain: 'Ten bags is the limit; higher stacks cause warehouse set through compaction.' }),
  Q({ topic: 'T1', type: 'scenario', text: 'A contractor pouring a 2.5 m thick raft foundation is worried about thermal cracking. Which recommendation is technically correct?', opts: ['Switch to OPC 53 for faster strength', 'Recommend PPC for its lower heat of hydration', 'Increase the cement content by 15%', 'Reduce the curing period to limit heat'], ans: [1], marks: 5, diff: 'Hard', explain: 'Mass pours are the classic application for PPC — lower heat of hydration reduces the thermal gradient and the risk of cracking.' }),
  Q({ topic: 'T1', type: 'single', text: 'The minimum initial setting time specified for PPC is:', opts: ['15 minutes', '30 minutes', '45 minutes', '60 minutes'], ans: [1], marks: 1, diff: 'Medium', explain: 'Not less than 30 minutes initial set; not more than 600 minutes final set.' }),
  Q({ topic: 'T1', type: 'image', text: 'Refer to the hydration schematic. Which compound is chiefly responsible for concrete strength?', opts: ['Calcium hydroxide — Ca(OH)₂', 'Calcium Silicate Hydrate — C-S-H', 'Gypsum — CaSO₄·2H₂O', 'Calcium carbonate — CaCO₃'], ans: [1], marks: 2, diff: 'Medium', img: 'Hydration schematic — C-S-H gel network formation', explain: 'C-S-H gel is the binding phase that provides strength; Ca(OH)₂ contributes very little.' }),
  Q({ topic: 'T1', type: 'match', text: 'Match each standard to the subject it covers:', opts: [], ans: [], pairs: [['IS 1489 (Part 1)', 'Portland Pozzolana Cement'], ['IS 3812 (Part 1)', 'Pulverised fuel ash'], ['IS 4031', 'Physical tests for cement'], ['IS 269', 'Ordinary Portland Cement']], marks: 5, diff: 'Hard', explain: 'Standards mapping is frequently tested in certification examinations.' }),
  Q({ topic: 'T1', type: 'single', text: 'Minimum specific surface (Blaine fineness) required for PPC:', opts: ['225 m²/kg', '300 m²/kg', '370 m²/kg', '450 m²/kg'], ans: [1], marks: 1, diff: 'Hard', explain: '300 m²/kg minimum per IS 1489 (Part 1).' }),
  Q({ topic: 'T1', type: 'single', text: 'A customer says PPC is "weaker" than OPC. The most accurate response is:', opts: ['Agree and offer a discount', 'Explain that 28-day strengths are comparable and PPC keeps gaining strength afterwards', 'Advise them to use twice the quantity', 'Tell them PPC is only for plastering'], ans: [1], marks: 2, diff: 'Medium', explain: 'Address the objection with the lifecycle strength and durability argument.' }),
  Q({ topic: 'T1', type: 'yn', text: 'Should cement be used within 90 days of the date of manufacture?', opts: ['Yes', 'No'], ans: [0], marks: 1, diff: 'Easy', explain: 'Yes. Beyond 90 days, strength loss through atmospheric moisture becomes significant.' }),
);

QUESTIONS.push(
  Q({ topic: 'T2', type: 'single', text: 'At approximately what temperature does calcination of limestone occur?', opts: ['450°C', '900°C', '1450°C', '1800°C'], ans: [1], marks: 2, mandatory: true, diff: 'Medium', explain: 'CaCO₃ → CaO + CO₂ occurs around 900°C in the calciner.' }),
  Q({ topic: 'T2', type: 'single', text: 'Peak temperature in the kiln burning zone is approximately:', opts: ['900°C', '1200°C', '1450°C', '2000°C'], ans: [2], marks: 2, mandatory: true, diff: 'Medium', explain: 'Clinkerisation occurs at about 1450°C.' }),
  Q({ topic: 'T2', type: 'single', text: 'Why is gypsum added during finish grinding?', opts: ['To increase colour brightness', 'To regulate the setting time', 'To reduce the cost per tonne', 'To increase the fineness'], ans: [1], marks: 2, mandatory: true, diff: 'Easy', explain: 'Without gypsum the C₃A phase would cause a flash set.' }),
  Q({ topic: 'T2', type: 'multi', text: 'Select ALL principal clinker phases:', opts: ['C₃S (alite)', 'C₂S (belite)', 'C₃A', 'C₄AF', 'CaCO₃'], ans: [0, 1, 2, 3], marks: 5, diff: 'Hard', explain: 'CaCO₃ is a raw material, not a clinker phase.' }),
  Q({ topic: 'T2', type: 'tf', text: 'Approximately 1.5 tonnes of raw material is needed to produce 1 tonne of clinker.', opts: ['True', 'False'], ans: [0], marks: 1, diff: 'Medium', explain: 'True — mainly due to CO₂ loss during calcination.' }),
  Q({ topic: 'T7', type: 'single', text: 'Above what noise level is hearing protection mandatory?', opts: ['65 dB', '75 dB', '85 dB', '105 dB'], ans: [2], marks: 2, mandatory: true, diff: 'Easy', explain: '85 dB is the action level for mandatory hearing protection.' }),
  Q({ topic: 'T7', type: 'single', text: 'A work-at-height permit is required for work above:', opts: ['1.0 m', '1.8 m', '3.0 m', '5.0 m'], ans: [1], marks: 2, mandatory: true, diff: 'Medium', explain: '1.8 metres is the standard threshold.' }),
  Q({ topic: 'T7', type: 'multi', text: 'Which of the following require a written work permit?', opts: ['Hot work (welding/cutting)', 'Confined space entry', 'Routine desk work', 'Electrical isolation / LOTO'], ans: [0, 1, 3], marks: 5, mandatory: true, diff: 'Easy', explain: 'Routine office work does not require a permit.' }),
  Q({ topic: 'T7', type: 'yn', text: 'On hearing the emergency siren, should you first complete the task in hand?', opts: ['Yes', 'No'], ans: [1], marks: 2, diff: 'Easy', explain: 'No. Stop work immediately, isolate equipment and move to the assembly point.' }),
  Q({ topic: 'T7', type: 'tf', text: 'PPE is the primary control measure for workplace hazards.', opts: ['True', 'False'], ans: [1], marks: 1, diff: 'Medium', explain: 'False. PPE is the LAST line of defence after elimination, substitution, engineering and administrative controls.' }),
);

// Bulk-fill the bank so randomisation is demonstrable (PRD: 250+ per topic)
(function generateBank() {
  const tmpl: [Question['type'], string, string[], number[]][] = [
    ['single', 'Which statement about {T} is most accurate in field conditions?', ['Statement A — refer to module slide 2', 'Statement B — the correct technical position', 'Statement C — a common misconception', 'Statement D — not applicable'], [1]],
    ['tf', '{T}: the parameter described in the module must be verified before dispatch.', ['True', 'False'], [0]],
    ['yn', 'Does the {T} module require site verification before sign-off?', ['Yes', 'No'], [0]],
    ['single', 'In {T}, the first checkpoint in the standard procedure is:', ['Documentation review', 'Visual inspection', 'Laboratory testing', 'Customer sign-off'], [1]],
    ['multi', 'Select ALL items that apply to {T}:', ['Applicable standard reference', 'Field verification step', 'Unrelated commercial term', 'Recorded quality checkpoint'], [0, 1, 3]],
  ];
  TOPICS.forEach((t) => {
    const have = QUESTIONS.filter((q) => q.topic === t.id).length;
    const target = t.id === 'T1' ? 250 : (t.id === 'T2' || t.id === 'T7' ? 120 : 60);
    for (let i = have; i < target; i++) {
      const tm = tmpl[i % tmpl.length];
      QUESTIONS.push(Q({
        topic: t.id, type: tm[0], text: tm[1].replace('{T}', t.name) + ' (Bank ref ' + (i + 1) + ')', opts: tm[2].slice(), ans: tm[3].slice(),
        marks: [1, 1, 2, 1, 2, 5][i % 6], time: i % 17 === 0 ? 45 : null, diff: (['Easy', 'Medium', 'Hard'] as const)[i % 3],
        explain: 'Refer to the ' + t.name + ' learning module. This is generated bank content used to demonstrate randomised selection from a large question bank.',
      }));
    }
  });
})();
