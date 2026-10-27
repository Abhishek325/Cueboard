const themes = [
  { id: 'demo-tutorials', name: 'Tutorials', description: 'Practical walkthroughs people can follow along with.', color: '#799588' },
  { id: 'demo-stories', name: 'Behind the scenes', description: 'The small decisions behind a finished video.', color: '#b18c65' },
  { id: 'demo-reviews', name: 'Reviews & comparisons', description: 'Try the same task two ways. Show the trade-off.', color: '#829ac0' },
  { id: 'demo-explainers', name: 'Quick explainers', description: 'Clear answers to questions that keep coming up.', color: '#aa8eb9' },
].map(theme => ({ ...theme, isDemo: true }));

function sample(id, theme, title, demo, value, status = 'planned', format = 'Reel + Short') {
  return { id, theme, title, demo, value, status, format, previousStatus: 'planned', selected: status === 'progress', notes: 'Illustrative sample idea, not a published video or a claim about your work. Edit and save to keep it as your own.', youtubeVideoId: '', isDemo: true };
}

const ideas = [
  sample('demo-first', 'demo-tutorials', 'Record a clean voiceover with your phone', 'Record the same sentence beside a window and inside a soft-furnished room. Play both clips before explaining what changed.', 'Help viewers improve a recording with the space they already have.'),
  sample('demo-tutorial-progress', 'demo-tutorials', 'Build a reusable caption style', 'Set the font, line length and placement on one clip. Apply the same style to a second clip, then check it on a phone screen.', 'Give creators a repeatable starting point for readable captions.', 'progress', 'YouTube tutorial'),
  sample('demo-tutorial-repurpose', 'demo-tutorials', 'One tutorial. One useful Short.', 'Choose a single question from a longer walkthrough. Keep its answer and demonstration together; cut the introduction and unrelated steps.', 'Show how to make a standalone short without stripping out its value.'),
  sample('demo-complete', 'demo-tutorials', 'Export a sharper screen recording', 'Compare a tiny full-screen capture with a recording framed around the action.', 'Make the important text easier to read.', 'done', 'YouTube tutorial'),
  sample('demo-tutorial-captions', 'demo-tutorials', 'Stop captions covering the button', 'Move a caption away from the demonstrated control and compare the two layouts.', 'Keep instructions and the action visible at the same time.', 'done'),
  sample('demo-tutorial-backup', 'demo-tutorials', 'Save the original before the edit', 'Duplicate a short project, try a different cut and reopen the original.', 'Make experimentation easier to undo.', 'done'),
  sample('demo-story-decision', 'demo-stories', 'Why I cut the opening 12 seconds', 'Use an illustrative before-and-after edit: a long introduction versus starting with the problem on screen.', 'Make an editing decision understandable without claiming a retention result.'),
  sample('demo-story-outtake', 'demo-stories', 'The take I kept', 'Compare two fictional takes: one polished but vague, one simpler with a clearer example.', 'Show why clarity can matter more than a perfect delivery.', 'done'),
  sample('demo-review-workflow', 'demo-reviews', 'Phone mic or budget USB mic?', 'Record the same paragraph at the same distance in the same room. Compare room noise, clarity and setup time. Let viewers hear both recordings before explaining which situation each suits.', 'Help viewers decide whether changing equipment solves their actual recording problem.'),
  sample('demo-review-followup', 'demo-reviews', 'A checklist or a full project board?', 'Plan the same three-video week both ways. Show where each approach adds useful context and where it adds work.', 'Choose a planning method based on the complexity of the work.', 'done', 'Carousel'),
  sample('demo-explainer-diagram', 'demo-explainers', '1080p footage, blurry text. Why?', 'Zoom into a screen recording and show how fitting a large desktop into a small frame shrinks the text. Compare it with a tighter crop.', 'Explain why resolution alone does not guarantee a readable tutorial.'),
  sample('demo-explainer-confusion', 'demo-explainers', 'A backup is not the same as sync', 'Delete a fictional note in a synced workspace, then contrast that with a separate dated export.', 'Explain which kind of copy helps recover an earlier version.'),
  sample('demo-explainer-size', 'demo-explainers', 'Why does the upload limit say MB?', 'Use a fictional 10 MB upload limit and a 20 MB video. Separate file size from video dimensions, then show which export choices affect each.', 'Help viewers understand what needs to change before uploading.'),
  sample('demo-explainer-example', 'demo-explainers', 'Views and unique viewers', 'Draw five plays coming from three fictional people. Explain what the two counts describe.', 'Make two often-confused measurements easier to interpret.', 'done'),
];

export default { schemaVersion: 1, themes, ideas };
