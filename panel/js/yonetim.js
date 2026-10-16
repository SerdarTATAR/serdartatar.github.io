/* =========================================================
   Yönetici: müşteriler, hesap eşleştirme, kullanıcılar, şablonlar, kayıtlar
   ========================================================= */
(function () {
'use strict';
const {$, $$, esc, ikon} = B;
const yalnizYonetici = () => { if (!B.yoneticiMi()) { B.git('#/'); return false; } return true; };

/* ---------- Müşteri formu ---------- */
const musteriFormu = (m, ekDugmeler) => B.form({baslik: m && m.id ? 'Müşteri bilgileri' : 'Yeni müşteri', ekDugmeler,
  alanlar: [
    {ad:'ad', etiket:'Ad soyad / firma', zorunlu:1, deger: m && m.ad, maks:120},
    {ad:'telefon', etiket:'Telefon', tur:'tel', deger: m && m.telefon, maks:30},
    {ad:'eposta', etiket:'E-posta', tur:'eposta', deger: m && m.eposta, maks:120},
    {ad:'adres', etiket:'Adres', tur:'cok', satir:2, deger: m && m.adres, maks:300},
    {ad:'ic_not', etiket:'İç not (yalnızca yöneticiler görür)', tur:'cok', deger: m && m.ic_not, maks:2000},
  ],
  kaydet: v => B.yaz('musteri_kaydet', Object.assign(v, m && m.id ? {id: m.id} : {}))});

/* =========================================================
   MÜŞTERİLER
   ========================================================= */
B.rota(/^#\/musteriler(\?yeni)?$/, async yeni => {
  if (!yalnizYonetici()) return;
  B.yukleniyor();
  const d = await B.oku('musteriler');
  B.sayfa(`
    <div class="baslik-satiri"><h1 class="baslik">Müşteriler</h1><button class="btn kucuk vurgu" id="musteriEkle">${ikon.arti} Yeni müşteri</button></div>
    ${d.eslesme_bekleyen.length ? `
      <section class="dikkat-kutu" aria-labelledby="ebBaslik">
        <h2 id="ebBaslik">${ikon.kisi} Eşleştirme bekleyen hesaplar <span class="sayi">${d.eslesme_bekleyen.length}</span></h2>
        <p class="not" style="margin:0 0 10px">Bu kişiler kendi hesaplarını oluşturdu. Bir müşteri kaydıyla eşleştirene kadar hiçbir proje bilgisini göremezler.</p>
        <ul>${d.eslesme_bekleyen.map(h => `<li><div><b>${esc(h.ad_soyad)}</b><p>${esc(h.eposta || '')}${h.telefon ? ' · ' + esc(h.telefon) : ''}</p><small>${B.goreceli(h.olusturma)} kayıt oldu</small></div>
          <button class="btn kucuk vurgu" data-eslestir="${h.id}">Eşleştir</button></li>`).join('')}</ul>
      </section>` : ''}
    <div class="arama"><span aria-hidden="true">${ikon.arama}</span><input id="ara" type="search" placeholder="Ad, telefon veya e-posta ara" aria-label="Müşterilerde ara"></div>
    <div id="liste" class="kart satir-listesi"></div>`, {genis: true});
  const ciz = q => {
    const a = (q || '').toLocaleLowerCase('tr');
    const l = d.musteriler.filter(m => !a || [m.ad, m.telefon, m.eposta].join(' ').toLocaleLowerCase('tr').includes(a));
    $('#liste').innerHTML = l.length ? l.map(m => `
      <a class="satir-oge" href="#/musteri/${m.id}">${B.avatar(m.ad)}<div><b>${esc(m.ad)}${(m.ic_not || '').startsWith('[ÖRNEK VERİ]') ? ' <span class="mini">örnek</span>' : ''}</b>
        <small>${[m.telefon, m.eposta].filter(Boolean).map(esc).join(' · ') || '—'}</small></div>
        <span class="satir-meta">${m.is_sayisi} proje${m.hesap_sayisi ? '' : ` · <span class="dikkat-metin">hesap yok</span>`}</span>${ikon.ileri}</a>`).join('')
      : B.bos('kisiler', d.musteriler.length ? 'Sonuç yok' : 'Henüz müşteri yok', d.musteriler.length ? 'Aramayı değiştirin.' : 'İlk müşterinizi ekleyin veya müşterinin kendi hesabını açmasını bekleyin.');
  };
  ciz('');
  $('#ara').oninput = e => ciz(e.target.value);
  const ekle = async () => { const s = await musteriFormu(null); if (s && s.musteri) { B.toast('Müşteri eklendi'); B.git('#/musteri/' + s.musteri.id); } };
  $('#musteriEkle').onclick = ekle;
  if (yeni) { history.replaceState(null, '', '#/musteriler'); ekle(); }
  $('#icerik').onclick = async e => {
    const b = e.target.closest('[data-eslestir]'); if (!b) return;
    const h = d.eslesme_bekleyen.find(x => x.id === +b.dataset.eslestir);
    const s = await B.form({baslik: 'Hesabı eşleştir', aciklama: `${h.ad_soyad} (${h.eposta || ''}) hangi müşteri kaydına ait? Eşleştirince müşterinin tüm projelerini görebilir ve bildirim alır.`,
      dugme: 'Eşleştir', alanlar: [{ad:'secim', etiket:'Müşteri', tur:'secim', zorunlu:1, deger:'yeni',
        secenekler: [['yeni', '+ Bu bilgilerle yeni müşteri oluştur'], ...d.musteriler.map(m => [m.id, m.ad + (m.telefon ? ' — ' + m.telefon : '')])]}],
      kaydet: v => B.yaz('hesap_eslestir', v.secim === 'yeni' ? {kullanici_id: h.id, yeni_musteri: true} : {kullanici_id: h.id, musteri_id: +v.secim})});
    if (s && s.musteri_id) { B.toast('Hesap eşleştirildi; müşteriye bildirim gitti'); B.git('#/musteri/' + s.musteri_id); }
  };
});

B.rota(/^#\/musteri\/(\d+)$/, async id => {
  if (!yalnizYonetici()) return;
  B.yukleniyor();
  const d = await B.oku('musteri_detay', {id});
  const m = d.musteri;
  B.sayfa(`
    ${B.ustBar(B.geri('Müşteriler', '#/musteriler'))}
    <div class="baslik-satiri"><h1 class="baslik">${esc(m.ad)}</h1><button class="btn kucuk ikincil" id="musteriDuzenle">${ikon.kalem} Düzenle</button></div>
    <div class="kart bilgi-liste"><dl>
      <dt>Telefon</dt><dd>${m.telefon ? `<a href="${B.telLink(m.telefon)}">${esc(m.telefon)}</a> · <a href="${B.waLink(m.telefon)}" target="_blank" rel="noopener">WhatsApp</a>` : '—'}</dd>
      <dt>E-posta</dt><dd>${m.eposta ? `<a href="mailto:${esc(m.eposta)}">${esc(m.eposta)}</a>` : '—'}</dd>
      <dt>Adres</dt><dd>${m.adres ? B.nl2br(m.adres) : '—'}</dd>
      ${m.ic_not ? `<dt>İç not</dt><dd class="ic-satir">${ikon.kilit}${B.nl2br(m.ic_not)}</dd>` : ''}
    </dl></div>
    <div class="bolum-baslik"><h2 class="alt-baslik">Projeler</h2><button class="btn kucuk vurgu" id="projeEkle">${ikon.arti} Proje oluştur</button></div>
    ${d.isler.length ? `<div class="is-listesi">${d.isler.map(i => `<a class="is-satir kart" href="#/is/${i.id}"><div class="is-satir-ust"><b>${esc(i.ad)}</b>${B.cip('IS', i.durum)}</div>
      <div class="is-satir-alt">${i.aktif_asama ? B.cip('ASAMA', i.aktif_asama.durum, 1) + `<span class="asama-adi">${esc(i.aktif_asama.ad)}</span>` : ''}<span class="oran">%${i.ilerleme.oran}</span></div>${B.ilerleme(i.ilerleme.oran, 1)}</a>`).join('')}</div>`
      : '<p class="not">Bu müşterinin henüz projesi yok.</p>'}
    <h2 class="alt-baslik">Panel hesapları</h2>
    <div class="kart satir-listesi">${d.hesaplar.length ? d.hesaplar.map(h => `<div class="satir-oge">${B.avatar(h.ad_soyad)}<div><b>${esc(h.ad_soyad)}</b><small>${esc(h.eposta || '')} · ${h.son_giris ? 'son giriş ' + B.goreceli(h.son_giris) : 'henüz giriş yapmadı'}${+h.aktif ? '' : ' · <span class="dikkat-metin">kapalı</span>'}</small></div>
        <button class="btn kucuk ikincil" data-hesap-kaldir="${h.id}">Eşleşmeyi kaldır</button></div>`).join('')
      : `<div class="satir-oge"><div><b>Panel hesabı yok</b><small>Müşteri bildirim alamaz. Ona panel için hesap açabilirsiniz; şifresini kendisi belirler.</small></div></div>`}
      <div class="satir-oge"><button class="btn kucuk ikincil" id="hesapAc">${ikon.arti} Bu müşteriye panel hesabı aç</button></div></div>
  `, {genis: true});
  $('#musteriDuzenle').onclick = async () => {
    const s = await musteriFormu(m, [{k:'sil', ad:'Müşteriyi sil', tehlike:1}]);
    if (s && s.eylem === 'sil') {
      if (!await B.onay('“' + m.ad + '” silinsin mi?', 'Projesi olan müşteri silinemez. Bağlı panel hesaplarının eşleşmesi kaldırılır.', 'Sil')) return;
      try { await B.yaz('musteri_sil', {id: m.id}); B.toast('Müşteri silindi'); B.git('#/musteriler'); } catch (e) { B.toast(e.message, true); }
    } else if (s && s.musteri) { B.toast('Kaydedildi'); B.goster(); }
  };
  $('#projeEkle').onclick = () => B.yeniProjeFormu(m.id);
  $('#hesapAc').onclick = async () => {
    const s = await B.form({baslik:'Panel hesabı aç', aciklama:'Şifre belirleme bağlantısı oluşturulur; WhatsApp veya e-postayla müşteriye gönderirsiniz.', dugme:'Hesap aç',
      alanlar:[{ad:'ad_soyad', etiket:'Ad soyad', zorunlu:1, deger:m.ad, maks:80}, {ad:'eposta', etiket:'E-posta (giriş için)', tur:'eposta', zorunlu:1, deger:m.eposta, maks:120}, {ad:'telefon', etiket:'Telefon', tur:'tel', deger:m.telefon, maks:30}],
      kaydet: v => B.yaz('kullanici_kaydet', Object.assign(v, {rol:'musteri', musteri_id: m.id, aktif: 1}))});
    if (s && s.baglanti) { await B.baglantiGoster('Hesap açıldı', 'Bu bağlantıyı müşteriye gönderin. 72 saat geçerlidir.', s.baglanti, s.ad_soyad || m.ad); B.goster(); }
  };
  $('#icerik').onclick = async e => {
    const b = e.target.closest('[data-hesap-kaldir]'); if (!b) return;
    if (!await B.onay('Eşleşme kaldırılsın mı?', 'Bu hesap artık müşterinin projelerini göremez.', 'Kaldır')) return;
    try { await B.yaz('hesap_eslestir', {kullanici_id: +b.dataset.hesapKaldir, musteri_id: null}); B.toast('Eşleşme kaldırıldı'); B.goster(); } catch (err) { B.toast(err.message, true); }
  };
});

/* =========================================================
   KULLANICILAR
   ========================================================= */
B.rota(/^#\/kullanicilar$/, async () => {
  if (!yalnizYonetici()) return;
  B.yukleniyor();
  const [{kullanicilar}, {musteriler}] = await Promise.all([B.oku('kullanicilar'), B.oku('musteriler')]);
  let f = 'ekip';
  B.sayfa(`
    <div class="baslik-satiri"><h1 class="baslik">Kullanıcılar</h1><button class="btn kucuk vurgu" id="personelEkle">${ikon.arti} Personel ekle</button></div>
    <p class="not">Personel ve yönetici yetkisini yalnızca yöneticiler verebilir. Yetki değişince kişinin açık oturumları kapanır.</p>
    <div class="filtreler">${[['ekip', 'Ekip'], ['musteri', 'Müşteri hesapları'], ['hepsi', 'Tümü']].map(([k, ad]) => `<button data-f="${k}" class="${k === f ? 'aktif' : ''}">${ad}</button>`).join('')}</div>
    <div id="liste" class="kart satir-listesi"></div>`, {genis: true});
  const ciz = () => {
    const l = kullanicilar.filter(u => f === 'hepsi' || (f === 'ekip' ? u.rol !== 'musteri' : u.rol === 'musteri'));
    $('#liste').innerHTML = l.map(u => `
      <button class="satir-oge" data-kullanici="${u.id}">${B.avatar(u.ad_soyad)}<div><b>${esc(u.ad_soyad)}${u.id === B.kullanici.id ? ' <span class="mini">siz</span>' : ''}</b>
        <small>${esc(u.eposta || u.giris)}${u.unvan ? ' · ' + esc(u.unvan) : ''}${u.rol === 'musteri' ? ' · ' + (u.musteri_ad ? esc(u.musteri_ad) : '<span class="dikkat-metin">eşleşmedi</span>') : ''}</small></div>
        <span class="satir-meta"><span class="cip cip-${u.rol === 'yonetici' ? 'devam' : u.rol === 'personel' ? 'tamam' : 'bekliyor'}">${esc(B.ROL[u.rol])}</span>${+u.aktif ? '' : ' <span class="cip cip-dikkat">Kapalı</span>'}</span></button>`).join('') || B.bos('kisi', 'Kullanıcı yok');
  };
  ciz();
  $$('[data-f]').forEach(b => b.onclick = () => { f = b.dataset.f; $$('[data-f]').forEach(x => x.classList.toggle('aktif', x === b)); ciz(); });
  const form = async u => {
    const yeni = !u;
    u = u || {rol: 'personel', aktif: 1};
    const alanlar = [
      {ad:'ad_soyad', etiket:'Ad soyad', zorunlu:1, deger:u.ad_soyad, maks:80},
      {ad:'eposta', etiket:'E-posta (giriş için)', tur:'eposta', zorunlu: yeni, deger:u.eposta, maks:120, ipucu: u.giris && !u.eposta ? 'Bu hesap “' + u.giris + '” kullanıcı adıyla giriş yapar.' : ''},
      {ad:'telefon', etiket:'Telefon', tur:'tel', deger:u.telefon, maks:30, ipucu:'Müşteriler sorumlu personeli bu numaradan arayabilir.'},
      {ad:'unvan', etiket:'Unvan', deger:u.unvan, yer:'Örn. Proje Mimarı', maks:60},
      {ad:'rol', etiket:'Rol', tur:'segment', deger:u.rol, secenekler:[['personel', 'Personel'], ['yonetici', 'Yönetici'], ['musteri', 'Müşteri']]},
      {ad:'musteri_id', etiket:'Bağlı müşteri', tur:'secim', deger:u.musteri_id || '', secenekler:[['', '— eşleşmemiş —'], ...musteriler.map(m => [m.id, m.ad])]},
      {ad:'aktif', etiket:'Hesap durumu', tur:'onay', metin:'Hesap açık (giriş yapabilir)', deger: +u.aktif},
    ];
    alanlar.degisince = (v, p) => p.alanGoster('musteri_id', v.rol === 'musteri');
    const s = await B.form({baslik: yeni ? 'Personel ekle' : u.ad_soyad, aciklama: yeni ? 'Kişiye şifresini belirleyeceği bir bağlantı verilir (72 saat geçerli).' : '', dugme: yeni ? 'Ekle' : 'Kaydet',
      alanlar, ekDugmeler: yeni ? [] : [{k:'baglanti', ad:'Şifre belirleme / sıfırlama bağlantısı oluştur'}],
      kaydet: v => B.yaz('kullanici_kaydet', Object.assign(v, {aktif: v.aktif ? 1 : 0, musteri_id: v.rol === 'musteri' && v.musteri_id ? +v.musteri_id : null}, yeni ? {} : {id: u.id}))});
    if (s && s.eylem === 'baglanti') {
      try { const j = await B.yaz('kullanici_baglanti', {id: u.id}); await B.baglantiGoster('Şifre bağlantısı', 'Bu bağlantıyı kişiye gönderin. 72 saat geçerlidir ve bir kez kullanılabilir.', j.baglanti, u.ad_soyad); } catch (e) { B.toast(e.message, true); }
      return;
    }
    if (!s || !s.ok) return;
    if (s.baglanti) await B.baglantiGoster('Personel eklendi', 'Bu bağlantıyı kişiye gönderin; kendi şifresini belirleyip giriş yapacak. 72 saat geçerlidir.', s.baglanti, s.ad_soyad);
    else B.toast('Kaydedildi');
    B.goster();
  };
  $('#personelEkle').onclick = () => form(null);
  $('#icerik').onclick = e => { const b = e.target.closest('[data-kullanici]'); if (b) form(kullanicilar.find(u => u.id === +b.dataset.kullanici)); };
});

/* =========================================================
   SÜREÇ ŞABLONLARI
   ========================================================= */
B.rota(/^#\/sablonlar$/, async () => {
  if (!yalnizYonetici()) return;
  B.yukleniyor();
  const {sablonlar} = await B.oku('sablonlar');
  B.sayfa(`
    <div class="baslik-satiri"><h1 class="baslik">Süreç şablonları</h1><a class="btn kucuk vurgu" href="#/sablon/yeni">${ikon.arti} Yeni şablon</a></div>
    <p class="not">Yeni proje oluştururken seçilen şablonun aşamaları ve istenecek evrakları projeye kopyalanır. Şablonu değiştirmek mevcut projeleri etkilemez.</p>
    <div class="kart satir-listesi">${sablonlar.map(s => `<a class="satir-oge" href="#/sablon/${s.id}"><span class="avatar">${ikon.katman}</span><div><b>${esc(s.ad)}</b>
      <small>${s.asamalar.length} aşama · ${s.evraklar.length} evrak${s.aciklama ? ' · ' + esc(s.aciklama) : ''}</small></div>${ikon.ileri}</a>`).join('') || B.bos('katman', 'Şablon yok', 'Sık kullandığınız hizmet türleri için şablon oluşturun.')}</div>`, {genis: true});
});

B.rota(/^#\/sablon\/(yeni|\d+)$/, async id => {
  if (!yalnizYonetici()) return;
  B.yukleniyor();
  const {sablonlar} = await B.oku('sablonlar');
  const s = id === 'yeni' ? {ad: '', aciklama: '', asamalar: [{ad: 'Başvuru alındı', aciklama: ''}], evraklar: []} : sablonlar.find(x => x.id === +id);
  if (!s) return B.git('#/sablonlar');
  const satir = (tur, o) => `<li class="sablon-satir">
      <button type="button" class="tutamak" aria-label="Sırasını değiştir">${ikon.tutamak}</button>
      <div class="sablon-alanlar"><input class="s-ad" value="${esc(o.ad)}" placeholder="${tur === 'a' ? 'Aşama adı' : 'Evrak adı'}" maxlength="120" aria-label="${tur === 'a' ? 'Aşama adı' : 'Evrak adı'}">
        <input class="s-ac" value="${esc(o.aciklama || '')}" placeholder="${tur === 'a' ? 'Müşteriye açıklama (isteğe bağlı)' : 'Açıklama (isteğe bağlı)'}" maxlength="600" aria-label="Açıklama"></div>
      <button type="button" class="ikon-kucuk tehlike" data-satir-sil aria-label="Kaldır">${ikon.sil}</button></li>`;
  B.sayfa(`
    ${B.ustBar(B.geri('Şablonlar', '#/sablonlar'))}
    <h1 class="baslik">${id === 'yeni' ? 'Yeni şablon' : esc(s.ad)}</h1>
    <div class="kart form-kart">
      <div class="form-alan"><label for="sAd">Şablon adı *</label><input id="sAd" value="${esc(s.ad)}" maxlength="80" placeholder="Örn. İç Mimari Proje"></div>
      <div class="form-alan"><label for="sAc">Açıklama</label><input id="sAc" value="${esc(s.aciklama || '')}" maxlength="300"></div>
    </div>
    <div class="bolum-baslik"><h2 class="alt-baslik">Aşamalar</h2><button class="btn kucuk ikincil" data-ekle="a">${ikon.arti} Aşama</button></div>
    <ol class="kart sablon-liste" id="aListe">${s.asamalar.map(a => satir('a', a)).join('')}</ol>
    <div class="bolum-baslik"><h2 class="alt-baslik">Müşteriden istenecek evraklar</h2><button class="btn kucuk ikincil" data-ekle="e">${ikon.arti} Evrak</button></div>
    <ol class="kart sablon-liste" id="eListe">${s.evraklar.map(e => satir('e', e)).join('')}</ol>
    <div class="yan-yana" style="margin-top:24px">${id !== 'yeni' ? `<button class="btn tehlike" id="sSil">${ikon.sil} Şablonu sil</button>` : ''}<button class="btn vurgu" id="sKaydet">Kaydet</button></div>`);
  ['aListe', 'eListe'].forEach(l => Sortable.create($('#' + l), {handle: '.tutamak', animation: 160}));
  $('#icerik').oninput = () => { B.kirli = true; };
  $('#icerik').onclick = async e => {
    const ek = e.target.closest('[data-ekle]');
    if (ek) { const l = $(ek.dataset.ekle === 'a' ? '#aListe' : '#eListe'); l.insertAdjacentHTML('beforeend', satir(ek.dataset.ekle, {ad: ''})); $('li:last-child .s-ad', l).focus(); B.kirli = true; return; }
    const sil = e.target.closest('[data-satir-sil]');
    if (sil) { sil.closest('li').remove(); B.kirli = true; return; }
    if (e.target.closest('#sKaydet')) {
      const topla = l => $$('#' + l + ' li').map(li => ({ad: $('.s-ad', li).value.trim(), aciklama: $('.s-ac', li).value.trim()})).filter(x => x.ad);
      const v = {ad: $('#sAd').value.trim(), aciklama: $('#sAc').value.trim(), asamalar: topla('aListe'), evraklar: topla('eListe')};
      if (!v.ad) return B.toast('Şablon adını yazın.', true);
      if (!v.asamalar.length) return B.toast('En az bir aşama ekleyin.', true);
      try { await B.yaz('sablon_kaydet', Object.assign(v, id === 'yeni' ? {} : {id: +id})); B.kirli = false; B.toast('Şablon kaydedildi'); B.git('#/sablonlar'); }
      catch (err) { B.toast(err.message, true); }
    }
    if (e.target.closest('#sSil')) {
      if (!await B.onay('“' + s.ad + '” silinsin mi?', 'Bu şablonla oluşturulmuş projeler etkilenmez.', 'Sil')) return;
      try { await B.yaz('sablon_sil', {id: +id}); B.kirli = false; B.toast('Şablon silindi'); B.git('#/sablonlar'); } catch (err) { B.toast(err.message, true); }
    }
  };
});

/* =========================================================
   DEĞİŞİKLİK KAYITLARI
   ========================================================= */
B.rota(/^#\/kayitlar$/, async () => {
  if (!yalnizYonetici()) return;
  B.yukleniyor();
  let sayfa = 1, q = '', liste = [], devam = false;
  B.sayfa(`
    <h1 class="baslik">Değişiklik kayıtları</h1>
    <p class="not">Paneldeki her değişiklik, yapan kişi ve zaman bilgisiyle burada tutulur.</p>
    <div class="arama"><span aria-hidden="true">${ikon.arama}</span><input id="ara" type="search" placeholder="Kişi, işlem veya proje ara" aria-label="Kayıtlarda ara"></div>
    <div class="kart"><ul class="kayit-listesi" id="liste"></ul></div>
    <button class="btn ikincil" id="dahaFazla" hidden>Daha eski kayıtlar</button>`, {genis: true});
  const yukle = async ekle => {
    const d = await B.oku('kayitlar', {sayfa, q});
    liste = ekle ? liste.concat(d.kayitlar) : d.kayitlar; devam = d.devam;
    $('#liste').innerHTML = liste.map(k => `<li><b>${esc(k.kullanici_ad || 'Sistem')}</b> ${esc(k.islem)}${k.is_ad ? ` — <a href="#/is/${k.is_id}">${esc(k.is_ad)}</a>` : ''}<small>${B.tarih(k.tarih)} ${B.saat(k.tarih)}</small></li>`).join('') || '<li class="not">Kayıt bulunamadı.</li>';
    $('#dahaFazla').hidden = !devam;
  };
  await yukle();
  let zaman;
  $('#ara').oninput = e => { clearTimeout(zaman); zaman = setTimeout(() => { q = e.target.value.trim(); sayfa = 1; yukle(); }, 300); };
  $('#dahaFazla').onclick = () => { sayfa++; yukle(true); };
});

/* ---------- Mobil "Daha fazla" menüsü ---------- */
B.rota(/^#\/menu$/, async () => {
  B.sayfa(`
    <h1 class="baslik">Daha fazla</h1>
    <div class="kart satir-listesi">
      ${B.yoneticiMi() ? `
      <a class="satir-oge" href="#/kullanicilar"><span class="avatar">${ikon.kisi}</span><div><b>Kullanıcılar</b><small>Personel, yönetici ve müşteri hesapları</small></div>${ikon.ileri}</a>
      <a class="satir-oge" href="#/sablonlar"><span class="avatar">${ikon.katman}</span><div><b>Süreç şablonları</b><small>Hizmet türlerine göre aşama ve evraklar</small></div>${ikon.ileri}</a>
      <a class="satir-oge" href="#/kayitlar"><span class="avatar">${ikon.saat}</span><div><b>Değişiklik kayıtları</b><small>Kim, neyi, ne zaman değiştirdi</small></div>${ikon.ileri}</a>` : ''}
      <a class="satir-oge" href="#/hesap"><span class="avatar">${ikon.ayar}</span><div><b>Hesabım</b><small>Profil, şifre, çıkış</small></div>${ikon.ileri}</a>
    </div>`);
});
})();
