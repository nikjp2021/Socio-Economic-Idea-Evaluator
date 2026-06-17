/* ═══════════════════════════════════════════════════════
   SEE — Socio-Economic Evaluator
   Application JavaScript
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── DOM CACHE ───
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
    $$('.reveal, .how-step, .evidence-card, .evidence-featured, .sdg-card').forEach((el) => revealObserver.observe(el));
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

  // ─── TOAST (defined once; auth module adds type-aware version) ───
  function showToast(message, type) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast visible' + (type ? ' toast-' + type : '');
    setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  // ─── LOADING ANIMATION ───
  const loadingOverlay = $('#loadingOverlay');
  const loadingSteps = [
    'Reading your idea...',
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
      const headers = {};
      if (getAuthToken()) headers['Authorization'] = 'Bearer ' + getAuthToken();
      const resp = await fetch('/api/eval?idea=' + encodeURIComponent(ideaText), { headers });
      const data = await resp.json();

      if (data.error) {
        let msg = data.error;
        if (msg.includes('timed out'))
          msg = 'The evaluation took too long. Try a shorter, more specific description.';
        else if (msg.includes('invalid JSON'))
          msg = 'We had trouble processing this. Try rephrasing your idea with more detail.';
        else if (msg.includes('API key') || msg.includes('not configured'))
          msg = 'Service temporarily unavailable. Please try again in a moment.';
        else if (msg.includes('429') || msg.includes('quota') || msg.includes('rate') || msg.includes('busy'))
          msg = 'Our evaluation service is busy right now. Please try again in a few minutes.';
        else if (msg.includes('limit'))
          msg = 'Something went wrong on our end. Please try again in a moment.';
        tryError.textContent = msg;
        tryError.classList.add('visible');
        return;
      }

      data._input = { problem, goal, country, budget, constraints };
      renderResult(data);
      renderInnovationPanel(data);
      showSimilarIdeas(data.idea_type, data.country);
      saveToMarketplace(data);
      saveLastEvaluation(data);
      saveEvaluationToDB(data);
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
    {
      const sdgs = d.sdgs || {};
      const ideaType = d.idea_type || '';
      const fb = IDEA_SDG_MAP[ideaType] || IDEA_SDG_MAP.community;
      const sdgPrimary = (sdgs.primary && sdgs.primary.number) ? sdgs.primary : fb.primary;
      const sdgSecondary = (sdgs.secondary && sdgs.secondary.number) ? sdgs.secondary : fb.secondary;

      let h = `<div style="font-size:0.8125rem;color:var(--ink-muted);line-height:1.65;margin-bottom:1rem;padding:0.75rem 1rem;background:rgba(37,99,168,0.03);border-radius:var(--radius-sm)">The <strong style="color:var(--ink)">United Nations</strong> has <strong style="color:var(--ink)">17 Global Goals</strong> to make the world better by 2030. Your idea connects to these goals.</div>`;
      const plainExp = esc(
        sdgPrimary.plain_explanation || sdgs.alignment_text || ''
      );
      h += `<div class="r-card" style="margin-bottom:0.75rem">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">
          <div class="sdg-number">${sdgPrimary.number || '?'}</div>
          <div><div class="r-value">Goal ${sdgPrimary.number || '?'}: ${esc(
        sdgPrimary.name || 'Social Impact'
      )}</div><div class="r-detail">${esc(sdgPrimary.target_text || '')}</div></div>
        </div>
        <div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${plainExp || 'Your idea contributes to this UN Sustainable Development Goal.'}</div>
      </div>`;
      if (sdgSecondary && sdgSecondary.number) {
        h += `<div class="r-card" style="margin-bottom:0.75rem">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <div class="sdg-number" style="font-size:0.875rem">${sdgSecondary.number}</div>
            <div><div class="r-value">Also impacts: Goal ${sdgSecondary.number}: ${esc(sdgSecondary.name || '')}</div></div>
          </div>
        </div>`;
      }
      const whatMeans = esc(sdgs.what_this_means || '');
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

    // 14-Day Plan (Interactive)
    if (d.verdict.proof_of_work) {
      const p = d.verdict.proof_of_work;
      const planSteps = [
        { id: 'd12', l: 'Day 1\u20132', t: p.week_1.day_1_2 },
        { id: 'd34', l: 'Day 3\u20134', t: p.week_1.day_3_4 },
        { id: 'd57', l: 'Day 5\u20137', t: p.week_1.day_5_7 },
        { id: 'd810', l: 'Day 8\u201310', t: p.week_2.day_8_10 },
        { id: 'd1112', l: 'Day 11\u201312', t: p.week_2.day_11_12 },
        { id: 'd1314', l: 'Day 13\u201314', t: p.week_2.day_13_14 },
      ];

      // Load saved progress
      const planKey = 'see_plan_' + (d.country || 'x') + '_' + (d.idea_type || 'x');
      let savedProgress = {};
      try { savedProgress = JSON.parse(localStorage.getItem(planKey) || '{}'); } catch(e) {}

      const completedCount = planSteps.filter(s => savedProgress[s.id]).length;
      const progressPct = Math.round((completedCount / planSteps.length) * 100);

      let h = `<div class="progress-tracker">
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${progressPct}%"></div>
        </div>
        <div class="progress-label">${completedCount}/${planSteps.length} phases complete &mdash; ${progressPct}%</div>
      </div>`;
      h += '<p style="font-size:0.875rem;color:var(--ink-muted);margin-bottom:1rem;line-height:1.65">Start with $0. No permission needed. Check off each phase as you complete it.</p>';

      planSteps.forEach((s) => {
        const checked = savedProgress[s.id] ? 'checked' : '';
        h += `<div class="step task-step ${checked ? 'task-done' : ''}">
          <label class="task-checkbox-wrap">
            <input type="checkbox" class="task-checkbox" data-plan-key="${planKey}" data-task-id="${s.id}" ${checked}>
            <span class="task-checkmark"></span>
          </label>
          <div class="step-content">
            <div class="step-label">${s.l}</div>
            <div class="step-text">${esc(s.t)}</div>
          </div>
        </div>`;
      });
      h += `<div class="r-card" style="margin-top:1rem"><div class="r-label" style="color:var(--forest)">How Do You Know If It Is Working?</div><div style="font-size:0.875rem;color:var(--ink-muted);line-height:1.65">${esc(
        p.success_criteria
      )}</div></div>`;
      addSection('sec-plan', '&#x1F4C5;', 'forest', 'Your First 14 Days', h);

      // Wire up checkboxes after render
      setTimeout(() => {
        $$('.task-checkbox').forEach(cb => {
          cb.addEventListener('change', () => {
            const key = cb.dataset.planKey;
            const taskId = cb.dataset.taskId;
            let progress = {};
            try { progress = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
            if (cb.checked) { progress[taskId] = true; } else { delete progress[taskId]; }
            localStorage.setItem(key, JSON.stringify(progress));
            // Update step styling
            const step = cb.closest('.task-step');
            if (step) step.classList.toggle('task-done', cb.checked);
            // Update progress bar
            const total = $$('.task-checkbox').length;
            const done = $$('.task-checkbox:checked').length;
            const pct = Math.round((done / total) * 100);
            const bar = document.querySelector('.progress-bar-fill');
            const label = document.querySelector('.progress-label');
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = `${done}/${total} phases complete \u2014 ${pct}%`;
          });
        });
      }, 100);
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
      <div class="first-step-icon">&#x1F680;</div>
      <div class="first-step-label">Do This Today</div>
      <div class="first-step-text">${esc(d.verdict.first_step)}</div>
      <div class="first-step-actions">
        <button class="first-step-btn copy-step" onclick="navigator.clipboard.writeText(this.closest('.first-step').querySelector('.first-step-text').textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>{this.innerHTML='&#x1F4CB; Copy Step'},1500)})">&#x1F4CB; Copy Step</button>
        <button class="first-step-btn whatsapp-step" onclick="window.open('https://wa.me/?text='+encodeURIComponent('My first step from SEE: '+document.querySelector('.first-step-text').textContent+'\n\nTest your idea: '+window.location.origin+'?utm_source=whatsapp&utm_medium=share&utm_campaign=first_step'),'_blank')">&#x1F4AC; Share on WhatsApp</button>
      </div>
    </div>`;

    // What-If Mode
    c.innerHTML += `<div class="what-if-panel">
      <div class="what-if-header">
        <div class="what-if-icon">&#x1F504;</div>
        <div>
          <div class="what-if-title">What If You Changed the Country?</div>
          <div class="what-if-sub">See how cultural context affects your score</div>
        </div>
      </div>
      <div class="what-if-controls">
        <select id="whatIfCountry" class="what-if-select">
          <option value="">Select a country…</option>
        </select>
      </div>
      <div id="whatIfResult" class="what-if-result"></div>
    </div>`;

    // Wire up What-If after render — wait for Hofstede data if needed
    async function initWhatIf() {
      const sel = document.getElementById('whatIfCountry');
      const resultEl = document.getElementById('whatIfResult');
      if (!sel || !resultEl) return;

      // Wait for Hofstede data to load (max 3 seconds)
      let hofData = window.__hofstedeData || [];
      if (!hofData.length) {
        for (let i = 0; i < 30; i++) {
          await new Promise(r => setTimeout(r, 100));
          hofData = window.__hofstedeData || [];
          if (hofData.length) break;
        }
      }

      if (!hofData.length) {
        // Final fallback: fetch directly
        try {
          const resp = await fetch('data/hofstede-database.json');
          const json = await resp.json();
          const countries = json.countries || json;
          if (Array.isArray(countries)) {
            hofData = countries.map(c => ({
              code: c.code || '', name: c.name || c.code || '',
              power_distance: c.pdi || 50, individualism: c.idv || 50,
              masculinity: c.mas || 50, uncertainty_avoidance: c.uai || 50,
              long_term_orientation: c.lto || 50, indulgence: c.ivr || 50,
            }));
          } else if (typeof countries === 'object') {
            hofData = Object.entries(countries).map(([code, c]) => ({
              code: c.code || code, name: c.name || code,
              power_distance: c.pdi || 50, individualism: c.idv || 50,
              masculinity: c.mas || 50, uncertainty_avoidance: c.uai || 50,
              long_term_orientation: c.lto || 50, indulgence: c.ivr || 50,
            }));
          }
          window.__hofstedeData = hofData;
        } catch (_) {}
      }

      if (!hofData.length) {
        sel.innerHTML = '<option value="">Could not load country data</option>';
        return;
      }

      // Populate country dropdown
      hofData.sort((a, b) => (a.name || '').localeCompare(b.name || '')).forEach(c => {
        if (c.code === d.country) return;
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.name || c.code;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', () => {
        const code = sel.value;
        if (!code) { resultEl.innerHTML = ''; return; }
        const target = hofData.find(c => c.code === code);
        if (!target) return;
        const home = hofData.find(c => c.code === d.country) || {};
        const dimKeys = ['power_distance', 'individualism', 'masculinity', 'uncertainty_avoidance', 'long_term_orientation', 'indulgence'];
        const dimLabels = ['Power Distance', 'Individualism', 'Masculinity', 'Uncertainty Avoidance', 'Long-Term Orientation', 'Indulgence'];
        // Compute cultural score delta
        const homeBarriers = dimKeys.filter(k => (home[k] || 50) > 75).length;
        const targetBarriers = dimKeys.filter(k => (target[k] || 50) > 75).length;
        const culturalDelta = (homeBarriers - targetBarriers) * 1.5;
        // Compute education delta (restrained countries = harder)
        const homeIVR = home.indulgence || 50;
        const targetIVR = target.indulgence || 50;
        const eduDelta = ((targetIVR - homeIVR) / 100) * 2;
        // Overall score delta
        const totalDelta = culturalDelta * 0.15 + eduDelta * 0.15;
        const newScore = Math.max(1, Math.min(10, d.verdict.total_score + totalDelta));
        const delta = newScore - d.verdict.total_score;
        const deltaStr = delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
        const deltaColor = delta > 0 ? 'var(--forest)' : delta < 0 ? 'var(--terracotta)' : 'var(--ink-muted)';
        // Dimension comparison
        let dimHTML = '<div class="what-if-dims">';
        dimKeys.forEach((k, i) => {
          const homeVal = home[k] || 50;
          const targetVal = target[k] || 50;
          const diff = targetVal - homeVal;
          const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
          const diffColor = diff > 10 ? 'var(--terracotta)' : diff < -10 ? 'var(--forest)' : 'var(--ink-muted)';
          dimHTML += `<div class="what-if-dim">
            <span class="what-if-dim-label">${dimLabels[i]}</span>
            <span class="what-if-dim-home">${homeVal}</span>
            <span class="what-if-dim-arrow">&#x2192;</span>
            <span class="what-if-dim-target">${targetVal}</span>
            <span class="what-if-dim-diff" style="color:${diffColor}">${diffStr}</span>
          </div>`;
        });
        dimHTML += '</div>';
        resultEl.innerHTML = `<div class="what-if-score">
          <div class="what-if-score-label">Estimated Score in ${esc(target.name || code)}</div>
          <div class="what-if-score-value">
            <span style="color:${deltaColor}">${newScore.toFixed(1)}</span>
            <span class="what-if-score-delta" style="color:${deltaColor}">${deltaStr}</span>
          </div>
        </div>
        ${dimHTML}
        <div class="what-if-note">This is an estimate based on cultural dimensions. A full evaluation would include community viability, case study matching, and bootstrapper scoring.</div>`;
      });
    }
    initWhatIf();

    // Save evaluation banner (if not logged in)
    if (!localStorage.getItem('see_token')) {
      c.innerHTML += `<div class="save-banner">
        <div class="save-banner-icon">&#x1F512;</div>
        <div class="save-banner-text">
          <strong>Save your evaluation permanently.</strong>
          <span>Create a free account to track progress, compare ideas, and get matched with collaborators.</span>
        </div>
        <button class="save-banner-btn" id="saveBannerBtn">Create Free Account</button>
        <button class="save-banner-dismiss" id="saveBannerDismiss">&times;</button>
      </div>`;
      setTimeout(() => {
        const btn = document.getElementById('saveBannerBtn');
        const dismiss = document.getElementById('saveBannerDismiss');
        if (btn) btn.addEventListener('click', () => {
          const authOverlay = document.getElementById('authOverlay');
          if (authOverlay) { authOverlay.style.display = 'flex'; }
        });
        if (dismiss) dismiss.addEventListener('click', () => {
          const banner = dismiss.closest('.save-banner');
          if (banner) banner.style.display = 'none';
        });
      }, 100);
    }

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
    const baseUrl = window.location.origin;
    const text = `My social impact idea scored ${score}/10 on SEE \u2014 "${headline}" \u2014 Try it: ${baseUrl}?utm_source=share&utm_medium=native&utm_campaign=eval_results`;

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

  // ─── CANVAS EXPORT ───
  window.__exportCanvasPNG = function (canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    // Use html2canvas if available, otherwise fallback to SVG foreignObject
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const clone = el.cloneNode(true);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${new XMLSerializer().serializeToString(clone).replace(/#/g, '%23')}</div>
      </foreignObject>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * 2;
      c.height = h * 2;
      const ctx = c.getContext('2d');
      ctx.scale(2, 2);
      ctx.fillStyle = '#FFFCF7';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      c.toBlob((pngBlob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(pngBlob);
        a.download = 'lean-canvas.png';
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
    showToast('Lean Canvas downloaded!', 'success');
  };

  window.__exportCanvasText = function (canvasId) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const blocks = el.querySelectorAll('.canvas-block');
    let text = 'SOCIAL IMPACT LEAN CANVAS\n========================\n\n';
    blocks.forEach((block) => {
      const title = block.querySelector('.canvas-block-title');
      if (title) {
        text += title.textContent.trim().toUpperCase() + '\n';
        text += '-'.repeat(30) + '\n';
      }
      const p = block.querySelectorAll('p');
      p.forEach((para) => { text += para.textContent.trim() + '\n'; });
      const ul = block.querySelector('ul');
      if (ul) {
        ul.querySelectorAll('li').forEach((li) => { text += '• ' + li.textContent.trim() + '\n'; });
      }
      text += '\n';
    });
    navigator.clipboard.writeText(text).then(() => {
      showToast('Canvas copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Could not copy. Try again.', 'error');
    });
  };

  // ─── PASSPORT EXPORT ───
  window.__exportPassportPNG = function () {
    const el = document.querySelector('.cultural-passport');
    if (!el || typeof html2canvas === 'undefined') {
      showToast('Export unavailable. Try the Print option.', 'error');
      return;
    }
    html2canvas(el, { backgroundColor: '#faf7f2', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'cultural-fit-passport.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Passport saved!', 'success');
    });
  };

  // ─── CERTIFICATE EXPORT ───
  window.__exportCertificatePNG = function () {
    const el = document.getElementById('sdg-certificate');
    if (!el || typeof html2canvas === 'undefined') {
      showToast('Export unavailable. Try the Print option.', 'error');
      return;
    }
    html2canvas(el, { backgroundColor: '#ffffff', scale: 2 }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'sdg-certificate.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Certificate saved!', 'success');
    });
  };

  window.__exportCertificateText = function () {
    const el = document.getElementById('sdg-certificate');
    if (!el) return;
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(text).then(() => {
      showToast('Certificate text copied!', 'success');
    });
  };

  // ─── LOAD HOFSTEDE DATA FOR PASSPORT ───
  (function loadHofstedeData() {
    fetch('data/hofstede-database.json')
      .then(r => r.json())
      .then(data => {
        const countries = data.countries || data;
        if (Array.isArray(countries)) {
          window.__hofstedeData = countries.map(c => ({
            code: c.code || '',
            name: c.name || c.code || '',
            power_distance: c.pdi || c.hofstede?.power_distance || 50,
            individualism: c.idv || c.hofstede?.individualism || 50,
            masculinity: c.mas || c.hofstede?.masculinity || 50,
            uncertainty_avoidance: c.uai || c.hofstede?.uncertainty_avoidance || 50,
            long_term_orientation: c.lto || c.hofstede?.long_term_orientation || 50,
            indulgence: c.ivr || c.hofstede?.indulgence || 50,
          }));
        } else if (typeof countries === 'object') {
          window.__hofstedeData = Object.entries(countries).map(([code, c]) => ({
            code: c.code || code,
            name: c.name || code,
            power_distance: c.pdi || c.hofstede?.power_distance || 50,
            individualism: c.idv || c.hofstede?.individualism || 50,
            masculinity: c.mas || c.hofstede?.masculinity || 50,
            uncertainty_avoidance: c.uai || c.hofstede?.uncertainty_avoidance || 50,
            long_term_orientation: c.lto || c.hofstede?.long_term_orientation || 50,
            indulgence: c.ivr || c.hofstede?.indulgence || 50,
          }));
        }
      })
      .catch(() => {});
  })();

  // ─── INNOVATION PANEL ───
  function renderInnovationPanel(d) {
    const panel = $('#innovationPanel');
    if (!panel) return;

    const hasCanvas = d.lean_canvas;
    const hasPositioning = d.competitive_positioning;
    const hasHeatmap = d.global_heatmap;
    const hasMarketplace = d.marketplace_listing;
    const hasMentors = Array.isArray(d.mentor_council) && d.mentor_council.length > 0;

    // Always show panel — passport, stories, and certificate are always available
    const hasAnyFeature = hasCanvas || hasPositioning || hasHeatmap || hasMarketplace || hasMentors || d.verdict;
    if (!hasAnyFeature) {
      panel.style.display = 'none';
      return;
    }

    const innovTabs = [];
    if (hasMentors) innovTabs.push({ id: 'inn-mentors', label: 'Mentor Council', icon: '&#x1F9D1;&#x200D;&#x1F4BC;' });
    innovTabs.push({ id: 'inn-passport', label: 'Cultural Passport', icon: '&#x1F4C4;' });
    innovTabs.push({ id: 'inn-stories', label: 'Impact Stories', icon: '&#x1F4DD;' });
    innovTabs.push({ id: 'inn-certificate', label: 'SDG Certificate', icon: '&#x1F3C6;' });
    if (hasCanvas) innovTabs.push({ id: 'inn-canvas', label: 'Lean Canvas', icon: '&#x1F4CB;' });
    if (hasPositioning) innovTabs.push({ id: 'inn-positioning', label: 'Positioning', icon: '&#x1F4CA;' });
    if (hasHeatmap) innovTabs.push({ id: 'inn-heatmap', label: 'Global Heatmap', icon: '&#x1F30D;' });
    if (hasMarketplace) innovTabs.push({ id: 'inn-marketplace', label: 'Marketplace', icon: '&#x1F3EA;' });

    let html = `<div class="innovation-header">
      <div class="section-label">Innovation Toolkit</div>
      <h2 class="section-title">Go Deeper With Your Idea</h2>
      <p class="section-sub">Advanced analysis powered by 136 countries, 182+ case studies, and the Shizuoka Method.</p>
    </div>`;

    html += `<div class="innovation-tabs">${innovTabs.map((t, i) =>
      `<button class="innovation-tab${i === 0 ? ' active' : ''}" data-innov="${t.id}">${t.icon} ${t.label}</button>`
    ).join('')}</div>`;

    html += '<div class="innovation-content">';
    if (hasMentors) html += `<div id="inn-mentors" class="active">${renderMentorCouncil(d.mentor_council, d.verdict)}</div>`;
    html += `<div id="inn-passport"${hasMentors ? '' : ' class="active"'}>${renderCulturalPassport(d)}</div>`;
    html += `<div id="inn-stories">${renderStoryEngine(d)}</div>`;
    html += `<div id="inn-certificate">${renderSDGCertificate(d)}</div>`;
    if (hasCanvas) html += `<div id="inn-canvas">${renderLeanCanvas(d.lean_canvas)}</div>`;
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

  // ─── CULTURAL FIT PASSPORT ───
  function renderCulturalPassport(d) {
    const cultural = d.cultural || {};
    const dims = cultural.dimensions || {};
    const score = d.verdict?.total_score || 0;
    const country = d.country_name || d.country || 'Unknown';
    const ideaType = d.idea_type || 'social impact';

    // Build radar SVG for cultural dimensions
    const dimKeys = ['power_distance', 'individualism', 'masculinity', 'uncertainty_avoidance', 'long_term_orientation', 'indulgence'];
    const dimLabels = ['Power\nDistance', 'Individualism', 'Masculinity', 'Uncertainty\nAvoidance', 'Long-Term\nOrientation', 'Indulgence'];
    const dimValues = dimKeys.map(k => {
      const dim = dims[k];
      return dim ? (typeof dim === 'object' ? dim.score || 50 : dim) : 50;
    });

    // Cultural fit percentage (inverse of barrier count)
    const highBarriers = dimValues.filter(v => v > 75).length;
    const lowBarriers = dimValues.filter(v => v < 25).length;
    const fitPct = Math.max(20, Math.min(95, 100 - (highBarriers * 12) - (lowBarriers * 6)));

    // Find cultural twin (country with similar Hofstede profile)
    const hofData = window.__hofstedeData || [];
    let twin = null;
    let minDist = Infinity;
    const homeHof = dimValues;
    hofData.forEach(c => {
      if (c.code === d.country) return;
      const dist = Math.sqrt(
        dimKeys.reduce((sum, k, i) => sum + Math.pow((c[k] || 50) - homeHof[i], 2), 0)
      );
      if (dist < minDist) { minDist = dist; twin = c; }
    });

    // Radar SVG
    const cx = 120, cy = 120, r = 90;
    const angleStep = (Math.PI * 2) / 6;
    const points = dimValues.map((v, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const pct = v / 100;
      return `${cx + r * pct * Math.cos(angle)},${cy + r * pct * Math.sin(angle)}`;
    });
    const gridLevels = [0.33, 0.66, 1];
    const gridPaths = gridLevels.map(lvl => {
      return dimKeys.map((_, i) => {
        const angle = -Math.PI / 2 + i * angleStep;
        return `${cx + r * lvl * Math.cos(angle)},${cy + r * lvl * Math.sin(angle)}`;
      }).join(' ');
    });
    const labelPos = dimLabels.map((label, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const lx = cx + (r + 28) * Math.cos(angle);
      const ly = cy + (r + 28) * Math.sin(angle);
      return { x: lx, y: ly, label };
    });

    let svg = `<svg viewBox="0 0 240 240" style="width:220px;height:220px;margin:0 auto;display:block">
      ${gridPaths.map(p => `<polygon points="${p}" fill="none" stroke="var(--cream-deeper)" stroke-width="1"/>`).join('')}
      <polygon points="${points.join(' ')}" fill="rgba(45,90,39,0.15)" stroke="var(--forest)" stroke-width="2"/>
      ${labelPos.map(l => `<text x="${l.x}" y="${l.y}" text-anchor="middle" dominant-baseline="middle" style="font-size:8px;fill:var(--ink-muted);font-family:var(--font-body)">${l.label.split('\n').map((t,j) => `<tspan x="${l.x}" dy="${j?'10':'0'}">${t}</tspan>`).join('')}</text>`).join('')}
    </svg>`;

    const adaptationTips = [];
    dimValues.forEach((v, i) => {
      const label = dimLabels[i].replace('\n', ' ');
      if (v > 75) adaptationTips.push(`<strong>${label} (${v})</strong> — Work with authority figures, not against them.`);
      else if (v < 25) adaptationTips.push(`<strong>${label} (${v})</strong> — Build personal connections; community matters here.`);
    });

    return `<div class="cultural-passport">
      <div class="passport-header">
        <div class="passport-stamp">&#x1F4C4;</div>
        <h3 class="passport-title">Cultural Fit Passport</h3>
        <p class="passport-sub">How your idea fits the cultural landscape of ${esc(country)}</p>
      </div>
      <div class="passport-body">
        <div class="passport-radar">
          ${svg}
          <div class="passport-fit-score">
            <span class="fit-number">${fitPct}%</span>
            <span class="fit-label">Cultural Fit</span>
          </div>
        </div>
        <div class="passport-details">
          <div class="passport-card">
            <div class="passport-card-label">Your Idea</div>
            <div class="passport-card-value">${esc(ideaType)} in ${esc(country)}</div>
          </div>
          ${twin ? `<div class="passport-card passport-twin">
            <div class="passport-card-label">&#x1F30D; Cultural Twin</div>
            <div class="passport-card-value">${esc(twin.name || twin.code)}</div>
            <div class="passport-card-note">Most similar cultural profile where social enterprises have succeeded</div>
          </div>` : ''}
          ${cultural.context_summary ? `<div class="passport-card">
            <div class="passport-card-label">Cultural Context</div>
            <div class="passport-card-value">${esc(cultural.context_summary)}</div>
          </div>` : ''}
          ${adaptationTips.length ? `<div class="passport-card">
            <div class="passport-card-label">Key Adaptations</div>
            <ul class="passport-tips">${adaptationTips.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>` : ''}
        </div>
      </div>
      <div class="passport-footer">
        <button class="passport-export-btn" onclick="window.__exportPassportPNG()">&#x1F4F8; Save as Image</button>
        <span class="passport-brand">${window.location.origin}?utm_source=passport&utm_medium=image&utm_campaign=cultural_passport</span>
      </div>
    </div>`;
  }

  // ─── IMPACT STORY ENGINE ───
  function renderStoryEngine(d) {
    const score = d.verdict?.total_score || 0;
    const pitch = d.verdict?.elevator_pitch || '';
    const ideaType = d.idea_type || 'social impact';
    const country = d.country_name || d.country || '';
    const sdgs = d.sdgs || {};
    const primarySDG = sdgs.primary?.name || '';
    const secondarySDG = sdgs.secondary?.name || '';
    const hook = d.marketplace_listing?.hook || d.idea || '';
    const firstStep = d.verdict?.first_step || '';
    const verdict = d.verdict?.verdict || '';

    const verdictEmoji = { GO: '&#x2705;', 'GO WITH EDUCATION': '&#x1F4A1;', PIVOT: '&#x1F504;', SHELVE: '&#x1F91D;' };

    // LinkedIn post
    const seeUrl = window.location.origin + '?utm_source=linkedin&utm_medium=share&utm_campaign=story_engine';
    const linkedinPost = `I just evaluated my social impact idea and scored ${score}/10.\n\n${verdictEmoji[verdict] || ''} ${hook}\n\nWhat I learned:\n${primarySDG ? `• Addresses ${primarySDG}` : ''}${secondarySDG ? `\n• Also impacts ${secondarySDG}` : ''}\n• Cultural fit analysis across 136 countries\n• Matched with real-world case studies\n\nMy first step: ${firstStep}\n\nWant to test your idea? Try the Socio-Economic Evaluator — free, no sign-up, results in 60 seconds.\n${seeUrl}\n\n#SocialImpact #SocialEnterprise #${ideaType.replace(/_/g, '')} #SDGs`;

    // Elevator pitch (60 seconds)
    const elevatorPitch = pitch || `"${hook}" scored ${score}/10. ${verdict === 'GO' ? 'This is ready to test.' : verdict === 'PIVOT' ? 'The problem is real but the approach needs to change.' : 'There are specific barriers to address first.'} ${firstStep}`;

    // WhatsApp status
    const whatsappStatus = `${verdictEmoji[verdict] || ''} My ${ideaType} idea scored ${score}/10. ${hook ? `"${hook}"` : ''} First step: ${firstStep}\n\n${window.location.origin}?utm_source=whatsapp&utm_medium=status&utm_campaign=story_engine`;

    function copyBtn(text, id) {
      return `<button class="story-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('${id}').textContent).then(()=>{this.textContent='Copied!';setTimeout(()=>{this.innerHTML='&#x1F4CB; Copy'},1500)})">&#x1F4CB; Copy</button>`;
    }

    return `<div class="story-engine">
      <div class="story-header">
        <div class="story-icon">&#x1F4DD;</div>
        <h3 class="story-title">Impact Story Engine</h3>
        <p class="story-sub">Ready-to-use narratives from your evaluation. Share your journey.</p>
      </div>
      <div class="story-cards">
        <div class="story-card">
          <div class="story-card-header">
            <span class="story-card-icon">&#x1F4AC;</span>
            <span class="story-card-label">LinkedIn Post</span>
          </div>
          <div class="story-card-body" id="story-linkedin">${esc(linkedinPost)}</div>
          <div class="story-card-footer">${copyBtn(linkedinPost, 'story-linkedin')}</div>
        </div>
        <div class="story-card">
          <div class="story-card-header">
            <span class="story-card-icon">&#x1F3A4;</span>
            <span class="story-card-label">60-Second Pitch</span>
          </div>
          <div class="story-card-body" id="story-elevator">${esc(elevatorPitch)}</div>
          <div class="story-card-footer">${copyBtn(elevatorPitch, 'story-elevator')}</div>
        </div>
        <div class="story-card">
          <div class="story-card-header">
            <span class="story-card-icon">&#x1F4F1;</span>
            <span class="story-card-label">WhatsApp Status</span>
          </div>
          <div class="story-card-body" id="story-whatsapp">${esc(whatsappStatus)}</div>
          <div class="story-card-footer">
            ${copyBtn(whatsappStatus, 'story-whatsapp')}
            <button class="story-share-btn" onclick="window.open('https://wa.me/?text='+encodeURIComponent(document.getElementById('story-whatsapp').textContent),'_blank')">&#x1F4AC; Share</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  // ─── SDG ALIGNMENT CERTIFICATE ───
  // Fallback SDG mapping by idea type
  const IDEA_SDG_MAP = {
    women: { primary: { number: 5, name: 'Gender Equality' }, secondary: { number: 10, name: 'Reduced Inequalities' } },
    safety: { primary: { number: 16, name: 'Peace, Justice and Strong Institutions' }, secondary: { number: 11, name: 'Sustainable Cities' } },
    elderly: { primary: { number: 3, name: 'Good Health and Well-Being' }, secondary: { number: 10, name: 'Reduced Inequalities' } },
    mental_health: { primary: { number: 3, name: 'Good Health and Well-Being' }, secondary: { number: 4, name: 'Quality Education' } },
    disaster: { primary: { number: 13, name: 'Climate Action' }, secondary: { number: 11, name: 'Sustainable Cities' } },
    health: { primary: { number: 3, name: 'Good Health and Well-Being' }, secondary: { number: 1, name: 'No Poverty' } },
    food: { primary: { number: 2, name: 'Zero Hunger' }, secondary: { number: 3, name: 'Good Health and Well-Being' } },
    water: { primary: { number: 6, name: 'Clean Water and Sanitation' }, secondary: { number: 3, name: 'Good Health and Well-Being' } },
    financial: { primary: { number: 8, name: 'Decent Work and Economic Growth' }, secondary: { number: 1, name: 'No Poverty' } },
    work: { primary: { number: 8, name: 'Decent Work and Economic Growth' }, secondary: { number: 4, name: 'Quality Education' } },
    education: { primary: { number: 4, name: 'Quality Education' }, secondary: { number: 5, name: 'Gender Equality' } },
    community: { primary: { number: 11, name: 'Sustainable Cities and Communities' }, secondary: { number: 16, name: 'Peace, Justice' } },
    environment: { primary: { number: 13, name: 'Climate Action' }, secondary: { number: 15, name: 'Life on Land' } },
    sustainability: { primary: { number: 12, name: 'Responsible Consumption' }, secondary: { number: 13, name: 'Climate Action' } },
    agriculture: { primary: { number: 2, name: 'Zero Hunger' }, secondary: { number: 15, name: 'Life on Land' } },
    energy: { primary: { number: 7, name: 'Affordable and Clean Energy' }, secondary: { number: 13, name: 'Climate Action' } },
    technology: { primary: { number: 9, name: 'Industry, Innovation and Infrastructure' }, secondary: { number: 4, name: 'Quality Education' } },
    housing: { primary: { number: 11, name: 'Sustainable Cities and Communities' }, secondary: { number: 1, name: 'No Poverty' } },
    rights: { primary: { number: 16, name: 'Peace, Justice and Strong Institutions' }, secondary: { number: 5, name: 'Gender Equality' } },
    inclusion: { primary: { number: 10, name: 'Reduced Inequalities' }, secondary: { number: 16, name: 'Peace, Justice' } },
  };

  function renderSDGCertificate(d) {
    const score = d.verdict?.total_score || 0;
    const sdgs = d.sdgs || {};
    const ideaType = d.idea_type || 'social impact';
    const fallback = IDEA_SDG_MAP[ideaType] || IDEA_SDG_MAP.community;

    // Merge: prefer API data, fallback to idea-type mapping
    const primary = (sdgs.primary && sdgs.primary.number) ? sdgs.primary : fallback.primary;
    const secondary = (sdgs.secondary && sdgs.secondary.number) ? sdgs.secondary : fallback.secondary;
    const country = d.country_name || d.country || '';
    const hook = d.marketplace_listing?.hook || d.idea || '';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const sdgColors = {
      1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
      6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
      11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
      16: '#00689D', 17: '#19486A'
    };

    const primaryColor = sdgColors[primary.number] || '#2d5a27';
    const secondaryColor = sdgColors[secondary.number] || '#4a8c3f';

    const cultural = d.cultural || {};
    const fitScore = cultural.cultural_compatibility_score || cultural.score || Math.round(score * 0.8);

    return `<div class="certificate-wrap">
      <div class="certificate" id="sdg-certificate">
        <div class="cert-border">
          <div class="cert-header">
            <div class="cert-logo">&#x1F33F;</div>
            <div class="cert-org">Socio-Economic Evaluator</div>
          </div>
          <div class="cert-title">Social Impact Idea Certificate</div>
          <div class="cert-hook">"${esc(hook)}"</div>
          <div class="cert-scores">
            <div class="cert-score-item">
              <div class="cert-score-num" style="color:${primaryColor}">${score}</div>
              <div class="cert-score-label">/10 Score</div>
            </div>
            <div class="cert-score-divider"></div>
            <div class="cert-score-item">
              <div class="cert-score-num" style="color:var(--forest)">${fitScore}</div>
              <div class="cert-score-label">Cultural Fit</div>
            </div>
          </div>
          <div class="cert-sdg-row">
            ${primary.number ? `<div class="cert-sdg-badge" style="background:${primaryColor}"><span>SDG ${primary.number}</span><span>${esc(primary.name || '')}</span></div>` : ''}
            ${secondary.number ? `<div class="cert-sdg-badge" style="background:${secondaryColor}"><span>SDG ${secondary.number}</span><span>${esc(secondary.name || '')}</span></div>` : ''}
          </div>
          ${primary.plain_explanation ? `<div class="cert-explanation">${esc(primary.plain_explanation)}</div>` : ''}
          <div class="cert-meta">
            <span>${esc(country)} &middot; ${esc(ideaType)}</span>
            <span>${date}</span>
          </div>
          <div class="cert-footer">
            <span>Deep analysis across 136 countries and 182+ case studies &middot; ${window.location.origin}?utm_source=certificate&utm_medium=image&utm_campaign=sdg_cert</span>
          </div>
        </div>
      </div>
      <div class="cert-actions">
        <button class="cert-export-btn" onclick="window.__exportCertificatePNG()">&#x1F4F8; Save as PNG</button>
        <button class="cert-export-btn secondary" onclick="window.__exportCertificateText()">&#x1F4CB; Copy Text</button>
      </div>
    </div>`;
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

    const canvasId = 'canvas-' + Math.random().toString(36).slice(2, 8);

    return `<div class="canvas-actions" style="display:flex;gap:0.5rem;margin-bottom:1rem">
      <button class="canvas-export-btn" onclick="window.__exportCanvasPNG('${canvasId}')" style="padding:0.4rem 0.8rem;border-radius:99px;border:1.5px solid var(--forest);background:var(--forest);color:white;font-size:0.75rem;font-weight:600;cursor:pointer;font-family:var(--font-body)">&#x1F4F8; Save as PNG</button>
      <button class="canvas-export-btn" onclick="window.__exportCanvasText('${canvasId}')" style="padding:0.4rem 0.8rem;border-radius:99px;border:1.5px solid var(--border);background:white;color:var(--ink);font-size:0.75rem;font-weight:600;cursor:pointer;font-family:var(--font-body)">&#x1F4CB; Copy Text</button>
    </div>
    <div id="${canvasId}" class="canvas-grid" style="background:white;padding:1.5rem;border-radius:12px;border:1px solid var(--border)">
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

  // ─── MENTOR COUNCIL RENDERER ───
  function renderMentorCouncil(mentors, verdict) {
    if (!Array.isArray(mentors) || mentors.length === 0) {
      return '<p style="color:var(--ink-muted)">No mentor matches found for this idea.</p>';
    }

    const zoneLabels = {
      south_asia: 'South Asia', southeast_asia: 'Southeast Asia', east_asia: 'East Asia',
      sub_saharan_africa: 'Sub-Saharan Africa', latin_america: 'Latin America',
      mena: 'Middle East & North Africa', north_america: 'North America',
      europe: 'Europe', central_asia: 'Central Asia', oceania: 'Oceania'
    };

    const stageIcons = { idea: '&#x1F4A1;', proof: '&#x1F9EA;', scale: '&#x1F680;', system: '&#x1F3E2;' };
    const stageLabels = { idea: 'Idea Stage', proof: 'Proof Stage', scale: 'Scale Stage', system: 'System Change' };

    const scoreTier = mentors[0]?.score_tier || 'mid_score';
    const tierLabels = { low_score: 'Early Stage', mid_score: 'Building Proof', high_score: 'Scaling Up' };
    const tierLabel = tierLabels[scoreTier] || 'Your Stage';

    let html = `<div class="mentor-council-header">
      <div class="section-label">Mentor Personas</div>
      <h2 class="section-title">Your Mentor Council</h2>
      <p class="section-sub">Real playbooks from social enterprise leaders who solved problems like yours. Matched to your idea, your context, and your current stage.</p>
      <div class="mentor-stage-badge">${esc(tierLabel)}</div>
    </div>`;

    html += '<div class="mentor-council-grid">';
    mentors.forEach((m, idx) => {
      html += `<div class="mentor-card">
        <div class="mentor-card-header">
          <div class="mentor-avatar">${esc(m.name?.charAt(0) || '?')}</div>
          <div class="mentor-meta">
            <h3 class="mentor-name">${esc(m.name)}</h3>
            <div class="mentor-title">${esc(m.title)}</div>
            <div class="mentor-zone">${zoneLabels[m.zone] || esc(m.zone)} &middot; ${esc(m.country)}</div>
          </div>
        </div>

        <div class="mentor-bio">${esc(m.bio)}</div>

        <div class="mentor-philosophy">
          <div class="mentor-philosophy-label">Philosophy</div>
          <div class="mentor-philosophy-text">${esc(m.philosophy)}</div>
          ${m.quote ? `<div class="mentor-quote">"${esc(m.quote)}"</div>` : ''}
        </div>

        <div class="mentor-playbook">
          <div class="mentor-playbook-label">Playbook for You</div>
          <h4 class="mentor-playbook-title">${esc(m.playbook_title)}</h4>
          <p class="mentor-playbook-advice">${esc(m.playbook_advice)}</p>
          ${m.playbook_actions && m.playbook_actions.length ? `
            <div class="mentor-playbook-actions">
              <div class="mentor-actions-label">Your Actions</div>
              <ol>${m.playbook_actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>
            </div>` : ''}
        </div>

        ${m.model_stages ? `<div class="mentor-journey">
          <div class="mentor-journey-label">How They Did It</div>
          <div class="mentor-journey-stages">
            ${['idea', 'proof', 'scale', 'system'].filter(s => m.model_stages[s]).map((s) => `
              <div class="mentor-stage">
                <div class="mentor-stage-icon">${stageIcons[s]}</div>
                <div class="mentor-stage-name">${stageLabels[s]}</div>
                <div class="mentor-stage-text">${esc(m.model_stages[s])}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}

        ${m.warning ? `<div class="mentor-warning">
          <div class="mentor-warning-label">&#x26A0;&#xFE0F; What They'd Warn Against</div>
          <p>${esc(m.warning)}</p>
        </div>` : ''}
      </div>`;
    });
    html += '</div>';

    return html;
  }

  // ─── MENTORS GALLERY (Standalone) ───
  let _mentorPersonas = [];

  async function loadMentorPersonas() {
    if (_mentorPersonas.length) return _mentorPersonas;
    try {
      const resp = await fetch('/api/reference?data=personas');
      if (!resp.ok) return [];
      const json = await resp.json();
      _mentorPersonas = json.data || [];
      return _mentorPersonas;
    } catch (_) { return []; }
  }

  async function renderMentorsGallery(zone) {
    const grid = $('#mentorsGrid');
    if (!grid) return;
    const personas = await loadMentorPersonas();
    if (!personas.length) {
      grid.innerHTML = '<div class="mentors-empty">No mentor personas available. Run an evaluation to populate the mentor council.</div>';
      return;
    }

    const zoneLabels = { south_asia: 'South Asia', east_asia: 'East Asia', southeast_asia: 'SE Asia', sub_saharan_africa: 'Sub-Saharan Africa', mena: 'MENA', latin_america: 'Latin America', north_america: 'North America', europe: 'Europe' };

    const filtered = zone === 'all' ? personas : personas.filter((p) => p.zone === zone);

    if (!filtered.length) {
      grid.innerHTML = '<div class="mentors-empty">No mentors found for this region.</div>';
      return;
    }

    grid.innerHTML = filtered.map((p) => {
      const initials = (p.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      const categories = (p.categories || []).map((c) => `<span class="mentor-gallery-cat">${esc(c)}</span>`).join('');

      return `<div class="mentor-gallery-card" data-zone="${esc(p.zone || '')}">
        <div class="mentor-gallery-card-inner">
          <div class="mentor-gallery-top">
            <div class="mentor-gallery-avatar">${esc(initials)}</div>
            <div class="mentor-gallery-info">
              <h4>${esc(p.name)}</h4>
              <span class="mentor-gallery-title">${esc(p.title)}</span>
            </div>
          </div>
          <div class="mentor-gallery-zone">${esc(zoneLabels[p.zone] || p.zone)} · ${esc(p.country || '')}</div>
          <div class="mentor-gallery-bio">${esc(p.bio)}</div>
          ${p.quote ? `<div class="mentor-gallery-quote">"${esc(p.quote)}"</div>` : ''}
          ${p.philosophy ? `<div class="mentor-gallery-philosophy"><strong>Philosophy</strong>${esc(p.philosophy)}</div>` : ''}
          ${categories ? `<div class="mentor-gallery-categories">${categories}</div>` : ''}
        </div>
      </div>`;
    }).join('');
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
  let _marketplaceData = null;

  async function renderMarketplaceGallery(filter) {
    const grid = $('#marketplaceGrid');
    if (!grid) return;

    // Fetch from database if not cached
    if (!_marketplaceData) {
      try {
        const resp = await fetch('/api/reference?data=leaderboard&limit=50');
        const json = await resp.json();
        const listings = json.data || [];

        // Also merge localStorage user ideas
        let localItems = [];
        try { localItems = JSON.parse(localStorage.getItem('see_marketplace') || '[]'); } catch (_) {}

        _marketplaceData = [...localItems, ...listings];
      } catch (_) {
        // Fallback to localStorage only
        try { _marketplaceData = JSON.parse(localStorage.getItem('see_marketplace') || '[]'); } catch (_) { _marketplaceData = []; }
      }
    }

    const items = filter === 'all' ? _marketplaceData : _marketplaceData.filter((i) => i.badge === filter);

    if (!items.length) {
      grid.innerHTML = '<div class="marketplace-empty"><div class="marketplace-empty-icon">&#x1F50D;</div><p>No ideas match this filter yet.</p><p style="font-size:0.85rem;margin-top:0.5rem"><a href="#try">Evaluate your idea</a> to be the first.</p></div>';
      return;
    }

    const sdgColors = { 1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A' };

    grid.innerHTML = items.map((item) => {
      const sdgHtml = (item.sdg_tags || []).map((s) =>
        `<span class="marketplace-sdg-tag" style="background:${sdgColors[s.n || s.number] || '#888'}">SDG ${s.n || s.number}: ${esc(s.name || s.n || '')}</span>`
      ).join('');
      const score = item.score ? Number(item.score).toFixed(1) : null;
      const region = item.region || item.eval_type || '';
      return `<div class="marketplace-card badge-${item.badge}" data-badge="${item.badge}">
        <div class="marketplace-card-top"><span class="marketplace-badge ${item.badge}">${esc(item.badge_label || item.badge)}</span>${score ? `<span class="marketplace-card-score">${score}/10</span>` : ''}</div>
        <div class="marketplace-card-type">${esc(item.idea_type || item.idea_type_display || 'Social Impact')}</div>
        <div class="marketplace-card-hook">${esc(item.hook || '')}</div>
        ${sdgHtml ? `<div class="marketplace-card-sdgs">${sdgHtml}</div>` : ''}
        ${region ? `<div class="marketplace-card-region">&#x1F4CD; ${esc(region)}</div>` : ''}
        <button class="marketplace-card-upvotes" data-listing-id="${item.id}" data-upvotes="${item.upvotes || 0}">&#x1F44D; <span class="upvote-count">${item.upvotes || 0}</span></button>
      </div>`;
    }).join('');
  }

  // ─── PERSIST LAST EVALUATION ───
  function saveLastEvaluation(data) {
    try {
      localStorage.setItem('see_last_eval', JSON.stringify(data));
      localStorage.setItem('see_last_eval_time', Date.now().toString());

      // Also save to history (keep last 10)
      const history = JSON.parse(localStorage.getItem('see_eval_history') || '[]');
      const entry = {
        id: 'local_' + Date.now(),
        idea_text: (data._input?.problem || '') + ' ' + (data._input?.goal || ''),
        score: data.verdict?.total_score,
        verdict: data.verdict?.verdict,
        verdict_label: data.verdict?.verdict === 'GO' ? 'READY TO TEST' : data.verdict?.verdict === 'PIVOT' ? 'CHANGE YOUR APPROACH' : data.verdict?.verdict,
        country: data.country_name || data.country || '',
        idea_type: data.idea_type || '',
        created_at: new Date().toISOString(),
        result_json: data,
      };
      // Deduplicate by idea text (don't add if same idea was just evaluated)
      const recentDuplicate = history.find(h => h.idea_text.trim() === entry.idea_text.trim());
      if (!recentDuplicate) {
        history.unshift(entry);
        localStorage.setItem('see_eval_history', JSON.stringify(history.slice(0, 10)));
      }
    } catch (_) { /* quota exceeded or private mode */ }
  }

  function loadLastEvaluation() {
    try {
      const raw = localStorage.getItem('see_last_eval');
      const time = localStorage.getItem('see_last_eval_time');
      if (!raw || !time) return null;
      // Expire after 7 days
      if (Date.now() - parseInt(time) > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('see_last_eval');
        localStorage.removeItem('see_last_eval_time');
        return null;
      }
      return JSON.parse(raw);
    } catch (_) { return null; }
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
        _marketplaceData = null; // invalidate cache
        renderMarketplaceGallery('all');
      }
    } catch (_) { /* ignore */ }
  }

  // ─── SAVE EVALUATION TO DATABASE ───
  async function saveEvaluationToDB(data) {
    if (!isLoggedIn()) return;
    try {
      const ideaText = data._input?.problem + '. ' + data._input?.goal;
      const resp = await fetch('/api/evaluations?action=save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getAuthToken(),
        },
        body: JSON.stringify({
          idea_text: ideaText,
          result: data,
        }),
      });
      const result = await resp.json();
      if (result.error) console.warn('DB save failed:', result.error);
    } catch (err) {
      console.warn('DB save failed:', err.message);
    }
  }

  // ─── AUTH MODULE ───
  const AUTH_TOKEN_KEY = 'see_token';
  const AUTH_USER_KEY = 'see_user';

  function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
  function getAuthUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'); } catch (_) { return null; }
  }
  function isLoggedIn() { return !!getAuthToken(); }

  function setAuth(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    updateAuthUI();
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    updateAuthUI();
  }

  async function apiAuth(action, body) {
    const res = await fetch('/api/auth?action=' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function apiAuthGet(action) {
    const res = await fetch('/api/auth?action=' + action, {
      headers: { 'Authorization': 'Bearer ' + getAuthToken() },
    });
    return res.json();
  }

  async function apiEvaluationsGet(action) {
    const res = await fetch('/api/evaluations?action=' + action, {
      headers: { 'Authorization': 'Bearer ' + getAuthToken() },
    });
    return res.json();
  }

  function updateAuthUI() {
    const loggedOut = $('#navAuthLoggedOut');
    const loggedIn = $('#navAuthLoggedIn');
    const userName = $('#navUserName');
    const userAvatar = $('#navUserAvatar');

    if (!loggedOut || !loggedIn) return;

    if (isLoggedIn()) {
      loggedOut.style.display = 'none';
      loggedIn.style.display = 'flex';
      const user = getAuthUser();
      if (userName) userName.textContent = user?.name || 'User';
      if (userAvatar) userAvatar.textContent = (user?.name || 'U').charAt(0).toUpperCase();
    } else {
      loggedOut.style.display = 'flex';
      loggedIn.style.display = 'none';
    }
  }

  // Auth modal
  let authMode = 'login';

  function showAuthModal(mode) {
    authMode = mode || 'login';
    const overlay = $('#authOverlay');
    const title = $('#authTitle');
    const sub = $('#authSub');
    const nameField = $('#authNameField');
    const submit = $('#authSubmit');
    const toggle = $('#authToggle');
    const error = $('#authError');

    if (overlay) overlay.style.display = 'flex';
    if (error) error.textContent = '';

    if (authMode === 'register') {
      if (title) title.textContent = 'Create Account';
      if (sub) sub.textContent = 'Save evaluations, track progress, and get personalized mentor matches.';
      if (nameField) nameField.style.display = 'block';
      if (submit) submit.textContent = 'Create Account';
      if (toggle) toggle.innerHTML = 'Already have an account? <a href="#" id="authToggleLink">Sign in</a>';
    } else {
      if (title) title.textContent = 'Sign In';
      if (sub) sub.textContent = 'Save your evaluations and track your progress.';
      if (nameField) nameField.style.display = 'none';
      if (submit) submit.textContent = 'Sign In';
      if (toggle) toggle.innerHTML = 'Don\'t have an account? <a href="#" id="authToggleLink">Create one</a>';
    }
  }

  function hideAuthModal() {
    const overlay = $('#authOverlay');
    if (overlay) overlay.style.display = 'none';
    const form = $('#authForm');
    if (form) form.reset();
    const error = $('#authError');
    if (error) error.textContent = '';
  }

  async function handleAuthSubmit() {
    const email = $('#authEmail')?.value?.trim();
    const password = $('#authPassword')?.value;
    const name = $('#authName')?.value?.trim();
    const error = $('#authError');
    const submit = $('#authSubmit');

    if (error) error.textContent = '';

    if (!email || !password) {
      if (error) error.textContent = 'Email and password are required.';
      return;
    }
    if (authMode === 'register' && (!name || name.length < 2)) {
      if (error) error.textContent = 'Name is required (min 2 characters).';
      return;
    }
    if (password.length < 8) {
      if (error) error.textContent = 'Password must be at least 8 characters.';
      return;
    }

    if (submit) { submit.disabled = true; submit.textContent = 'Please wait...'; }

    try {
      const action = authMode === 'register' ? 'register' : 'login';
      const body = authMode === 'register' ? { email, password, name } : { email, password };
      const data = await apiAuth(action, body);

      if (data.error) {
        if (error) error.textContent = data.error;
        return;
      }

      setAuth(data.token, data.user);
      hideAuthModal();
      showToast('Welcome, ' + (data.user.name || 'there') + '!', 'success');
    } catch (err) {
      if (error) error.textContent = 'Network error. Please try again.';
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = authMode === 'register' ? 'Create Account' : 'Sign In'; }
    }
  }

  // showToast defined above at line 181; no duplicate needed here

  // My Evaluations panel
  async function showMyEvaluations() {
    const dropdown = $('#navDropdown');
    if (dropdown) dropdown.style.display = 'none';

    let evals = [];

    // Try DB first (if logged in)
    if (isLoggedIn()) {
      try {
        const data = await apiEvaluationsGet('list');
        if (data.evaluations) evals = data.evaluations;
      } catch (_) {}
    }

    // Fallback: load from localStorage history
    if (!evals.length) {
      try {
        const history = JSON.parse(localStorage.getItem('see_eval_history') || '[]');
        if (history.length) {
          evals = history;
        }
      } catch (_) {}
    }

    // Last resort: single evaluation
    if (!evals.length) {
      const local = loadLastEvaluation();
      if (local && local.verdict) {
        evals = [{
          id: 'local',
          idea_text: (local._input?.problem || '') + ' ' + (local._input?.goal || ''),
          score: local.verdict?.total_score,
          verdict: local.verdict?.verdict,
          verdict_label: local.verdict?.verdict === 'GO' ? 'READY TO TEST' : local.verdict?.verdict === 'PIVOT' ? 'CHANGE YOUR APPROACH' : local.verdict?.verdict,
          created_at: localStorage.getItem('see_last_eval_time') ? new Date(parseInt(localStorage.getItem('see_last_eval_time'))).toISOString() : new Date().toISOString(),
          result_json: local,
        }];
      }
    }

    try {
      let html = '<div class="my-evals-panel">';
      html += '<div class="my-evals-header"><h3>My Evaluations</h3><button class="my-evals-close" id="myEvalsClose">&times;</button></div>';

      if (evals.length > 0) {
        html += `<div class="my-evals-counter">${evals.length} evaluation${evals.length !== 1 ? 's' : ''}</div>`;
      }

      if (evals.length === 0) {
        html += '<div class="my-evals-empty">No evaluations yet. <a href="#try">Evaluate your first idea</a></div>';
      } else {
        html += '<div class="my-evals-list">';
        evals.forEach((ev) => {
          const date = new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const score = ev.score ? Number(ev.score).toFixed(1) : '?';
          const verdict = ev.verdict_label || ev.verdict || '';
          const idea = ev.idea_text ? ev.idea_text.slice(0, 80) + (ev.idea_text.length > 80 ? '...' : '') : '';
          html += `<div class="my-eval-card" data-id="${ev.id}">
            <div class="my-eval-top">
              <span class="my-eval-score">${esc(score)}</span>
              <span class="my-eval-verdict">${esc(verdict)}</span>
              <span class="my-eval-date">${esc(date)}</span>
            </div>
            <div class="my-eval-idea">${esc(idea)}</div>
          </div>`;
        });
        html += '</div>';
      }

      html += '</div>';

      // Show as a modal/panel
      let overlay = document.querySelector('.my-evals-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'my-evals-overlay';
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = html;
      overlay.style.display = 'flex';

      const closeBtn = document.getElementById('myEvalsClose');
      if (closeBtn) closeBtn.onclick = () => { overlay.style.display = 'none'; };
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
    } catch (err) {
      showToast('Failed to load evaluations.', 'error');
    }
  }

  // ─── QUICK EVALUATE ───
  const SDG_COLORS = { 1:'#E5243B',2:'#DDA63A',3:'#4C9F38',4:'#C5192D',5:'#FF3A21',6:'#26BDE2',7:'#FCC30B',8:'#A21942',9:'#FD6925',10:'#DD1367',11:'#FD9D24',12:'#BF8B2E',13:'#3F7E44',14:'#0A97D9',15:'#56C02B',16:'#00689D',17:'#19486A' };
  const SDG_ICONS = { 1:'&#x1F4B0;',2:'&#x1F33E;',3:'&#x1FA7A;',4:'&#x1F4DA;',5:'&#x2640;',6:'&#x1F4A7;',7:'&#x2600;',8:'&#x1F4BC;',9:'&#x1F527;',10:'&#x2696;',11:'&#x1F3D8;',12:'&#x267B;',13:'&#x1F30D;',14:'&#x1F41F;',15:'&#x1F333;',16:'&#x262E;',17:'&#x1F91D;' };
  const typeToSDG = { women:5, safety:16, elderly:3, mental_health:3, disaster:13, health:3, food:2, water:6, financial:8, work:8, education:4, community:11, environment:13, energy:7, technology:9 };
  const countryEmojis = { IN:'&#x1F1EE;&#x1F1F3;', BD:'&#x1F1E7;&#x1F1E9;', KE:'&#x1F1F0;&#x1F1EA;', JP:'&#x1F1EF;&#x1F1F5;', UG:'&#x1F1FA;&#x1F1EC;', JO:'&#x1F1EF;&#x1F1F4;', NG:'&#x1F1F3;&#x1F1EC;', PH:'&#x1F1F5;&#x1F1ED;', CO:'&#x1F1E8;&#x1F1F4;', MX:'&#x1F1F2;&#x1F1FD;', US:'&#x1F1FA;&#x1F1F8;', GB:'&#x1F1EC;&#x1F1E7;', BR:'&#x1F1E7;&#x1F1F7', ET:'&#x1F1EA;&#x1F1F9', RW:'&#x1F1F7;&#x1F1FC' };

  async function initQuickEval() {
    const grid = $('#quick-eval-grid');
    const resultEl = $('#quick-eval-result');
    if (!grid) return;

    try {
      const resp = await fetch('/api/reference?data=templates');
      const json = await resp.json();
      const templates = json.data || [];

      if (!templates.length) {
        grid.innerHTML = '<div class="quick-eval-loading">No ready questions available yet.</div>';
        return;
      }

      grid.innerHTML = templates.map(t => {
        const score = parseFloat(t.score) || 7;
        const verdictClass = t.verdict?.includes('PIVOT') ? 'pivot' : t.verdict?.includes('EDUCATION') ? 'go-edu' : 'go';
        const sdgNum = typeToSDG[t.category] || 8;
        const sdgColor = SDG_COLORS[sdgNum] || '#888';
        const emoji = countryEmojis[t.country] || '&#x1F30D;';
        const problem = t.problem || t.label || '';
        return `
          <div class="qe-card" data-template-id="${t.id}">
            <div class="qe-card-top">
              <div class="qe-card-score-ring" style="--ring-color:${score >= 7.5 ? 'var(--forest)' : score >= 6 ? 'var(--amber)' : 'var(--terracotta)'}">
                <span>${score}</span>
              </div>
              <div class="qe-card-badges">
                <span class="qe-badge qe-badge-verdict ${verdictClass}">${escHtml(t.verdict || 'GO')}</span>
              </div>
            </div>
            <div class="qe-card-title">${escHtml(t.label)}</div>
            <div class="qe-card-problem">${escHtml(problem.length > 90 ? problem.slice(0, 87) + '...' : problem)}</div>
            <div class="qe-card-footer">
              <span class="qe-tag qe-country">${emoji} ${escHtml(t.country || '')}</span>
              <span class="qe-tag qe-category">${escHtml(t.category || '')}</span>
              <span class="qe-tag qe-sdg" style="background:${sdgColor}">SDG ${sdgNum}</span>
            </div>
          </div>
        `;
      }).join('');

      grid.addEventListener('click', async (e) => {
        const card = e.target.closest('.qe-card');
        if (!card) return;
        const id = card.dataset.templateId;

        grid.querySelectorAll('.qe-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        try {
          const r2 = await fetch(`/api/reference?data=template&id=${encodeURIComponent(id)}`);
          const j2 = await r2.json();
          const tpl = j2.data;
          const res = tpl?.sample_result;
          if (!res) {
            resultEl.innerHTML = '<div class="qe-result-empty">No result data available.</div>';
            resultEl.classList.remove('hidden');
            return;
          }

          const v = res.verdict || {};
          const sdg = res.sdgs || {};
          const primary = sdg.primary || {};
          const cultural = res.cultural || {};
          const caseStudy = res.case_study || {};
          const bootstrapper = res.bootstrapper || {};
          const pow = v.proof_of_work || {};
          const sdgNum = primary.number || typeToSDG[res.idea_type] || 8;
          const sdgColor = SDG_COLORS[sdgNum] || '#888';
          const emoji = countryEmojis[res.country] || '&#x1F30D;';
          const score = v.total_score || tpl.score || 7;
          const verdictLabel = { GO: 'READY TO TEST', 'GO WITH EDUCATION': 'GOOD, BUT FIX ONE THING FIRST', PIVOT: 'CHANGE YOUR APPROACH', SHELVE: 'HIGH BARRIERS RIGHT NOW' };
          const cls = score >= 8 ? 'go' : score >= 6 ? 'edu' : score >= 4 ? 'pivot' : 'shelve';

          resultEl.innerHTML = `
            <button class="qe-result-close" onclick="this.parentElement.classList.add('hidden')">&times;</button>

            <!-- Header -->
            <div class="qe-result-header qe-${cls}">
              <div class="qe-result-score-circle">${score}</div>
              <div class="qe-result-header-text">
                <div class="qe-result-verdict-label">${verdictLabel[v.verdict] || v.verdict || 'EVALUATED'}</div>
                <div class="qe-result-idea">${escHtml(res.idea || tpl.label)}</div>
                <div class="qe-result-location">${emoji} ${escHtml(res.country_name || res.country || '')} &middot; ${escHtml(res.idea_type || tpl.category || '')}</div>
              </div>
            </div>

            <!-- SDG + Impact row -->
            <div class="qe-result-row">
              <div class="qe-result-sdg-badge" style="background:${sdgColor}">
                <span class="qe-sdg-icon">${SDG_ICONS[sdgNum] || '&#x1F30D;'}</span>
                <div>
                  <div class="qe-sdg-num">SDG ${sdgNum}</div>
                  <div class="qe-sdg-name">${escHtml(primary.name || '')}</div>
                </div>
              </div>
              ${res.impact ? `<div class="qe-result-impact">
                <div class="qe-impact-score">${res.impact.score || '—'}<span>/100</span></div>
                <div class="qe-impact-label">Impact Score</div>
              </div>` : ''}
            </div>

            <!-- What it does -->
            ${v.elevator_pitch ? `<div class="qe-result-section">
              <div class="qe-section-label">&#x1F4AC; The Pitch</div>
              <div class="qe-section-body qe-pitch">${escHtml(v.elevator_pitch)}</div>
            </div>` : ''}

            <!-- Cultural context -->
            ${cultural.context_summary ? `<div class="qe-result-section">
              <div class="qe-section-label">&#x1F30D; Cultural Context</div>
              <div class="qe-section-body">${escHtml(cultural.context_summary)}</div>
            </div>` : ''}

            <!-- Case study -->
            ${caseStudy.title ? `<div class="qe-result-section">
              <div class="qe-section-label">&#x1F4DA; Who Did Something Similar</div>
              <div class="qe-case-title">${escHtml(caseStudy.title)}</div>
              ${caseStudy.narrative ? `<div class="qe-section-body">${escHtml(caseStudy.narrative.length > 200 ? caseStudy.narrative.slice(0, 197) + '...' : caseStudy.narrative)}</div>` : ''}
              ${caseStudy.expert ? `<div class="qe-case-quote">&ldquo;${escHtml(caseStudy.expert)}&rdquo;${caseStudy.expert_name ? ` — ${escHtml(caseStudy.expert_name)}` : ''}</div>` : ''}
            </div>` : ''}

            <!-- Bootstrapper -->
            ${bootstrapper.take ? `<div class="qe-result-section">
              <div class="qe-section-label">&#x1F680; Can You Start With Nothing?</div>
              <div class="qe-section-body">${escHtml(bootstrapper.take)}</div>
              <div class="qe-bootstrapper-scores">
                <span>Easy: ${bootstrapper.easy || '—'}/10</span>
                <span>Feasible: ${bootstrapper.feasible || '—'}/10</span>
                <span>Efforts: ${bootstrapper.efforts || '—'}/10</span>
              </div>
            </div>` : ''}

            <!-- 14-Day Plan -->
            ${pow.week_1 ? `<div class="qe-result-section">
              <div class="qe-section-label">&#x1F4C5; Your First 14 Days</div>
              <div class="qe-plan-grid">
                ${pow.week_1.day_1_2 ? `<div class="qe-plan-item"><div class="qe-plan-day">Day 1–2</div><div class="qe-plan-text">${escHtml(pow.week_1.day_1_2)}</div></div>` : ''}
                ${pow.week_1.day_3_4 ? `<div class="qe-plan-item"><div class="qe-plan-day">Day 3–4</div><div class="qe-plan-text">${escHtml(pow.week_1.day_3_4)}</div></div>` : ''}
                ${pow.week_1.day_5_7 ? `<div class="qe-plan-item"><div class="qe-plan-day">Day 5–7</div><div class="qe-plan-text">${escHtml(pow.week_1.day_5_7)}</div></div>` : ''}
                ${pow.week_2?.day_8_10 ? `<div class="qe-plan-item"><div class="qe-plan-day">Day 8–10</div><div class="qe-plan-text">${escHtml(pow.week_2.day_8_10)}</div></div>` : ''}
                ${pow.week_2?.day_11_12 ? `<div class="qe-plan-item"><div class="qe-plan-day">Day 11–12</div><div class="qe-plan-text">${escHtml(pow.week_2.day_11_12)}</div></div>` : ''}
                ${pow.week_2?.day_13_14 ? `<div class="qe-plan-item"><div class="qe-plan-day">Day 13–14</div><div class="qe-plan-text">${escHtml(pow.week_2.day_13_14)}</div></div>` : ''}
              </div>
              ${pow.success_criteria ? `<div class="qe-success-criteria"><strong>Success:</strong> ${escHtml(pow.success_criteria)}</div>` : ''}
            </div>` : ''}

            <!-- First Step CTA -->
            ${v.first_step ? `<div class="qe-result-cta">
              <div class="qe-cta-label">&#x1F680; Do This Today</div>
              <div class="qe-cta-text">${escHtml(v.first_step)}</div>
              <a href="#try" class="qe-cta-btn" onclick="this.closest('.quick-eval-result').classList.add('hidden')">Evaluate Your Own Idea &#x2192;</a>
            </div>` : ''}
          `;
          resultEl.classList.remove('hidden');
          resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch (err) {
          resultEl.innerHTML = '<div class="qe-result-empty">Failed to load result. Please try again.</div>';
          resultEl.classList.remove('hidden');
        }
      });
    } catch (err) {
      grid.innerHTML = '<div class="quick-eval-loading">Could not load ready questions.</div>';
    }
  }

  // ─── HELPER: Clean JSONB values into readable text ───
  function cleanJsonb(val, maxLen) {
    if (!val) return '';
    let text = '';
    if (typeof val === 'string') {
      text = val.replace(/^"|"$/g, '').replace(/\\"/g, '"');
      if (text.startsWith('[') || text.startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) text = parsed.join(', ');
          else if (typeof parsed === 'object') text = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
        } catch (_) {}
      }
    } else if (Array.isArray(val)) {
      text = val.join(', ');
    } else if (typeof val === 'object') {
      text = Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
    if (maxLen && text.length > maxLen) text = text.slice(0, maxLen - 3) + '…';
    return text;
  }

  // ─── CASE STUDY EXPLORER ───
  let _allCaseStudies = [];
  let _explorerFilters = { cat: 'all', zone: 'all', status: 'all' };

  async function initExplorer() {
    const grid = $('#explorerGrid');
    const countEl = $('#explorerCount');
    const moreEl = $('#explorerMore');
    if (!grid) return;

    if (!_allCaseStudies.length) {
      try {
        const resp = await fetch('/api/reference?data=cases&limit=200');
        const json = await resp.json();
        _allCaseStudies = json.data || [];
      } catch (_) {}
      if (!_allCaseStudies.length) {
        try {
          const libResp = await fetch('case-studies/library.json');
          const lib = await libResp.json();
          _allCaseStudies = lib.case_studies || [];
        } catch (_) {}
      }
    }

    const PAGE = 18;
    let _query = '';
    let _shown = PAGE;

    function render(reset) {
      if (reset) _shown = PAGE;

      const filtered = _allCaseStudies.filter(cs => {
        if (_explorerFilters.cat !== 'all' && cs.category !== _explorerFilters.cat) return false;
        if (_explorerFilters.zone !== 'all' && cs.zone !== _explorerFilters.zone) return false;
        if (_explorerFilters.status === 'active' && cs.status === 'failed') return false;
        if (_explorerFilters.status === 'failed' && cs.status !== 'failed') return false;
        if (_query) {
          const q = _query.toLowerCase();
          const hay = ((cs.title || '') + ' ' + (cs.organization || '') + ' ' + (cs.key_lesson || '') + ' ' + (cs.category || '') + ' ' + (cs.country || '')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      if (!filtered.length) {
        grid.innerHTML = '<div class="explorer-empty">No results. Try different filters.</div>';
        if (countEl) countEl.textContent = '';
        if (moreEl) moreEl.innerHTML = '';
        return;
      }

      if (countEl) countEl.textContent = `${filtered.length} of ${_allCaseStudies.length}`;

      const slice = filtered.slice(0, _shown);
      grid.innerHTML = slice.map(cs => {
        const fail = cs.status === 'failed';
        const worked = cleanJsonb(cs.what_worked, 80);
        const failed = cleanJsonb(cs.what_didnt, 80);
        const impact = cleanJsonb(cs.impact, 60);
        const lesson = cs.key_lesson || '';
        return `<div class="explorer-card ${fail ? 'explorer-failed' : 'explorer-success'}">
          <div class="explorer-card-top">
            <span class="explorer-dot ${fail ? 'failed' : 'success'}"></span>
            <span class="explorer-card-cat">${escHtml(cs.category || '')}</span>
            <span class="explorer-card-country">${escHtml(cs.country || '')}</span>
          </div>
          <div class="explorer-card-title">${escHtml(cs.title || cs.organization || '')}</div>
          ${lesson ? `<div class="explorer-card-lesson">${escHtml(lesson)}</div>` : ''}
          <div class="explorer-expand">
            ${lesson ? `<div class="explorer-expand-quote">&ldquo;${escHtml(lesson)}&rdquo;</div>` : ''}
            ${worked ? `<div class="explorer-expand-section"><div class="explorer-expand-label wLabel">What worked</div><div class="explorer-expand-text">${escHtml(worked)}</div></div>` : ''}
            ${failed ? `<div class="explorer-expand-section"><div class="explorer-expand-label fLabel">What failed</div><div class="explorer-expand-text">${escHtml(failed)}</div></div>` : ''}
            ${impact ? `<div class="explorer-expand-section"><div class="explorer-expand-label iLabel">Impact</div><div class="explorer-expand-text">${escHtml(impact)}</div></div>` : ''}
          </div>
        </div>`;
      }).join('');

      // Load more
      if (moreEl) {
        if (filtered.length > _shown) {
          moreEl.innerHTML = `<button class="explorer-more-btn">Show more (${filtered.length - _shown})</button>`;
          moreEl.querySelector('.explorer-more-btn').onclick = () => { _shown += PAGE; render(false); };
        } else {
          moreEl.innerHTML = '';
        }
      }
    }

    // Card click to expand
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.explorer-card');
      if (!card) return;
      card.classList.toggle('expanded');
    });

    // Filters
    const toolbar = $('#explorerFilters');
    if (toolbar) {
      toolbar.querySelectorAll('.explorer-select').forEach(sel => {
        sel.addEventListener('change', () => {
          _explorerFilters[sel.dataset.filter] = sel.value;
          render(true);
        });
      });
      const search = $('#explorerSearch');
      if (search) {
        let db;
        search.addEventListener('input', () => {
          clearTimeout(db);
          db = setTimeout(() => { _query = search.value.trim(); render(true); }, 200);
        });
      }
    }

    render(true);
  }

  // ─── CULTURAL LOOKUP ───
  const DIM_PRACTICAL = {
    pdi: {
      high: { meaning: 'People follow leaders and don\'t challenge authority openly.', advice: 'Partner with a respected community leader — temple, mosque, church, village chief. They open doors you can\'t.', avoid: 'Don\'t go door-to-door yourself. People won\'t trust a stranger.' },
      low: { meaning: 'People expect equality and question decisions.', advice: 'Build credibility through transparency. Show your work. Let people ask questions.', avoid: 'Don\'t act like an authority figure. People here respond to peers, not bosses.' },
    },
    idv: {
      high: { meaning: 'People make individual choices. "What\'s in it for me?"', advice: 'Frame benefits around personal gain. "This helps YOU." Build a personal brand.', avoid: 'Don\'t rely on community obligation. People here look out for themselves.' },
      low: { meaning: 'Community and family ties drive decisions. "What\'s good for us?"', advice: 'Build a community coalition first. Word-of-mouth through trusted networks works. Get 5 families to commit together.', avoid: 'Don\'t pitch to individuals. Go through groups — mothers\' groups, cooperatives, village councils.' },
    },
    mas: {
      high: { meaning: 'Achievement and competition are valued. Asking for help = weakness.', advice: 'Frame your service as empowering, not charity. Use private channels. Nobody wants to be seen receiving help.', avoid: 'Don\'t publicly identify beneficiaries. Shame is a real barrier.' },
      low: { meaning: 'Cooperation and quality of life are prioritized.', advice: 'Community-oriented framing works well. "Together we can" resonates here.', avoid: 'Don\'t use competitive language. "Be the best" doesn\'t work here.' },
    },
    uai: {
      high: { meaning: 'People need institutional trust before trying something new.', advice: 'Get endorsed by a trusted institution — government, NGO, university. Then people will try it.', avoid: 'Don\'t launch without credentials. "Just trust me" fails here.' },
      low: { meaning: 'People are comfortable with ambiguity and new approaches.', advice: 'You can experiment freely. Low risk of rejection. Try things, iterate fast.', avoid: 'Don\'t over-plan. Start small and learn by doing.' },
    },
    lto: {
      high: { meaning: 'People invest in slow, long-term change.', advice: 'Show a 6-month roadmap. Patience is a strength here. Build trust over time.', avoid: 'Don\'t promise instant results. People here value persistence.' },
      low: { meaning: 'People want quick wins and immediate results.', advice: 'Start with a 2-week pilot. Show fast impact. "Here\'s what changed this week."', avoid: 'Don\'t talk about 5-year plans. People need to see results now.' },
    },
    ivr: {
      high: { meaning: 'People express needs openly and seek gratification.', advice: 'Direct outreach works. People will engage openly. Ask them what they want.', avoid: 'Don\'t be indirect. People here appreciate straightforward communication.' },
      low: { meaning: 'People suppress needs and feel shame in asking for help.', advice: 'Use private, discreet channels. Trusted intermediaries. Anonymous options. Shame is a real barrier.', avoid: 'Don\'t ask people to publicly admit they need help. They won\'t.' },
    },
  };

  async function initCulturalLookup() {
    const select = $('#lookup-country');
    const resultEl = $('#lookup-result');
    if (!select || !resultEl) return;

    // Load country list
    try {
      const resp = await fetch('/api/reference?data=countries');
      const json = await resp.json();
      const countries = json.data || [];
      countries.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      for (const c of countries) {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.name;
        select.appendChild(opt);
      }
    } catch (_) {}

    select.addEventListener('change', async () => {
      const code = select.value;
      if (!code) { resultEl.classList.add('hidden'); return; }

      try {
        const resp = await fetch(`/api/reference?data=country&code=${encodeURIComponent(code)}`);
        const json = await resp.json();
        const data = json.data;
        if (!data?.country) {
          resultEl.innerHTML = '<div class="lookup-no-data">No data available for this country.</div>';
          resultEl.classList.remove('hidden');
          return;
        }

        const c = data.country;
        const dims = ['pdi', 'idv', 'mas', 'uai', 'lto', 'ivr'];
        const dimNames = { pdi: 'Power Distance', idv: 'Individualism', mas: 'Masculinity', uai: 'Uncertainty Avoidance', lto: 'Long-Term Orientation', ivr: 'Indulgence' };
        const dimColors = { pdi: '#E5243B', idv: '#4C9F38', mas: '#FCC30B', uai: '#26BDE2', lto: '#FD6925', ivr: '#DD1367' };

        // Count barriers
        const highBarriers = dims.filter(d => (c[d] || 0) > 75);
        const lowBarriers = dims.filter(d => (c[d] || 0) < 25);

        // Build dimension cards with practical advice
        const dimsHtml = dims.map(d => {
          const val = c[d];
          if (val == null) return '';
          const isHigh = val > 65;
          const isLow = val < 35;
          const level = isHigh ? 'high' : isLow ? 'low' : 'mid';
          const practical = DIM_PRACTICAL[d]?.[level];
          const barrierTag = isHigh ? '<span class="lookup-barrier-tag high">HIGH BARRIER</span>' : isLow ? '<span class="lookup-barrier-tag low">CULTURAL STRENGTH</span>' : '';

          return `
            <div class="lookup-dim-card ${isHigh ? 'dim-high' : isLow ? 'dim-low' : ''}">
              <div class="lookup-dim-top">
                <div class="lookup-dim-name">${dimNames[d]}</div>
                <div class="lookup-dim-score" style="color:${dimColors[d]}">${val}</div>
              </div>
              <div class="lookup-dim-bar-track">
                <div class="lookup-dim-bar-fill" style="width:${val}%;background:${dimColors[d]}"></div>
              </div>
              ${barrierTag}
              ${practical ? `
                <div class="lookup-dim-meaning">${escHtml(practical.meaning)}</div>
                <div class="lookup-dim-advice"><strong>Do this:</strong> ${escHtml(practical.advice)}</div>
                <div class="lookup-dim-avoid"><strong>Avoid:</strong> ${escHtml(practical.avoid)}</div>
              ` : `<div class="lookup-dim-meaning">This dimension is moderate — neither a barrier nor a strength.</div>`}
            </div>
          `;
        }).join('');

        // What works / What fails
        const worksItems = [];
        const failsItems = [];
        dims.forEach(d => {
          const val = c[d] || 50;
          const practical = DIM_PRACTICAL[d]?.[val > 65 ? 'high' : val < 35 ? 'low' : null];
          if (practical) {
            if (val < 35) worksItems.push(practical.advice);
            if (val > 75) failsItems.push(practical.avoid);
          }
        });

        let summaryHtml = '';
        if (worksItems.length || failsItems.length) {
          summaryHtml = `<div class="lookup-summary">
            ${worksItems.length ? `<div class="lookup-summary-section works">
              <div class="lookup-summary-title">&#x2705; What Works in ${escHtml(c.name)}</div>
              <ul>${worksItems.map(w => `<li>${escHtml(w)}</li>`).join('')}</ul>
            </div>` : ''}
            ${failsItems.length ? `<div class="lookup-summary-section fails">
              <div class="lookup-summary-title">&#x274C; What Fails in ${escHtml(c.name)}</div>
              <ul>${failsItems.map(f => `<li>${escHtml(f)}</li>`).join('')}</ul>
            </div>` : ''}
          </div>`;
        }

        // How to start here
        const startHtml = `
          <div class="lookup-start">
            <div class="lookup-start-title">&#x1F680; How to Start Here</div>
            <div class="lookup-start-steps">
              ${highBarriers.length ? `<div class="lookup-start-step"><span class="step-num">1</span><span>Work WITH the culture, not against it. ${highBarriers.length > 1 ? highBarriers.length + ' dimensions' : '1 dimension'} above 75 means there are real barriers — but also real trust networks to tap into.</span></div>` : ''}
              <div class="lookup-start-step"><span class="step-num">${highBarriers.length ? '2' : '1'}</span><span>Find the trust layer: ${c.zone?.includes('south_asia') ? 'family, caste, religious community, ASHA/BRAC workers' : c.zone?.includes('east_asia') ? 'institutions, formal associations, PTA' : c.zone?.includes('mena') ? 'family, mosque, tribal leaders' : c.zone?.includes('africa') ? 'family, village, church/mosque, community leaders' : c.zone?.includes('latin') ? 'family, church, neighborhood associations' : 'family, community organizations, local leaders'}</span></div>
              <div class="lookup-start-step"><span class="step-num">${highBarriers.length ? '3' : '2'}</span><span>Test with 10 people. If 7 say they\'d use your solution — you have something. If fewer — adjust your approach, not your mission.</span></div>
            </div>
          </div>
        `;

        // Case studies
        let casesHtml = '';
        if (data.case_studies?.length) {
          casesHtml = `
            <div class="lookup-cases-section">
              <div class="lookup-cases-title">&#x1F4DA; Organizations That Work in ${escHtml(c.name)}</div>
              <div class="lookup-cases-grid">${data.case_studies.map(cs => `
                <div class="lookup-case-card">
                  <div class="lookup-case-title">${escHtml(cs.title || cs.organization || '')}</div>
                  ${cs.key_lesson ? `<div class="lookup-case-lesson">&ldquo;${escHtml(cs.key_lesson)}&rdquo;</div>` : ''}
                </div>
              `).join('')}</div>
            </div>
          `;
        }

        resultEl.innerHTML = `
          <div class="lookup-country-header">
            <div class="lookup-country-name">${escHtml(c.name)}</div>
            <div class="lookup-country-meta">${escHtml(c.region || '')} &middot; ${escHtml((c.zone || '').replace(/_/g, ' '))} &middot; ${escHtml(c.economic_tier || c.income_level || '')}</div>
          </div>
          ${summaryHtml}
          <div class="lookup-dimensions">${dimsHtml}</div>
          ${startHtml}
          ${casesHtml}
        `;
        resultEl.classList.remove('hidden');
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (err) {
        resultEl.innerHTML = '<div class="lookup-no-data">Failed to load country data.</div>';
        resultEl.classList.remove('hidden');
      }
    });
  }

  // Init auth UI on DOMContentLoaded
  function initAuth() {
    updateAuthUI();

    // Nav login button
    const loginBtn = $('#navLoginBtn');
    if (loginBtn) loginBtn.addEventListener('click', () => showAuthModal('login'));

    // Auth modal close
    const authClose = $('#authClose');
    if (authClose) authClose.addEventListener('click', hideAuthModal);
    const authOverlay = $('#authOverlay');
    if (authOverlay) authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) hideAuthModal(); });

    // Auth form submit
    const authForm = $('#authForm');
    if (authForm) authForm.addEventListener('submit', handleAuthSubmit);

    // Toggle login/register
    document.addEventListener('click', (e) => {
      if (e.target.id === 'authToggleLink') {
        e.preventDefault();
        showAuthModal(authMode === 'login' ? 'register' : 'login');
      }
    });

    // User menu toggle
    const userBtn = $('#navUserBtn');
    const dropdown = $('#navDropdown');
    if (userBtn && dropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
      });
      document.addEventListener('click', () => { dropdown.style.display = 'none'; });
    }

    // Dropdown items
    const myEvals = $('#navMyEvals');
    if (myEvals) myEvals.addEventListener('click', (e) => { e.preventDefault(); showMyEvaluations(); });

    const myDashboard = $('#navMyDashboard');
    if (myDashboard) myDashboard.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });

    const myFavorites = $('#navMyFavorites');
    if (myFavorites) myFavorites.addEventListener('click', (e) => { e.preventDefault(); showMyEvaluations(); });

    const myProfile = $('#navMyProfile');
    if (myProfile) myProfile.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });

    const logout = $('#navLogout');
    if (logout) logout.addEventListener('click', (e) => {
      e.preventDefault();
      clearAuth();
      const dd = $('#navDropdown');
      if (dd) dd.style.display = 'none';
      showToast('Signed out.', 'success');
    });

    // Verify token on load
    if (isLoggedIn()) {
      apiAuthGet('me').then((data) => {
        if (data.error) clearAuth();
      }).catch(() => {});
    }
  }

  // ─── COMMUNITY LEADERBOARD + STATS ───
  let _communityLoaded = false;

  async function initCommunity() {
    if (_communityLoaded) return;
    _communityLoaded = true;

    try {
      const [statsResp, lbResp] = await Promise.all([
        fetch('/api/reference?data=stats'),
        fetch('/api/reference?data=leaderboard&limit=12'),
      ]);
      const statsJson = await statsResp.json();
      const lbJson = await lbResp.json();
      const stats = statsJson.data || {};
      const listings = lbJson.data || [];

      // Animate stat counters
      const statMap = { statEvals: stats.total_evaluations, statUsers: stats.total_users, statCases: stats.total_case_studies, statCountries: stats.total_countries };
      Object.entries(statMap).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) {
          el.dataset.count = val;
          const target = parseFloat(val);
          const duration = 1400;
          const start = performance.now();
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.round(target * ease).toLocaleString();
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      });

      // Verdict distribution bar
      const verdictBar = $('#communityVerdictBar');
      if (verdictBar && stats.verdict_distribution?.length) {
        const total = stats.verdict_distribution.reduce((s, v) => s + parseInt(v.count), 0);
        const colors = { GO: 'var(--forest)', 'GO WITH EDUCATION': 'var(--amber)', PIVOT: 'var(--sky)', SHELVE: 'var(--terracotta)' };
        const labels = { GO: 'Ready to Test', 'GO WITH EDUCATION': 'Fix One Thing', PIVOT: 'Change Approach', SHELVE: 'High Barriers' };
        verdictBar.innerHTML = `<div class="verdict-bar-label">Verdict Distribution</div><div class="verdict-bar-track">${stats.verdict_distribution.map(v => {
          const pct = ((parseInt(v.count) / total) * 100).toFixed(1);
          return `<div class="verdict-bar-segment" style="width:${pct}%;background:${colors[v.verdict] || 'var(--ink-faint)'}" title="${labels[v.verdict] || v.verdict}: ${pct}%"></div>`;
        }).join('')}</div><div class="verdict-bar-legend">${stats.verdict_distribution.map(v => {
          const pct = ((parseInt(v.count) / total) * 100).toFixed(0);
          return `<span class="verdict-bar-legend-item"><span class="verdict-bar-dot" style="background:${colors[v.verdict] || 'var(--ink-faint)'}"></span>${labels[v.verdict] || v.verdict} ${pct}%</span>`;
        }).join('')}</div>`;
      }

      // Leaderboard
      const lb = $('#communityLeaderboard');
      if (lb) {
        if (!listings.length) {
          // Show placeholder with stats
          const topTypes = (stats.top_idea_types || []).slice(0, 5);
          const topCountries = (stats.top_countries || []).slice(0, 5);
          lb.innerHTML = `<div class="leaderboard-empty"><div class="leaderboard-empty-icon">&#x1F331;</div><p>No ideas on the leaderboard yet. Be the first to <a href="#try">evaluate your idea</a> and claim the top spot.</p>${topTypes.length ? `<div class="leaderboard-top-types"><div class="leaderboard-section-label">Most Popular Idea Types</div>${topTypes.map(t => `<span class="leaderboard-type-tag">${escHtml(t.idea_type)} (${t.count})</span>`).join('')}</div>` : ''}${topCountries.length ? `<div class="leaderboard-top-countries"><div class="leaderboard-section-label">Most Active Countries</div>${topCountries.map(c => `<span class="leaderboard-type-tag">${escHtml(c.country)} (${c.count})</span>`).join('')}</div>` : ''}</div>`;
        } else {
          lb.innerHTML = `<div class="leaderboard-grid">${listings.map((item, idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const score = item.score ? Number(item.score).toFixed(1) : '?';
            const verdictLabel = item.verdict ? (item.verdict === 'GO' ? 'Ready' : item.verdict === 'GO WITH EDUCATION' ? 'Fix One Thing' : item.verdict === 'PIVOT' ? 'Pivot' : 'Shelve') : '';
            return `<div class="leaderboard-card ${rankClass}"><div class="leaderboard-rank">${rank <= 3 ? ['&#x1F947;', '&#x1F948;', '&#x1F949;'][rank - 1] : '#' + rank}</div><div class="leaderboard-hook">${escHtml(item.hook || '')}</div><div class="leaderboard-meta"><span class="leaderboard-score">${score}/10</span>${verdictLabel ? `<span class="leaderboard-verdict badge-${item.badge || ''}">${verdictLabel}</span>` : ''}${item.region ? `<span class="leaderboard-region">&#x1F4CD; ${escHtml(item.region)}</span>` : ''}<button class="leaderboard-upvotes" data-listing-id="${item.id}" data-upvotes="${item.upvotes || 0}">&#x1F44D; <span class="upvote-count">${item.upvotes || 0}</span></button></div></div>`;
          }).join('')}</div>`;
        }
      }
    } catch (_) { /* fail silently */ }
  }

  // ─── FIGURES GALLERY ───
  let _allFigures = [];

  async function initFiguresGallery(zone) {
    const grid = $('#figuresGrid');
    if (!grid) return;

    if (!_allFigures.length) {
      // Try API first
      try {
        const resp = await fetch('/api/reference?data=figures&limit=100');
        const json = await resp.json();
        _allFigures = json.data || [];
      } catch (_) {}

      // Fallback: load from local JSON files
      if (!_allFigures.length) {
        try {
          const [libResp, zonesResp] = await Promise.all([
            fetch('case-studies/library.json').catch(() => null),
            fetch('case-studies/zones-library.json').catch(() => null),
          ]);
          if (libResp) {
            const lib = await libResp.json();
            const figs = lib.figures || [];
            _allFigures.push(...figs);
          }
          if (zonesResp) {
            const zones = await zonesResp.json();
            Object.entries(zones).forEach(([zoneKey, zoneData]) => {
              if (zoneKey === 'metadata') return;
              if (zoneData?.figures) {
                zoneData.figures.forEach(f => {
                  if (!f.zone) f.zone = zoneKey;
                  _allFigures.push(f);
                });
              }
            });
          }
        } catch (_) {}
      }

      if (!_allFigures.length) {
        grid.innerHTML = '<div class="figures-empty">Could not load figures.</div>';
        return;
      }
    }

    const filterZone = zone || 'all';
    const filtered = filterZone === 'all' ? _allFigures : _allFigures.filter(f => f.zone === filterZone);

    if (!filtered.length) {
      grid.innerHTML = '<div class="figures-empty">No figures found for this region.</div>';
      return;
    }

    grid.innerHTML = filtered.map(f => {
      const initials = (f.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const impactShort = (f.impact || '').length > 120 ? (f.impact || '').slice(0, 120) + '…' : (f.impact || '');
      return `<div class="figure-card"><div class="figure-card-top"><div class="figure-avatar">${escHtml(initials)}</div><div class="figure-info"><h4 class="figure-name">${escHtml(f.name)}</h4><div class="figure-role">${escHtml(f.role || '')}</div>${f.country ? `<div class="figure-country">${escHtml(f.country)}</div>` : ''}</div></div>${impactShort ? `<div class="figure-impact">${escHtml(impactShort)}</div>` : ''}${f.quote ? `<div class="figure-quote">"${escHtml(f.quote)}"</div>` : ''}</div>`;
    }).join('');
  }

  // Wire figures filter buttons
  document.addEventListener('DOMContentLoaded', () => {
    const figFilters = $('#figuresFilters');
    if (figFilters) {
      figFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.figures-filter');
        if (!btn) return;
        figFilters.querySelectorAll('.figures-filter').forEach(f => f.classList.remove('active'));
        btn.classList.add('active');
        initFiguresGallery(btn.dataset.zone);
      });
    }
  });

  // ─── SIMILAR IDEAS PANEL ───
  async function showSimilarIdeas(ideaType, country) {
    try {
      const params = new URLSearchParams();
      if (ideaType) params.set('idea_type', ideaType);
      if (country) params.set('country', country);
      params.set('limit', '5');
      const resp = await fetch('/api/reference?data=similar&' + params.toString());
      const json = await resp.json();
      const similar = json.data || [];

      if (!similar.length) return;

      const container = $('#resultContent');
      if (!container) return;

      const verdictColors = { GO: 'var(--forest)', 'GO WITH EDUCATION': 'var(--amber)', PIVOT: 'var(--sky)', SHELVE: 'var(--terracotta)' };
      const verdictLabels = { GO: 'Ready', 'GO WITH EDUCATION': 'Fix One Thing', PIVOT: 'Pivot', SHELVE: 'Shelve' };

      let html = `<div class="similar-section"><div class="similar-header"><span class="r-icon amber">&#x1F517;</span>Ideas Like Yours</div><p style="font-size:0.8125rem;color:var(--ink-muted);margin-bottom:1rem">Other ideas in the same category. See how they scored and what verdict they received.</p><div class="similar-scroll">`;

      similar.forEach(s => {
        const score = s.score ? Number(s.score).toFixed(1) : '?';
        const vColor = verdictColors[s.verdict] || 'var(--ink-muted)';
        const vLabel = verdictLabels[s.verdict] || s.verdict || '';
        const ideaShort = (s.idea_text || '').length > 100 ? (s.idea_text || '').slice(0, 100) + '…' : (s.idea_text || '');
        const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        html += `<div class="similar-card"><div class="similar-card-top"><span class="similar-score" style="color:${vColor}">${score}</span>${vLabel ? `<span class="similar-verdict" style="color:${vColor}">${vLabel}</span>` : ''}${date ? `<span class="similar-date">${date}</span>` : ''}</div><div class="similar-idea">${escHtml(ideaShort)}</div>${s.country ? `<div class="similar-country">${escHtml(s.country)}</div>` : ''}</div>`;
      });

      html += '</div></div>';
      container.insertAdjacentHTML('beforeend', html);
    } catch (_) { /* fail silently */ }
  }

  // ─── SDG STORIES CAROUSEL ───
  const SDG_IMAGES = {
    1: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80',
    2: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    3: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    4: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    5: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
    6: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=600&q=80',
    7: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    8: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=80',
    9: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    10: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    11: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
    12: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    13: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=600&q=80',
    14: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=600&q=80',
    15: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    16: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=600&q=80',
    17: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',
  };

  // Category-based images for case studies without SDG mapping
  const CATEGORY_IMAGES = {
    education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80',
    health: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
    food: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    water: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=600&q=80',
    energy: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    sanitation: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    finance: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    community: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    women: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80',
    safety: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=600&q=80',
    elderly: 'https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?auto=format&fit=crop&w=600&q=80',
    mental_health: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=600&q=80',
    work: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=600&q=80',
    disaster: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=600&q=80',
    housing: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
    rights: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',
    environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    agriculture: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
  };

  async function initSDGStoriesCarousel() {
    const track = $('#sdgCarouselTrack');
    const dotsEl = $('#sdgCarouselDots');
    const prevBtn = $('#sdgCarouselPrev');
    const nextBtn = $('#sdgCarouselNext');
    if (!track) return;

    // SDG color map
    const sdgColors = { 1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A' };

    // Idea type to SDG mapping
    const typeToSDG = { women: 5, safety: 16, elderly: 3, mental_health: 3, disaster: 13, health: 3, food: 2, water: 6, financial: 8, work: 8, education: 4, community: 11 };

    // Try API first, fallback to local
    let stories = [];
    try {
      const resp = await fetch('/api/reference?data=sdg-stories');
      const json = await resp.json();
      stories = json.data || [];
    } catch (_) {}

    // Fallback: load from local case studies
    if (!stories.length) {
      try {
        const [libResp, zonesResp] = await Promise.all([
          fetch('case-studies/library.json').catch(() => null),
          fetch('case-studies/zones-library.json').catch(() => null),
        ]);
        const lib = libResp ? await libResp.json() : {};
        const zones = zonesResp ? await zonesResp.json() : {};
        const caseStudies = lib.case_studies || [];
        // Flatten zone case studies
        Object.values(zones).forEach(zone => {
          if (zone && Array.isArray(zone.case_studies)) {
            caseStudies.push(...zone.case_studies);
          }
        });
        // Map to stories with SDG tags
        stories = caseStudies.slice(0, 20).map(cs => {
          const cat = (cs.category || '').toLowerCase();
          const sdgNum = typeToSDG[cat] || 8;
          return {
            title: cs.title || cs.organization || 'Social Enterprise',
            organization: cs.organization || cs.title || '',
            country: cs.country || '',
            category: cs.category || '',
            sdg_number: sdgNum,
            sdg_name: SDG_FALLBACK.find(s => s.number === sdgNum)?.name || 'Decent Work',
            excerpt: cs.key_lesson || cs.problem_statement || cs.the_model || '',
            impact: cs.impact_numbers || cs.impact || '',
            what_worked: Array.isArray(cs.what_worked) ? cs.what_worked[0] : (cs.what_worked || ''),
          };
        });
      } catch (_) {}
    }

    if (!stories.length) {
      track.innerHTML = '<p style="color:var(--ink-muted);text-align:center;padding:2rem">Stories loading&hellip;</p>';
      return;
    }

    // Shuffle stories for variety
    stories.sort(() => Math.random() - 0.5);

    let current = 0;
    const perView = window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : 3;
    const totalSlides = Math.ceil(stories.length / perView);

    function renderSlide(s) {
      const color = sdgColors[s.sdg_number] || '#888';
      const img = s.image || SDG_IMAGES[s.sdg_number] || CATEGORY_IMAGES[(s.category || '').toLowerCase()] || SDG_IMAGES[8];
      const excerpt = cleanJsonb(s.excerpt, 140);
      const impactText = cleanJsonb(s.impact, 100);
      const workedText = cleanJsonb(s.what_worked, 100);
      return `<div class="sdg-story-card">
        <div class="sdg-story-img"><img src="${img}" alt="${escHtml(s.title || '')}" loading="lazy"></div>
        <div class="sdg-story-body">
          <div class="sdg-story-badge" style="background:${color}">SDG ${s.sdg_number}</div>
          <div class="sdg-story-title">${escHtml(s.title || s.organization || '')}</div>
          <div class="sdg-story-meta">${escHtml(s.organization || '')}${s.country ? ' &middot; ' + escHtml(s.country) : ''}${s.category ? ' &middot; ' + escHtml(s.category) : ''}</div>
          ${excerpt ? `<div class="sdg-story-excerpt">${escHtml(excerpt)}</div>` : ''}
          ${impactText ? `<div class="sdg-story-impact">&#x1F4CA; ${escHtml(impactText)}</div>` : ''}
          ${workedText ? `<div class="sdg-story-worked">&#x2705; ${escHtml(workedText)}</div>` : ''}
        </div>
      </div>`;
    }

    function render() {
      const start = current * perView;
      const slice = stories.slice(start, start + perView);
      track.innerHTML = `<div class="sdg-carousel-slide">${slice.map(renderSlide).join('')}</div>`;
      // Dots
      if (dotsEl) {
        dotsEl.innerHTML = Array.from({ length: totalSlides }, (_, i) =>
          `<button class="sdg-carousel-dot${i === current ? ' active' : ''}" data-idx="${i}"></button>`
        ).join('');
        dotsEl.querySelectorAll('.sdg-carousel-dot').forEach(dot => {
          dot.addEventListener('click', () => { current = parseInt(dot.dataset.idx); render(); });
        });
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { current = (current - 1 + totalSlides) % totalSlides; render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { current = (current + 1) % totalSlides; render(); });

    render();

    // Auto-rotate every 6 seconds
    setInterval(() => { current = (current + 1) % totalSlides; render(); }, 6000);
  }

  // ─── SDG EXPLORER ───
  let _sdgData = [];
  const SDG_FALLBACK = [
    { number: 1, name: 'No Poverty', description: 'End poverty in all its forms everywhere.', targets: '1.1 Eradicate extreme poverty · 1.2 Reduce poverty by at least 50% · 1.3 Social protection systems · 1.4 Equal rights to resources · 1.5 Build resilience of the poor' },
    { number: 2, name: 'Zero Hunger', description: 'End hunger, achieve food security and improved nutrition.', targets: '2.1 Universal access to safe food · 2.2 End malnutrition · 2.3 Double agricultural productivity · 2.4 Sustainable food production · 2.5 Maintain genetic diversity' },
    { number: 3, name: 'Good Health and Well-Being', description: 'Ensure healthy lives and promote well-being for all.', targets: '3.1 Reduce maternal mortality · 3.2 End preventable deaths of children · 3.3 Fight communicable diseases · 3.4 Reduce non-communicable diseases · 3.5 Substance abuse · 3.7 Universal access to reproductive health · 3.8 Universal health coverage' },
    { number: 4, name: 'Quality Education', description: 'Ensure inclusive and equitable quality education for all.', targets: '4.1 Free primary and secondary education · 4.2 Equal access to early childhood development · 4.3 Equal access to technical and vocational education · 4.4 Increase youth and adult skills · 4.5 Eliminate gender disparities · 4.6 Universal literacy' },
    { number: 5, name: 'Gender Equality', description: 'Achieve gender equality and empower all women and girls.', targets: '5.1 End discrimination against women · 5.2 Eliminate violence against women · 5.3 Eliminate harmful practices · 5.4 Value unpaid care · 5.5 Women leadership and participation · 5.6 Universal access to reproductive rights' },
    { number: 6, name: 'Clean Water and Sanitation', description: 'Ensure availability and sustainable management of water for all.', targets: '6.1 Safe and affordable drinking water · 6.2 Access to sanitation and hygiene · 6.3 Improve water quality · 6.4 Increase water-use efficiency · 6.5 Integrated water resources management · 6.6 Protect water-related ecosystems' },
    { number: 7, name: 'Affordable and Clean Energy', description: 'Ensure access to affordable, reliable, sustainable energy for all.', targets: '7.1 Universal access to modern energy · 7.2 Increase share of renewable energy · 7.3 Double the rate of energy efficiency improvement' },
    { number: 8, name: 'Decent Work and Economic Growth', description: 'Promote sustained, inclusive economic growth and decent work for all.', targets: '8.1 Sustained economic growth · 8.2 Diversify and upgrade technology · 8.3 Development-oriented policies · 8.4 Improve resource efficiency · 8.5 Full and productive employment · 8.6 Reduce youth unemployment' },
    { number: 9, name: 'Industry, Innovation and Infrastructure', description: 'Build resilient infrastructure, promote inclusive industrialization.', targets: '9.1 Develop quality infrastructure · 9.2 Promote inclusive industrialization · 9.3 Increase access to financial services · 9.4 Upgrade infrastructure for sustainability · 9.5 Enhance scientific research' },
    { number: 10, name: 'Reduced Inequalities', description: 'Reduce inequality within and among countries.', targets: '10.1 Income growth of bottom 40% · 10.2 Social, economic, political inclusion · 10.3 Ensure equal opportunity · 10.4 Adopt fiscal and wage policies · 10.5 Regulation of financial markets · 10.6 Enhanced representation in governance' },
    { number: 11, name: 'Sustainable Cities and Communities', description: 'Make cities and human settlements inclusive, safe, resilient.', targets: '11.1 Safe and affordable housing · 11.2 Affordable and sustainable transport · 11.3 Inclusive urbanization · 11.4 Protect cultural and natural heritage · 11.5 Reduce impact of disasters · 11.6 Environmental impact of cities' },
    { number: 12, name: 'Responsible Consumption and Production', description: 'Ensure sustainable consumption and production patterns.', targets: '12.1 Sustainable consumption plan · 12.2 Sustainable management of natural resources · 12.3 Halve food waste · 12.4 Environmentally sound management of chemicals · 12.5 Substantially reduce waste · 12.6 Encourage companies to adopt sustainable practices' },
    { number: 13, name: 'Climate Action', description: 'Take urgent action to combat climate change and its impacts.', targets: '13.1 Strengthen resilience to climate hazards · 13.2 Integrate climate measures into policies · 13.3 Improve education and awareness on climate change' },
    { number: 14, name: 'Life Below Water', description: 'Conserve and sustainably use the oceans, seas and marine resources.', targets: '14.1 Reduce marine pollution · 14.2 Protect marine ecosystems · 14.3 Minimize ocean acidification · 14.4 Regulate fishing · 14.5 Conserve coastal areas' },
    { number: 15, name: 'Life on Land', description: 'Protect, restore and promote sustainable use of terrestrial ecosystems.', targets: '15.1 Conserve terrestrial ecosystems · 15.2 Sustainable management of forests · 15.3 Combat desertification · 15.4 Ensure conservation of mountain ecosystems · 15.5 Reduce degradation of natural habitats · 15.6 Fair sharing of genetic resources' },
    { number: 16, name: 'Peace, Justice and Strong Institutions', description: 'Promote peaceful and inclusive societies for sustainable development.', targets: '16.1 Reduce violence everywhere · 16.2 End abuse and exploitation of children · 16.3 Promote rule of law · 16.4 Reduce illicit financial flows · 16.5 Substantially reduce corruption · 16.6 Develop effective institutions · 16.7 Inclusive decision-making' },
    { number: 17, name: 'Partnerships for the Goals', description: 'Strengthen the means of implementation and revitalize partnerships.', targets: '17.1 Mobilize domestic resources · 17.2 Developed countries commit to ODA · 17.3 Mobilize financial resources · 17.4 Debt sustainability · 17.5 Investment promotion · 17.6 Enhance North-South and South-South cooperation · 17.7 Promote green technology · 17.9 Enhanced capacity-building · 17.16 Multi-stakeholder partnerships' },
  ];

  async function initSDGExplorer() {
    // Make SDG cards clickable
    $$('.sdg-explore').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => openSDGModal(parseInt(card.dataset.sdg)));
    });

    // Close modal
    const closeBtn = $('#sdgModalClose');
    if (closeBtn) closeBtn.addEventListener('click', () => { $('#sdgModal').style.display = 'none'; });
    const overlay = $('#sdgModal');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
  }

  async function openSDGModal(sdgNum) {
    const modal = $('#sdgModal');
    const content = $('#sdgModalContent');
    if (!modal || !content) return;

    // Load SDG data if not cached (API first, fallback to local)
    if (!_sdgData.length) {
      try {
        const resp = await fetch('/api/reference?data=sdgs');
        const json = await resp.json();
        _sdgData = json.data || [];
      } catch (_) { /* ignore */ }
      if (!_sdgData.length) _sdgData = SDG_FALLBACK;
    }

    const sdg = _sdgData.find(s => s.number === sdgNum);
    if (!sdg) {
      content.innerHTML = `<div class="sdg-modal-header"><div class="sdg-modal-num" style="background:#888">${sdgNum}</div><h3>SDG ${sdgNum}</h3></div><p style="color:var(--ink-muted)">No detailed data for this SDG yet. Check back soon.</p>`;
      modal.style.display = 'flex';
      return;
    }

    const sdgColors = { 1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21', 6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367', 11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B', 16: '#00689D', 17: '#19486A' };
    const color = sdgColors[sdgNum] || '#888';

    // Parse idea_type_mapping
    let mappings = [];
    try {
      const raw = sdg.idea_type_mapping;
      if (typeof raw === 'string') mappings = JSON.parse(raw);
      else if (raw && typeof raw === 'object') mappings = raw;
    } catch (_) { /* ignore */ }

    // Clean description
    const desc = sdg.description || SDG_FALLBACK.find(s => s.number === sdgNum)?.description || '';

    let html = `<div class="sdg-modal-header"><div class="sdg-modal-num" style="background:${color}">${sdgNum}</div><div><h3 style="color:${color}">${escHtml(sdg.name)}</h3><p style="font-size:0.875rem;color:var(--ink-muted);line-height:1.6">${escHtml(desc)}</p></div></div>`;

    // Clean targets — handle JSON string, array, or plain string
    let targetsText = '';
    if (sdg.targets) {
      if (typeof sdg.targets === 'string') {
        // Strip JSON quotes if present
        targetsText = sdg.targets.replace(/^"|"$/g, '');
      } else if (Array.isArray(sdg.targets)) {
        targetsText = sdg.targets.join(' · ');
      } else if (typeof sdg.targets === 'object') {
        targetsText = JSON.stringify(sdg.targets);
      }
    }
    // Fallback to local data if still empty
    if (!targetsText || targetsText === '[]') {
      targetsText = SDG_FALLBACK.find(s => s.number === sdgNum)?.targets || '';
    }

    if (targetsText && targetsText !== '[]') {
      // Format each target as a styled bullet point
      const targetItems = targetsText.split('·').map(t => t.trim()).filter(Boolean);
      html += `<div class="sdg-modal-section"><div class="sdg-modal-section-title">Targets</div><div class="sdg-modal-targets">${targetItems.map(t => `<div class="sdg-target-item"><span class="sdg-target-bullet" style="background:${color}"></span><span>${escHtml(t)}</span></div>`).join('')}</div></div>`;
    }

    if (mappings && (Array.isArray(mappings) ? mappings.length : Object.keys(mappings).length)) {
      html += `<div class="sdg-modal-section"><div class="sdg-modal-section-title">Idea Types That Map to This Goal</div><div class="sdg-modal-mappings">`;
      const items = Array.isArray(mappings) ? mappings : Object.entries(mappings).map(([k, v]) => ({ type: k, ...v }));
      items.forEach(m => {
        const typeName = typeof m === 'string' ? m : (m.type || m.name || m);
        const desc = typeof m === 'object' ? (m.description || m.target_text || '') : '';
        html += `<div class="sdg-mapping-item"><span class="sdg-mapping-type">${escHtml(typeName)}</span>${desc ? `<span class="sdg-mapping-desc">${escHtml(desc)}</span>` : ''}</div>`;
      });
      html += '</div></div>';
    }

    html += `<div class="sdg-modal-cta"><a href="#try" class="btn-primary" onclick="document.getElementById('sdgModal').style.display='none'">Evaluate Your Idea &#x2192;</a></div>`;

    content.innerHTML = html;
    modal.style.display = 'flex';
  }

  // ─── USER DASHBOARD ───
  async function showDashboard() {
    const overlay = $('#dashboardOverlay');
    const content = $('#dashboardContent');
    if (!overlay || !content) return;

    const dropdown = $('#navDropdown');
    if (dropdown) dropdown.style.display = 'none';

    overlay.style.display = 'flex';
    content.innerHTML = '<div class="dashboard-loading">Loading your data…</div>';

    let stats = {};
    let evals = [];
    let typeBreakdown = [];
    let verdictBreakdown = [];

    if (isLoggedIn()) {
      try {
        const resp = await fetch('/api/reference?data=dashboard', {
          headers: { 'Authorization': 'Bearer ' + getAuthToken() },
        });
        const json = await resp.json();
        const data = json.data || {};
        if (!data.error) {
          stats = data.stats || {};
          evals = data.evaluations || [];
          typeBreakdown = data.type_breakdown || [];
          verdictBreakdown = data.verdict_breakdown || [];
        }
      } catch (_) {}
    }

    // Fallback: use localStorage history if no DB data
    if (!evals.length) {
      try {
        const history = JSON.parse(localStorage.getItem('see_eval_history') || '[]');
        if (history.length) {
          evals = history;
        }
      } catch (_) {}
    }

    // Last resort: single evaluation
    if (!evals.length) {
      const local = loadLastEvaluation();
      if (local && local.verdict) {
        const localTime = localStorage.getItem('see_last_eval_time');
        evals = [{
          idea_text: (local._input?.problem || '') + ' ' + (local._input?.goal || ''),
          score: local.verdict?.total_score,
          verdict: local.verdict?.verdict,
          verdict_label: local.verdict?.verdict === 'GO' ? 'READY TO TEST' : local.verdict?.verdict === 'PIVOT' ? 'CHANGE YOUR APPROACH' : local.verdict?.verdict,
          created_at: localTime ? new Date(parseInt(localTime)).toISOString() : new Date().toISOString(),
        }];
      }
    }

    // Compute stats from evaluations if not provided by API
    if (!stats.total && evals.length) {
      const scores = evals.map(e => Number(e.score)).filter(s => !isNaN(s));
      stats = {
        total: evals.length,
        avg_score: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—',
        min_score: scores.length ? Math.min(...scores).toFixed(1) : '—',
        max_score: scores.length ? Math.max(...scores).toFixed(1) : '—',
      };
      // Compute verdict breakdown
      const vCounts = {};
      evals.forEach(e => { const v = e.verdict || 'UNKNOWN'; vCounts[v] = (vCounts[v] || 0) + 1; });
      verdictBreakdown = Object.entries(vCounts).map(([verdict, count]) => ({ verdict, count }));
    }

    try {
      let html = '';

      // Stats cards
      html += '<div class="dashboard-stats">';
      html += `<div class="dash-stat-card"><div class="dash-stat-val">${stats.total || 0}</div><div class="dash-stat-label">Total Evaluations</div></div>`;
      html += `<div class="dash-stat-card"><div class="dash-stat-val">${stats.avg_score || '—'}</div><div class="dash-stat-label">Average Score</div></div>`;
      html += `<div class="dash-stat-card"><div class="dash-stat-val">${stats.max_score || '—'}</div><div class="dash-stat-label">Best Score</div></div>`;
      html += '</div>';

      // Verdict breakdown
      if (verdictBreakdown.length) {
        const colors = { GO: 'var(--forest)', 'GO WITH EDUCATION': 'var(--amber)', PIVOT: 'var(--sky)', SHELVE: 'var(--terracotta)' };
        const labels = { GO: 'Ready', 'GO WITH EDUCATION': 'Fix One Thing', PIVOT: 'Pivot', SHELVE: 'Shelve' };
        html += '<div class="dashboard-section"><div class="dashboard-section-title">Your Verdicts</div><div class="dash-verdict-grid">';
        verdictBreakdown.forEach(v => {
          html += `<div class="dash-verdict-item" style="border-left:3px solid ${colors[v.verdict] || 'var(--ink-faint)'}"><span class="dash-verdict-count">${v.count}</span><span class="dash-verdict-label">${labels[v.verdict] || v.verdict}</span></div>`;
        });
        html += '</div></div>';
      }

      // Type breakdown
      if (typeBreakdown.length) {
        html += '<div class="dashboard-section"><div class="dashboard-section-title">Your Focus Areas</div><div class="dash-type-grid">';
        typeBreakdown.forEach(t => {
          html += `<div class="dash-type-item"><span class="dash-type-name">${escHtml(t.idea_type)}</span><span class="dash-type-count">${t.count}</span></div>`;
        });
        html += '</div></div>';
      }

      // Evaluation history
      if (evals.length) {
        html += '<div class="dashboard-section"><div class="dashboard-section-title">Recent Evaluations</div><div class="dash-evals-list">';
        evals.forEach(ev => {
          const date = new Date(ev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const score = ev.score ? Number(ev.score).toFixed(1) : '?';
          const verdictColors = { GO: 'var(--forest)', 'GO WITH EDUCATION': 'var(--amber)', PIVOT: 'var(--sky)', SHELVE: 'var(--terracotta)' };
          const idea = (ev.idea_text || '').length > 80 ? (ev.idea_text || '').slice(0, 80) + '…' : (ev.idea_text || '');
          html += `<div class="dash-eval-card"><div class="dash-eval-top"><span class="dash-eval-score" style="color:${verdictColors[ev.verdict] || 'var(--ink)'}">${score}</span><span class="dash-eval-verdict">${escHtml(ev.verdict_label || ev.verdict || '')}</span><span class="dash-eval-date">${date}</span></div><div class="dash-eval-idea">${escHtml(idea)}</div></div>`;
        });
        html += '</div></div>';
      } else {
        html += '<div class="dashboard-empty">No evaluations yet. <a href="#try" onclick="document.getElementById(\'dashboardOverlay\').style.display=\'none\'">Evaluate your first idea</a></div>';
      }

      content.innerHTML = html;
    } catch (_) {
      content.innerHTML = '<div class="dashboard-error">Failed to load dashboard. Please try again.</div>';
    }
  }

  // ─── INIT ───
  document.addEventListener('DOMContentLoaded', () => {
    initRevealElements();
    initAuth();

    // Database-powered features (zero AI calls)
    initQuickEval();
    initCulturalLookup();
    initCommunity();
    initFiguresGallery();
    initSDGExplorer();
    initSDGStoriesCarousel();
    initExplorer();

    // Restore last evaluation if returning user
    const lastEval = loadLastEvaluation();
    if (lastEval && lastEval.verdict) {
      renderResult(lastEval);
      renderInnovationPanel(lastEval);
      if (lastEval._input) {
        const pi = $('#fieldProblem'), gi = $('#fieldGoal'), ci = $('#fieldCountry'), bi = $('#fieldBudget'), xi = $('#fieldConstraints');
        if (pi) pi.value = lastEval._input.problem || '';
        if (gi) gi.value = lastEval._input.goal || '';
        if (ci) ci.value = lastEval._input.country || '';
        if (bi) bi.value = lastEval._input.budget || '';
        if (xi) xi.value = lastEval._input.constraints || '';
      }
      const tryResults = $('#tryResults');
      if (tryResults) tryResults.classList.add('visible');
      // Show a subtle banner
      const banner = document.createElement('div');
      banner.className = 'restored-banner';
      banner.innerHTML = '&#x1F501; Showing your last evaluation from ' + new Date(parseInt(localStorage.getItem('see_last_eval_time'))).toLocaleDateString() + '. <a href="#try" onclick="this.closest(\'.restored-banner\').remove()">Start fresh</a>';
      const trySection = $('#try');
      if (trySection) trySection.prepend(banner);
    }

    // Mentors gallery
    renderMentorsGallery('all');

    // Mentors filters
    const mentorsFiltersContainer = $('#mentorsFilters');
    if (mentorsFiltersContainer) {
      mentorsFiltersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.mentors-filter');
        if (!btn) return;
        mentorsFiltersContainer.querySelectorAll('.mentors-filter').forEach((f) => f.classList.remove('active'));
        btn.classList.add('active');
        renderMentorsGallery(btn.dataset.zone);
      });
    }

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

    // Upvote click delegation
    document.addEventListener('click', async (e) => {
      const upvoteBtn = e.target.closest('.marketplace-card-upvotes, .leaderboard-upvotes');
      if (!upvoteBtn) return;
      e.preventDefault();
      const listingId = upvoteBtn.dataset.listingId;
      if (!listingId) return;
      try {
        const resp = await fetch('/api/evaluations?action=upvote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: parseInt(listingId, 10) }),
        });
        const data = await resp.json();
        if (data.upvotes !== undefined) {
          const countEl = upvoteBtn.querySelector('.upvote-count');
          if (countEl) countEl.textContent = data.upvotes;
          upvoteBtn.dataset.upvotes = data.upvotes;
          upvoteBtn.classList.add('upvoted');
        }
      } catch (_) { /* ignore */ }
    });

    // Dashboard button in nav
    const dashBtn = $('#navMyDashboard');
    if (dashBtn) dashBtn.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });
    const dashClose = $('#dashboardClose');
    if (dashClose) dashClose.addEventListener('click', () => { $('#dashboardOverlay').style.display = 'none'; });
    const dashOverlay = $('#dashboardOverlay');
    if (dashOverlay) dashOverlay.addEventListener('click', (e) => { if (e.target === dashOverlay) dashOverlay.style.display = 'none'; });
  });

})();
