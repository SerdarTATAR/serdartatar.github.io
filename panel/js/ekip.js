/* =========================================================
   Personel / yönetici: iş listesi ve proje yönetimi
   ========================================================= */
(function () {
'use strict';
const {$, $$, esc, ikon} = B;
const oturumDeger = (a, v) => { try { if (v === undefined) return sessionStorage.getItem(a); sessionStorage.setItem(a, v); } catch (e) {} return null; };

const ASAMA_SECENEK = [['bekliyor', 'Bekliyor'], ['devam', 'Devam ediyor'], ['musteri', 'Müşteriden bekleniyor'], ['tamamlandi', 'Tamamlandı']];
const EVRAK_SECENEK = [['eksik', 'Eksik'], ['yuklendi', 'Yüklendi'], ['inceleniyor', 'İnceleniyor'], ['onaylandi', 'Onaylandı'], ['duzeltme', 'Düzeltme gerekli']];
const IS_SECENEK = [['aktif', 'Devam ediyor'], ['beklemede', 'Beklemede'], ['tamamlandi', 'Tamamlandı'], ['iptal', 'İptal edildi']];

/* =========================================================
   İŞ LİSTESİ (arama + filtre)
   ========================================================= */
B.ekipIsler = async () => {
  B.yukleniyor();
  const {isler} = await B.oku('isler');
  const yonetici = B.yoneticiMi();
  let filtre = oturumDeger('bm-filtre') || 'acik', q = oturumDeger('bm-ara') || '';
  const sayac = {
    acik: isler.filter(i => i.durum === 'aktif' || i.durum === 'beklemede').length,
    dikkat: isler.filter(i => i.dikkat > 0 && i.durum === 'aktif').length,
    beklemede: isler.filter(i => i.durum === 'beklemede').length,
    tamamlandi: isler.filter(i => i.durum === 'tamamlandi').length,
    hepsi: isler.length,
  };
  const FILTRELER = [['acik', 'Açık işler'], ['dikkat', 'Dikkat gerekenler'], ['beklemede', 'Beklemede'], ['tamamlandi', 'Tamamlanan'], ['hepsi', 'Tümü']];
  B.sayfa(`
    <div class="baslik-satiri"><h1 class="baslik">${yonetici ? 'İşler' : 'İşlerim'}</h1>
      ${yonetici ? `<button class="btn kucuk vurgu" id="yeniIs">${ikon.arti} Yeni proje</button>` : ''}</div>
    <p class="alt-yazi">${sayac.acik} açık iş${sayac.dikkat ? ` · <b class="dikkat-metin">${sayac.dikkat} işte müşteriden işlem/evrak bekleniyor</b>` : ''}</p>
    <div class="arama"><span aria-hidden="true">${ikon.arama}</span><input id="ara" type="search" placeholder="Müşteri, proje, hizmet veya konum ara" value="${esc(q)}" aria-label="İşlerde ara"></div>
    <div class="filtreler" role="tablist" aria-label="Duruma göre filtrele">${FILTRELER.map(([k, ad]) => `<button role="tab" data-f="${k}" aria-selected="${k === filtre}" class="${k === filtre ? 'aktif' : ''}">${ad} <small>${sayac[k]}</small></button>`).join('')}</div>
    <div id="liste" class="is-listesi"></div>`, {genis: true});
  const ciz = () => {
    const aranan = q.toLocaleLowerCase('tr');
    const l = isler.filter(i => {
      if (filtre === 'acik' && !['aktif', 'beklemede'].includes(i.durum)) return false;
      if (filtre === 'dikkat' && !(i.dikkat > 0 && i.durum === 'aktif')) return false;
      if (filtre === 'beklemede' && i.durum !== 'beklemede') return false;
      if (filtre === 'tamamlandi' && i.durum !== 'tamamlandi') return false;
      if (aranan && ![i.ad, i.musteri && i.musteri.ad, i.hizmet, i.konum, i.aktif_asama && i.aktif_asama.ad].join(' ').toLocaleLowerCase('tr').includes(aranan)) return false;
      return true;
    });
    $('#liste').innerHTML = l.length ? l.map(i => `
      <a class="is-satir kart" href="#/is/${i.id}">
        <div class="is-satir-ust"><b>${esc(i.ad)}</b>${i.dikkat && i.durum === 'aktif' ? `<span class="mini mini-dikkat">${ikon.unlem}${i.dikkat} bekleyen</span>` : ''}</div>
        <span class="soluk">${esc(i.musteri ? i.musteri.ad : '—')}${i.hizmet ? ' · ' + esc(i.hizmet) : ''}</span>
        <div class="is-satir-alt">${i.durum !== 'aktif' ? B.cip('IS', i.durum) : i.aktif_asama ? B.cip('ASAMA', i.aktif_asama.durum, 1) + `<span class="asama-adi">${esc(i.aktif_asama.ad)}</span>` : ''}<span class="oran">%${i.ilerleme.oran}</span></div>
        ${B.ilerleme(i.ilerleme.oran, 1)}
        <div class="is-satir-meta">${i.sorumlu ? `${ikon.kisi}<span>${esc(i.sorumlu.ad_soyad)}</span>` : '<span class="dikkat-metin">Sorumlu atanmamış</span>'}${i.tahmini_bitis ? `<span>${ikon.saat}${B.tarih(i.tahmini_bitis)}</span>` : ''}<span>${ikon.saat}${B.goreceli(i.guncelleme)} güncellendi</span></div>
      </a>`).join('')
      : B.bos(isler.length ? 'arama' : 'canta', isler.length ? 'Sonuç bulunamadı' : (yonetici ? 'Henüz proje yok' : 'Size atanmış iş yok'),
          isler.length ? 'Arama veya filtreyi değiştirmeyi deneyin.' : (yonetici ? 'Bir müşteri için ilk projeyi oluşturun.' : 'Yönetici sizi bir projeye atadığında burada görünecek.'),
          !isler.length && yonetici ? `<button class="btn vurgu" onclick="document.getElementById('yeniIs').click()">${ikon.arti} Yeni proje</button>` : '');
  };
  ciz();
  $('#ara').addEventListener('input', e => { q = e.target.value; oturumDeger('bm-ara', q); ciz(); });
  $$('[data-f]').forEach(b => b.onclick = () => {
    filtre = b.dataset.f; oturumDeger('bm-filtre', filtre);
    $$('[data-f]').forEach(x => { x.classList.toggle('aktif', x === b); x.setAttribute('aria-selected', x === b); });
    ciz();
  });
  if (yonetici) $('#yeniIs').onclick = () => B.yeniProjeFormu();
};

/* ---------- Yeni proje (yönetici) ---------- */
B.yeniProjeFormu = async musteriId => {
  const [m, s, p] = await Promise.all([B.oku('musteriler'), B.oku('sablonlar'), B.oku('personeller')]);
  if (!m.musteriler.length) {
    if (await B.onay('Önce bir müşteri ekleyin', 'Proje bir müşteriye bağlı olmalı.', 'Müşteri ekle', false)) B.git('#/musteriler?yeni');
    return;
  }
  const bugun = new Date().toISOString().slice(0, 10);
  const alanlar = [
    {ad:'musteri_id', etiket:'Müşteri', tur:'secim', zorunlu:1, deger: musteriId || '', secenekler: [['', 'Müşteri seçin…'], ...m.musteriler.map(x => [x.id, x.ad])]},
    {ad:'sablon_id', etiket:'Süreç şablonu', tur:'secim', deger: s.sablonlar[0] ? s.sablonlar[0].id : '', secenekler: [...s.sablonlar.map(x => [x.id, `${x.ad} (${x.asamalar.length} aşama, ${x.evraklar.length} evrak)`]), ['', 'Şablonsuz — aşamaları sonra ekleyeceğim']],
      ipucu:'Şablondaki aşamalar ve istenecek evraklar projeye kopyalanır; sonra projeye özel düzenleyebilirsiniz.'},
    {ad:'ad', etiket:'Proje adı', zorunlu:1, yer:'Örn. Bahçeşehir Villa Projesi', maks:120},
    {ad:'hizmet', etiket:'Hizmet türü', yer:'Örn. Mimari Proje', maks:80},
    {ad:'konum', etiket:'Konum', yer:'Örn. Bahçeşehir, İstanbul', maks:120},
    {ad:'sorumlu_id', etiket:'Sorumlu personel', tur:'secim', deger: B.kullanici.id, secenekler: [['', '—'], ...p.personeller.map(x => [x.id, x.ad_soyad + (x.unvan ? ' — ' + x.unvan : '')])]},
    {ad:'personel_idler', etiket:'Projeye erişebilecek personel', tur:'coklu', deger: [], secenekler: p.personeller.filter(x => x.rol === 'personel').map(x => [x.id, x.ad_soyad]),
      ipucu:'Personel yalnızca atandığı projeleri görür. Yöneticiler tüm projeleri görür.'},
    {ad:'baslangic', etiket:'Başlangıç', tur:'tarih', deger: bugun},
    {ad:'tahmini_bitis', etiket:'Tahmini tamamlanma', tur:'tarih'},
  ];
  const sonuc = await B.form({baslik:'Yeni proje', dugme:'Oluştur', alanlar, kaydet: v => B.yaz('is_kaydet', Object.assign({}, v, {
    durum:'aktif', musteri_id: +v.musteri_id, sablon_id: v.sablon_id ? +v.sablon_id : null, sorumlu_id: v.sorumlu_id ? +v.sorumlu_id : null, personel_idler: v.personel_idler.map(Number),
  }))});
  if (sonuc && sonuc.is) { B.toast('Proje oluşturuldu; müşteriye bildirim gönderildi'); B.git('#/is/' + sonuc.is.id); }
};

/* =========================================================
   PROJE YÖNETİMİ
   ========================================================= */
B.ekipIs = async (id, hazir) => {
  if (!hazir) B.yukleniyor();
  const is = hazir || (await B.oku('is_detay', {id})).is;
  const yonetici = B.yoneticiMi();
  let sekme = oturumDeger('bm-sekme') || 'surec';
  const SEKMELER = [['surec', 'Süreç'], ['evrak', 'Evraklar'], ['mesaj', 'Mesajlar'], ['bilgi', 'Bilgiler']];
  const talep = is.evraklar.filter(e => e.yon === 'talep');
  const bekleyenEvrak = talep.filter(e => ['yuklendi', 'inceleniyor'].includes(e.durum)).length;
  B.sayfa(`
    ${B.ustBar(B.geri('İşler', '#/'), yonetici && is.musteri ? `<a class="geri" href="#/musteri/${is.musteri.id}" style="padding-right:0">${ikon.kisi}<span>Müşteri</span></a>` : '')}
    <h1 class="baslik">${esc(is.ad)}</h1>
    <p class="alt-yazi">${esc(is.musteri ? is.musteri.ad : '')}${is.hizmet ? ' · ' + esc(is.hizmet) : ''}${is.konum ? ' · ' + esc(is.konum) : ''}</p>
    <div class="kart ozet-kart kucuk">
      ${B.halka(is.ilerleme.oran)}
      <div class="ozet-metin">
        <b>${is.ilerleme.toplam} aşamadan ${is.ilerleme.tamam} tanesi tamamlandı</b>
        <span class="cipler">${B.cip('IS', is.durum)}${is.aktif_asama ? ' ' + B.cip('ASAMA', is.aktif_asama.durum, 1) : ''}</span>
        ${is.tahmini_bitis ? `<span>${B.tahminiHtml(is.tahmini_bitis)}</span>` : ''}
        ${is.dikkat ? `<span class="dikkat-metin">${ikon.unlem} Müşteriden ${is.dikkat} işlem/evrak bekleniyor</span>` : ''}
      </div>
    </div>
    <div class="segment sekmeler" role="tablist">${SEKMELER.map(([k, ad]) => `<button role="tab" data-sekme="${k}" aria-selected="${k === sekme}" class="${k === sekme ? 'aktif' : ''}">${ad}${k === 'evrak' && bekleyenEvrak ? ` <em class="rozet kucuk-rozet">${bekleyenEvrak}</em>` : ''}</button>`).join('')}</div>
    <div id="sekmeIcerik"></div>`, {genis: true});

  const yenile = j => { if (j && j.is) B.ekipIs(is.id, j.is); };
  const hataliysa = async islev => { try { yenile(await islev()); } catch (e) { B.toast(e.message, true); } };

  /* ---------- Süreç ---------- */
  const surec = () => `
    <p class="not">Aşamanın durumunu değiştirdiğinizde müşteriye otomatik bildirim gider ve güncellemelerde görünür. Sıralamak için ${ikon.tutamak.replace('<svg', '<svg style="width:14px;height:14px;vertical-align:-2px"')} tutamağını sürükleyin.</p>
    <ol class="asama-liste kart" id="asamaListe">${is.asamalar.map((a, n) => {
      const d = B.ASAMA[a.durum];
      return `<li class="asama-satir zc-${d.sinif}" data-id="${a.id}">
        <button class="tutamak" aria-label="${esc(a.ad)} sırasını değiştir">${ikon.tutamak}</button>
        <button class="asama-ac" data-asama="${a.id}">
          <span class="zc-isaret" aria-hidden="true">${ikon[d.ikon]}</span>
          <span class="asama-metin"><b>${n + 1}. ${esc(a.ad)}</b>
            <span>${B.cip('ASAMA', a.durum, 1)}${a.tahmini_tarih && a.durum !== 'tamamlandi' ? `<small>${ikon.saat}${B.tarih(a.tahmini_tarih)}</small>` : ''}${a.durum === 'tamamlandi' && a.tamamlanma ? `<small>${ikon.onay}${B.tarih(a.tamamlanma)}</small>` : ''}</span>
            ${a.durum === 'musteri' && a.musteri_islemi ? `<small class="dikkat-metin">Beklenen: ${esc(a.musteri_islemi)}</small>` : ''}
            ${a.ic_not ? `<small class="ic-satir">${ikon.kilit}${esc(a.ic_not)}</small>` : ''}
          </span></button>
        ${a.durum !== 'tamamlandi' ? `<button class="hizli-tamam" data-tamamla="${a.id}" aria-label="${esc(a.ad)} tamamlandı olarak işaretle" title="Tamamlandı işaretle">${ikon.onay}</button>` : '<span class="hizli-bos"></span>'}
      </li>`;
    }).join('') || '<li class="bos-satir">Henüz aşama yok.</li>'}</ol>
    <button class="btn ikincil" id="asamaEkle">${ikon.arti} Aşama ekle</button>`;

  const asamaFormu = async a => {
    const yeni = !a;
    a = a || {durum: 'bekliyor'};
    const alanlar = [
      {ad:'ad', etiket:'Aşama adı', zorunlu:1, deger:a.ad, maks:120},
      {ad:'durum', etiket:'Durum', tur:'segment', deger:a.durum, secenekler: ASAMA_SECENEK},
      {ad:'musteri_islemi', etiket:'Müşteriden beklenen işlem', deger:a.musteri_islemi, maks:500, yer:'Örn. Tapu belgesini yüklemeniz gerekiyor.',
        ipucu:'Müşterinin ana ekranında “Sizden beklenenler” bölümünde belirgin şekilde görünür.'},
      {ad:'aciklama', etiket:'Müşteriye açıklama', tur:'cok', deger:a.aciklama, maks:1000, yer:'Örn. Proje çizimleri tamamlandı. İlgili kurumun onayı bekleniyor.',
        ipucu:'Sade ve anlaşılır yazın; müşteri bu metni görür.'},
      {ad:'ic_not', etiket:'İç not (müşteri görmez)', tur:'cok', deger:a.ic_not, maks:2000, yer:'Yalnızca ekip görür'},
      {ad:'tahmini_tarih', etiket:'Tahmini tarih', tur:'tarih', deger:a.tahmini_tarih},
    ];
    alanlar.degisince = (v, p) => p.alanGoster('musteri_islemi', v.durum === 'musteri');
    const s = await B.form({baslik: yeni ? 'Aşama ekle' : 'Aşamayı düzenle', alanlar, dugme: yeni ? 'Ekle' : 'Kaydet',
      ekDugmeler: yeni ? [] : [{k:'sil', ad:'Aşamayı sil', tehlike:1}],
      kaydet: v => B.yaz('asama_kaydet', Object.assign(v, yeni ? {is_id: is.id} : {id: a.id}, v.durum === 'musteri' ? {} : {musteri_islemi: ''}))});
    if (s && s.eylem === 'sil') {
      if (await B.onay('“' + a.ad + '” silinsin mi?', 'Bu aşama projeden kaldırılır.', 'Sil')) hataliysa(() => B.yaz('asama_sil', {id: a.id}));
      return;
    }
    if (s && s.is) { B.toast(yeni ? 'Aşama eklendi' : 'Aşama güncellendi'); yenile(s); }
  };

  /* ---------- Evraklar ---------- */
  const dosyaSatiri = f => `<li>
      <div class="dosya-bilgi"><a href="${B.indirAdres(f.id)}" target="_blank" rel="noopener">${ikon.dosya}<span>${esc(f.ad)}</span></a>
      <small>${B.boyut(f.boyut)} · ${esc(f.yukleyen)} · ${B.goreceli(f.tarih)}</small></div>
      <a class="ikon-kucuk" href="${B.indirAdres(f.id, 1)}" aria-label="${esc(f.ad)} indir">${ikon.indir}</a>
      <button class="ikon-kucuk tehlike" data-dosya-sil="${f.id}" aria-label="${esc(f.ad)} sil">${ikon.sil}</button></li>`;
  const evrakKart = e => `
    <div class="evrak kart${['yuklendi', 'inceleniyor'].includes(e.durum) ? ' evrak-incele' : ''}">
      <div class="evrak-ust"><div><b>${esc(e.ad)}</b>${e.aciklama ? `<p>${esc(e.aciklama)}</p>` : ''}</div>${B.cip('EVRAK', e.durum)}</div>
      ${e.musteri_notu ? `<div class="${e.durum === 'duzeltme' ? 'duzeltme-notu' : 'not'}">${e.durum === 'duzeltme' ? ikon.uyari : ''}<span>Müşteriye not: ${esc(e.musteri_notu)}</span></div>` : ''}
      ${e.ic_not ? `<small class="ic-satir">${ikon.kilit}${esc(e.ic_not)}</small>` : ''}
      ${e.dosyalar.length ? `<ul class="dosya-listesi">${e.dosyalar.map(dosyaSatiri).join('')}</ul>` : '<p class="not">Henüz dosya yüklenmedi.</p>'}
      <div class="evrak-dugmeleri">
        ${['yuklendi', 'inceleniyor'].includes(e.durum) ? `<button class="btn kucuk vurgu" data-evrak-hizli="${e.id}" data-durum="onaylandi">${ikon.onay} Onayla</button>
          <button class="btn kucuk ikincil" data-evrak-incele="${e.id}" data-durum="duzeltme">${ikon.uyari} Düzeltme iste</button>` : ''}
        ${e.durum === 'yuklendi' ? `<button class="btn kucuk ikincil" data-evrak-hizli="${e.id}" data-durum="inceleniyor">${ikon.saat} İncelemeye al</button>` : ''}
        <button class="btn kucuk ikincil" data-evrak-incele="${e.id}">${ikon.kalem} Durum / not</button>
        <button class="btn kucuk ikincil" data-evrak-yukle="${e.id}">${ikon.yukle} Dosya ekle</button>
      </div>
    </div>`;
  const paylasimKart = e => `
    <div class="evrak kart">
      <div class="evrak-ust"><div><b>${esc(e.ad)}</b>${e.aciklama ? `<p>${esc(e.aciklama)}</p>` : ''}</div><span class="cip cip-tamam">${ikon.goz}Müşteri görebilir</span></div>
      ${e.dosyalar.length ? `<ul class="dosya-listesi">${e.dosyalar.map(dosyaSatiri).join('')}</ul>` : '<p class="not">Dosya eklenmedi — müşteri bu başlığı görmez.</p>'}
      <div class="evrak-dugmeleri"><button class="btn kucuk ikincil" data-evrak-yukle="${e.id}">${ikon.yukle} Dosya ekle</button>
        <button class="btn kucuk tehlike" data-evrak-sil="${e.id}">${ikon.sil} Kaldır</button></div>
    </div>`;
  const evraklar = () => {
    const pay = is.evraklar.filter(e => e.yon === 'paylasim');
    return `
      <div class="bolum-baslik"><h2 class="alt-baslik">Müşteriden istenen evraklar</h2><button class="btn kucuk vurgu" id="evrakIste">${ikon.arti} Evrak iste</button></div>
      ${talep.length ? `<div class="evrak-listesi">${talep.map(evrakKart).join('')}</div>` : '<p class="not">Henüz evrak istenmedi.</p>'}
      <div class="bolum-baslik"><h2 class="alt-baslik">Müşteriye paylaşılan dosyalar</h2><button class="btn kucuk ikincil" id="dosyaPaylas">${ikon.paylas} Dosya paylaş</button></div>
      ${pay.length ? `<div class="evrak-listesi">${pay.map(paylasimKart).join('')}</div>` : '<p class="not">Çizim, sözleşme gibi dosyaları müşteriyle buradan paylaşabilirsiniz.</p>'}`;
  };
  const evrakIncele = async (e, onDurum) => {
    const s = await B.form({baslik: e.ad, aciklama: 'Durumu değiştirdiğinizde müşteriye bildirim gider.', dugme:'Kaydet',
      alanlar: [
        {ad:'durum', etiket:'Durum', tur:'segment', deger: onDurum || e.durum, secenekler: EVRAK_SECENEK},
        {ad:'musteri_notu', etiket:'Müşteriye not', tur:'cok', deger: e.musteri_notu, maks:600, yer:'Düzeltme gerekiyorsa müşterinin ne yapması gerektiğini sade bir dille yazın.',
          ipucu:'“Düzeltme gerekli” seçildiğinde zorunludur.'},
        {ad:'ic_not', etiket:'İç not (müşteri görmez)', tur:'cok', deger: e.ic_not, maks:2000},
      ],
      ekDugmeler: [{k:'duzenle', ad:'Evrak adını / açıklamasını düzenle'}, {k:'sil', ad:'Evrakı sil', tehlike:1}],
      kaydet: v => B.yaz('evrak_durum', Object.assign(v, {id: e.id}))});
    if (s && s.eylem === 'sil') {
      if (await B.onay('“' + e.ad + '” silinsin mi?', 'Evrak ve yüklenmiş dosyaları kalıcı olarak silinir.', 'Sil')) hataliysa(() => B.yaz('evrak_sil', {id: e.id}));
    } else if (s && s.eylem === 'duzenle') {
      const d = await B.form({baslik:'Evrakı düzenle', alanlar:[{ad:'ad', etiket:'Evrak adı', zorunlu:1, deger:e.ad, maks:120}, {ad:'aciklama', etiket:'Açıklama (müşteri görür)', tur:'cok', deger:e.aciklama, maks:600}],
        kaydet: v => B.yaz('evrak_kaydet', Object.assign(v, {id: e.id}))});
      if (d && d.is) { B.toast('Evrak güncellendi'); yenile(d); }
    } else if (s && s.is) { B.toast('Evrak durumu güncellendi'); yenile(s); }
  };

  /* ---------- Mesajlar ---------- */
  const mesajlar = () => `
    <form class="kart mesaj-yaz" id="mesajForm">
      <label for="mesajMetin" class="gizli-etiket">Mesaj</label>
      <textarea id="mesajMetin" rows="3" maxlength="3000" placeholder="Müşteriye bir açıklama yazın veya ekibe iç not bırakın"></textarea>
      <div class="mesaj-alt">
        <div class="segment secmeli" id="mesajGor" role="radiogroup" aria-label="Kimler görsün">
          <button type="button" role="radio" data-k="musteri" aria-checked="true" class="aktif">${ikon.goz} Müşteri görsün</button>
          <button type="button" role="radio" data-k="ic" aria-checked="false">${ikon.kilit} Yalnızca ekip</button>
        </div>
        <button class="btn kucuk vurgu" id="mesajGonder">Gönder</button>
      </div>
    </form>
    <div class="kart akis-kart">${B.akisHtml(is.guncellemeler, false, true)}</div>`;

  /* ---------- Bilgiler ---------- */
  const bilgiler = () => `
    <div class="kart bilgi-liste">
      <dl>
        <dt>Durum</dt><dd>${B.cip('IS', is.durum)}</dd>
        <dt>Başlangıç</dt><dd>${is.baslangic ? B.tarih(is.baslangic, 1) : '—'}</dd>
        <dt>Tahmini tamamlanma</dt><dd>${is.tahmini_bitis ? B.tarih(is.tahmini_bitis, 1) : '—'}</dd>
        <dt>Sorumlu</dt><dd>${is.sorumlu ? esc(is.sorumlu.ad_soyad) : '<span class="dikkat-metin">Atanmamış</span>'}</dd>
        <dt>Ekip</dt><dd>${(is.ekip || []).filter(Boolean).map(k => esc(k.ad_soyad)).join(', ') || '—'}</dd>
        <dt>Açıklama</dt><dd>${is.aciklama ? B.nl2br(is.aciklama) : '—'}</dd>
      </dl>
      <button class="btn ikincil" id="bilgiDuzenle">${ikon.kalem} Bilgileri düzenle</button>
    </div>
    <h2 class="alt-baslik">Müşteri</h2>
    <div class="kart bilgi-liste"><dl>
      <dt>Müşteri</dt><dd>${yonetici && is.musteri ? `<a href="#/musteri/${is.musteri.id}">${esc(is.musteri.ad)}</a>` : esc(is.musteri ? is.musteri.ad : '—')}</dd>
      <dt>Panel hesapları</dt><dd>${(is.musteri_hesaplari || []).length ? is.musteri_hesaplari.map(h => `${esc(h.ad_soyad)}${h.telefon ? ` · <a href="${B.telLink(h.telefon)}">${esc(h.telefon)}</a>` : ''}${h.eposta ? ` · ${esc(h.eposta)}` : ''}`).join('<br>') : '<span class="dikkat-metin">Müşterinin panel hesabı yok — bildirimleri göremez.</span>'}</dd>
    </dl></div>
    <h2 class="alt-baslik">Değişiklik geçmişi</h2>
    <div class="kart"><ul class="kayit-listesi">${(is.kayitlar || []).map(k => `<li><b>${esc(k.kullanici_ad || 'Sistem')}</b> ${esc(k.islem)}<small>${B.tarih(k.tarih)} ${B.saat(k.tarih)}</small></li>`).join('') || '<li class="not">Kayıt yok.</li>'}</ul></div>
    ${yonetici ? `<button class="btn tehlike" id="isSil" style="margin-top:24px">${ikon.sil} Projeyi sil</button>` : ''}`;

  const bilgiFormu = async () => {
    const p = yonetici ? (await B.oku('personeller')).personeller : [];
    const alanlar = [
      ...(yonetici ? [
        {ad:'ad', etiket:'Proje adı', zorunlu:1, deger:is.ad, maks:120},
        {ad:'hizmet', etiket:'Hizmet türü', deger:is.hizmet, maks:80},
        {ad:'konum', etiket:'Konum', deger:is.konum, maks:120},
        {ad:'sorumlu_id', etiket:'Sorumlu personel', tur:'secim', deger: is.sorumlu ? is.sorumlu.id : '', secenekler: [['', '—'], ...p.map(x => [x.id, x.ad_soyad])]},
        {ad:'personel_idler', etiket:'Projeye erişebilecek personel', tur:'coklu', deger: (is.ekip || []).filter(Boolean).map(k => k.id), secenekler: p.filter(x => x.rol === 'personel').map(x => [x.id, x.ad_soyad])},
      ] : []),
      {ad:'durum', etiket:'Proje durumu', tur:'secim', deger:is.durum, secenekler: IS_SECENEK},
      {ad:'baslangic', etiket:'Başlangıç', tur:'tarih', deger:is.baslangic},
      {ad:'tahmini_bitis', etiket:'Tahmini tamamlanma', tur:'tarih', deger:is.tahmini_bitis, ipucu:'Değiştirirseniz müşteriye bildirim gider.'},
      {ad:'aciklama', etiket:'Açıklama (müşteri görmez, yalnızca ekip)', tur:'cok', deger:is.aciklama, maks:2000},
    ];
    const s = await B.form({baslik:'Proje bilgileri', alanlar, kaydet: v => B.yaz('is_kaydet', Object.assign(v, {id: is.id},
      yonetici ? {sorumlu_id: v.sorumlu_id ? +v.sorumlu_id : null, personel_idler: v.personel_idler.map(Number)} : {}))});
    if (s && s.is) { B.toast('Proje bilgileri kaydedildi'); yenile(s); }
  };

  /* ---------- Sekme çizimi + olaylar ---------- */
  const ciz = () => {
    $('#sekmeIcerik').innerHTML = {surec, evrak: evraklar, mesaj: mesajlar, bilgi: bilgiler}[sekme]();
    if (sekme === 'surec' && is.asamalar.length > 1) Sortable.create($('#asamaListe'), {handle:'.tutamak', animation:180, ghostClass:'surukleniyor',
      onEnd: async ev => {
        if (ev.oldIndex === ev.newIndex) return;
        const idler = $$('#asamaListe [data-id]').map(l => +l.dataset.id);
        try { await B.yaz('asamalari_sirala', {is_id: is.id, idler}); B.toast('Sıralama kaydedildi'); const j = await B.oku('is_detay', {id: is.id}); yenile(j); }
        catch (e) { B.toast(e.message, true); B.ekipIs(is.id); }
      }});
  };
  ciz();
  $$('[data-sekme]').forEach(b => b.onclick = () => {
    sekme = b.dataset.sekme; oturumDeger('bm-sekme', sekme);
    $$('[data-sekme]').forEach(x => { x.classList.toggle('aktif', x === b); x.setAttribute('aria-selected', x === b); });
    ciz();
  });

  $('#icerik').onclick = async e => {
    const t = s => e.target.closest(s);
    let el;
    if ((el = t('[data-asama]'))) return asamaFormu(is.asamalar.find(a => a.id === +el.dataset.asama));
    if (t('#asamaEkle')) return asamaFormu(null);
    if ((el = t('[data-tamamla]'))) {
      const n = is.asamalar.findIndex(a => a.id === +el.dataset.tamamla), a = is.asamalar[n], sonraki = is.asamalar[n + 1];
      el.disabled = true;
      return hataliysa(async () => {
        let j = await B.yaz('asama_kaydet', Object.assign({}, a, {durum: 'tamamlandi', musteri_islemi: ''}));
        if (sonraki && sonraki.durum === 'bekliyor') j = await B.yaz('asama_kaydet', Object.assign({}, sonraki, {durum: 'devam'}));
        B.toast('“' + a.ad + '” tamamlandı' + (sonraki && sonraki.durum === 'bekliyor' ? '; sıradaki aşama başladı' : ''));
        return j;
      });
    }
    if (t('#evrakIste')) {
      const s = await B.form({baslik:'Müşteriden evrak iste', aciklama:'Müşteriye bildirim gider ve ana ekranında “Sizden beklenenler” bölümünde görünür.',
        alanlar:[{ad:'ad', etiket:'Evrak adı', zorunlu:1, yer:'Örn. Tapu belgesi', maks:120}, {ad:'aciklama', etiket:'Açıklama (müşteri görür)', tur:'cok', yer:'Örn. Tüm sayfaların okunaklı fotoğrafı', maks:600}],
        dugme:'İste', kaydet: v => B.yaz('evrak_kaydet', Object.assign(v, {is_id: is.id, yon: 'talep'}))});
      if (s && s.is) { B.toast('Evrak istendi; müşteriye bildirim gönderildi'); yenile(s); }
      return;
    }
    if (t('#dosyaPaylas')) {
      const s = await B.form({baslik:'Müşteriye dosya paylaş', aciklama:'Önce başlık verin, ardından dosyayı seçin.', dugme:'Dosya seç',
        alanlar:[{ad:'ad', etiket:'Başlık', zorunlu:1, yer:'Örn. Avan proje çizimleri', maks:120}, {ad:'aciklama', etiket:'Açıklama (müşteri görür)', tur:'cok', maks:600}]});
      if (!s) return;
      const dosyalar = await B.dosyaSec(B.EVRAK_KABUL, true);
      if (!dosyalar.length) return;
      try {
        const j = await B.yaz('evrak_kaydet', Object.assign(s, {is_id: is.id, yon: 'paylasim'}));
        const son = await B.evrakYukle(j.evrak_id, dosyalar);
        yenile({is: son || j.is});
      } catch (err) { B.toast(err.message, true); }
      return;
    }
    if ((el = t('[data-evrak-yukle]'))) {
      const dosyalar = await B.dosyaSec(B.EVRAK_KABUL, true);
      const son = await B.evrakYukle(+el.dataset.evrakYukle, dosyalar);
      if (son) yenile({is: son});
      return;
    }
    if ((el = t('[data-evrak-hizli]'))) {
      const ev = is.evraklar.find(x => x.id === +el.dataset.evrakHizli);
      el.disabled = true;
      return hataliysa(async () => { const j = await B.yaz('evrak_durum', {id: ev.id, durum: el.dataset.durum, musteri_notu: '', ic_not: ev.ic_not || ''}); B.toast(ev.ad + ': ' + B.EVRAK[el.dataset.durum].ad); return j; });
    }
    if ((el = t('[data-evrak-incele]'))) return evrakIncele(is.evraklar.find(x => x.id === +el.dataset.evrakIncele), el.dataset.durum);
    if ((el = t('[data-evrak-sil]'))) {
      const ev = is.evraklar.find(x => x.id === +el.dataset.evrakSil);
      if (await B.onay('“' + ev.ad + '” kaldırılsın mı?', 'Müşteri bu dosyaları artık göremez.', 'Kaldır')) hataliysa(() => B.yaz('evrak_sil', {id: ev.id}));
      return;
    }
    if ((el = t('[data-dosya-sil]'))) {
      if (await B.onay('Dosya silinsin mi?', 'Dosya kalıcı olarak silinir.', 'Sil')) hataliysa(() => B.yaz('dosya_sil', {id: +el.dataset.dosyaSil}));
      return;
    }
    if ((el = t('[data-guncelleme-sil]'))) {
      if (await B.onay('Bu kayıt silinsin mi?', null, 'Sil')) hataliysa(() => B.yaz('guncelleme_sil', {id: +el.dataset.guncellemeSil}));
      return;
    }
    if ((el = t('#mesajGor button'))) {
      $$('#mesajGor button').forEach(x => { x.classList.toggle('aktif', x === el); x.setAttribute('aria-checked', x === el); });
      $('#mesajMetin').placeholder = el.dataset.k === 'ic' ? 'Yalnızca ekibin göreceği iç not' : 'Müşterinin göreceği açıklama — sade ve anlaşılır yazın';
      return;
    }
    if (t('#bilgiDuzenle')) return bilgiFormu();
    if (t('#isSil')) {
      if (await B.onay('“' + is.ad + '” silinsin mi?', 'Projenin tüm aşamaları, evrakları, dosyaları ve geçmişi kalıcı olarak silinir. Bu işlem geri alınamaz.', 'Projeyi sil')) {
        try { await B.yaz('is_sil', {id: is.id}); B.toast('Proje silindi'); B.git('#/'); } catch (err) { B.toast(err.message, true); }
      }
    }
  };
  // onsubmit (addEventListener değil): sayfa her yenilendiğinde dinleyici çoğalmasın, mesaj iki kez gitmesin
  $('#icerik').onsubmit = async e => {
    if (e.target.id !== 'mesajForm') return;
    e.preventDefault();
    const metin = $('#mesajMetin').value.trim(), gorunurluk = $('#mesajGor .aktif').dataset.k;
    if (!metin) return B.toast('Önce bir mesaj yazın.', true);
    const btn = $('#mesajGonder'); btn.disabled = true;
    try { const j = await B.yaz('guncelleme_ekle', {is_id: is.id, metin, gorunurluk}); B.toast(gorunurluk === 'ic' ? 'İç not eklendi' : 'Gönderildi; müşteriye bildirim gitti'); yenile(j); }
    catch (err) { B.toast(err.message, true); btn.disabled = false; }
  };
};
})();
