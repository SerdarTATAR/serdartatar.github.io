/* =========================================================
   Uygulama: role göre yönlendirme, bildirimler, hesap ekranı, başlatma
   ========================================================= */
(function () {
'use strict';
const {$, $$, esc, ikon} = B;

/* Ana sayfa ve proje sayfası role göre farklıdır */
B.rota(/^#\/$|^$/, async () => {
  return B.kullanici.rol === 'musteri' ? B.musteriAna() : B.ekipIsler();
});
B.rota(/^#\/is\/(\d+)$/, async id => B.kullanici.rol === 'musteri' ? B.musteriIs(+id) : B.ekipIs(+id));

/* ---------- Bildirimler ---------- */
const BILDIRIM_IKON = {islem: 'unlem', evrak: 'dosya', dosya: 'dosya', asama: 'onay', durum: 'canta', tarih: 'saat', guncelleme: 'mesaj', yeni: 'canta', hesap: 'kisi'};
B.rota(/^#\/bildirimler$/, async () => {
  B.yukleniyor();
  const d = await B.oku('bildirimler');
  B.okunmamis = d.okunmamis; B.rozetGuncelle();
  B.sayfa(`
    <div class="baslik-satiri"><h1 class="baslik">Bildirimler</h1>${d.okunmamis ? '<button class="btn kucuk ikincil" id="hepsiOkundu">Tümünü okundu say</button>' : ''}</div>
    ${d.bildirimler.length ? `<div class="kart satir-listesi bildirim-listesi">${d.bildirimler.map(b => `
      <button class="satir-oge bildirim${b.okundu ? '' : ' okunmadi'}${b.tur === 'islem' ? ' bildirim-dikkat' : ''}" data-bildirim="${b.id}" data-is="${b.is_id || ''}" data-tur="${esc(b.tur)}">
        <span class="avatar">${ikon[BILDIRIM_IKON[b.tur] || 'zil']}</span>
        <div><b>${esc(b.metin)}</b><small>${B.goreceli(b.tarih)}${b.okundu ? '' : ' · <span class="yeni-etiket">yeni</span>'}</small></div>
        ${b.is_id || b.tur === 'hesap' ? ikon.ileri : ''}
      </button>`).join('')}</div>`
      : B.bos('zil', 'Bildiriminiz yok', 'Projenizde bir gelişme olduğunda burada göreceksiniz.')}`);
  const okundu = async (govde) => { try { await B.yaz('bildirim_okundu', govde); await B.oturumYenile(); B.rozetGuncelle(); } catch (e) {} };
  const h = $('#hepsiOkundu');
  if (h) h.onclick = async () => { await okundu({hepsi: true}); B.goster(); };
  $('#icerik').onclick = async e => {
    const b = e.target.closest('[data-bildirim]'); if (!b) return;
    if (b.classList.contains('okunmadi')) await okundu({id: +b.dataset.bildirim});
    if (b.dataset.is) B.git('#/is/' + b.dataset.is);
    else if (b.dataset.tur === 'hesap') B.git(B.yoneticiMi() ? '#/musteriler' : '#/');
    else B.goster();
  };
});

/* ---------- Hesabım ---------- */
B.rota(/^#\/hesap$/, async () => {
  const k = B.kullanici;
  B.sayfa(`
    <h1 class="baslik">Hesabım</h1>
    ${B.DEMO ? '<p class="demo-not">Tanıtım sürümü — burada yaptığınız değişiklikler gerçek siteye kaydedilmez.</p>' : ''}
    <div class="kart profil-kart">${B.avatar(k.ad_soyad, 1)}<div><b>${esc(k.ad_soyad)}</b><small>${esc(k.eposta || k.giris)} · ${esc(B.ROL[k.rol])}</small></div></div>
    ${B.DEMO ? `
      <div class="yan-yana" style="margin-top:16px"><button class="btn ikincil" id="demoSifirla">Tanıtımı baştan başlat</button></div>
      <p class="not">Yaptığınız tüm denemeleri siler; örnek müşteri, proje ve evraklar ilk haline döner.</p>` : ''}${`
      <h2 class="alt-baslik">Bilgilerim</h2>
      <form class="kart" id="pForm" novalidate>
        <div class="alan"><label for="pAd">Ad soyad</label><input id="pAd" value="${esc(k.ad_soyad)}" maxlength="80" autocomplete="name"></div>
        <div class="alan"><label for="pTel">Telefon</label><input id="pTel" type="tel" inputmode="tel" value="${esc(k.telefon || '')}" maxlength="30" autocomplete="tel"></div>
        <div class="alan"><label>E-posta</label><span class="salt-oku">${esc(k.eposta || '—')}</span></div>
      </form>
      <div class="yan-yana"><button class="btn ikincil" id="pKaydet">Bilgilerimi kaydet</button></div>

      <h2 class="alt-baslik">Şifre değiştir</h2>
      <form class="kart" id="sForm" novalidate>
        <input type="text" autocomplete="username" value="${esc(k.giris)}" hidden>
        <div class="alan"><label for="sEski">Mevcut</label><input id="sEski" type="password" autocomplete="current-password"></div>
        <div class="alan"><label for="sYeni">Yeni</label><input id="sYeni" type="password" autocomplete="new-password" placeholder="En az 8 karakter, harf ve rakam"></div>
        <div class="alan"><label for="sYeni2">Tekrar</label><input id="sYeni2" type="password" autocomplete="new-password"></div>
      </form>
      <div class="yan-yana"><button class="btn ikincil" id="sKaydet">Şifreyi değiştir</button></div>
      <p class="not">Şifre değişince diğer cihazlardaki oturumlarınız kapanır.</p>
      ${B.yoneticiMi() && !B.DEMO ? `
        <h2 class="alt-baslik">Örnek veriler</h2>
        <div class="kart metin-kart">
          <p>Sistemi tanıtmak için kurgusal bir müşteri (Ahmet Yılmaz), ona ait mimari villa projesi, bir personel ve eşleştirme bekleyen bir hesap oluşturur. Örnek hesaplarla giriş yapıp müşteri ve personel ekranlarını deneyebilirsiniz.</p>
          <div class="yan-yana"><button class="btn ikincil" id="ornekOlustur">Örnek verileri oluştur</button><button class="btn tehlike" id="ornekSil">Örnek verileri sil</button></div>
        </div>` : ''}`}
    <div style="margin-top:32px"><button class="btn tehlike" id="cikis">${ikon.cikis} Çıkış yap</button></div>`);

  const dugme = (id, islev) => { const b = $(id); if (b) b.onclick = async () => { b.disabled = true; try { await islev(); } catch (e) { B.toast(e.message, true); } b.disabled = false; }; };
  dugme('#demoSifirla', async () => { B.demoSifirla && B.demoSifirla(); await B.oturumYenile(); B.toast('Tanıtım baştan başladı'); B.git('#/'); });
  dugme('#pKaydet', async () => {
    const j = await B.yaz('profil_guncelle', {ad_soyad: $('#pAd').value.trim(), telefon: $('#pTel').value.trim()});
    B.kullanici = j.kullanici; B.toast('Bilgileriniz kaydedildi'); $('.kabuk').dataset.imza = ''; B.goster();
  });
  dugme('#sKaydet', async () => {
    const eski = $('#sEski').value, yeni = $('#sYeni').value;
    if (!eski || !yeni) throw new Error('Mevcut ve yeni şifreyi yazın.');
    if (yeni !== $('#sYeni2').value) throw new Error('Yeni şifreler aynı değil.');
    await B.yaz('sifre_degistir', {eski, yeni}); $('#sForm').reset(); B.toast('Şifreniz değiştirildi');
  });
  dugme('#ornekOlustur', async () => {
    const j = await B.yaz('ornek_veri_olustur', {});
    await B.form({baslik:'Örnek veriler hazır', dugme:'Tamam', alanlar:[{ad:'b', tur:'bilgi', html:`
      <p>Bu hesaplarla giriş yapıp ekranları deneyebilirsiniz. Tüm örnek hesapların şifresi: <b>${esc(j.sifre)}</b></p>
      <ul class="hesap-listesi">${j.hesaplar.map(h => `<li><b>${esc(h.rol)}</b> ${esc(h.ad)}<br><code>${esc(h.giris)}</code></li>`).join('')}</ul>
      <p class="not">İşiniz bitince “Örnek verileri sil” ile hepsini kaldırabilirsiniz.</p>`}]});
    B.git('#/');
  });
  dugme('#ornekSil', async () => {
    if (!await B.onay('Örnek veriler silinsin mi?', 'Örnek müşteriler, projeleri, dosyaları ve örnek hesaplar kaldırılır. Gerçek verileriniz etkilenmez.', 'Sil')) return;
    await B.yaz('ornek_veri_sil', {}); B.toast('Örnek veriler silindi');
  });
  dugme('#cikis', async () => {
    if (!await B.onay(null, 'Bu cihazdan çıkış yapılsın mı?', 'Çıkış yap')) return;
    try { await B.yaz('cikis', {}); } catch (e) {}
    B.kullanici = null; B.git('#/giris');
  });
});

B.goster();
})();
