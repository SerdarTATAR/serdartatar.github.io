/* =========================================================
   Müşteri ekranları: ana sayfa, proje detayı (zaman çizelgesi, evraklar), evrak yükleme
   ========================================================= */
(function () {
'use strict';
const {$, $$, esc, ikon} = B;
const OFIS_WA = '905335838775';

/* ---------- Ortak parçalar (ekip ekranları da kullanır) ---------- */

/** Dosya yükleme şeridi (ekranın altında ilerleme) */
B.yuklemeSeridi = () => {
  let s = $('#yuklemeSeridi');
  if (!s) { s = document.createElement('div'); s.id = 'yuklemeSeridi'; s.setAttribute('role', 'status'); s.setAttribute('aria-live', 'polite'); document.body.appendChild(s); }
  return {
    goster: (ad, oran, sira) => { s.className = 'acik'; s.innerHTML = `<div><b>${esc(ad)}</b><small>${sira || ''}${oran < 1 ? 'yükleniyor… %' + Math.round(oran * 100) : 'işleniyor…'}</small></div><span class="ilerleme"><i style="width:${Math.round(oran * 100)}%"></i></span>`; },
    gizle: () => { s.className = ''; },
  };
};

/** Bir evraka dosya(lar) yükler; son proje görünümünü döndürür */
B.evrakYukle = async (evrakId, dosyalar) => {
  if (!dosyalar.length) return null;
  const serit = B.yuklemeSeridi();
  B.yuklemeSuruyor += dosyalar.length;
  let son = null, hata = null, basarili = 0;
  try {
    for (let i = 0; i < dosyalar.length; i++) {
      const ad = dosyalar[i].name;
      const sira = dosyalar.length > 1 ? `${i + 1}/${dosyalar.length} · ` : '';
      serit.goster(ad, 0, sira);
      try {
        const d = await B.evrakHazirla(dosyalar[i]);
        const f = new FormData(); f.append('evrak_id', evrakId); f.append('dosya', d, d.name);
        son = await B.gonder('dosya_yukle', f, x => serit.goster(ad, x, sira));
        basarili++;
      } catch (e) { hata = `${ad}: ${e.message}`; }
      B.yuklemeSuruyor = Math.max(0, B.yuklemeSuruyor - 1);
    }
  } finally { serit.gizle(); B.yuklemeSuruyor = 0; }
  if (hata) B.toast((basarili ? basarili + ' dosya yüklendi. ' : '') + hata, true);
  else B.toast(basarili > 1 ? basarili + ' dosya yüklendi' : 'Dosya yüklendi — ekibimiz inceleyecek');
  return son ? son.is : null;
};

B.bekleyenlerHtml = (liste, projeAdiGoster) => !liste.length ? '' : `
  <section class="dikkat-kutu" aria-labelledby="dkBaslik">
    <h2 id="dkBaslik">${ikon.uyari} Sizden beklenenler <span class="sayi">${liste.length}</span></h2>
    <ul>${liste.map(b => `<li>
      <div><b>${esc(b.baslik)}</b>${b.ayrinti ? `<p>${esc(b.ayrinti)}</p>` : ''}${projeAdiGoster ? `<small>${esc(b.is_ad)}</small>` : ''}</div>
      ${b.evrak_id ? `<button class="btn kucuk vurgu" data-yukle="${b.evrak_id}" data-is="${b.is_id}">${ikon.yukle} Yükle</button>`
        : projeAdiGoster ? `<a class="btn kucuk ikincil" href="#/is/${b.is_id}">Görüntüle</a>` : ''}
    </li>`).join('')}</ul>
  </section>`;

B.evrakOzetHtml = e => {
  const p = [];
  if (e.onaylandi) p.push(`<span class="mini mini-tamam">${ikon.onay}${e.onaylandi} onaylandı</span>`);
  if (e.inceleniyor + e.yuklendi) p.push(`<span class="mini mini-devam">${ikon.saat}${e.inceleniyor + e.yuklendi} incelemede</span>`);
  if (e.eksik) p.push(`<span class="mini mini-dikkat">${ikon.unlem}${e.eksik} eksik</span>`);
  if (e.duzeltme) p.push(`<span class="mini mini-dikkat">${ikon.uyari}${e.duzeltme} düzeltme gerekli</span>`);
  return p.length ? `<div class="evrak-ozet" aria-label="Evrak durumu">${ikon.dosya}${p.join('')}</div>` : '';
};

B.tahminiHtml = t => {
  if (!t) return '';
  const g = B.kalanGun(t);
  const ek = g > 0 ? ` <span class="soluk">(${g} gün)</span>` : g === 0 ? ' <span class="soluk">(bugün)</span>' : '';
  return `${ikon.saat}<span>Tahmini tamamlanma: <b>${B.tarih(t, true)}</b>${ek}</span>`;
};

B.akisHtml = (liste, projeAdi, ekip) => !liste.length ? '<p class="not">Henüz güncelleme yok.</p>' : `
  <ol class="akis">${liste.map(g => `<li class="${g.gorunurluk === 'ic' ? 'ic' : ''}">
    <span class="akis-nokta" aria-hidden="true"></span>
    <div>${g.gorunurluk === 'ic' ? '<span class="ic-rozet">' + ikon.kilit + 'İç not · müşteri görmez</span>' : ''}
      <p>${B.nl2br(g.metin)}</p>
      <small>${projeAdi && g.is_ad ? esc(g.is_ad) + ' · ' : ''}${ekip && g.yazan ? esc(g.yazan) + ' · ' : ''}<time datetime="${esc(g.tarih)}">${B.goreceli(g.tarih)}</time></small>
      ${ekip && (g.benim || B.yoneticiMi()) && g.id ? `<button class="metin-dugme tehlike kucuk-metin" data-guncelleme-sil="${g.id}">Sil</button>` : ''}
    </div></li>`).join('')}</ol>`;

B.sorumluHtml = (s, baslik) => !s ? '' : `
  <div class="kart sorumlu-kart">
    <div class="sorumlu">${B.avatar(s.ad_soyad, 1)}<div><b>${esc(s.ad_soyad)}</b><small>${esc(s.unvan || 'Balat Mimarlık')} · ${esc(baslik || 'Projeden sorumlu')}</small></div></div>
    <div class="iletisim-dugmeleri">
      ${s.telefon ? `<a class="btn kucuk ikincil" href="${B.telLink(s.telefon)}">${ikon.telefon} Ara</a>
        <a class="btn kucuk wa" href="${B.waLink(s.telefon)}" target="_blank" rel="noopener">${ikon.whatsapp} WhatsApp</a>` : ''}
      ${s.eposta ? `<a class="btn kucuk ikincil" href="mailto:${esc(s.eposta)}">${ikon.mesaj} E-posta</a>` : ''}
    </div>
  </div>`;

/* =========================================================
   MÜŞTERİ ANA EKRANI
   ========================================================= */
B.musteriAna = async () => {
  B.yukleniyor();
  const d = await B.oku('panom');
  const k = B.kullanici;
  if (d.onay_bekliyor) {
    return B.sayfa(`
      <h1 class="baslik">Hoş geldiniz, ${esc(B.ilkAd(k.ad_soyad))}</h1>
      <div class="kart bilgi-kart">
        <div class="bilgi-ikon">${ikon.saat}</div>
        <h2>Hesabınız onay bekliyor</h2>
        <p>Hesabınız oluşturuldu. Ekibimiz hesabınızı projenizle eşleştirdiğinde projenizin aşamalarını, evraklarını ve güncellemelerini burada göreceksiniz. Eşleştirme yapıldığında size bildirim gelir.</p>
        <p class="not">Bu genellikle 1 iş günü içinde yapılır. Beklemek istemiyorsanız bize yazabilirsiniz.</p>
        <div class="iletisim-dugmeleri">
          <a class="btn wa" href="https://wa.me/${OFIS_WA}?text=${encodeURIComponent('Merhaba, panelde ' + k.ad_soyad + ' (' + (k.eposta || '') + ') adıyla hesap oluşturdum; projemle eşleştirilmesini rica ederim.')}" target="_blank" rel="noopener">${ikon.whatsapp} WhatsApp ile yazın</a>
          <a class="btn ikincil" href="tel:+905335838775">${ikon.telefon} Arayın</a>
        </div>
      </div>`);
  }
  const isler = d.isler, aktifler = isler.filter(i => i.durum === 'aktif' || i.durum === 'beklemede'), biten = isler.filter(i => i.durum === 'tamamlandi');
  const kart = i => `
    <a class="proje-kart kart" href="#/is/${i.id}" aria-label="${esc(i.ad)} projesinin ayrıntıları">
      <div class="pk-ust"><div><h3>${esc(i.ad)}</h3><span>${esc([i.hizmet, i.konum].filter(Boolean).join(' · '))}</span></div>${B.cip('IS', i.durum)}</div>
      <div class="pk-oran"><b>%${i.ilerleme.oran}</b> tamamlandı <span class="soluk">· ${i.ilerleme.toplam} aşamadan ${i.ilerleme.tamam} tanesi bitti</span></div>
      ${B.ilerleme(i.ilerleme.oran)}
      ${i.aktif_asama ? `<div class="pk-satir">${ikon.ileri}<span>Şu an: <b>${esc(i.aktif_asama.ad)}</b></span>${B.cip('ASAMA', i.aktif_asama.durum)}</div>` : ''}
      ${i.tahmini_bitis && i.durum !== 'tamamlandi' ? `<div class="pk-satir">${B.tahminiHtml(i.tahmini_bitis)}</div>` : ''}
      ${B.evrakOzetHtml(i.evrak)}
      ${i.sorumlu ? `<div class="sorumlu kucuk">${B.avatar(i.sorumlu.ad_soyad)}<div><b>${esc(i.sorumlu.ad_soyad)}</b><small>${esc(i.sorumlu.unvan || 'Balat Mimarlık')} · projeden sorumlu</small></div></div>` : ''}
      <span class="pk-git">Ayrıntılar ${ikon.ileri}</span>
    </a>`;
  B.sayfa(`
    <h1 class="baslik">Merhaba, ${esc(B.ilkAd(k.ad_soyad))}</h1>
    <p class="alt-yazi">${aktifler.length ? 'Projelerinizin güncel durumu aşağıda.' : isler.length ? 'Tüm projeleriniz tamamlandı.' : ''}</p>
    ${B.bekleyenlerHtml(d.bekleyenler, true)}
    ${!isler.length ? B.bos('canta', 'Henüz projeniz görünmüyor', 'Hesabınız onaylandı; projeniz oluşturulduğunda burada görünecek.') : ''}
    ${aktifler.length ? `<h2 class="alt-baslik">Devam eden projeler</h2><div class="kart-listesi">${aktifler.map(kart).join('')}</div>` : ''}
    ${biten.length ? `<h2 class="alt-baslik">Tamamlanan projeler</h2><div class="kart-listesi">${biten.map(kart).join('')}</div>` : ''}
    ${d.son_guncellemeler.length ? `<h2 class="alt-baslik">Son güncellemeler</h2><div class="kart akis-kart">${B.akisHtml(d.son_guncellemeler, isler.length > 1)}</div>` : ''}
  `);
};

/* =========================================================
   MÜŞTERİ PROJE DETAYI
   ========================================================= */
B.musteriIs = async (id, hazir) => {
  if (!hazir) B.yukleniyor();
  const is = hazir || (await B.oku('is_detay', {id})).is;
  const talepler = is.evraklar.filter(e => e.yon === 'talep');
  const paylasilan = is.evraklar.filter(e => e.yon === 'paylasim' && e.dosyalar.length);
  const ilk = is.ilerleme;
  B.okunmamisAzalt && B.okunmamisAzalt();

  const asama = a => {
    const d = B.ASAMA[a.durum];
    const tarih = a.durum === 'tamamlandi' && a.tamamlanma ? 'Tamamlandı: ' + B.tarih(a.tamamlanma) : a.tahmini_tarih ? 'Tahmini: ' + B.tarih(a.tahmini_tarih) : '';
    return `<li class="zc zc-${d.sinif}">
      <span class="zc-isaret" aria-hidden="true">${ikon[d.ikon]}</span>
      <div class="zc-icerik">
        <div class="zc-ust"><b>${esc(a.ad)}</b>${B.cip('ASAMA', a.durum)}</div>
        ${a.aciklama && a.durum !== 'bekliyor' ? `<p>${B.nl2br(a.aciklama)}</p>` : ''}
        ${a.durum === 'musteri' && a.musteri_islemi ? `<div class="zc-islem">${ikon.unlem}<span><b>Sizden beklenen işlem:</b> ${esc(a.musteri_islemi)}</span></div>` : ''}
        <small>${[tarih, a.durum !== 'bekliyor' ? 'Son güncelleme: ' + B.goreceli(a.guncelleme) : ''].filter(Boolean).join(' · ')}</small>
      </div></li>`;
  };
  const dosyaSatiri = (f, e) => `<li>
      <div class="dosya-bilgi"><a href="${B.indirAdres(f.id)}" target="_blank" rel="noopener">${ikon.dosya}<span>${esc(f.ad)}</span></a>
      <small>${B.boyut(f.boyut)} · ${esc(f.yukleyen)} · ${B.tarih(f.tarih)}</small></div>
      <a class="ikon-kucuk" href="${B.indirAdres(f.id, 1)}" aria-label="${esc(f.ad)} indir">${ikon.indir}</a>
      ${f.benim && e && ['yuklendi', 'eksik', 'duzeltme'].includes(e.durum) ? `<button class="ikon-kucuk tehlike" data-dosya-sil="${f.id}" aria-label="${esc(f.ad)} sil">${ikon.sil}</button>` : ''}
    </li>`;
  const evrak = e => `
    <div class="evrak kart${['eksik', 'duzeltme'].includes(e.durum) ? ' evrak-dikkat' : ''}" id="evrak-${e.id}">
      <div class="evrak-ust"><div><b>${esc(e.ad)}</b>${e.aciklama ? `<p>${esc(e.aciklama)}</p>` : ''}</div>${B.cip('EVRAK', e.durum)}</div>
      ${e.durum === 'duzeltme' && e.musteri_notu ? `<div class="duzeltme-notu">${ikon.uyari}<span><b>Ne yapmalısınız:</b> ${esc(e.musteri_notu)}</span></div>` : ''}
      ${e.durum === 'onaylandi' && e.musteri_notu ? `<p class="not">${esc(e.musteri_notu)}</p>` : ''}
      ${e.dosyalar.length ? `<ul class="dosya-listesi">${e.dosyalar.map(f => dosyaSatiri(f, e)).join('')}</ul>` : ''}
      ${e.durum !== 'onaylandi' ? `<button class="btn kucuk ${['eksik', 'duzeltme'].includes(e.durum) ? 'vurgu' : 'ikincil'}" data-yukle="${e.id}">${ikon.yukle} ${e.dosyalar.length ? 'Yeni dosya ekle' : 'Dosya yükle'}</button>` : ''}
    </div>`;

  B.sayfa(`
    ${B.ustBar(B.geri('Projelerim', '#/'))}
    <h1 class="baslik">${esc(is.ad)}</h1>
    <p class="alt-yazi">${esc([is.hizmet, is.konum].filter(Boolean).join(' · '))}</p>
    <div class="kart ozet-kart">
      ${B.halka(ilk.oran)}
      <div class="ozet-metin">
        <b>${ilk.toplam} aşamadan ${ilk.tamam} tanesi tamamlandı</b>
        ${is.aktif_asama ? `<span>${ikon.ileri} Şu an: <b>${esc(is.aktif_asama.ad)}</b></span>` : ''}
        ${is.tahmini_bitis && is.durum !== 'tamamlandi' ? `<span>${B.tahminiHtml(is.tahmini_bitis)}</span>` : ''}
        <span class="cipler">${B.cip('IS', is.durum)}</span>
      </div>
    </div>
    ${B.bekleyenlerHtml(is.bekleyenler, false)}
    <h2 class="alt-baslik">Süreç</h2>
    <ol class="zaman-cizelgesi kart" aria-label="Proje aşamaları">${is.asamalar.map(asama).join('') || '<li class="not">Aşamalar yakında eklenecek.</li>'}</ol>
    <h2 class="alt-baslik">İstenen evraklar</h2>
    ${talepler.length ? `<div class="evrak-listesi">${talepler.map(evrak).join('')}</div>` : '<p class="not">Sizden istenen bir evrak yok.</p>'}
    ${paylasilan.length ? `<h2 class="alt-baslik">Size paylaşılan dosyalar</h2>
      <div class="kart"><ul class="dosya-listesi genis">${paylasilan.map(e => `<li class="paylasim-baslik"><b>${esc(e.ad)}</b>${e.aciklama ? `<small>${esc(e.aciklama)}</small>` : ''}</li>${e.dosyalar.map(f => dosyaSatiri(f, null)).join('')}`).join('')}</ul></div>` : ''}
    ${is.sorumlu ? `<h2 class="alt-baslik">Projeden sorumlu</h2>${B.sorumluHtml(is.sorumlu)}` : ''}
    <h2 class="alt-baslik">Güncellemeler</h2>
    <div class="kart akis-kart">${B.akisHtml(is.guncellemeler, false)}</div>
  `);
  B.musteriIsBagla(is.id);
};

B.musteriIsBagla = isId => {
  const ic = $('#icerik');
  ic.onclick = async e => {
    const sil = e.target.closest('[data-dosya-sil]');
    if (sil) {
      if (!await B.onay('Dosya silinsin mi?', 'Yüklediğiniz dosya kaldırılır.', 'Sil')) return;
      try { const j = await B.yaz('dosya_sil', {id: +sil.dataset.dosyaSil}); B.toast('Dosya silindi'); B.musteriIs(isId, j.is); }
      catch (err) { B.toast(err.message, true); }
    }
  };
};

/* Ana ekrandaki ve proje sayfasındaki "Yükle" düğmeleri */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-yukle]');
  if (!b || !B.kullanici || B.kullanici.rol !== 'musteri') return;
  e.preventDefault();
  const dosyalar = await B.dosyaSec(B.EVRAK_KABUL, true);
  if (!dosyalar.length) return;
  b.disabled = true;
  const is = await B.evrakYukle(+b.dataset.yukle, dosyalar);
  b.disabled = false;
  if (!is) return;
  if (location.hash === '#/' || location.hash === '') B.musteriAna();
  else B.musteriIs(is.id, is);
});
})();
