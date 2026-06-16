/* ═══════════════════════════════════════════════════════
   SEE — Socio-Economic Evaluator
   Application JavaScript
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── DOM CACHE ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── GATE SCREEN ───
  const gateOverlay = $('#gateOverlay');
  const gateCode = $('#gateCode');
  const gateBtn = $('#gateBtn');
  const gateError = $('#gateError');

  if (localStorage.getItem('see_unlocked') !== 'true') {
    document.body.classList.add('gate-active');
  } else {
    gateOverlay.classList.add('hidden');
  }

  function verifyGateCode() {
    if (gateCode.value.trim() === '9999') {
      localStorage.setItem('see_unlocked', 'true');
      gateOverlay.classList.add('hidden');
      document.body.classList.remove('gate-active');
    } else {
      gateError.classList.add('visible');
      gateCode.value = '';
      gateCode.focus();
      setTimeout(() => gateError.classList.remove('visible'), 3000);
    }
  }

  gateBtn.addEventListener('click', verifyGateCode);
  gateCode.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyGateCode();
  });

  // ─── NAV SCROLL ───
  const nav = $('#nav');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 20);
    lastScroll = scrollY;
  }, { passive: true });

  // ─── SCROLL REVEAL ───
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  function initRevealElements() {
    $$('.reveal').forEach((el) => revealObserver.observe(el));
  }

  // ─── COUNTER ANIMATION ───
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      if (!target) return;
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        el.textContent = Math.round(target * ease);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  $$('[data-count]').forEach((el) => counterObserver.observe(el));

  // ─── EXAMPLE CHIPS ───
  $$('.example-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $('#fieldProblem').value = chip.dataset.problem || '';
      $('#fieldGoal').value = chip.dataset.goal || '';
      $('#fieldCountry').value = chip.dataset.country || '';
      $('#fieldBudget').value = chip.dataset.budget || '';
      $('#fieldConstraints').value = chip.dataset.constraints || '';
      updateCounter();
      $('#fieldProblem').focus();
      // Subtle feedback
      chip.style.transform = 'scale(0.95)';
      setTimeout(() => { chip.style.transform = ''; }, 150);
    });
  });

  // ─── CHARACTER COUNTER ───
  function updateCounter() {
    const p = $('#fieldProblem').value.trim();
    const g = $('#fieldGoal').value.trim();
    const total = p.length + g.length;
    const counter = $('#fieldCounter');
    counter.textContent = `${total} / 50 characters minimum`;
    counter.className = total >= 50 ? 'form-counter ready' : 'form-counter';
  }

  ['fieldProblem', 'fieldGoal'].forEach((id) => {
    document.getElementById(id).addEventListener('input', updateCounter);
  });

  // ─── INTENT FILTERING ───
  const BLOCKED_PATTERNS = [
    /disneyland|disney\s*land/i,
    /go\s*to\s*(the\s*)?moon/i,
    /buy\s*(a\s*)?lamborghini|buy\s*(a\s*)?ferrari/i,
    /make\s*me\s*rich|get\s*rich\s*quick/i,
    /dating\s*app|tinder|hookup/i,
    /nft|crypto\s*pump|memecoin/i,
    /kill|harm|hurt|attack|bomb|weapon/i,
    /drug\s*deal|sell\s*drug/i,
    /onlyfans|porn|adult\s*content/i,
    /prank|joke|meme\s*project/i,
  ];

  function validateIntent(problem, goal) {
    const combined = (problem + ' ' + goal).toLowerCase();

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(combined)) {
        return {
          valid: false,
          message:
            'This tool evaluates social impact ideas — ideas that help communities. Your input doesn\'t seem like a serious social impact idea. If it is, please describe the problem you\'re solving and who it helps.',
        };
      }
    }

    if (problem.length + goal.length < 50) {
      return {
        valid: false,
        message:
          'We need more detail. Tell us: What is the problem? Who is affected? What do you want to achieve? At least 2-3 sentences each.',
      };
    }

    const words = combined.split(/\s+/).filter((w) => w.length > 2);
    if (words.length < 5) {
      return {
        valid: false,
        message:
          'We need more detail. Describe the problem and your goal in at least 2-3 sentences each.',
      };
    }

    if (
      combined.endsWith('?') &&
      !combined.includes('want') &&
      !combined.includes('create') &&
      !combined.includes('build') &&
      !combined.includes('help')
    ) {
      return {
        valid: false,
        message:
          'This looks like a question, not an idea. Tell us what you want to DO, not just what you\'re wondering about.',
      };
    }

    return { valid: true };
  }

  // ─── TOAST ───
  function showToast(message) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  // ─── LOADING ANIMATION ───
  const loadingOverlay = $('#loadingOverlay');
  const loadingSteps = [
    'Parsing your idea...',
    'Checking 136 countries...',
    'Analyzing cultural fit...',
    'Matching case studies...',
    'Building your evaluation...',
  ];

  function showLoading() {
    const stepsList = loadingOverlay.querySelector('.loading-steps');
    stepsList.innerHTML = loadingSteps
      .map((s, i) => `<li data-step="${i}"><span class="step-dot"></span>${s}</li>`)
      .join('');
    loadingOverlay.classList.add('visible');
    animateLoadingSteps(0);
  }

  function animateLoadingSteps(index) {
    if (index >= loadingSteps.length) return;
    const items = loadingOverlay.querySelectorAll('.loading-steps li');
    items.forEach((item, i) => {
      if (i < index) {
        item.classList.remove('active');
        item.classList.add('done');
      } else if (i === index) {
        item.classList.add('active');
      }
    });
    setTimeout(() => animateLoadingSteps(index + 1), 800 + Math.random() * 600);
  }

  function hideLoading() {
    loadingOverlay.classList.remove('visible');
  }

  // ─── EVALUATE ───
  const evalBtn = $('#evalBtn');
  const tryResults = $('#tryResults');
  const tryError = $('#tryError');

  evalBtn.addEventListener('click', async () => {
    const problem = $('#fieldProblem').value.trim();
    const goal = $('#fieldGoal').value.trim();
    const country = $('#fieldCountry').value.trim();
    const budget = $('#fieldBudget').value.trim();
    const constraints = $('#fieldConstraints').value.trim();

    const validation = validateIntent(problem, goal);
    if (!validation.valid) {
      tryError.textContent = validation.message;
      tryError.classList.add('visible');
      return;
    }

    let ideaText = problem + '. ' + goal;
    if (country) ideaText += '. Location: ' + country;
    if (budget) ideaText += '. Budget: ' + budget;
    if (constraints) ideaText += '. Constraints: ' + constraints;

    tryError.classList.remove('visible');
    tryResults.classList.remove('visible');
    evalBtn.disabled = true;
    evalBtn.innerHTML =
      '<span style="display:inline-block;width:18px;height:18px;border:2px solid rgba(250,247,242,0.3);border-top-color:var(--cream);border-radius:50%;animation:spin 0.7s linear infinite;margin-right:8px;vertical-align:-3px"></span>Evaluating...';
    showLoading();

    try {
      const resp = await fetch('/api/eval?idea=' + encodeURIComponent(ideaText));
      const data = await resp.json();

      if (data.error) {
        let msg = data.error;
        if (msg.includes('timed out'))
          msg = 'The evaluation took too long. Try a shorter, more specific description.';
        else if (msg.includes('invalid JSON'))
          msg = 'We had trouble processing this. Try rephrasing your idea with more detail.';
        else if (msg.includes('API key'))
          msg = 'Service temporarily unavailable. Please try again in a moment.';
        tryError.textContent = msg;
        tryError.classList.add('visible');
        return;
      }

      data._input = { problem, goal, country, budget, constraints };
      renderResult(data);
      renderInnovationPanel(data);
      saveToMarketplace(data);
      tryResults.classList.add('visible');
      hideLoading();
      setTimeout(() => {
        tryResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e) {
      hideLoading();
      tryError.textContent = 'Connection issue. Check your internet and try again.';
      tryError.classList.add('visible');
    } finally {
      evalBtn.disabled = false;
      evalBtn.innerHTML = 'Can This Work?';
    }
  });

  // ─── ESCAPE HTML ───
  function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  // ─── RENDER RESULTS ───
  function renderResult(d) {
    const c = $('#resultContent');
    c.innerHTML = '';
    const score = d.verdict.total_score;
    const v = d.verdict.verdict;

    const verdictLabels = {
      GO: 'READY TO TEST',
      'GO WITH EDUCATION': 'GOOD, BUT FIX ONE THING FIRST',
      PIVOT: 'CHANGE YOUR APPROACH',
      SHELVE: 'HIGH BARRIERS RIGHT NOW',
    };
    const plainVerdict = verdictLabels[v] || v;

    let vc;
    if (score >= 8)
      vc = {
        cls: 'go',
        emoji: '&#x2705;',
        headline: 'This is worth testing.',
        tone: `This idea scored ${score} out of 10. The community is ready, the culture fits, and you can start with what you have. Here is your Day 1.`,
      };
    else if (score >= 6)
      vc = {
        cls: 'edu',
        emoji: '&#x1F4A1;',
        headline: 'Good, but fix one thing first.',
        tone: `This idea scored ${score} out of 10. It has real potential, but one specific barrier is holding it back. Fix that first, then test it.`,
      };
    else if (score >= 4)
      vc = {
        cls: 'pivot',
        emoji: '&#x1F504;',
        headline: 'The problem is real. The approach needs to change.',
        tone: `This idea scored ${score} out of 10. The problem you are solving is real, but the way you are thinking about it needs to change. Here is what to try instead.`,
      };
    else
      vc = {
        cls: 'shelve',
        emoji: '&#x1F91D;',
        headline: 'The barriers are high right now.',
        tone: `This idea scored ${score} out of 10. The barriers are real. But here is someone who started with harder conditions, and what you can learn from them.`,
      };

    // Verdict card
    c.innerHTML += `<div class="verdict ${vc.cls}">
      <div class="verdict-emoji">${vc.emoji}</div>
      <h2 class="verdict-headline ${vc.cls}">${vc.headline}</h2>
      <div class="verdict-score" data-target="${score}"><span class="score-count">0</span><span>/10</span></div>
      <div class="verdict-badge ${vc.cls}">${plainVerdict}</div>
      <p class="verdict-tone">${vc.tone}</p>
      ${
        d.verdict.elevator_pitch
          ? `<div style="margin-top:1.25rem;padding:1rem 1.25rem;background:rgba(0,0,0,0.025);border-radius:var(--radius-md);border-left:3px solid ${
              vc.cls === 'go'
                ? 'var(--forest)'
                : vc.cls === 'edu'
                ? 'var(--amber)'
                : vc.cls === 'pivot'
                ? 'var(--sky)'
                : 'var(--terracotta)'
            }">
              <div style="font-size:0.625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--ink-muted);margin-bottom:0.5rem">Your Pitch</div>
              <div style="font-size:0.9375rem;line-height:1.7;color:var(--ink);font-style:italic">${esc(
                d.verdict.elevator_pitch
              )}</div>
            </div>`
          : ''
      }
    </div>`;

    // Score count-up animation
    setTimeout(() => {
      const scoreEl = c.querySelector('.score-count');
      if (scoreEl) animateScore(scoreEl, score);
    }, 300);

    // Actions bar
    c.innerHTML += `<div class="results-actions">
      <button class="results-action-btn" onclick="window.__shareResults()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>
      <button class="results-action-btn" onclick="window.__downloadResults()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>
      <button class="results-action-btn" onclick="window.__printResults()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print
      </button>
    </div>`;

    // Tab bar
    const tabs = [
      { id: 'sec-score', label: 'Score', icon: '&#x1F3AF;' },
      { id: 'sec-idea', label: 'Idea', icon: '&#x1F4DD;' },
      { id: 'sec-who', label: 'Impact', icon: '&#x1F30D;' },
      { id: 'sec-problem', label: 'Problem', icon: '&#x1F50D;' },
      { id: 'sec-strengths', label: 'Strengths', icon: '&#x2705;' },
      { id: 'sec-barriers', label: 'Barriers', icon: '&#x26A0;' },
      { id: 'sec-start', label: 'Start', icon: '&#x1F9EA;' },
      { id: 'sec-case', label: 'Case Study', icon: '&#x1F4DA;' },
      { id: 'sec-plan', label: '14 Days', icon: '&#x1F4C5;' },
      { id: 'sec-funding', label: 'Funding', icon: '&#x1F4B0;' },
    ];
    c.innerHTML += `<div class="results-tabs"><div class="results-tabs-inner">${tabs
      .map(
        (t, i) =>
          `<button class="results-tab${i === 0 ? ' active' : ''}" data-target="${t.id}">${t.icon} ${t.label}</button>`
      )
      .join('')}</div></div>`;

    // ─── SECTION BUILDER HELPER ───
    function addSection(id, icon, iconClass, title, bodyHtml, collapsed) {
      c.innerHTML += `<div class="r-section${collapsed ? ' collapsed' : ''}" id="${id}">
        <div class="r-section-title" onclick="window.__toggleSection(this)">
          <span class="r-icon ${iconClass}">${icon}</span>${title}
          <span class="r-chevron">&#x25BC;</span>
        </div>
        <div class="r-section-body">${bodyHtml}</div>
      </div>`;
    }

    // Your Idea
    if (d._input) {
      const inp = d._input;
      let h = '<div style="display:flex;flex-direction:column;gap:0.75rem">';
      if (inp.problem)
        h += `<div class="r-card"><div class="r-label">The Problem</div><div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${esc(
          inp.problem
        )}</div></div>`;
      if (inp.goal)
        h += `<div class="r-card"><div class="r-label">Your Goal</div><div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${esc(
          inp.goal
        )}</div></div>`;
      const details = [];
      if (inp.country) details.push(['Where', inp.country]);
      if (inp.budget) details.push(['Budget', inp.budget]);
      if (inp.constraints) details.push(['Constraints', inp.constraints]);
      if (details.length) {
        h += '<div class="r-card-grid">';
        details.forEach(([l, v]) => {
          h += `<div class="r-card"><div class="r-label">${l}</div><div style="font-size:0.875rem;color:var(--ink-muted)">${esc(
            v
          )}</div></div>`;
        });
        h += '</div>';
      }
      h += '</div>';
      addSection('sec-idea', '&#x1F4DD;', 'amber', 'Your Idea', h);
    }

    // SDG / Who You Help
    if (d.sdgs) {
      let h = `<div style="font-size:0.8125rem;color:var(--ink-muted);line-height:1.65;margin-bottom:1rem;padding:0.75rem 1rem;background:rgba(37,99,168,0.03);border-radius:var(--radius-sm)">The <strong style="color:var(--ink)">United Nations</strong> has <strong style="color:var(--ink)">17 Global Goals</strong> to make the world better by 2030. Your idea connects to these goals.</div>`;
      const plainExp = esc(
        d.sdgs.primary.plain_explanation || d.sdgs.alignment_text || ''
      );
      h += `<div class="r-card" style="margin-bottom:0.75rem">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
          <div class="sdg-number">${d.sdgs.primary.number}</div>
          <div><div class="r-value">Goal ${d.sdgs.primary.number}: ${esc(
        d.sdgs.primary.name
      )}</div><div class="r-detail">${esc(d.sdgs.primary.target_text)}</div></div>
        </div>
        <div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${plainExp}</div>
      </div>`;
      const whatMeans = esc(d.sdgs.what_this_means || '');
      if (whatMeans) {
        h += `<div class="r-card" style="margin-bottom:0.75rem"><div class="r-label">What This Means For You</div><div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${whatMeans}</div></div>`;
      }
      if (d.impact) {
        const icVar =
          d.impact.interpretation === 'HIGH'
            ? 'var(--forest)'
            : d.impact.interpretation === 'MEDIUM'
            ? 'var(--amber)'
            : 'var(--ink-muted)';
        h += `<div class="r-card">
          <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
            <span class="r-label" style="color:${icVar}">Potential Impact</span>
            <span style="font-family:var(--font-display);font-weight:400;font-size:1.75rem;color:${icVar}">${d.impact.score}/100</span>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.min(
            100,
            d.impact.score
          )}%;background:${icVar}"></div></div>
          <div class="r-detail" style="margin-top:0.5rem">Reach: ${
            d.impact.estimated_reach
          } people. Cultural fit: ${Math.round(
          d.impact.cultural_fit * 100
        )}%. SDG weight: ${d.impact.sdg_weight}/10.</div>
        </div>`;
      }
      addSection('sec-who', '&#x1F30D;', 'sky', 'Who You Help', h);
    }

    // Is This a Real Problem?
    if (d.fad_risk) {
      const f = d.fad_risk;
      const fcVar =
        f.level === 'LOW'
          ? 'var(--forest)'
          : f.level === 'MEDIUM'
          ? 'var(--amber)'
          : 'var(--terracotta)';
      const fadLabel =
        f.level === 'LOW'
          ? 'REAL PROBLEM'
          : f.level === 'MEDIUM'
          ? 'REAL, BUT WATCH THE TREND'
          : 'COULD BE A TREND';
      const h = `<div class="r-card" style="margin-bottom:0.75rem">
        <div style="margin-bottom:0.5rem">
          <span style="font-size:0.5625rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;padding:0.25rem 0.75rem;border-radius:var(--radius-pill);background:${
            f.level === 'LOW'
              ? 'var(--forest-dim)'
              : f.level === 'MEDIUM'
              ? 'var(--amber-dim)'
              : 'var(--terracotta-dim)'
          };color:${fcVar};border:1px solid rgba(0,0,0,0.03)">${fadLabel}</span>
        </div>
        <div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65;margin-bottom:0.25rem">${esc(
          f.text
        )}</div>
        <div class="r-detail">${esc(f.signal)}</div>
      </div>
      <div class="r-card">
        <div class="r-label">What This Means For You</div>
        <div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">If this problem will still exist in 5 years, your work will still matter. You are not building something that will disappear when the news stops covering it.</div>
      </div>`;
      addSection(
        'sec-problem',
        '&#x1F50D;',
        'amber',
        'Is This a Real Problem?',
        h,
        score < 6
      );
    }

    // Strengths
    const positives = [];
    if (d.three_tests.facebook_group_test)
      positives.push(
        'Existing communities already solve similar problems \u2014 you\'re not starting from zero'
      );
    if (d.three_tests.ten_for_ten_test)
      positives.push(
        'There are enough people to help deliver this \u2014 the supply side works'
      );
    if (d.three_tests.whatsapp_only_test)
      positives.push(
        'This works with minimal tech \u2014 no app, no website, just a phone'
      );
    if (d.cultural.score >= 8)
      positives.push('The culture in your market is a strong fit');
    else if (d.cultural.score >= 6)
      positives.push(
        'Cultural fit is decent \u2014 some adaptation needed but nothing blocking'
      );
    if (d.bootstrapper.easy >= 7)
      positives.push('Simple enough to start alone with what you have');
    if (d.bootstrapper.feasible >= 7)
      positives.push('Practical \u2014 no permits, no org, no big budget needed');

    if (positives.length) {
      const h = positives
        .map(
          (p) =>
            `<div class="r-item positive"><span class="r-item-icon">&#x2713;</span><span class="r-item-text">${p}</span></div>`
        )
        .join('');
      addSection('sec-strengths', '&#x2705;', 'forest', 'Your Strengths', h);
    }

    // Barriers
    if (score < 8) {
      const explanations = {
        power_distance: {
          issue: 'People don\'t challenge authority here',
          fix: 'Work WITH existing power structures. Partner with local leaders, schools, or religious institutions.',
        },
        individualism: {
          issue: 'Community bonds are weak',
          fix: 'Frame it as individual benefit, not community duty. Show people what THEY get.',
        },
        masculinity: {
          issue: 'Asking for help is seen as weakness',
          fix: 'Use anonymous channels. Or frame help as empowerment, not charity.',
        },
        uncertainty_avoidance: {
          issue: 'People need institutional trust',
          fix: 'Partner with a trusted institution \u2014 a school, church, government office.',
        },
        long_term_orientation: {
          issue: 'People want quick wins',
          fix: 'Show results in weeks, not months. Start with one small, visible success.',
        },
        indulgence: {
          issue: 'There\'s shame in expressing needs',
          fix: 'Use indirect approaches. Let people help each other, not ask for themselves.',
        },
      };
      const holdbacks = [];
      d.cultural.dimensions &&
        Object.entries(d.cultural.dimensions).forEach(([k, v]) => {
          if (v.barrier === 'HIGH')
            holdbacks.push(
              explanations[k] || { issue: k, fix: 'Adapt your approach.' }
            );
        });

      if (holdbacks.length) {
        let h = '<p style="font-size:0.875rem;color:var(--ink-muted);margin-bottom:1rem;line-height:1.65">These are the specific barriers. Each one has a practical workaround.</p>';
        holdbacks.forEach((b) => {
          h += `<div class="r-item warning"><div><div class="r-item-issue">${b.issue}</div><div class="r-item-fix">${b.fix}</div></div></div>`;
        });
        const gap = (8 - score).toFixed(1);
        h += `<div class="r-card" style="text-align:center;margin-top:1rem"><div style="font-size:0.875rem;color:var(--ink-muted)">You\'re <strong style="color:var(--ink)">${gap} points</strong> from "ready to launch." Address the barriers above and re-evaluate.</div></div>`;
        addSection(
          'sec-barriers',
          '&#x26A0;',
          'amber',
          'What Is In Your Way',
          h,
          false
        );
      }
    }

    // Bootstrapper
    const bs = d.bootstrapper;
    const bsH = `<div class="score-row">
      <div class="score-card"><div class="score-num">${bs.easy}</div><div class="score-label">Easy</div><div class="score-desc">How simple to start</div></div>
      <div class="score-card"><div class="score-num">${bs.feasible}</div><div class="score-label">Feasible</div><div class="score-desc">How practical</div></div>
      <div class="score-card"><div class="score-num">${bs.efforts}</div><div class="score-label">Effort</div><div class="score-desc">Ongoing work</div></div>
    </div>
    <div class="r-card"><div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${esc(
      bs.take
    )}</div></div>`;
    addSection(
      'sec-start',
      '&#x1F9EA;',
      'sky',
      'Can You Start With Nothing?',
      bsH
    );

    // Case Study
    if (d.case_study && d.case_study.title !== 'N/A') {
      let h = `<div class="case-card">
        <span class="case-badge ${
          d.case_study.source_type === 'real' ? 'real' : 'hyp'
        }">${
        d.case_study.source_type === 'real'
          ? 'Real Example'
          : 'Based on Real Evidence'
      }</span>
        <div class="case-title">${esc(d.case_study.title)}</div>`;
      if (d.case_study.narrative) {
        d.case_study.narrative
          .split('\n')
          .filter((l) => l.trim())
          .forEach((line) => {
            h += `<p class="case-text">${esc(line.replace(/\*\*/g, ''))}</p>`;
          });
      }
      if (d.case_study.expert) {
        h += `<p class="case-quote">"${esc(d.case_study.expert)}"</p>`;
        if (d.case_study.expert_name)
          h += `<p class="case-author">\u2014 ${esc(
            d.case_study.expert_name
          )}</p>`;
      }
      h += '</div>';
      addSection(
        'sec-case',
        '&#x1F4DA;',
        'amber',
        'Someone Who Did Something Similar',
        h,
        score < 4
      );
    }

    // 14-Day Plan
    if (d.verdict.proof_of_work) {
      const p = d.verdict.proof_of_work;
      let h = '<p style="font-size:0.875rem;color:var(--ink-muted);margin-bottom:1rem;line-height:1.65">Start with $0. No permission needed. Just do this.</p>';
      [
        { l: 'Day 1\u20132', t: p.week_1.day_1_2 },
        { l: 'Day 3\u20134', t: p.week_1.day_3_4 },
        { l: 'Day 5\u20137', t: p.week_1.day_5_7 },
        { l: 'Day 8\u201310', t: p.week_2.day_8_10 },
        { l: 'Day 11\u201312', t: p.week_2.day_11_12 },
        { l: 'Day 13\u201314', t: p.week_2.day_13_14 },
      ].forEach((s) => {
        h += `<div class="step"><div class="step-label">${s.l}</div><div class="step-text">${esc(
          s.t
        )}</div></div>`;
      });
      h += `<div class="r-card" style="margin-top:1rem"><div class="r-label" style="color:var(--forest)">How Do You Know If It Is Working?</div><div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${esc(
        p.success_criteria
      )}</div></div>`;
      addSection('sec-plan', '&#x1F4C5;', 'forest', 'Your First 14 Days', h);
    }

    // Funding
    if (d.verdict.funding && d.verdict.funding.length) {
      let h = '';
      d.verdict.funding.forEach((f) => {
        const lk =
          f.likelihood === 'HIGH'
            ? 'likely'
            : f.likelihood === 'MEDIUM'
            ? 'possible'
            : 'hard to get';
        h += `<div class="fund-row"><div><div class="fund-source">${esc(
          f.source
        )}</div><div class="fund-amount">${esc(
          f.amount
        )}</div></div><span class="fund-like ${lk}">${lk}</span></div>`;
      });
      addSection('sec-funding', '&#x1F4B0;', 'amber', 'Where to Find Money', h, true);
    }

    // First step CTA (always visible, outside collapsible sections)
    c.innerHTML += `<div class="first-step">
      <div class="first-step-label">Your First Step Today</div>
      <div class="first-step-text">${esc(d.verdict.first_step)}</div>
    </div>`;

    // Tab click handlers
    initResultsTabs();
    initResultsScrollSpy();
    initRevealElements();
  }

  // ─── SCORE COUNT-UP ───
  function animateScore(el, target) {
    const duration = 1200;
    const start = performance.now();
    const isInt = target === Math.floor(target);
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = target * ease;
      el.textContent = isInt ? Math.round(current) : current.toFixed(1);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ─── RESULTS TAB NAVIGATION ───
  function initResultsTabs() {
    const tabsContainer = document.querySelector('.results-tabs');
    $$('.results-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.results-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        // Scroll the tab into view horizontally
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        const target = document.getElementById(tab.dataset.target);
        if (target) {
          // Expand section if collapsed
          if (target.classList.contains('collapsed')) {
            target.classList.remove('collapsed');
          }
          const offset = 120;
          const y = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
    // Scroll shadow indicators
    if (tabsContainer) {
      function updateScrollShadows() {
        const { scrollLeft, scrollWidth, clientWidth } = tabsContainer;
        tabsContainer.classList.toggle('scroll-start', scrollLeft > 4);
        tabsContainer.classList.toggle('scroll-end', scrollLeft < scrollWidth - clientWidth - 4);
      }
      tabsContainer.addEventListener('scroll', updateScrollShadows, { passive: true });
      updateScrollShadows();
    }
  }

  // ─── RESULTS SCROLL SPY ───
  function initResultsScrollSpy() {
    const sections = $$('.r-section');
    const tabs = $$('.results-tab');
    if (!sections.length || !tabs.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            tabs.forEach((t) => t.classList.toggle('active', t.dataset.target === id));
            // Scroll the active tab into view
            const activeTab = document.querySelector('.results-tab.active');
            if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
  }

  // ─── SECTION TOGGLE ───
  window.__toggleSection = function (titleEl) {
    const section = titleEl.closest('.r-section');
    section.classList.toggle('collapsed');
  };

  // ─── SHARE ───
  window.__shareResults = function () {
    const verdict = $('.verdict');
    if (!verdict) return;
    const headline = $('.verdict-headline')?.textContent || '';
    const score = $('.verdict-score .score-count')?.textContent || '';
    const text = `My social impact idea scored ${score}/10 on SEE \u2014 "${headline}" \u2014 Try it: ${window.location.origin}`;

    if (navigator.share) {
      navigator.share({ title: 'My SEE Evaluation', text, url: window.location.origin }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
      });
    }
  };

  // ─── DOWNLOAD ───
  window.__downloadResults = function () {
    const resultContent = $('#resultContent');
    if (!resultContent) return;

    let text = 'SEE \u2014 Socio-Economic Evaluator\n';
    text += '='.repeat(40) + '\n\n';

    resultContent.querySelectorAll('.r-section, .verdict, .first-step').forEach((section) => {
      const title = section.querySelector('.r-section-title, .verdict-headline, .first-step-label');
      if (title) text += '\n' + title.textContent.trim() + '\n' + '-'.repeat(30) + '\n';

      const body = section.querySelector('.r-section-body') || section;
      body.querySelectorAll('.r-item-text, .r-item-issue, .r-item-fix, .step-text, .case-text, .case-quote, .fund-source, .fund-amount, .verdict-tone, .r-card, .score-card, .first-step-text').forEach((el) => {
        const t = el.textContent.trim();
        if (t) text += t + '\n';
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'see-evaluation.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Evaluation downloaded!');
  };

  // ─── PRINT ───
  window.__printResults = function () {
    // Expand all collapsed sections before printing
    $$('.r-section.collapsed').forEach((s) => s.classList.remove('collapsed'));
    setTimeout(() => window.print(), 200);
  };

  // ─── INNOVATION PANEL ───
  function renderInnovationPanel(d) {
    const panel = $('#innovationPanel');
    if (!panel) return;

    const hasCanvas = d.lean_canvas;
    const hasPositioning = d.competitive_positioning;
    const hasHeatmap = d.global_heatmap;
    const hasMarketplace = d.marketplace_listing;

    if (!hasCanvas && !hasPositioning && !hasHeatmap && !hasMarketplace) {
      panel.style.display = 'none';
      return;
    }

    const innovTabs = [];
    if (hasCanvas) innovTabs.push({ id: 'inn-canvas', label: 'Lean Canvas', icon: '&#x1F4CB;' });
    if (hasPositioning) innovTabs.push({ id: 'inn-positioning', label: 'Positioning', icon: '&#x1F4CA;' });
    if (hasHeatmap) innovTabs.push({ id: 'inn-heatmap', label: 'Global Heatmap', icon: '&#x1F30D;' });
    if (hasMarketplace) innovTabs.push({ id: 'inn-marketplace', label: 'Marketplace', icon: '&#x1F3EA;' });

    let html = `<div class="innovation-header">
      <div class="section-label">Innovation Toolkit</div>
      <h2 class="section-title">Go Deeper With Your Idea</h2>
      <p class="section-sub">Advanced analysis powered by 136 countries, 165 case studies, and the Shizuoka Method.</p>
    </div>`;

    html += `<div class="innovation-tabs">${innovTabs.map((t, i) =>
      `<button class="innovation-tab${i === 0 ? ' active' : ''}" data-innov="${t.id}">${t.icon} ${t.label}</button>`
    ).join('')}</div>`;

    html += '<div class="innovation-content">';
    if (hasCanvas) html += `<div id="inn-canvas" class="active">${renderLeanCanvas(d.lean_canvas)}</div>`;
    if (hasPositioning) html += `<div id="inn-positioning">${renderCompetitivePositioning(d.competitive_positioning)}</div>`;
    if (hasHeatmap) html += `<div id="inn-heatmap">${renderGlobalHeatmap(d)}</div>`;
    if (hasMarketplace) html += `<div id="inn-marketplace">${renderMarketplaceCard(d.marketplace_listing)}</div>`;
    html += '</div>';

    panel.innerHTML = html;
    panel.style.display = 'block';

    // Tab click handlers
    panel.querySelectorAll('.innovation-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.innovation-tab').forEach((t) => t.classList.remove('active'));
        panel.querySelectorAll('.innovation-content > div').forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        const target = panel.querySelector('#' + tab.dataset.innov);
        if (target) target.classList.add('active');
      });
    });

    // Animate heatmap bars after a short delay
    setTimeout(() => {
      panel.querySelectorAll('.heatmap-score-fill, .region-bar-fill').forEach((bar) => {
        const w = bar.dataset.width;
        if (w) bar.style.width = w + '%';
      });
    }, 200);
  }

  // ─── LEAN CANVAS RENDERER ───
  function renderLeanCanvas(canvas) {
    if (!canvas) return '<p style="color:var(--ink-muted)">Lean Canvas data not available.</p>';

    function listOrText(val) {
      if (Array.isArray(val)) {
        return '<ul>' + val.map((v) => `<li>${esc(v)}</li>`).join('') + '</ul>';
      }
      return `<p>${esc(val || 'Not available')}</p>`;
    }

    return `<div class="canvas-grid">
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F4A5;</span> Problem</div>
        ${listOrText(canvas.problem)}
      </div>
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F31F;</span> Unique Value Proposition</div>
        <p>${esc(canvas.unique_value_proposition || 'Not available')}</p>
      </div>
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x2728;</span> Solution</div>
        ${listOrText(canvas.solution)}
      </div>
      <div class="canvas-block span-2">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F6E1;</span> Unfair Advantage</div>
        <p>${esc(canvas.unfair_advantage || 'Not available')}</p>
      </div>
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F465;</span> Customer Segments</div>
        <p>${esc(canvas.customer_segments || 'Not available')}</p>
      </div>
      <div class="canvas-block span-2">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F4CA;</span> Key Metrics</div>
        ${listOrText(canvas.key_metrics)}
      </div>
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F4E2;</span> Channels</div>
        ${listOrText(canvas.channels)}
      </div>
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F4B8;</span> Cost Structure</div>
        <p>${esc(canvas.cost_structure || 'Not available')}</p>
      </div>
      <div class="canvas-block">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F4B0;</span> Revenue Streams</div>
        <p>${esc(canvas.revenue_streams || 'Not available')}</p>
      </div>
      <div class="canvas-block full">
        <div class="canvas-block-title"><span class="cb-icon">&#x1F50D;</span> Existing Alternatives</div>
        <p>${esc(canvas.existing_alternatives || 'Not available')}</p>
      </div>
    </div>`;
  }

  // ─── COMPETITIVE POSITIONING RENDERER ───
  function renderCompetitivePositioning(pos) {
    if (!pos) return '<p style="color:var(--ink-muted)">Positioning data not available.</p>';

    let html = '<div class="positioning-layout">';

    // Radar chart (SVG)
    html += `<div class="radar-container">
      <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);margin-bottom:1rem">Competitive Radar</div>
      ${buildRadarSVG(pos)}
      <div class="radar-legend">
        <div class="radar-legend-item"><span class="radar-legend-dot" style="background:var(--forest)"></span> Your Idea</div>
        <div class="radar-legend-item"><span class="radar-legend-dot" style="background:var(--amber)"></span> Case Studies</div>
      </div>
    </div>`;

    // Competitor cards
    html += '<div class="competitor-list">';
    if (pos.matches && pos.matches.length) {
      pos.matches.slice(0, 3).forEach((m) => {
        html += `<div class="competitor-card">
          <div class="competitor-name">${esc(m.title || m.organization || 'Unknown')}</div>
          <div class="competitor-meta">${esc(m.organization || '')} &middot; ${esc(m.country || '')} &middot; ${esc(m.category || '')}</div>
          <div class="competitor-lesson">"${esc(m.key_lesson || m.insight || '')}"</div>
          <div class="competitor-tags">
            ${m.what_worked ? `<span class="competitor-tag">&#x2713; ${esc(m.what_worked)}</span>` : ''}
            ${m.what_didnt ? `<span class="competitor-tag warn">&#x2717; ${esc(m.what_didnt)}</span>` : ''}
          </div>
        </div>`;
      });
    } else {
      html += '<p style="color:var(--ink-muted);font-size:0.875rem">No comparable case studies found. Your idea may be truly novel.</p>';
    }
    html += '</div>';

    // Insight
    if (pos.insight) {
      html += `<div class="positioning-insight" style="grid-column:1/-1">
        <div class="positioning-insight-label">Key Insight</div>
        <div class="positioning-insight-text">${esc(pos.insight)}</div>
      </div>`;
    }

    // Patterns
    if ((pos.success_patterns && pos.success_patterns.length) || (pos.failure_patterns && pos.failure_patterns.length)) {
      html += '<div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:0.5rem">';
      if (pos.success_patterns && pos.success_patterns.length) {
        html += '<div class="r-card"><div class="r-label" style="color:var(--forest)">&#x2713; What Works</div>';
        pos.success_patterns.forEach((p) => {
          html += `<div style="font-size:0.8125rem;color:var(--ink-muted);line-height:1.6;padding:0.375rem 0">${esc(p.pattern)}</div>`;
        });
        html += '</div>';
      }
      if (pos.failure_patterns && pos.failure_patterns.length) {
        html += '<div class="r-card"><div class="r-label" style="color:var(--amber)">&#x26A0; What to Avoid</div>';
        pos.failure_patterns.forEach((p) => {
          html += `<div style="font-size:0.8125rem;color:var(--ink-muted);line-height:1.6;padding:0.375rem 0">${esc(p.pattern)}</div>`;
        });
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function buildRadarSVG(pos) {
    const dims = ['Cultural\nFit', 'Community', 'Bootstrapper', 'Impact', 'Education'];
    const cx = 150, cy = 130, maxR = 90;
    const angleStep = (2 * Math.PI) / dims.length;

    // Generate polygon points for a given set of values
    function polyPoints(values, offset) {
      return values.map((v, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const r = (v / 10) * maxR;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
    }

    // Grid rings
    let svg = `<svg viewBox="0 0 300 260" xmlns="http://www.w3.org/2000/svg">`;
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach((scale) => {
      const pts = dims.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const r = scale * maxR;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="rgba(26,22,18,0.06)" stroke-width="0.5"/>`;
    });

    // Axes and labels
    dims.forEach((label, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x1 = cx + maxR * Math.cos(angle);
      const y1 = cy + maxR * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${x1}" y2="${y1}" stroke="rgba(26,22,18,0.06)" stroke-width="0.5"/>`;
      const lx = cx + (maxR + 20) * Math.cos(angle);
      const ly = cy + (maxR + 20) * Math.sin(angle);
      const lines = label.split('\n');
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#8a7e6e" font-family="DM Sans,sans-serif">${lines.join(' ')}</text>`;
    });

    // User radar (green) - use real data if available, otherwise estimate from positioning
    const userData = pos.user_radar || [6, 5, 7, 6, 5];
    svg += `<polygon points="${polyPoints(userData)}" fill="rgba(45,90,39,0.12)" stroke="var(--forest)" stroke-width="2"/>`;
    userData.forEach((v, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const r = (v / 10) * maxR;
      svg += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="3" fill="var(--forest)"/>`;
    });

    // Competitor radar (amber) - average of competitors
    const compData = pos.matches && pos.matches.length && pos.matches[0].radar
      ? pos.matches[0].radar
      : [5, 6, 5, 7, 4];
    svg += `<polygon points="${polyPoints(compData)}" fill="rgba(196,122,10,0.08)" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4,3"/>`;

    svg += '</svg>';
    return svg;
  }

  // ─── GLOBAL HEATMAP RENDERER ───
  function renderGlobalHeatmap(d) {
    const hm = d.global_heatmap;
    if (!hm) {
      return '<p style="color:var(--ink-muted)">Global heatmap data not available.</p>';
    }

    const top5 = hm.top_5 || [];
    const bottom5 = hm.bottom_5 || [];
    const regionAvg = hm.region_averages || hm.region_avgs || [];
    const globalAvg = hm.global_avg || hm.global_average || 0;
    const bestCountry = top5[0];
    const worstCountry = bottom5[bottom5.length - 1] || bottom5[0];

    let html = '<div class="heatmap-layout">';

    // Summary cards
    html += '<div class="heatmap-summary">';
    html += `<div class="heatmap-stat-card">
      <div class="heatmap-stat-val">${bestCountry ? bestCountry.country : 'N/A'}</div>
      <div class="heatmap-stat-label">Best Fit Country</div>
    </div>`;
    html += `<div class="heatmap-stat-card">
      <div class="heatmap-stat-val">${typeof globalAvg === 'number' ? globalAvg.toFixed(1) : globalAvg}/10</div>
      <div class="heatmap-stat-label">Global Average</div>
    </div>`;
    html += `<div class="heatmap-stat-card">
      <div class="heatmap-stat-val">${bestCountry ? bestCountry.total_score?.toFixed(1) : 'N/A'}</div>
      <div class="heatmap-stat-label">Top Score</div>
    </div>`;
    html += `<div class="heatmap-stat-card">
      <div class="heatmap-stat-val">${hm.countries_analyzed || 136}</div>
      <div class="heatmap-stat-label">Countries Analyzed</div>
    </div>`;
    html += '</div>';

    // Top 5 countries
    html += '<div class="heatmap-top-bottom">';
    html += '<div class="heatmap-section-title">&#x1F3C6; Top 5 Best Fit</div>';
    top5.forEach((c) => {
      const pct = Math.min(100, (c.total_score / 10) * 100);
      html += `<div class="heatmap-country-row">
        <span class="heatmap-flag">${c.flag || '&#x1F30D;'}</span>
        <span class="heatmap-country-name">${esc(c.country)}</span>
        <div class="heatmap-score-bar"><div class="heatmap-score-fill" data-width="${pct}" style="width:0;background:var(--forest)"></div></div>
        <span class="heatmap-score-val">${c.total_score?.toFixed(1)}</span>
      </div>`;
    });
    html += '</div>';

    // Bottom 5 countries
    html += '<div class="heatmap-top-bottom">';
    html += '<div class="heatmap-section-title">&#x1F6A8; Bottom 5 (Highest Barriers)</div>';
    bottom5.forEach((c) => {
      const pct = Math.min(100, (c.total_score / 10) * 100);
      html += `<div class="heatmap-country-row">
        <span class="heatmap-flag">${c.flag || '&#x1F30D;'}</span>
        <span class="heatmap-country-name">${esc(c.country)}</span>
        <div class="heatmap-score-bar"><div class="heatmap-score-fill" data-width="${pct}" style="width:0;background:var(--terracotta)"></div></div>
        <span class="heatmap-score-val">${c.total_score?.toFixed(1)}</span>
      </div>`;
    });
    html += '</div>';

    // Region averages
    if (regionAvg.length) {
      html += '<div class="heatmap-region-bars">';
      html += '<div class="heatmap-section-title">&#x1F30D; Regional Averages</div>';
      const maxRegion = Math.max(...regionAvg.map((r) => r.avg_score || r.score || 0));
      regionAvg.forEach((r) => {
        const score = r.avg_score || r.score || 0;
        const pct = maxRegion > 0 ? (score / maxRegion) * 100 : 0;
        const color = score >= 6 ? 'var(--forest)' : score >= 4 ? 'var(--amber)' : 'var(--terracotta)';
        html += `<div class="region-bar-row">
          <span class="region-bar-name">${esc(r.region)}</span>
          <div class="region-bar-track"><div class="region-bar-fill" data-width="${pct}" style="width:0;background:${color}"></div></div>
          <span class="region-bar-val">${score.toFixed(1)}</span>
        </div>`;
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // ─── MARKETPLACE CARD RENDERER ───
  function renderMarketplaceCard(listing) {
    if (!listing) return '<p style="color:var(--ink-muted)">Marketplace listing not available.</p>';

    const sdgColors = { 1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A' };

    return `<div class="marketplace-card badge-${listing.badge}" style="max-width:28rem;margin:0 auto">
      <span class="marketplace-badge ${listing.badge}">${esc(listing.badge_label || listing.badge)}</span>
      <div class="marketplace-card-type">${esc(listing.idea_type_display || 'Social Impact')}</div>
      <div class="marketplace-card-hook">${esc(listing.hook || '')}</div>
      ${listing.sdg_tags && listing.sdg_tags.length ? `<div class="marketplace-card-sdgs">${listing.sdg_tags.map((s) =>
        `<span class="marketplace-sdg-tag" style="background:${sdgColors[s.number] || '#888'}">SDG ${s.number}: ${esc(s.name)}</span>`
      ).join('')}</div>` : ''}
    </div>`;
  }

  // ─── MARKETPLACE GALLERY (Standalone) ───
  const MARKETPLACE_SEED = [
    { badge: 'gold', badge_label: 'Ready to Test', hook: 'WhatsApp homework help groups connecting university volunteers with rural Kenyan mothers', idea_type: 'Education', region: 'Kenya', sdg_tags: [{ n: 4, name: 'Quality Education' }, { n: 10, name: 'Reduced Inequalities' }] },
    { badge: 'gold', badge_label: 'Ready to Test', hook: 'Neighborhood buddy system for elderly wellness checks in rural Japan', idea_type: 'Healthcare', region: 'Japan', sdg_tags: [{ n: 3, name: 'Good Health' }, { n: 11, name: 'Sustainable Cities' }] },
    { badge: 'silver', badge_label: 'Promising', hook: 'Solar-powered shared cold storage for smallholder farmers in Nigeria', idea_type: 'Agriculture', region: 'Nigeria', sdg_tags: [{ n: 2, name: 'Zero Hunger' }, { n: 7, name: 'Clean Energy' }] },
    { badge: 'silver', badge_label: 'Promising', hook: 'University mentorship program keeping Bangladeshi girls in secondary school', idea_type: 'Education', region: 'Bangladesh', sdg_tags: [{ n: 4, name: 'Quality Education' }, { n: 5, name: 'Gender Equality' }] },
    { badge: 'gold', badge_label: 'Ready to Test', hook: 'Community kitchen network reducing food waste and feeding night-shift workers in São Paulo', idea_type: 'Food Security', region: 'Brazil', sdg_tags: [{ n: 2, name: 'Zero Hunger' }, { n: 12, name: 'Responsible Consumption' }] },
    { badge: 'bronze', badge_label: 'Needs Work', hook: 'AI-powered mental health chatbot for factory workers in Bangladesh', idea_type: 'Healthcare', region: 'Bangladesh', sdg_tags: [{ n: 3, name: 'Good Health' }, { n: 8, name: 'Decent Work' }] },
    { badge: 'developing', badge_label: 'Developing', hook: 'Peer-to-peer micro-lending circles for women street vendors in India', idea_type: 'Finance', region: 'India', sdg_tags: [{ n: 1, name: 'No Poverty' }, { n: 5, name: 'Gender Equality' }] },
    { badge: 'gold', badge_label: 'Ready to Test', hook: 'Open a small Indian street food stall serving evening commuters near London Bridge', idea_type: 'Food', region: 'United Kingdom', sdg_tags: [{ n: 8, name: 'Decent Work' }, { n: 2, name: 'Zero Hunger' }] },
    { badge: 'silver', badge_label: 'Promising', hook: 'Mobile literacy van bringing reading programs to remote villages in Myanmar', idea_type: 'Education', region: 'Myanmar', sdg_tags: [{ n: 4, name: 'Quality Education' }, { n: 10, name: 'Reduced Inequalities' }] },
  ];

  function renderMarketplaceGallery(filter) {
    const grid = $('#marketplaceGrid');
    if (!grid) return;

    const sdgColors = { 1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A' };

    // Merge seed data with any user-evaluated ideas stored in localStorage
    let items = [...MARKETPLACE_SEED];
    try {
      const stored = JSON.parse(localStorage.getItem('see_marketplace') || '[]');
      items = [...stored, ...items];
    } catch (_) { /* ignore */ }

    const filtered = filter === 'all' ? items : items.filter((i) => i.badge === filter);

    if (!filtered.length) {
      grid.innerHTML = '<div class="marketplace-empty"><div class="marketplace-empty-icon">&#x1F50D;</div>No ideas match this filter yet.</div>';
      return;
    }

    grid.innerHTML = filtered.map((item) => {
      const sdgHtml = (item.sdg_tags || []).map((s) =>
        `<span class="marketplace-sdg-tag" style="background:${sdgColors[s.n || s.number] || '#888'}">SDG ${s.n || s.number}: ${esc(s.name)}</span>`
      ).join('');
      return `<div class="marketplace-card badge-${item.badge}" data-badge="${item.badge}">
        <span class="marketplace-badge ${item.badge}">${esc(item.badge_label || item.badge)}</span>
        <div class="marketplace-card-type">${esc(item.idea_type || item.idea_type_display || 'Social Impact')}</div>
        <div class="marketplace-card-hook">${esc(item.hook || '')}</div>
        ${sdgHtml ? `<div class="marketplace-card-sdgs">${sdgHtml}</div>` : ''}
        ${item.region ? `<div class="marketplace-card-region">&#x1F4CD; ${esc(item.region)}</div>` : ''}
      </div>`;
    }).join('');
  }

  // ─── SAVE EVALUATION TO MARKETPLACE ───
  function saveToMarketplace(d) {
    if (!d.marketplace_listing) return;
    try {
      const stored = JSON.parse(localStorage.getItem('see_marketplace') || '[]');
      const listing = d.marketplace_listing;
      const exists = stored.some((s) => s.hook === listing.hook);
      if (!exists) {
        stored.unshift({
          badge: listing.badge,
          badge_label: listing.badge_label,
          hook: listing.hook,
          idea_type: listing.idea_type_display || 'Social Impact',
          region: d._input?.country || '',
          sdg_tags: listing.sdg_tags || [],
        });
        // Keep max 20 user entries
        localStorage.setItem('see_marketplace', JSON.stringify(stored.slice(0, 20)));
        renderMarketplaceGallery('all');
      }
    } catch (_) { /* ignore */ }
  }

  // ─── INIT ───
  document.addEventListener('DOMContentLoaded', () => {
    initRevealElements();

    // Marketplace gallery
    renderMarketplaceGallery('all');

    // Marketplace filters
    const filtersContainer = $('#marketplaceFilters');
    if (filtersContainer) {
      filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.marketplace-filter');
        if (!btn) return;
        filtersContainer.querySelectorAll('.marketplace-filter').forEach((f) => f.classList.remove('active'));
        btn.classList.add('active');
        renderMarketplaceGallery(btn.dataset.filter);
      });
    }
  });

})();
