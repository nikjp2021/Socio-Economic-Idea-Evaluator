/**
 * Roadmap Generator — adapts a case study into a personalized 14-day action plan.
 * Pure function: (caseStudy, userContext) → roadmap object.
 */

export function generateRoadmap(caseStudy, userContext) {
  const country = userContext.country || caseStudy.country || 'IN';
  const scale = userContext.scale || 'solo';
  const resources = userContext.resources || [];

  const hasPhone = resources.includes('phone') || resources.includes('funding');
  const hasCommunity = resources.includes('community');

  const reach = scale === 'ngo' ? '50 people' : scale === 'org' ? '20 people' : scale === 'team' ? '10 people' : '3 people';
  const reachWeek2 = scale === 'ngo' ? '200 people' : scale === 'org' ? '50 people' : scale === 'team' ? '25 people' : '10 people';

  const worked = Array.isArray(caseStudy.what_worked) ? caseStudy.what_worked : [];
  const failed = Array.isArray(caseStudy.what_didnt) ? caseStudy.what_didnt : [];
  const copyFrom = worked.length > 0 ? worked[0] : caseStudy.key_lesson || 'Start small, learn fast';
  const avoidFrom = failed.length > 0 ? failed[0] : "Don't try to scale before you have proof";

  const category = caseStudy.category || 'community';
  const firstStepMap = {
    food: `Find ${reach} who are hungry. Ask: "Where do you get your food? What do you wish you could eat?"`,
    education: `Find ${reach} who want to learn. Ask: "What do you wish you could learn? What stops you?"`,
    health: `Find ${reach} with a health problem. Ask: "What health issue affects you most? What do you do about it?"`,
    water: `Find ${reach} without clean water. Ask: "Where do you get your water? How far do you walk?"`,
    women: `Find ${reach} women who face a specific challenge. Ask: "What would make your daily life safer?"`,
    elderly: `Find ${reach} elderly people living alone. Ask: "When was the last time someone checked on you?"`,
    environment: `Find ${reach} affected by pollution. Ask: "What environmental problem bothers you most?"`,
    financial: `Find ${reach} who are unbanked. Ask: "How do you save money? How do you send money to family?"`,
    community: `Find ${reach} in your neighborhood. Ask: "What problem do you all share that nobody is solving?"`,
  };
  const firstStep = firstStepMap[category] || firstStepMap.community;

  const tech = hasPhone ? 'Use WhatsApp to document everything.' : 'Write it down by hand. Take photos if you have a phone.';

  const title = caseStudy.title || caseStudy.organization || 'Social Impact Project';

  return {
    title: `Your version of ${title}`,
    adapted_from: title,
    case_study_id: caseStudy.id || null,
    country,
    scale,
    resources,
    week_1: {
      day_1_2: firstStep,
      day_3_4: `Ask 10 people the same question. Write down every answer. Look for patterns. ${copyFrom ? 'What worked for ' + title + ': ' + copyFrom : ''}`,
      day_5_7: `${tech} Serve ${reach} this week. Document: what happened, what they said, what you learned. ${avoidFrom ? 'Watch out: ' + avoidFrom : ''}`,
    },
    week_2: {
      day_8_10: `Serve ${reachWeek2} total. Track: how many showed up, how many came back, how many told a friend.`,
      day_11_12: `Ask every person: "Would you recommend this to a friend?" If yes, ask: "Why?" ${hasCommunity ? 'Ask your community partners to spread the word.' : ''}`,
      day_13_14: `Write 1 page: how many you served, what they said, what you'd change. This is your proof-of-work.`,
    },
    success_criteria: `If 7 out of 10 people say "I would recommend this to a friend" — you have proof. That's your green light.`,
    lessons_from: {
      what_worked: worked.slice(0, 3),
      what_to_avoid: failed.slice(0, 3),
    },
    sdg_alignment: category,
    milestones: [
      { phase: 'research', label: 'Find your first people', description: firstStep },
      { phase: 'research', label: 'Ask 10 people the same question', description: 'Look for patterns in their answers' },
      { phase: 'pilot', label: `Serve ${reach}`, description: 'Your first real-world test' },
      { phase: 'pilot', label: 'Document what you learned', description: tech },
      { phase: 'proof', label: `Scale to ${reachWeek2}`, description: 'Track who came back' },
      { phase: 'proof', label: 'Write your proof-of-work', description: '1 page: results, feedback, next steps' },
    ],
  };
}
