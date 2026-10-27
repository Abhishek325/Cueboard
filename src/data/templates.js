import { normalize } from '../lib/board.js';

// Templates are starting exercises, never claims about a creator's work or results.
export const starterTemplates = [
  {
    id: 'educational-shorts', name: 'Educational Shorts',
    description: 'Turn one useful lesson into a demonstration viewers can try.',
    themes: [
      { name: 'Show how', color: '#799588', description: 'Teach a small task from start to finish.' },
      { name: 'Explain why', color: '#839cc0', description: 'Make one confusing detail visible.' },
      { name: 'Check understanding', color: '#aa8db7', description: 'Give viewers a way to test the lesson.' },
    ],
    ideas: [
      { theme: 0, title: 'One messy input, one useful output', demo: 'Choose a task you know well. Show the original input, the two important actions and the finished output.', value: 'Viewers can repeat one complete task instead of copying disconnected tips.', notes: 'Replace this example with your subject. Use a fictional or permission-cleared input.' },
      { theme: 0, title: 'The step beginners usually skip', demo: 'Record the same task with and without one check. Put the resulting difference side by side.', value: 'Viewers learn when the extra step matters and how to perform it.', notes: 'Choose a mistake you can reproduce. Avoid claiming everyone makes it.' },
      { theme: 1, title: 'Same instruction, two different results', demo: 'Change one input or setting while keeping the rest identical. Point to exactly what changes.', value: 'Viewers learn a cause-and-effect relationship they can recognize later.', notes: 'State which conditions stayed the same and one limit of the comparison.' },
      { theme: 2, title: 'Can you spot the broken example?', demo: 'Show two short examples. Pause briefly, then reveal the error and demonstrate the check that catches it.', value: 'Viewers practice checking their understanding, with the full answer in this video.', notes: 'Make the difference readable on a phone. Do not hide the answer in a follow-up.' },
    ],
  },
  {
    id: 'building-in-public', name: 'Building in public',
    description: 'Explain the real decisions behind a product, with evidence and limitations.',
    themes: [
      { name: 'Problem & scope', color: '#b28c62', description: 'Show who the work is for and what it solves.' },
      { name: 'Build decisions', color: '#799588', description: 'Make a trade-off concrete with a working example.' },
      { name: 'Tests & lessons', color: '#839cc0', description: 'Share what happened, including what did not work.' },
    ],
    ideas: [
      { theme: 0, title: 'One user, one frustrating moment', demo: 'Recreate a specific workflow using fictional data. Show the awkward step and sketch one smaller alternative.', value: 'Viewers see how to scope a product around a concrete problem.', notes: 'Distinguish your assumption from observed user evidence. Do not invent interviews.' },
      { theme: 1, title: 'The feature I deliberately left out', demo: 'Compare a small working flow with a sketch containing one extra feature. Explain its cost and what you would need to learn first.', value: 'Viewers learn how to make a practical scope decision.', notes: 'Use a decision you actually made; otherwise label this as a hypothetical exercise.' },
      { theme: 1, title: 'Two versions of the same interaction', demo: 'Walk through two prototypes of one action, such as adding an item. Show the steps and explain which constraint each version serves.', value: 'Viewers can evaluate an interface using a concrete task.', notes: 'Do not imply a usability win unless you tested it. Show the trade-off.' },
      { theme: 2, title: 'The edge case that changed the design', demo: 'Use a reproducible case such as an empty list, a long name or a failed request. Show the failure and the revised behavior.', value: 'Viewers learn to test beyond the happy path.', notes: 'Use synthetic data. Include one limitation that remains after the fix.' },
    ],
  },
  {
    id: 'travel-content', name: 'Travel content',
    description: 'Plan useful travel stories around real footage and clearly dated information.',
    themes: [
      { name: 'Plan the day', color: '#799588', description: 'Help viewers make one practical travel decision.' },
      { name: 'On the ground', color: '#b28c62', description: 'Use real footage to show what a visit feels like.' },
      { name: 'Useful details', color: '#aa8db7', description: 'Answer the questions a pretty montage leaves open.' },
    ],
    ideas: [
      { theme: 0, title: 'One neighborhood, a realistic half-day route', demo: 'Map a short route using places you visited. Pair each stop with your own footage and separate walking time from time spent there.', value: 'Viewers can judge whether the route fits their pace and interests.', notes: 'Name the location and visit date. Verify current access and opening hours before publishing.' },
      { theme: 1, title: 'What the scenic clip does not show', demo: 'Pair a scenic shot with the approach, steps, crowd or waiting area from the same visit.', value: 'Viewers can assess the effort and conditions behind the view.', notes: 'Describe your actual visit. Conditions vary by season and time; avoid universal claims.' },
      { theme: 1, title: 'The same place at two times of day', demo: 'Compare footage from two actual visits with visible timestamps or a clearly labeled visit note.', value: 'Viewers can compare atmosphere and plan a time that suits them.', notes: 'Only use this idea if you have both recordings. Do not present a single visit as a recurring pattern.' },
      { theme: 2, title: 'What this outing actually cost', demo: 'Build an itemized breakdown from your own receipts or notes. Separate optional spending and costs shared with others.', value: 'Viewers get a transparent example they can adapt to their own budget.', notes: 'State date, currency and party size. Hide personal payment details and verify any current prices you quote.' },
    ],
  },
];

export function boardFromTemplate(templateId) {
  const template = starterTemplates.find(item => item.id === templateId);
  if (!template) throw Error('That template is unavailable.');
  const themes = template.themes.map(theme => ({ ...theme, id: 'theme-' + crypto.randomUUID(), isDemo: false }));
  return normalize({ schemaVersion: 1, themes, ideas: template.ideas.map(idea => ({
    ...idea, id: 'idea-' + crypto.randomUUID(), theme: themes[idea.theme].id,
    status: 'planned', format: 'Reel + Short', selected: false, isDemo: false,
  })) });
}
