/* =========================================================
   Balat Panel — ortak çekirdek
   Sunucu iletişimi, yönlendirme, kabuk (menü), form/sayfa pencereleri,
   bildirim balonu, tarih ve durum yardımcıları.
   ========================================================= */
window.B = (function () {
'use strict';

const B = {};
const $ = B.$ = (s, k) => (k || document).querySelector(s);
const $$ = B.$$ = (s, k) => [...(k || document).querySelectorAll(s)];
const esc = B.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
B.nl2br = s => esc(s).replace(/\n/g, '<br>');

/* github.io gibi PHP çalışmayan önizleme sunucularında yalnızca Portföy tanıtımı çalışır */
B.DEMO = /\.github\.io$/.test(location.hostname) || new URLSearchParams(location.search).has('demo');
if (B.DEMO) document.documentElement.classList.add('demo');

/* ---------- Simgeler (her durum metinle birlikte gösterilir; yalnızca renge dayanılmaz) ---------- */
const svg = (d, w) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
B.ikon = {
  geri: svg('<path d="M15 5l-7 7 7 7"/>', 2.4),
  ileri: svg('<path d="M9 5l7 7-7 7"/>', 2.2),
  ev: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  zil: svg('<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>'),
  kisi: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
  kisiler: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/>'),
  canta: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 12h18"/>'),
  katman: svg('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  resim: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  saat: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  menu: svg('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>', 2.6),
  ayar: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>', 1.7),
  arti: svg('<path d="M12 5v14M5 12h14"/>', 2.4),
  arama: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', 2.2),
  onay: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.6),
  nokta: svg('<circle cx="12" cy="12" r="4" fill="currentColor"/>'),
  bos: svg('<circle cx="12" cy="12" r="4"/>'),
  unlem: svg('<path d="M12 7v6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>', 2.6),
  uyari: svg('<path d="M12 3l10 18H2z"/><path d="M12 10v4"/><circle cx="12" cy="17.5" r=".6" fill="currentColor"/>', 2),
  dosya: svg('<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/>'),
  indir: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', 2),
  yukle: svg('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>', 2),
  sil: svg('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  kalem: svg('<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>'),
  telefon: svg('<path d="M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2z"/>'),
  mesaj: svg('<path d="M4 5h16v11H8l-4 4z"/>'),
  kilit: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>'),
  baglanti: svg('<path d="M10 14a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 10a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>'),
  tutamak: svg('<path d="M4 8h16M4 12h16M4 16h16"/>', 2),
  goz: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  cikis: svg('<path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H4"/>'),
  paylas: svg('<path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>', 2),
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2z"/></svg>',
};

/* ---------- Tarih ---------- */
const AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const AYLAR_UZUN = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
B.tarih = (s, uzun) => {
  if (!s) return '';
  const d = new Date(s.length === 10 ? s + 'T12:00:00' : s);
  if (isNaN(d)) return '';
  return d.getDate() + ' ' + (uzun ? AYLAR_UZUN : AYLAR)[d.getMonth()] + ' ' + d.getFullYear();
};
B.saat = s => { const d = new Date(s); return isNaN(d) ? '' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
B.goreceli = s => {
  if (!s) return '';
  const d = new Date(s), fark = (Date.now() - d) / 1000;
  if (fark < 60) return 'az önce';
  if (fark < 3600) return Math.floor(fark / 60) + ' dk önce';
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  const gun = Math.round((bugun - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  if (gun === 0) return 'bugün ' + B.saat(s);
  if (gun === 1) return 'dün ' + B.saat(s);
  if (gun < 7) return gun + ' gün önce';
  return B.tarih(s);
};
B.kalanGun = s => {
  if (!s) return null;
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((new Date(s + 'T00:00:00') - b) / 864e5);
};
B.boyut = n => n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
B.basHarf = ad => String(ad || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toLocaleUpperCase('tr');
B.ilkAd = ad => String(ad || '').trim().split(/\s+/)[0];

/* ---------- Durumlar: renk + simge + metin ---------- */
B.ASAMA = {
  tamamlandi: {ad:'Tamamlandı', ikon:'onay', sinif:'tamam'},
  devam: {ad:'Devam ediyor', ikon:'nokta', sinif:'devam'},
  musteri: {ad:'Sizden işlem bekleniyor', ekip:'Müşteriden işlem bekleniyor', ikon:'unlem', sinif:'dikkat'},
  bekliyor: {ad:'Bekliyor', ikon:'bos', sinif:'bekliyor'},
};
B.EVRAK = {
  eksik: {ad:'Eksik', ikon:'unlem', sinif:'dikkat'},
  yuklendi: {ad:'Yüklendi', ikon:'yukle', sinif:'devam'},
  inceleniyor: {ad:'İnceleniyor', ikon:'saat', sinif:'devam'},
  onaylandi: {ad:'Onaylandı', ikon:'onay', sinif:'tamam'},
  duzeltme: {ad:'Düzeltme gerekli', ikon:'uyari', sinif:'dikkat'},
};
B.IS = {
  aktif: {ad:'Devam ediyor', ikon:'nokta', sinif:'devam'},
  beklemede: {ad:'Beklemede', ikon:'saat', sinif:'bekliyor'},
  tamamlandi: {ad:'Tamamlandı', ikon:'onay', sinif:'tamam'},
  iptal: {ad:'İptal edildi', ikon:'bos', sinif:'bekliyor'},
};
B.ROL = {musteri:'Müşteri', personel:'Personel', yonetici:'Yönetici'};
B.cip = (tablo, durum, ekipIcin) => {
  const d = B[tablo][durum] || {ad: durum, ikon:'bos', sinif:'bekliyor'};
  return `<span class="cip cip-${d.sinif}">${B.ikon[d.ikon]}${esc(ekipIcin && d.ekip ? d.ekip : d.ad)}</span>`;
};
B.ilerleme = (oran, ince) => `<div class="ilerleme${ince ? ' ince' : ''}" role="progressbar" aria-valuenow="${oran}" aria-valuemin="0" aria-valuemax="100" aria-label="Tamamlanma oranı yüzde ${oran}"><i style="width:${oran}%"></i></div>`;
B.halka = oran => {
  const r = 34, c = 2 * Math.PI * r;
  return `<div class="halka" role="img" aria-label="Yüzde ${oran} tamamlandı"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="${r}" class="halka-iz"/><circle cx="40" cy="40" r="${r}" class="halka-dolu" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - oran / 100)}"/></svg><b>%${oran}</b></div>`;
};
B.avatar = (ad, buyuk) => `<span class="avatar${buyuk ? ' buyuk' : ''}" aria-hidden="true">${esc(B.basHarf(ad))}</span>`;
B.telLink = t => t ? 'tel:' + t.replace(/[^\d+]/g, '') : '';
B.waLink = (t, metin) => {
  if (!t) return '';
  let n = t.replace(/\D/g, '');
  if (n.startsWith('0')) n = '9' + n; else if (!n.startsWith('90')) n = '90' + n;
  return 'https://wa.me/' + n + (metin ? '?text=' + encodeURIComponent(metin) : '');
};

/* ---------- Sunucu ---------- */
B.oku = async (islem, parametre) => {
  if (B.DEMO && B.demoApi) return B.demoApi(islem, parametre || {});
  const q = new URLSearchParams(Object.assign({islem}, parametre || {}));
  return cevapIsle(islem, () => fetch('api.php?' + q, {credentials:'same-origin', headers:{'Accept':'application/json'}}));
};
B.yaz = async (islem, govde) => {
  if (B.DEMO && B.demoApi) return B.demoApi(islem, govde || {});
  return cevapIsle(islem, () => fetch('api.php?islem=' + islem, {
    method:'POST', credentials:'same-origin',
    headers:{'X-Balat-Panel':'1', 'Content-Type':'application/json'}, body: JSON.stringify(govde || {}),
  }));
};
async function cevapIsle(islem, istek) {
  let r, j;
  try { r = await istek(); } catch (e) { throw new Error('İnternet bağlantısı yok gibi görünüyor. Bağlantınızı kontrol edip tekrar deneyin.'); }
  try { j = await r.json(); } catch (e) { throw new Error('Sunucudan beklenmeyen bir cevap geldi (' + r.status + '). Biraz sonra tekrar deneyin.'); }
  if (r.status === 401 && !['giris', 'oturum', 'sifre_yenile'].includes(islem)) { B.oturumBitti(); }
  if (!j.ok && islem !== 'oturum') { const e = new Error(j.hata || 'Bir hata oluştu.'); e.kod = r.status; throw e; }
  return j;
}
/** Dosya gönderimi (ilerleme göstergeli) */
B.gonder = (islem, form, ilerleme) => B.DEMO ? B.demoGonder(islem, form, ilerleme) : new Promise((coz, red) => {
  const x = new XMLHttpRequest();
  x.open('POST', 'api.php?islem=' + islem);
  x.setRequestHeader('X-Balat-Panel', '1');
  x.upload.onprogress = e => e.lengthComputable && ilerleme && ilerleme(e.loaded / e.total);
  x.onload = () => {
    let j = null; try { j = JSON.parse(x.responseText); } catch (e) {}
    if (x.status === 401) B.oturumBitti();
    if (j && j.ok) coz(j);
    else red(new Error(j && j.hata ? j.hata : x.status === 413 ? 'Dosya sunucunun kabul ettiği boyuttan büyük.' : 'Yükleme başarısız (' + x.status + ').'));
  };
  x.onerror = () => red(new Error('Bağlantı koptu. Tekrar deneyin.'));
  x.send(form);
});
B.indirAdres = (dosyaId, indir) => B.DEMO ? B.demoDosyaAdres(dosyaId) : 'api.php?islem=dosya_indir&id=' + dosyaId + (indir ? '&indir=1' : '');

/* ---------- Fotoğrafları yüklemeden önce küçült (sunucu sınırı 2 MB olabilir) ---------- */
async function resmiAc(dosya) {
  if (window.createImageBitmap) { try { return await createImageBitmap(dosya, {imageOrientation:'from-image'}); } catch (e) {} }
  return new Promise((coz, red) => {
    const u = URL.createObjectURL(dosya), i = new Image();
    i.onload = () => { coz(i); setTimeout(() => URL.revokeObjectURL(u), 1000); };
    i.onerror = () => red(new Error('Fotoğraf açılamadı.'));
    i.src = u;
  });
}
B.olcekle = (kaynak, maksUzun, maksGen, kalite) => {
  const w = kaynak.width, h = kaynak.height, k = Math.min(1, maksUzun / Math.max(w, h), maksGen / w);
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(kaynak, 0, 0, c.width, c.height);
  return new Promise((coz, red) => c.toBlob(b => b ? coz(b) : red(new Error('Fotoğraf işlenemedi.')), 'image/jpeg', kalite));
};
B.resmiAc = resmiAc;
/** Evrak olarak yüklenecek dosya: büyük fotoğraflar okunaklı kalacak şekilde küçültülür, diğerleri olduğu gibi */
B.evrakHazirla = async dosya => {
  const foto = /^image\/(jpeg|png|webp|heic|heif)$/i.test(dosya.type) || /\.(heic|heif)$/i.test(dosya.name);
  if (!foto || dosya.size < 1.5 * 1048576) return dosya;
  try {
    const r = await resmiAc(dosya);
    let b = null;
    for (const [u, q] of [[2800, .85], [2400, .8], [2000, .75]]) { b = await B.olcekle(r, u, u, q); if (b.size < 1.8 * 1048576) break; }
    if (r.close) r.close();
    return new File([b], dosya.name.replace(/\.[^.]+$/, '') + '.jpg', {type:'image/jpeg'});
  } catch (e) { return dosya; }
};
/** Dosya seçtir (gizli input) */
B.dosyaSec = (kabul, coklu) => new Promise(coz => {
  const i = document.createElement('input');
  i.type = 'file'; i.accept = kabul || ''; i.multiple = !!coklu; i.style.display = 'none';
  i.onchange = () => { coz([...i.files]); i.remove(); };
  i.addEventListener('cancel', () => { coz([]); i.remove(); });   // iptal edilirse (destekleyen tarayıcılarda)
  document.body.appendChild(i); i.click();
});
B.EVRAK_KABUL = 'image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx,.xls,.xlsx,.dwg,.dxf,.zip';

/* ---------- Bildirim balonu ---------- */
let toastZaman;
B.toast = (mesaj, hata) => {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.textContent = mesaj; t.className = 'acik' + (hata ? ' hata' : '');
  clearTimeout(toastZaman); toastZaman = setTimeout(() => t.className = '', hata ? 4500 : 2600);
};

/* ---------- Alttan açılan seçenek listesi ---------- */
B.secenek = (baslik, aciklama, secenekler) => new Promise(coz => {
  const p = document.createElement('div');
  p.className = 'perde';
  p.innerHTML = `<div class="sayfa" role="dialog" aria-modal="true">
    <div class="sayfa-grup">${baslik || aciklama ? `<div class="sayfa-baslik">${baslik ? `<b>${esc(baslik)}</b>` : ''}${esc(aciklama || '')}</div>` : ''}
    ${secenekler.map(s => `<button data-k="${esc(s.k)}" class="${s.tehlike ? 'tehlike' : ''}">${esc(s.ad)}</button>`).join('')}</div>
    <div class="sayfa-grup"><button data-k="" class="kalin">Vazgeç</button></div></div>`;
  document.body.appendChild(p);
  requestAnimationFrame(() => p.classList.add('acik'));
  const kapat = k => { p.classList.remove('acik'); setTimeout(() => p.remove(), 300); coz(k || null); };
  p.addEventListener('click', e => { const b = e.target.closest('button'); if (b) kapat(b.dataset.k); else if (e.target === p) kapat(null); });
});
B.onay = async (baslik, aciklama, dugme, tehlike) => (await B.secenek(baslik, aciklama, [{k:'evet', ad:dugme || 'Evet', tehlike: tehlike !== false}])) === 'evet';

/* ---------- Form penceresi ----------
   alanlar: [{ad, etiket, tur, deger, secenekler:[[k,ad]], yer, zorunlu, ipucu, maks}]
   tur: metin | eposta | tel | sayi | tarih | cok | secim | segment | onay | coklu | bilgi
   kaydet(degerler) hata fırlatırsa pencere açık kalır ve hata gösterilir. */
B.form = ({baslik, aciklama, alanlar, dugme, kaydet, ekDugmeler}) => new Promise(coz => {
  const p = document.createElement('div');
  p.className = 'perde form-perde';
  const alanHtml = a => {
    const id = 'f_' + a.ad, d = a.deger == null ? '' : a.deger;
    const ust = a.tur === 'bilgi' ? '' : `<label for="${id}">${esc(a.etiket)}${a.zorunlu ? ' <i aria-hidden="true">*</i>' : ''}</label>`;
    let g;
    switch (a.tur) {
      case 'cok': g = `<textarea id="${id}" name="${a.ad}" rows="${a.satir || 3}" maxlength="${a.maks || 2000}" placeholder="${esc(a.yer || '')}">${esc(d)}</textarea>`; break;
      case 'secim': g = `<select id="${id}" name="${a.ad}">${a.secenekler.map(([k, ad]) => `<option value="${esc(k)}"${String(k) === String(d) ? ' selected' : ''}>${esc(ad)}</option>`).join('')}</select>`; break;
      case 'segment': g = `<div class="segment secmeli" id="${id}" data-ad="${a.ad}" role="radiogroup" aria-label="${esc(a.etiket)}">${a.secenekler.map(([k, ad]) => `<button type="button" role="radio" data-k="${esc(k)}" aria-checked="${String(k) === String(d)}" class="${String(k) === String(d) ? 'aktif' : ''}">${ad}</button>`).join('')}</div>`; break;
      case 'onay': g = `<label class="anahtar"><input type="checkbox" id="${id}" name="${a.ad}"${d ? ' checked' : ''}><span></span>${esc(a.metin || '')}</label>`; break;
      case 'coklu': g = `<div class="coklu" id="${id}" data-ad="${a.ad}">${a.secenekler.map(([k, ad]) => `<button type="button" data-k="${esc(k)}" aria-pressed="${(d || []).map(String).includes(String(k))}" class="cip-sec${(d || []).map(String).includes(String(k)) ? ' aktif' : ''}">${esc(ad)}</button>`).join('')}</div>`; break;
      case 'bilgi': g = `<div class="form-bilgi">${a.html}</div>`; break;
      default: {
        const tur = {eposta:'email', tel:'tel', sayi:'text', tarih:'date'}[a.tur] || 'text';
        const ek = a.tur === 'sayi' ? ' inputmode="numeric" pattern="[0-9]*"' : a.tur === 'eposta' ? ' autocapitalize="none" autocorrect="off" spellcheck="false"' : a.tur === 'tel' ? ' inputmode="tel"' : '';
        g = `<input id="${id}" name="${a.ad}" type="${tur}" value="${esc(d)}" maxlength="${a.maks || 200}" placeholder="${esc(a.yer || '')}"${ek}>`;
      }
    }
    return `<div class="form-alan" data-alan="${a.ad}"${a.gizle ? ' hidden' : ''}>${ust}${g}${a.ipucu ? `<small>${esc(a.ipucu)}</small>` : ''}</div>`;
  };
  p.innerHTML = `<form class="form-sayfa" role="dialog" aria-modal="true" aria-labelledby="fBaslik" novalidate>
    <div class="form-ust"><button type="button" class="metin-dugme" data-vazgec>Vazgeç</button><h2 id="fBaslik">${esc(baslik)}</h2><button type="submit" class="metin-dugme kalin">${esc(dugme || 'Kaydet')}</button></div>
    <div class="form-govde">${aciklama ? `<p class="not" style="margin:0 0 14px">${esc(aciklama)}</p>` : ''}
      <div class="hata-kutu gizli" role="alert"></div>
      ${alanlar.map(alanHtml).join('')}
      ${(ekDugmeler || []).map(e => `<button type="button" class="btn ${e.tehlike ? 'tehlike' : 'ikincil'}" data-ek="${e.k}" style="margin-top:12px">${esc(e.ad)}</button>`).join('')}
    </div></form>`;
  document.body.appendChild(p);
  document.body.classList.add('kilitli');
  requestAnimationFrame(() => p.classList.add('acik'));
  const f = $('form', p), hk = $('.hata-kutu', p);
  const kapat = v => { p.classList.remove('acik'); document.body.classList.remove('kilitli'); setTimeout(() => p.remove(), 300); coz(v); };
  $$('.segment.secmeli', p).forEach(s => s.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', s).forEach(x => { x.classList.toggle('aktif', x === b); x.setAttribute('aria-checked', x === b); });
    s.dispatchEvent(new Event('change', {bubbles:true}));
  }));
  $$('.coklu', p).forEach(s => s.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    b.classList.toggle('aktif'); b.setAttribute('aria-pressed', b.classList.contains('aktif'));
  }));
  const degerler = () => {
    const v = {};
    alanlar.forEach(a => {
      const el = $('#f_' + a.ad, p);
      if (!el || a.tur === 'bilgi') return;
      if (a.tur === 'segment') v[a.ad] = ($('button.aktif', el) || {dataset:{}}).dataset.k || '';
      else if (a.tur === 'onay') v[a.ad] = el.checked;
      else if (a.tur === 'coklu') v[a.ad] = $$('button.aktif', el).map(b => b.dataset.k);
      else v[a.ad] = el.value.trim();
    });
    return v;
  };
  p.alanGoster = (ad, goster) => { const el = $(`[data-alan="${ad}"]`, p); if (el) el.hidden = !goster; };
  if (typeof alanlar.degisince === 'function') { f.addEventListener('change', () => alanlar.degisince(degerler(), p)); alanlar.degisince(degerler(), p); }
  p.addEventListener('click', e => {
    if (e.target === p || e.target.closest('[data-vazgec]')) kapat(null);
    const ek = e.target.closest('[data-ek]'); if (ek) kapat({eylem: ek.dataset.ek});
  });
  f.onsubmit = async e => {
    e.preventDefault();
    hk.classList.add('gizli');
    const v = degerler();
    const eksik = alanlar.find(a => a.zorunlu && !$(`[data-alan="${a.ad}"]`, p).hidden && (v[a.ad] === '' || v[a.ad] == null));
    if (eksik) { hk.textContent = `“${eksik.etiket}” alanını doldurun.`; hk.classList.remove('gizli'); $('#f_' + eksik.ad, p)?.focus(); return; }
    if (!kaydet) return kapat(v);
    const btn = $('button[type=submit]', p), eski = btn.textContent;
    btn.disabled = true; btn.innerHTML = '<span class="donen"></span>';
    try { const sonuc = await kaydet(v); kapat(sonuc === undefined ? v : sonuc); }
    catch (err) { hk.textContent = err.message; hk.classList.remove('gizli'); hk.scrollIntoView({block:'nearest'}); btn.disabled = false; btn.textContent = eski; }
  };
  setTimeout(() => { const ilk = $('input:not([type=checkbox]),textarea', f); if (ilk && matchMedia('(hover:hover)').matches) ilk.focus(); }, 320);
});

/** Paylaşılabilir bağlantı penceresi (kopyala / WhatsApp ile gönder) */
B.baglantiGoster = (baslik, aciklama, link, kime) => {
  const metin = `Merhaba${kime ? ' ' + B.ilkAd(kime) : ''}, Balat Mimarlık paneline giriş için şifrenizi şu bağlantıdan belirleyebilirsiniz: ${link}`;
  return B.form({baslik, aciklama, dugme:'Tamam', alanlar:[{ad:'b', tur:'bilgi', html:`<input class="baglanti-kutu" readonly value="${esc(link)}" onfocus="this.select()">
    <div class="yan-yana"><button type="button" class="btn ikincil" data-kopyala>${B.ikon.baglanti} Kopyala</button>
    <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(metin)}">${B.ikon.whatsapp} WhatsApp</a></div>`}]}).then(() => {});
};
document.addEventListener('click', async e => {
  const k = e.target.closest('[data-kopyala]'); if (!k) return;
  const i = $('.baglanti-kutu', k.closest('.form-govde')); if (!i) return;
  try { await navigator.clipboard.writeText(i.value); B.toast('Bağlantı kopyalandı'); }
  catch (err) { i.focus(); i.select(); document.execCommand && document.execCommand('copy'); B.toast('Bağlantı seçildi — kopyalayabilirsiniz'); }
});

/* =========================================================
   OTURUM + YÖNLENDİRME + KABUK
   ========================================================= */
B.kullanici = null;
B.okunmamis = 0;
B.kirli = false;            // kaydedilmemiş form
B.yuklemeSuruyor = 0;       // süren dosya yüklemesi
const rotalar = [];
const ACIK_ROTALAR = /^#\/(giris|kayit|sifremi-unuttum|sifre-yenile\/.+|kvkk)$/;
B.rota = (desen, islev) => rotalar.push({desen, islev});
B.git = hash => { if (location.hash === hash) B.goster(); else location.hash = hash; };
B.oturumBitti = () => { B.kullanici = null; if (!ACIK_ROTALAR.test(location.hash)) { B.toast('Oturumunuz kapandı, lütfen tekrar giriş yapın.', true); location.hash = '#/giris'; } };
B.oturumYenile = async () => {
  const o = await B.oku('oturum');
  B.kullanici = o.ok ? o.kullanici : null;
  B.okunmamis = o.ok ? o.okunmamis || 0 : 0;
  return B.kullanici;
};
B.ekipMi = () => B.kullanici && (B.kullanici.rol === 'personel' || B.kullanici.rol === 'yonetici');
B.yoneticiMi = () => B.kullanici && B.kullanici.rol === 'yonetici';

function menuOgeleri() {
  const k = B.kullanici;
  if (!k) return [];
  const zil = {h:'#/bildirimler', ad:'Bildirimler', ikon:'zil', rozet:B.okunmamis, mobil:1};
  if (k.rol === 'musteri') return [{h:'#/', ad:'Projelerim', ikon:'ev', mobil:1}, zil, {h:'#/hesap', ad:'Hesabım', ikon:'kisi', mobil:1}];
  if (k.rol === 'personel') return [{h:'#/', ad:'İşler', ikon:'canta', mobil:1}, zil, {h:'#/hesap', ad:'Hesabım', ikon:'kisi', mobil:1}];
  return [
    {h:'#/', ad:'İşler', ikon:'canta', mobil:1},
    {h:'#/musteriler', ad:'Müşteriler', ikon:'kisiler', mobil:1},
    {h:'#/portfoy', ad:'Portföy', ikon:'resim', mobil:1},
    zil,
    {h:'#/kullanicilar', ad:'Kullanıcılar', ikon:'kisi'},
    {h:'#/sablonlar', ad:'Süreç şablonları', ikon:'katman'},
    {h:'#/kayitlar', ad:'Değişiklik kayıtları', ikon:'saat'},
    {h:'#/hesap', ad:'Hesabım', ikon:'ayar'},
    {h:'#/menu', ad:'Daha fazla', ikon:'menu', mobil:1, sadeceMobil:1},
  ];
}
function aktifMenu(hash) {
  const h = hash || '#/';
  const es = {'#/is/':'#/', '#/musteri':'#/musteriler', '#/kullanici':'#/kullanicilar', '#/sablon':'#/sablonlar', '#/portfoy':'#/portfoy'};
  for (const [on, hedef] of Object.entries(es)) if (h.startsWith(on)) return hedef;
  if (['#/kullanicilar', '#/sablonlar', '#/kayitlar', '#/hesap'].includes(h) && B.yoneticiMi() && matchMedia('(max-width: 959px)').matches) return '#/menu';
  return h;
}
/** Sayfa içeriğini kabuğa (menü + içerik alanı) yerleştirir */
B.sayfa = (html, secenek) => {
  const app = $('#app');
  let kabuk = $('.kabuk', app);
  const imza = (B.kullanici ? B.kullanici.rol + B.kullanici.id : '') + (B.DEMO ? 'd' : '');
  if (!kabuk || kabuk.dataset.imza !== imza) {
    const m = menuOgeleri();
    app.innerHTML = `<div class="kabuk" data-imza="${imza}">
      <nav class="yan-menu" aria-label="Ana menü">
        <div class="yan-logo"><img src="../images/balatlogo.png" alt="Balat Mimarlık"><span>${B.DEMO ? 'Tanıtım · ' : ''}${esc(B.ROL[B.kullanici.rol])}</span></div>
        ${m.filter(o => !o.sadeceMobil).map(o => `<a href="${o.h}" data-menu="${o.h}">${B.ikon[o.ikon]}<span>${esc(o.ad)}</span>${o.rozet !== undefined ? `<em class="rozet" data-rozet${o.rozet ? '' : ' hidden'}>${o.rozet}</em>` : ''}</a>`).join('')}
        <div class="yan-alt">${B.avatar(B.kullanici.ad_soyad)}<div><b>${esc(B.kullanici.ad_soyad)}</b><small>${esc(B.kullanici.unvan || B.ROL[B.kullanici.rol])}</small></div></div>
      </nav>
      <main class="icerik" id="icerik" tabindex="-1"></main>
      <nav class="sekme-cubugu" aria-label="Menü">
        ${m.filter(o => o.mobil).map(o => `<a href="${o.h}" data-menu="${o.h}">${B.ikon[o.ikon]}<span>${esc(o.ad)}</span>${o.rozet !== undefined ? `<em class="rozet" data-rozet${o.rozet ? '' : ' hidden'}>${o.rozet}</em>` : ''}</a>`).join('')}
      </nav></div>`;
    kabuk = $('.kabuk', app);
  }
  const akt = aktifMenu(location.hash);
  $$('[data-menu]', kabuk).forEach(a => { const ak = a.dataset.menu === akt; a.classList.toggle('aktif', ak); ak ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
  B.rozetGuncelle();
  const ic = $('#icerik');
  ic.innerHTML = `<div class="ekran${secenek && secenek.genis ? ' genis' : ''}">${html}</div>`;
  return ic;
};
B.rozetGuncelle = () => $$('[data-rozet]').forEach(r => { r.textContent = B.okunmamis > 99 ? '99+' : B.okunmamis; r.hidden = !B.okunmamis; });
/** Kabuksuz tam ekran (giriş vb.) */
B.tamEkran = html => { $('#app').innerHTML = html; };
B.yukleniyor = () => { const ic = $('#icerik'); if (ic) ic.innerHTML = '<div class="ekran"><div class="donen" role="status" aria-label="Yükleniyor"></div></div>'; else $('#app').innerHTML = '<div class="donen" role="status" aria-label="Yükleniyor"></div>'; };
B.hataEkrani = mesaj => {
  const html = `<div class="bos-durum">${B.ikon.uyari}<h2>Bir sorun oluştu</h2><p>${esc(mesaj)}</p><button class="btn ikincil" onclick="location.reload()">Tekrar dene</button></div>`;
  if (B.kullanici) B.sayfa(html); else B.tamEkran(`<div class="ekran">${html}</div>`);
};
B.ustBar = (sol, sag) => `<div class="ust-bar">${sol || '<span></span>'}${sag || '<span></span>'}</div>`;
B.geri = (metin, hedef) => `<button class="geri" data-git="${hedef}">${B.ikon.geri}<span>${esc(metin)}</span></button>`;
B.bos = (ikon, baslik, metin, dugme) => `<div class="bos-durum">${B.ikon[ikon] || ''}<h2>${esc(baslik)}</h2>${metin ? `<p>${esc(metin)}</p>` : ''}${dugme || ''}</div>`;

B.goster = async () => {
  const h = location.hash || '#/';
  window.scrollTo(0, 0);
  try {
    if (!ACIK_ROTALAR.test(h)) {
      if (!B.kullanici) {
        B.yukleniyor();
        await B.oturumYenile();
        if (!B.kullanici) return B.git('#/giris');
      }
    }
    for (const r of rotalar) {
      const m = h.match(r.desen);
      if (m) return await r.islev(...m.slice(1));
    }
    B.git('#/');
  } catch (e) {
    console.error(e);
    B.hataEkrani(e.message);
  }
};

/* Kaydedilmemiş değişiklik / süren yükleme varken sayfadan çıkmadan önce sor */
window.addEventListener('hashchange', async e => {
  if (B.kirli || B.yuklemeSuruyor) {
    const eski = e.oldURL.slice(e.oldURL.indexOf('#'));
    const yeni = e.newURL.slice(e.newURL.indexOf('#'));
    history.replaceState(null, '', eski);
    const mesaj = B.yuklemeSuruyor ? 'Dosyalar hâlâ yükleniyor.' : 'Kaydedilmemiş değişiklikleriniz var.';
    const devam = await B.onay(mesaj, 'Çıkarsanız ' + (B.yuklemeSuruyor ? 'yüklenmeyen dosyalar kaybolur.' : 'değişiklikler kaybolur.'), 'Yine de çık');
    if (!devam) return;
    B.kirli = false; B.yuklemeSuruyor = 0;
    location.hash = yeni;
    return;
  }
  B.goster();
});
window.addEventListener('beforeunload', e => { if (B.kirli || B.yuklemeSuruyor) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('click', e => { const b = e.target.closest('[data-git]'); if (b) { e.preventDefault(); B.git(b.dataset.git); } });

/* Uygulama öne gelince bildirim sayısını tazele */
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && B.kullanici && !B.DEMO) { try { await B.oturumYenile(); B.rozetGuncelle(); } catch (e) {} }
});

return B;
})();
