/* =========================================================
   Balat Panel — proje ve fotoğraf yönetimi
   Ekranlar: #/giris  #/ (liste)  #/proje/<id>  #/yeni  #/ayarlar
   ========================================================= */
(function(){
'use strict';

const $ = (s, k) => (k || document).querySelector(s);
const $$ = (s, k) => [...(k || document).querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const GRUPLAR = {mimari:'Mimari', ic:'İç Mimari'};
const KATEGORILER = {konut:'Konut', villa:'Villa', ticari:'Ticari', ofis:'Ofis', magaza:'Mağaza & Ticari', cafe:'Cafe & Restoran'};

const ikon = {
  geri:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  ayar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  tutamak:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h16M4 12h16M4 16h16"/></svg>',
  arti:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  paylas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
};

/* ---------- Durum ---------- */
let veri = null;                 // {mimari:[...], ic:[...]}
let aktifGrup = 'mimari';
try { aktifGrup = sessionStorage.getItem('bm-grup') || 'mimari'; } catch(e) {}
let kirli = false;               // kaydedilmemiş form değişikliği
let yuklemeSuruyor = 0;

/* ---------- Tanıtım modu ----------
   github.io gibi PHP çalışmayan önizleme sunucularında panel kendini tanıtım moduna alır:
   ekranlar aynı çalışır ama hiçbir değişiklik sunucuya kaydedilmez (yalnızca bu tarayıcı sekmesinde tutulur). */
const DEMO = /\.github\.io$/.test(location.hostname) || new URLSearchParams(location.search).has('demo');
const DEMO_SIFRE = 'demo';
const demo = {
  veri: null,
  async yukle() {
    if (this.veri) return;
    let kayitli = null;
    try { kayitli = JSON.parse(sessionStorage.getItem('bm-demo-veri')); } catch (e) {}
    if (kayitli) {
      // Sekme yenilenince tarayıcıda geçici tutulan (blob:) fotoğraflar kaybolur; onları ayıkla
      for (const g of ['mimari', 'ic']) kayitli[g].forEach(p => p.gorseller = p.gorseller.filter(x => !x.b.startsWith('blob:')));
      this.veri = kayitli; return;
    }
    const r = await fetch('../veri/projeler.json', {cache:'no-cache'});
    this.veri = await r.json();
  },
  kaydet() { try { sessionStorage.setItem('bm-demo-veri', JSON.stringify(this.veri)); } catch (e) {} },
  bul(id) {
    for (const g of ['mimari', 'ic']) { const i = this.veri[g].findIndex(p => p.id === id); if (i >= 0) return {g, i, p: this.veri[g][i]}; }
    throw new Error('Proje bulunamadı.');
  },
  async api(islem, b) {
    await new Promise(r => setTimeout(r, 180));            // gerçek sunucu hissi
    const giris = () => { try { return sessionStorage.getItem('bm-demo-giris') === '1'; } catch (e) { return false; } };
    if (islem === 'oturum') return {ok: giris(), kullanici: giris() ? 'balat' : null};
    if (islem === 'giris') {
      if (!b.kullanici || b.sifre !== DEMO_SIFRE) throw new Error('Kullanıcı adı veya şifre hatalı. (Tanıtım şifresi: demo)');
      try { sessionStorage.setItem('bm-demo-giris', '1'); } catch (e) {}
      return {ok: true, kullanici: 'balat'};
    }
    if (islem === 'cikis') { try { sessionStorage.removeItem('bm-demo-giris'); } catch (e) {} return {ok: true}; }
    if (!giris()) { git('#/giris'); throw new Error('Lütfen giriş yapın.'); }
    await this.yukle();
    const kopya = () => JSON.parse(JSON.stringify(this.veri));
    if (islem === 'projeler') return {ok: true, veri: kopya()};
    if (islem === 'proje_kaydet') {
      const a = b.proje;
      if (!a.ad || !a.ad.trim()) throw new Error('Proje adı boş olamaz.');
      const alan = a.alan ? parseInt(a.alan, 10) : null, yil = a.yil ? parseInt(a.yil, 10) : null;
      if (yil && (yil < 1950 || yil > new Date().getFullYear() + 10)) throw new Error('Yıl geçerli değil.');
      const alanlar = {ad: a.ad.trim().slice(0, 80), kategori: a.kategori, konum: (a.konum || '').trim(), alan, yil};
      let p;
      if (!b.id) {
        const slug = alanlar.ad.toLocaleLowerCase('tr').replace(/[çğıöşü]/g, c => ({'ç':'c','ğ':'g','ı':'i','ö':'o','ş':'s','ü':'u'}[c])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proje';
        const id = slug + '-' + Math.random().toString(16).slice(2, 6);
        p = Object.assign({id, klasor: id}, alanlar, {gorseller: []});
        this.veri[b.grup].unshift(p);
      } else {
        const k = this.bul(b.id);
        p = Object.assign(k.p, alanlar);
        if (k.g !== b.grup) { this.veri[k.g].splice(k.i, 1); this.veri[b.grup].unshift(p); }
      }
      this.kaydet(); return {ok: true, proje: JSON.parse(JSON.stringify(p))};
    }
    if (islem === 'proje_sil') { const k = this.bul(b.id); this.veri[k.g].splice(k.i, 1); this.kaydet(); return {ok: true}; }
    if (islem === 'projeleri_sirala') {
      const m = new Map(this.veri[b.grup].map(p => [p.id, p]));
      this.veri[b.grup] = b.idler.map(id => m.get(id)).filter(Boolean); this.kaydet(); return {ok: true};
    }
    if (islem === 'gorselleri_sirala') {
      const k = this.bul(b.id), m = new Map(k.p.gorseller.map(x => [x.b, x]));
      k.p.gorseller = b.sira.map(x => m.get(x)).filter(Boolean); this.kaydet(); return {ok: true};
    }
    if (islem === 'gorsel_sil') { const k = this.bul(b.id); k.p.gorseller = k.p.gorseller.filter(x => x.b !== b.b); this.kaydet(); return {ok: true}; }
    if (islem === 'sifre_degistir') throw new Error('Tanıtım sürümünde şifre değiştirilemez.');
    throw new Error('Bilinmeyen işlem.');
  },
  async yukleGorsel(id, buyuk, kucuk, ilerleme) {
    for (let x = 1; x <= 10; x++) { await new Promise(r => setTimeout(r, 70)); ilerleme(x / 10); }
    const gr = {b: URL.createObjectURL(buyuk), k: URL.createObjectURL(kucuk)};
    this.bul(id).p.gorseller.push(gr); this.kaydet();
    return gr;
  },
  sifirla() { try { sessionStorage.removeItem('bm-demo-veri'); } catch (e) {} this.veri = null; },
};
if (DEMO) document.documentElement.classList.add('demo');
const demoNotu = () => DEMO ? '<p class="demo-not">Tanıtım sürümü — burada yaptığınız değişiklikler gerçek siteye kaydedilmez.</p>' : '';

/* ---------- Sunucu ---------- */
async function api(islem, govde) {
  if (DEMO) return demo.api(islem, govde || {});
  const opt = { method: govde ? 'POST' : 'GET', headers: {'X-Balat-Panel':'1'}, credentials:'same-origin' };
  if (govde) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(govde); }
  let r, j;
  try { r = await fetch('api.php?islem=' + islem, opt); }
  catch(e) { throw new Error('İnternet bağlantısı yok gibi görünüyor.'); }
  try { j = await r.json(); } catch(e) { throw new Error('Sunucudan beklenmeyen cevap geldi (' + r.status + ').'); }
  if (r.status === 401 && islem !== 'giris' && islem !== 'oturum') { veri = null; git('#/giris'); }
  if (!j.ok && islem !== 'oturum') throw new Error(j.hata || 'Bir hata oluştu.');
  return j;
}

function yukle(id, buyuk, kucuk, ilerleme) {
  if (DEMO) return demo.yukleGorsel(id, buyuk, kucuk, ilerleme);
  return new Promise((coz, red) => {
    const f = new FormData();
    f.append('id', id); f.append('buyuk', buyuk, 'b.jpg'); f.append('kucuk', kucuk, 'k.jpg');
    const x = new XMLHttpRequest();
    x.open('POST', 'api.php?islem=gorsel_yukle');
    x.setRequestHeader('X-Balat-Panel', '1');
    x.upload.onprogress = e => e.lengthComputable && ilerleme(e.loaded / e.total);
    x.onload = () => {
      let j = null; try { j = JSON.parse(x.responseText); } catch(e) {}
      if (x.status === 401) { git('#/giris'); }
      if (j && j.ok) coz(j.gorsel); else red(new Error(j && j.hata ? j.hata : 'Yükleme başarısız (' + x.status + ').'));
    };
    x.onerror = () => red(new Error('Bağlantı koptu.'));
    x.send(f);
  });
}

async function veriyiAl(zorla) {
  if (!veri || zorla) veri = (await api('projeler')).veri;
  return veri;
}
function projeBul(id) {
  for (const g of Object.keys(GRUPLAR)) { const p = veri[g].find(x => x.id === id); if (p) return {p, g}; }
  return null;
}

/* ---------- Fotoğraf hazırlama: telefonda küçültülür (hızlı yükleme, sunucuda eklenti gerekmez) ---------- */
async function resmiAc(dosya) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(dosya, {imageOrientation:'from-image'}); } catch(e) {}
  }
  return new Promise((coz, red) => {
    const u = URL.createObjectURL(dosya), i = new Image();
    i.onload = () => { coz(i); setTimeout(() => URL.revokeObjectURL(u), 1000); };
    i.onerror = () => red(new Error('Bu fotoğraf açılamadı.'));
    i.src = u;
  });
}
function olcekle(kaynak, maksUzun, maksGenislik, kalite) {
  const w = kaynak.width, h = kaynak.height;
  const k = Math.min(1, maksUzun / Math.max(w, h), maksGenislik / w);
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(kaynak, 0, 0, c.width, c.height);
  return new Promise((coz, red) => c.toBlob(b => b ? coz(b) : red(new Error('Fotoğraf işlenemedi.')), 'image/jpeg', kalite));
}
async function hazirla(dosya) {
  const r = await resmiAc(dosya);
  if (r.width < 200 || r.height < 200) throw new Error('Fotoğraf çok küçük.');
  // Sunucuların çoğunda dosya başına 2 MB sınırı var: sınırın altına inene kadar kaliteyi düşür
  let buyuk = null;
  for (const [uzun, kalite] of [[2400, .85], [2400, .75], [2000, .72], [1600, .7]]) {
    buyuk = await olcekle(r, uzun, uzun, kalite);
    if (buyuk.size < 1.8 * 1024 * 1024) break;
  }
  const kucuk = await olcekle(r, 1600, 1000, .72);
  if (r.close) r.close();
  return {buyuk, kucuk, onizleme: URL.createObjectURL(kucuk)};
}

/* ---------- Ortak arayüz parçaları ---------- */
let toastZaman;
function toast(mesaj, hata) {
  const t = $('#toast');
  t.textContent = mesaj; t.className = 'acik' + (hata ? ' hata' : '');
  clearTimeout(toastZaman); toastZaman = setTimeout(() => t.className = '', hata ? 4200 : 2400);
}

/** iOS tarzı alttan açılan seçenek listesi. Seçilen anahtarı (veya null) döndürür. */
function secenek(baslik, aciklama, secenekler) {
  return new Promise(coz => {
    const p = document.createElement('div');
    p.className = 'perde';
    p.innerHTML = `<div class="sayfa" role="dialog" aria-modal="true">
      <div class="sayfa-grup">${baslik || aciklama ? `<div class="sayfa-baslik">${baslik ? `<b>${esc(baslik)}</b>` : ''}${esc(aciklama || '')}</div>` : ''}
      ${secenekler.map(s => `<button data-k="${s.k}" class="${s.tehlike ? 'tehlike' : ''}">${esc(s.ad)}</button>`).join('')}</div>
      <div class="sayfa-grup"><button data-k="" class="kalin">Vazgeç</button></div></div>`;
    document.body.appendChild(p);
    requestAnimationFrame(() => p.classList.add('acik'));
    const kapat = k => { p.classList.remove('acik'); setTimeout(() => p.remove(), 300); coz(k || null); };
    p.addEventListener('click', e => { const b = e.target.closest('button'); if (b) kapat(b.dataset.k); else if (e.target === p) kapat(null); });
  });
}

function buyukGoster(src) {
  const g = document.createElement('div');
  g.className = 'goruntu';
  g.innerHTML = `<img src="${esc(src)}" alt=""><button aria-label="Kapat">✕</button>`;
  g.onclick = () => g.remove();
  document.body.appendChild(g);
}

function ustBar(sol, sag, sinirli) {
  return `<div class="ust-bar${sinirli ? ' sinirli' : ''}">${sol || '<span></span>'}${sag || '<span></span>'}</div>`;
}
function geriDugme(metin, hedef) {
  return `<button class="geri" data-git="${hedef}">${ikon.geri}<span>${esc(metin)}</span></button>`;
}

/* ---------- Yönlendirme ---------- */
function git(hash) { if (location.hash === hash) goster(); else location.hash = hash; }

async function goster() {
  const h = location.hash || '#/';
  window.scrollTo(0, 0);
  try {
    if (h === '#/giris') return girisEkrani();
    if (!veri) {
      const o = await api('oturum');
      if (!o.ok) return git('#/giris');
      app.innerHTML = '<div class="donen"></div>';
      await veriyiAl();
    }
    if (h === '#/ayarlar') return ayarlarEkrani();
    if (h === '#/yeni') return projeEkrani(null);
    const m = h.match(/^#\/proje\/([\w-]+)$/);
    if (m) return projeEkrani(m[1]);
    return listeEkrani();
  } catch (e) {
    app.innerHTML = `<div class="ekran"><div class="bos"><p>${esc(e.message)}</p><button class="btn ikincil" onclick="location.reload()">Tekrar dene</button></div></div>`;
  }
}

/* Kaydedilmemiş değişiklik varken çıkmadan önce sor */
window.addEventListener('hashchange', async e => {
  if (kirli || yuklemeSuruyor) {
    const eski = e.oldURL.slice(e.oldURL.indexOf('#'));
    const mesaj = yuklemeSuruyor ? 'Fotoğraflar hâlâ yükleniyor.' : 'Kaydedilmemiş değişiklikleriniz var.';
    history.replaceState(null, '', eski);
    const k = await secenek(mesaj, 'Çıkarsanız ' + (yuklemeSuruyor ? 'yüklenmeyen fotoğraflar kaybolur.' : 'değişiklikler kaybolur.'), [{k:'cik', ad:'Yine de çık', tehlike:true}]);
    if (k !== 'cik') return;
    kirli = false; yuklemeSuruyor = 0;
    location.hash = e.newURL.slice(e.newURL.indexOf('#'));
    return;
  }
  goster();
});
window.addEventListener('beforeunload', e => { if (kirli || yuklemeSuruyor) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('click', e => { const b = e.target.closest('[data-git]'); if (b) { e.preventDefault(); git(b.dataset.git); } });

/* =========================================================
   EKRAN: Giriş
   ========================================================= */
async function girisEkrani() {
  // Zaten giriş yapılmışsa doğrudan listeye geç (ana ekran ikonundan açılışta)
  try { if ((await api('oturum')).ok) return git('#/'); } catch (e) {}
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const anaEkranda = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  app.innerHTML = `<form class="giris" id="girisForm" novalidate>
    <img class="logo" src="../images/balatlogo.png" alt="Balat Mimarlık">
    <h1>Yönetim Paneli</h1>
    ${DEMO ? '<div class="demo-not" style="text-align:center;margin:-20px 0 22px">Tanıtım sürümü · Şifre: <b>demo</b></div>' : ''}
    <div class="hata-kutu gizli" id="girisHata" role="alert"></div>
    <div class="kart">
      <div class="alan"><label for="kAd">Kullanıcı</label><input id="kAd" ${DEMO ? 'value="balat"' : ''} name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></div>
      <div class="alan"><label for="kSifre">Şifre</label><input id="kSifre" ${DEMO ? 'value="demo"' : ''} name="password" type="password" autocomplete="current-password" required></div>
    </div>
    <button class="btn vurgu" id="girisBtn">Giriş yap</button>
    ${ios && !anaEkranda ? `<div class="ipucu"><b>Uygulama gibi kullanın</b>Safari’de alttaki ${ikon.paylas} <b style="display:inline">Paylaş</b> düğmesine dokunun, ardından <b style="display:inline">“Ana Ekrana Ekle”</b> seçin. Panel, telefonunuzda Balat ikonuyla açılır.</div>` : ''}
  </form>`;
  const f = $('#girisForm'), btn = $('#girisBtn'), hk = $('#girisHata');
  f.onsubmit = async e => {
    e.preventDefault();
    hk.classList.add('gizli');
    const kullanici = $('#kAd').value.trim(), sifre = $('#kSifre').value;
    if (!kullanici || !sifre) { hk.textContent = 'Kullanıcı adı ve şifre girin.'; hk.classList.remove('gizli'); return; }
    btn.disabled = true; btn.innerHTML = '<span class="donen"></span>';
    try {
      await api('giris', {kullanici, sifre});
      veri = null; git('#/');
    } catch (err) {
      hk.textContent = err.message; hk.classList.remove('gizli');
      btn.disabled = false; btn.textContent = 'Giriş yap';
    }
  };
}

/* =========================================================
   EKRAN: Proje listesi
   ========================================================= */
function listeEkrani() {
  const liste = veri[aktifGrup];
  app.innerHTML = `<div class="ekran">
    ${ustBar('<span></span>', `<button class="ikon-dugme" data-git="#/ayarlar" aria-label="Ayarlar">${ikon.ayar}</button>`)}
    <h1 class="baslik">Projeler</h1>${demoNotu()}
    <div class="segment" role="tablist">
      ${Object.entries(GRUPLAR).map(([k, ad]) => `<button role="tab" data-grup="${k}" class="${k === aktifGrup ? 'aktif' : ''}" aria-selected="${k === aktifGrup}">${ad}<small>${veri[k].length}</small></button>`).join('')}
    </div>
    ${liste.length ? `<ul class="liste" id="liste">${liste.map(satir).join('')}</ul>
      <p class="not">Sitede bu sırayla görünür. Sırayı değiştirmek için sağdaki ${ikon.tutamak.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} tutamağı basılı tutup sürükleyin.</p>`
      : `<div class="kart bos">Bu bölümde henüz proje yok.</div>`}
    <div class="alt-dugme"><button class="btn vurgu" data-git="#/yeni">${ikon.arti} Yeni proje</button></div>
  </div>`;

  $$('[data-grup]').forEach(b => b.onclick = () => {
    aktifGrup = b.dataset.grup;
    try { sessionStorage.setItem('bm-grup', aktifGrup); } catch(e) {}
    listeEkrani();
  });

  const ul = $('#liste');
  if (ul) Sortable.create(ul, {
    handle: '.tutamak', animation: 180, ghostClass: 'surukleniyor', chosenClass: 'secili-satir',
    onEnd: async ev => {
      if (ev.oldIndex === ev.newIndex) return;
      const idler = $$('.satir', ul).map(s => s.dataset.id);
      const eski = veri[aktifGrup];
      veri[aktifGrup] = idler.map(id => eski.find(p => p.id === id));
      try { await api('projeleri_sirala', {grup: aktifGrup, idler}); toast('Sıralama kaydedildi'); }
      catch (e) { toast(e.message, true); await veriyiAl(true); listeEkrani(); }
    }
  });
}

function satir(p) {
  const n = p.gorseller.length, kapak = n ? p.gorseller[0].k : '';
  return `<li class="satir" data-id="${esc(p.id)}">
    <button class="satir-ac" data-git="#/proje/${esc(p.id)}">
      ${kapak ? `<img class="kucuk-resim" src="${esc(kapak)}" alt="" loading="lazy">` : '<span class="kucuk-resim"></span>'}
      <span class="satir-metin"><b>${esc(p.ad)}</b>
        <span>${esc(KATEGORILER[p.kategori] || p.kategori)} · ${n ? n + ' fotoğraf' : '<span class="uyari">Fotoğraf yok · sitede görünmez</span>'}</span></span>
    </button>
    <button class="tutamak" aria-label="${esc(p.ad)} sırasını değiştir">${ikon.tutamak}</button>
  </li>`;
}

/* =========================================================
   EKRAN: Proje düzenle / yeni proje
   ========================================================= */
function projeEkrani(id) {
  const bulunan = id ? projeBul(id) : null;
  if (id && !bulunan) { toast('Proje bulunamadı.', true); return git('#/'); }
  const p = bulunan ? bulunan.p : {ad:'', kategori: aktifGrup === 'ic' ? 'konut' : 'villa', konum:'İstanbul', alan:null, yil:new Date().getFullYear(), gorseller:[]};
  let grup = bulunan ? bulunan.g : aktifGrup;
  const yeni = !bulunan;
  kirli = false;

  app.innerHTML = `<div class="ekran">
    ${ustBar(geriDugme('Projeler', '#/'), yeni ? '' : `<a class="geri" href="/#${grup === 'ic' ? 'ic-mimari' : 'projeler'}" target="_blank" rel="noopener" style="padding-right:0">Sitede gör ↗</a>`, true)}
    <h1 class="baslik" id="pBaslik">${yeni ? 'Yeni proje' : esc(p.ad)}</h1>${demoNotu()}
    <form id="pForm" class="kart" novalidate autocomplete="off">
      <div class="alan"><label for="fAd">Proje adı</label><input id="fAd" value="${esc(p.ad)}" placeholder="Örn. Sarıyer Villa" maxlength="80" enterkeyhint="next"></div>
      <div class="alan"><label>Bölüm</label><div class="segment" id="fGrup" style="margin:8px 0">
        ${Object.entries(GRUPLAR).map(([k, ad]) => `<button type="button" data-k="${k}" class="${k === grup ? 'aktif' : ''}">${ad}</button>`).join('')}</div></div>
      <div class="alan"><label for="fKat">Kategori</label><select id="fKat">
        ${Object.entries(KATEGORILER).map(([k, ad]) => `<option value="${k}"${k === p.kategori ? ' selected' : ''}>${ad}</option>`).join('')}</select></div>
      <div class="alan"><label for="fKonum">Konum</label><input id="fKonum" value="${esc(p.konum)}" placeholder="İstanbul" maxlength="60" enterkeyhint="next"></div>
      <div class="alan"><label for="fAlan">Alan</label><input id="fAlan" value="${p.alan || ''}" inputmode="numeric" pattern="[0-9]*" placeholder="İsteğe bağlı" maxlength="7"><span class="birim">m²</span></div>
      <div class="alan"><label for="fYil">Yıl</label><input id="fYil" value="${p.yil || ''}" inputmode="numeric" pattern="[0-9]*" placeholder="İsteğe bağlı" maxlength="4" enterkeyhint="done"></div>
    </form>
    ${yeni ? '<p class="not">Projeyi oluşturduktan sonra fotoğraf ekleyebilirsiniz. Fotoğrafı olmayan projeler sitede görünmez.</p>' : `
    <div class="foto-baslik"><h2 class="alt-baslik" id="fSayi">Fotoğraflar (${p.gorseller.length})</h2>
      <button class="kucuk-btn" id="fotoEkle">${ikon.arti} Ekle</button></div>
    <ul class="izgara" id="izgara"></ul>
    <p class="not" id="fotoNot"></p>
    <div style="margin-top:36px"><button class="btn tehlike" id="pSil">Projeyi sil</button></div>`}
    <div class="alt-dugme"><button class="btn vurgu" id="pKaydet"${yeni ? '' : ' disabled'}>${yeni ? 'Projeyi oluştur' : 'Kaydet'}</button></div>
  </div>`;

  const form = $('#pForm'), kaydet = $('#pKaydet');
  const degisti = () => { kirli = true; kaydet.disabled = false; };
  form.addEventListener('input', degisti);
  form.addEventListener('change', degisti);
  $$('#fGrup button').forEach(b => b.onclick = () => {
    grup = b.dataset.k; $$('#fGrup button').forEach(x => x.classList.toggle('aktif', x === b)); degisti();
  });
  // Klavyedeki "ileri" ile sonraki alana geç
  form.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const alanlar = $$('input,select', form), i = alanlar.indexOf(e.target);
    if (alanlar[i + 1]) alanlar[i + 1].focus(); else e.target.blur();
  });

  kaydet.onclick = async () => {
    const proje = {
      ad: $('#fAd').value.trim(), kategori: $('#fKat').value, konum: $('#fKonum').value.trim(),
      alan: $('#fAlan').value.replace(/\D/g, ''), yil: $('#fYil').value.replace(/\D/g, ''),
    };
    if (!proje.ad) { toast('Proje adı boş olamaz.', true); $('#fAd').focus(); return; }
    kaydet.disabled = true; const eskiMetin = kaydet.textContent; kaydet.innerHTML = '<span class="donen"></span>';
    try {
      const j = await api('proje_kaydet', {id: yeni ? '' : p.id, grup, proje});
      await veriyiAl(true);
      kirli = false; aktifGrup = grup;
      try { sessionStorage.setItem('bm-grup', grup); } catch(e) {}
      if (yeni) { toast('Proje oluşturuldu — şimdi fotoğraf ekleyin'); git('#/proje/' + j.proje.id); }
      else { toast('Kaydedildi'); $('#pBaslik').textContent = j.proje.ad; kaydet.textContent = eskiMetin; }
    } catch (e) { toast(e.message, true); kaydet.disabled = false; kaydet.textContent = eskiMetin; }
  };

  if (yeni) { setTimeout(() => $('#fAd').focus(), 300); return; }

  /* ---------- Fotoğraflar ---------- */
  const izgara = $('#izgara');
  const ciz = () => {
    const g = projeBul(p.id).p.gorseller;
    izgara.innerHTML = g.map((gr, i) => `<li class="foto" data-b="${esc(gr.b)}">
        <button type="button" aria-label="Fotoğraf ${i + 1}${i === 0 ? ' (kapak)' : ''} — seçenekler"><img src="${esc(gr.k)}" alt="" loading="lazy" draggable="false"></button>
        ${i === 0 ? '<span class="rozet">KAPAK</span>' : ''}<span class="sira">${i + 1}</span></li>`).join('');
    $('#fSayi').textContent = `Fotoğraflar (${g.length})`;
    $('#fotoNot').textContent = g.length
      ? 'İlk fotoğraf sitede kapak olarak görünür. Sırayı değiştirmek için fotoğrafı basılı tutup sürükleyin; seçenekler için dokunun.'
      : 'Henüz fotoğraf yok. “Ekle” ile galeriden veya kameradan fotoğraf seçin.';
  };
  ciz();

  const siraKaydet = async () => {
    const sira = $$('.foto', izgara).filter(li => li.dataset.b).map(li => li.dataset.b);
    const k = projeBul(p.id).p;
    k.gorseller = sira.map(b => k.gorseller.find(x => x.b === b));
    ciz();
    try { await api('gorselleri_sirala', {id: p.id, sira}); toast('Sıralama kaydedildi'); }
    catch (e) { toast(e.message, true); await veriyiAl(true); ciz(); }
  };

  Sortable.create(izgara, {
    animation: 180, delay: 220, delayOnTouchOnly: true, touchStartThreshold: 6,
    ghostClass: 'foto-hayalet', chosenClass: 'foto-secili', filter: '.yukleniyor', preventOnFilter: false,
    onStart: () => { if (navigator.vibrate) navigator.vibrate(10); },
    onEnd: ev => { if (ev.oldIndex !== ev.newIndex) siraKaydet(); },
  });

  izgara.addEventListener('click', async e => {
    const li = e.target.closest('.foto');
    if (!li || !li.dataset.b || li.classList.contains('yukleniyor')) return;
    const k = projeBul(p.id).p, i = k.gorseller.findIndex(x => x.b === li.dataset.b);
    if (i < 0) return;
    const sec = await secenek(null, `Fotoğraf ${i + 1} / ${k.gorseller.length}`, [
      ...(i > 0 ? [{k:'kapak', ad:'Kapak fotoğrafı yap'}] : []),
      {k:'buyuk', ad:'Büyük görüntüle'},
      {k:'sil', ad:'Fotoğrafı sil', tehlike:true},
    ]);
    if (sec === 'buyuk') buyukGoster(k.gorseller[i].b);
    if (sec === 'kapak') {
      const [gr] = k.gorseller.splice(i, 1); k.gorseller.unshift(gr); ciz();
      try { await api('gorselleri_sirala', {id: p.id, sira: k.gorseller.map(x => x.b)}); toast('Kapak fotoğrafı değişti'); }
      catch (err) { toast(err.message, true); await veriyiAl(true); ciz(); }
    }
    if (sec === 'sil') {
      const onay = await secenek('Fotoğraf silinsin mi?', 'Fotoğraf siteden kaldırılır. Sunucuda çöp kutusuna taşınır, gerekirse geri alınabilir.', [{k:'evet', ad:'Sil', tehlike:true}]);
      if (onay !== 'evet') return;
      try {
        await api('gorsel_sil', {id: p.id, b: k.gorseller[i].b});
        k.gorseller.splice(i, 1); ciz(); toast('Fotoğraf silindi');
      } catch (err) { toast(err.message, true); }
    }
  });

  const girdi = $('#dosya');
  $('#fotoEkle').onclick = () => { girdi.value = ''; girdi.click(); };
  girdi.onchange = async () => {
    const dosyalar = [...girdi.files];
    if (!dosyalar.length) return;
    yuklemeSuruyor += dosyalar.length;
    // Önce yer tutucular, sonra sırayla hazırlayıp yükle (telefon belleğini yormamak için tek tek)
    const kutular = dosyalar.map(() => {
      const li = document.createElement('li');
      li.className = 'foto yukleniyor';
      li.innerHTML = '<img alt=""><span class="yuzde">…</span><span class="ilerleme"><i></i></span>';
      izgara.appendChild(li); return li;
    });
    kutular[0].scrollIntoView({behavior:'smooth', block:'center'});
    let basarili = 0;
    const hatalar = [];
    for (let n = 0; n < dosyalar.length; n++) {
      const li = kutular[n], yz = $('.yuzde', li), bar = $('.ilerleme i', li);
      try {
        yz.textContent = 'Hazırlanıyor';
        const h = await hazirla(dosyalar[n]);
        $('img', li).src = h.onizleme;
        const gr = await yukle(p.id, h.buyuk, h.kucuk, x => { bar.style.width = (x * 100) + '%'; yz.textContent = Math.round(x * 100) + '%'; });
        projeBul(p.id).p.gorseller.push(gr);
        basarili++;
        li.dataset.bitti = '1';
      } catch (err) {
        hatalar.push(err.message);
        li.classList.add('hatali'); li.classList.remove('yukleniyor');
        yz.textContent = 'Hata';
        setTimeout(() => { li.dataset.bitti = '1'; li.remove(); }, 5000);
      }
      yuklemeSuruyor = Math.max(0, yuklemeSuruyor - 1);
      // Izgarayı yeniden çiz; bekleyen ve hatalı kutuları sona geri ekle
      ciz(); izgara.append(...kutular.filter(k => !k.dataset.bitti));
    }
    if (hatalar.length) toast(`${basarili} fotoğraf eklendi, ${hatalar.length} yüklenemedi: ${hatalar[0]}`, true);
    else toast(basarili === 1 ? 'Fotoğraf eklendi' : `${basarili} fotoğraf eklendi`);
  };

  $('#pSil').onclick = async () => {
    const k = projeBul(p.id).p;
    const onay = await secenek(`“${k.ad}” silinsin mi?`, `Proje ve ${k.gorseller.length} fotoğrafı siteden kaldırılır. Fotoğraflar sunucuda çöp kutusuna taşınır.`, [{k:'evet', ad:'Projeyi sil', tehlike:true}]);
    if (onay !== 'evet') return;
    try { await api('proje_sil', {id: p.id}); await veriyiAl(true); kirli = false; toast('Proje silindi'); git('#/'); }
    catch (e) { toast(e.message, true); }
  };
}

/* =========================================================
   EKRAN: Ayarlar
   ========================================================= */
function ayarlarEkrani() {
  app.innerHTML = `<div class="ekran">
    ${ustBar(geriDugme('Projeler', '#/'), '', true)}
    <h1 class="baslik">Ayarlar</h1>${demoNotu()}
    <h2 class="alt-baslik">Şifre değiştir</h2>
    <form class="kart" id="sForm" novalidate>
      <input type="text" name="username" autocomplete="username" value="balat" hidden>
      <div class="alan"><label for="sEski">Mevcut</label><input id="sEski" type="password" autocomplete="current-password"></div>
      <div class="alan"><label for="sYeni">Yeni</label><input id="sYeni" type="password" autocomplete="new-password" placeholder="En az 10 karakter"></div>
      <div class="alan"><label for="sYeni2">Yeni (tekrar)</label><input id="sYeni2" type="password" autocomplete="new-password"></div>
    </form>
    <div class="yan-yana"><button class="btn ikincil" id="sKaydet">Şifreyi değiştir</button></div>
    <p class="not">Şifre değişince diğer telefonlardaki oturumlar kapanır; oralarda yeni şifreyle tekrar giriş yapılır.</p>

    <h2 class="alt-baslik">Site</h2>
    <div class="kart">
      <a class="alan" href="/" target="_blank" rel="noopener" style="color:inherit">Siteyi aç<span style="margin-left:auto;color:var(--soluk)">↗</span></a>
    </div>
    <p class="not">Her değişiklikten önce proje listesinin yedeği alınır (son 30 sürüm). Silinen fotoğraflar sunucuda <b>images/_silinen</b> klasörüne taşınır; yanlışlıkla silinen bir şey olursa geri getirilebilir.</p>

    ${DEMO ? '<div class="yan-yana" style="margin-top:24px"><button class="btn ikincil" id="demoSifirla">Tanıtımı baştan başlat</button></div><p class="not">Yaptığınız tüm denemeleri siler, projeleri sitedeki haline döndürür.</p>' : ''}
    <div style="margin-top:36px"><button class="btn tehlike" id="cikis">Çıkış yap</button></div>
  </div>`;
  $('#sKaydet').onclick = async () => {
    const eski = $('#sEski').value, yeni = $('#sYeni').value, yeni2 = $('#sYeni2').value;
    if (!eski || !yeni) return toast('Tüm alanları doldurun.', true);
    if (yeni.length < 10) return toast('Yeni şifre en az 10 karakter olmalı.', true);
    if (yeni !== yeni2) return toast('Yeni şifreler aynı değil.', true);
    try { await api('sifre_degistir', {eski, yeni}); toast('Şifre değiştirildi'); $('#sForm').reset(); }
    catch (e) { toast(e.message, true); }
  };
  if ($('#demoSifirla')) $('#demoSifirla').onclick = async () => { demo.sifirla(); await veriyiAl(true); toast('Tanıtım baştan başladı'); git('#/'); };
  $('#cikis').onclick = async () => {
    const k = await secenek(null, 'Bu telefondan çıkış yapılsın mı?', [{k:'evet', ad:'Çıkış yap', tehlike:true}]);
    if (k !== 'evet') return;
    try { await api('cikis', {}); } catch (e) {}
    veri = null; git('#/giris');
  };
}

goster();
})();
