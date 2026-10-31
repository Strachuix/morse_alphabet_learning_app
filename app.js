(function () {
  const $ = s => document.querySelector(s);
  const app = $('#app'), flash = $('#flash');
  const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && matchMedia('(pointer:coarse)').matches);
  const canVibrate = typeof navigator.vibrate === 'function';
  const KEY = 'morse-state-v1';
  const defaults = {
    sound: true, light: true, vibration: isMobile && canVibrate, speed: 1, pitch: 600,
    xp: 0, streak: 0, lastDay: '', unlocked: 0, hearts: 5, stars: {}
  };
  let st = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}'));
  const save = () => localStorage.setItem(KEY, JSON.stringify(st));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const unit = () => Morse.UNIT / st.speed;

  // ---- signal output ----
  let ctx, playing = 0;
  function tone(on) {
    if (!st.sound) return () => {};
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = st.pitch; g.gain.value = 0.2;
    o.connect(g); g.connect(ctx.destination); o.start();
    return () => { g.gain.setTargetAtTime(0, ctx.currentTime, 0.005); o.stop(ctx.currentTime + 0.05); };
  }
  function pulseOn() { if (st.light) flash.classList.add('on'); return tone(); }
  function pulseOff(stop) { flash.classList.remove('on'); stop(); }

  async function play(pattern) {
    const id = ++playing;
    if (st.vibration && canVibrate) navigator.vibrate(Morse.vibrationPattern(pattern, unit()));
    for (const seg of Morse.timeline(pattern, unit())) {
      if (id !== playing) return;
      if (seg.on) { const stop = pulseOn(); await sleep(seg.ms); pulseOff(stop); }
      else await sleep(seg.ms);
    }
  }
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

  // ---- UI ----
  function stats() { $('#stats').textContent = `🔥${st.streak}  ⭐${st.xp}  ❤️${st.hearts}`; }
  function home() {
    playing++;
    stats();
    app.innerHTML = '<div class="path"></div>';
    Morse.LESSONS.forEach((l, i) => {
      const b = document.createElement('button');
      b.className = 'node' + (i <= st.unlocked ? ' primary' : ' locked');
      b.disabled = i > st.unlocked;
      b.textContent = `${i + 1}. ${l.title} ${'★'.repeat(st.stars[i] || 0)}`;
      b.onclick = () => startLesson(i);
      app.firstChild.appendChild(b);
    });
  }
  function startLesson(i) {
    if (st.hearts <= 0) st.hearts = 5; // hearts refill when starting a lesson
    const chars = [...Morse.LESSONS[i].chars], pool = [...Morse.lettersUpTo(i)];
    const qs = [];
    chars.forEach(c => { qs.push({ t: 'listen', c }, { t: 'send', c }, { t: 'see', c }); });
    runLesson(i, shuffle(qs), pool, 0, 0);
  }
  function runLesson(i, qs, pool, n, mistakes) {
    stats();
    if (n >= qs.length || st.hearts <= 0) return finish(i, n >= qs.length, mistakes);
    const q = qs[n], pat = Morse.MORSE[q.c];
    const bar = `<div class="bar"><div style="width:${n / qs.length * 100}%"></div></div>`;
    const next = ok => {
      if (!ok) { mistakes++; st.hearts--; qs.push(q); }
      save(); setTimeout(() => runLesson(i, qs, pool, n + 1, mistakes), 700);
    };
    if (q.t === 'send') {
      app.innerHTML = `${bar}<p>Tap the morse for</p><div class="big">${q.c}</div>
        <div class="pattern" id="in"></div>
        <div class="row"><button id="dot">•</button><button id="dash">—</button></div>
        <div class="row"><button id="clr">⌫</button><button class="primary" id="ok">Check</button></div>`;
      let input = '';
      const add = s => { input += s; $('#in').textContent = input; play(s); };
      $('#dot').onclick = () => add('.'); $('#dash').onclick = () => add('-');
      $('#clr').onclick = () => { input = ''; $('#in').textContent = ''; };
      $('#ok').onclick = () => {
        const ok = input === pat; $('#in').textContent = ok ? '✅ ' + pat : '❌ ' + pat;
        $('#ok').disabled = true; next(ok);
      };
      return;
    }
    const opts = shuffle([q.c, ...shuffle(pool.filter(c => c !== q.c)).slice(0, 3)]);
    const prompt = q.t === 'listen'
      ? '<p>What letter do you hear / feel / see?</p><button class="primary" id="rep">▶ Play</button>'
      : `<p>Which letter is this?</p><div class="pattern">${pat.replace(/\./g, '•').replace(/-/g, '—')}</div>`;
    app.innerHTML = `${bar}${prompt}<div class="grid">${opts.map(o => `<button class="opt big" style="font-size:2rem;margin:0">${o}</button>`).join('')}</div>`;
    if (q.t === 'listen') { $('#rep').onclick = () => play(pat); play(pat); }
    app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const ok = b.textContent === q.c;
      b.classList.add(ok ? 'good' : 'bad');
      app.querySelectorAll('.opt').forEach(x => x.disabled = true);
      if (!ok) [...app.querySelectorAll('.opt')].find(x => x.textContent === q.c).classList.add('good');
      next(ok);
    });
  }
  function finish(i, won, mistakes) {
    const today = new Date().toDateString();
    let msg;
    if (won) {
      const stars = mistakes === 0 ? 3 : mistakes < 3 ? 2 : 1;
      st.stars[i] = Math.max(st.stars[i] || 0, stars);
      st.xp += 10 * stars;
      if (st.lastDay !== today) {
        const y = new Date(Date.now() - 864e5).toDateString();
        st.streak = st.lastDay === y ? st.streak + 1 : 1; st.lastDay = today;
      }
      if (i === st.unlocked && i < Morse.LESSONS.length - 1) st.unlocked++;
      msg = `🎉 Lesson complete! ${'★'.repeat(stars)}`;
    } else msg = '💔 Out of hearts. Try again!';
    save(); stats();
    app.innerHTML = `<div class="big">${msg}</div><button class="primary" id="back">Continue</button>`;
    $('#back').onclick = home;
  }

  // ---- settings ----
  const dlg = $('#settings');
  const bind = (id, key, num) => {
    const el = $(id); if (el.type === 'checkbox') el.checked = st[key]; else el.value = st[key];
    el.onchange = () => { st[key] = el.type === 'checkbox' ? el.checked : parseFloat(el.value); save();
      if (key === 'light' && el.checked) { flash.classList.add('on'); setTimeout(() => flash.classList.remove('on'), 150); }
      if (key === 'vibration' && el.checked && canVibrate) navigator.vibrate(100);
      if (key === 'sound' && el.checked) pulseOff(pulseOn()); };
  };
  bind('#optSound', 'sound'); bind('#optLight', 'light'); bind('#optVibration', 'vibration');
  bind('#optSpeed', 'speed'); bind('#optPitch', 'pitch');
  if (!canVibrate) { $('#optVibration').disabled = true; $('#vibNote').textContent = '(not supported on this device)'; st.vibration = false; }
  $('#settingsBtn').onclick = () => dlg.showModal();
  $('#closeSettings').onclick = () => dlg.close();

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  home();
})();
