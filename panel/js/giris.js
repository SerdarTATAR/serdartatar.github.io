/* =========================================================
   Giriş, kayıt, şifremi unuttum, şifre yenileme, aydınlatma metni
   ========================================================= */
(function () {
'use strict';
const {$, esc, ikon} = B;

const iosTarayici = () => (/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  && !(window.navigator.standalone || matchMedia('(display-mode: standalone)').matches);

function kutu(icerik, alt) {
  return `<div class="giris">
    <img class="logo" src="../images/balatlogo.png" alt="Balat Mimarlık">
    <h1>${B.DEMO ? 'Yönetim Paneli · Tanıtım' : 'Müşteri ve Yönetim Paneli'}</h1>
    ${icerik}
    ${alt || ''}
  </div>`;
}
function hataGoster(mesaj) { const h = $('#gHata'); h.textContent = mesaj; h.classList.remove('gizli'); h.focus(); }
function bekle(btn, metin) { btn.disabled = !!metin; btn.innerHTML = metin ? '<span class="donen"></span>' : btn.dataset.metin; }

/* ---------- Giriş ---------- */
B.rota(/^#\/giris$/, async () => {
  try { if (await B.oturumYenile()) return B.git('#/'); } catch (e) {}
  B.tamEkran(kutu(`
    <form id="gForm" novalidate>
      ${B.DEMO ? `<div class="demo-kutu">
        <b>Tanıtım sürümü</b>
        <p>Paneli farklı gözlerle deneyin. Buradaki bilgiler örnektir ve yalnızca bu tarayıcıda tutulur.</p>
        <div class="demo-roller">
          <button type="button" class="btn vurgu" data-demo-rol="ahmet@ornek.balat">${ikon.kisi} Müşteri olarak dene</button>
          <button type="button" class="btn ikincil" data-demo-rol="elif@ornek.balat">${ikon.canta} Personel olarak dene</button>
          <button type="button" class="btn ikincil" data-demo-rol="demo">${ikon.ayar} Yönetici olarak dene</button>
        </div>
        <small>Elle giriş: tüm tanıtım hesaplarının şifresi <b>demo</b> · yönetici: <b>demo</b> · müşteri: <b>ahmet@ornek.balat</b> · personel: <b>elif@ornek.balat</b> · onay bekleyen müşteri: <b>mehmet@ornek.balat</b></small>
      </div>` : ''}
      <div class="hata-kutu gizli" id="gHata" role="alert" tabindex="-1"></div>
      <div class="kart">
        <div class="alan"><label for="gAd">E-posta</label><input id="gAd" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="E-posta veya kullanıcı adı" required></div>
        <div class="alan"><label for="gSifre">Şifre</label><input id="gSifre" name="password" type="password" autocomplete="current-password" required>
          <button type="button" class="sifre-goster" aria-label="Şifreyi göster" data-goster="gSifre">${ikon.goz}</button></div>
      </div>
      <button class="btn vurgu" id="gBtn" data-metin="Giriş yap">Giriş yap</button>
      <div class="giris-linkler"><a href="#/sifremi-unuttum">Şifremi unuttum</a></div>
    </form>`,
    `${`<div class="kayit-cagri"><p>Hizmet aldığınız projeyi takip etmek mi istiyorsunuz?</p><a class="btn ikincil" href="#/kayit">Hesap oluştur</a></div>`}
     ${iosTarayici() ? `<div class="ipucu"><b>Uygulama gibi kullanın</b>Safari’de alttaki ${ikon.paylas} <b style="display:inline">Paylaş</b> düğmesine dokunup <b style="display:inline">“Ana Ekrana Ekle”</b>yi seçin.</div>` : ''}`));
  const f = $('#gForm'), btn = $('#gBtn');
  document.querySelectorAll('[data-demo-rol]').forEach(b => b.onclick = () => { $('#gAd').value = b.dataset.demoRol; $('#gSifre').value = 'demo'; f.requestSubmit(); });
  f.onsubmit = async e => {
    e.preventDefault();
    $('#gHata').classList.add('gizli');
    const kullanici = $('#gAd').value.trim(), sifre = $('#gSifre').value;
    if (!kullanici || !sifre) return hataGoster('E-posta (veya kullanıcı adı) ve şifrenizi girin.');
    bekle(btn, 1);
    try {
      const j = await B.yaz('giris', {kullanici, sifre});
      B.kullanici = j.kullanici;
      await B.oturumYenile();
      B.git('#/');
    } catch (err) { hataGoster(err.message); bekle(btn); }
  };
});

/* ---------- Kayıt ---------- */
B.rota(/^#\/kayit$/, async () => {
  B.tamEkran(kutu(`
    <form id="kForm" novalidate>
      <h2 class="giris-baslik">Hesap oluşturun</h2>
      <p class="not" style="margin:-6px 4px 16px">Hesabınız, ekibimiz tarafından projenizle eşleştirildikten sonra projenizin durumunu buradan takip edebilirsiniz.</p>
      <div class="hata-kutu gizli" id="gHata" role="alert" tabindex="-1"></div>
      <div class="kart">
        <div class="alan"><label for="kAd">Ad soyad</label><input id="kAd" autocomplete="name" maxlength="80" required></div>
        <div class="alan"><label for="kEposta">E-posta</label><input id="kEposta" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="120" required></div>
        <div class="alan"><label for="kTel">Telefon</label><input id="kTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" maxlength="30"></div>
        <div class="alan"><label for="kSifre">Şifre</label><input id="kSifre" type="password" autocomplete="new-password" placeholder="En az 8 karakter, harf ve rakam" required>
          <button type="button" class="sifre-goster" aria-label="Şifreyi göster" data-goster="kSifre">${ikon.goz}</button></div>
      </div>
      <label class="onay-satir"><input type="checkbox" id="kKvkk"> <span><a href="#/kvkk" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; kişisel verilerimin proje takibi amacıyla işlenmesini kabul ediyorum.</span></label>
      <button class="btn vurgu" id="kBtn" data-metin="Hesap oluştur">Hesap oluştur</button>
      <div class="giris-linkler"><a href="#/giris">Zaten hesabım var — giriş yap</a></div>
    </form>`));
  const btn = $('#kBtn');
  $('#kForm').onsubmit = async e => {
    e.preventDefault();
    $('#gHata').classList.add('gizli');
    const v = {ad_soyad: $('#kAd').value.trim(), eposta: $('#kEposta').value.trim(), telefon: $('#kTel').value.trim(), sifre: $('#kSifre').value, kvkk: $('#kKvkk').checked};
    if (!v.ad_soyad || !v.eposta || !v.sifre) return hataGoster('Ad soyad, e-posta ve şifre alanlarını doldurun.');
    if (v.sifre.length < 8 || !/\d/.test(v.sifre) || !/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(v.sifre)) return hataGoster('Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermeli.');
    if (!v.kvkk) return hataGoster('Devam etmek için aydınlatma metnini onaylayın.');
    bekle(btn, 1);
    try { const j = await B.yaz('kayit_ol', v); B.kullanici = j.kullanici; B.toast('Hesabınız oluşturuldu'); B.git('#/'); }
    catch (err) { hataGoster(err.message); bekle(btn); }
  };
});

/* ---------- Şifremi unuttum ---------- */
B.rota(/^#\/sifremi-unuttum$/, async () => {
  B.tamEkran(kutu(`
    <form id="uForm" novalidate>
      <h2 class="giris-baslik">Şifrenizi mi unuttunuz?</h2>
      <p class="not" style="margin:-6px 4px 16px">Hesabınızdaki e-posta adresini yazın; size şifre sıfırlama bağlantısı gönderelim.</p>
      <div class="hata-kutu gizli" id="gHata" role="alert" tabindex="-1"></div>
      <div class="basari-kutu gizli" id="uTamam" role="status"></div>
      <div class="kart"><div class="alan"><label for="uEposta">E-posta</label><input id="uEposta" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" required></div></div>
      <button class="btn vurgu" id="uBtn" data-metin="Bağlantı gönder">Bağlantı gönder</button>
      <p class="not" style="text-align:center;margin-top:14px">E-posta gelmezse ekibimiz size WhatsApp üzerinden yeni bir bağlantı gönderebilir.</p>
      <div class="giris-linkler"><a href="#/giris">Girişe dön</a></div>
    </form>`));
  const btn = $('#uBtn');
  $('#uForm').onsubmit = async e => {
    e.preventDefault();
    $('#gHata').classList.add('gizli');
    const eposta = $('#uEposta').value.trim();
    if (!eposta) return hataGoster('E-posta adresinizi yazın.');
    bekle(btn, 1);
    try { const j = await B.yaz('sifre_unuttum', {eposta}); const t = $('#uTamam'); t.textContent = j.mesaj; t.classList.remove('gizli'); bekle(btn); }
    catch (err) { hataGoster(err.message); bekle(btn); }
  };
});

/* ---------- Şifre yenile (e-postadaki / yöneticinin gönderdiği bağlantı) ---------- */
B.rota(/^#\/sifre-yenile\/([\w-]{20,})$/, async token => {
  B.tamEkran(kutu(`
    <form id="yForm" novalidate>
      <h2 class="giris-baslik">Yeni şifrenizi belirleyin</h2>
      <div class="hata-kutu gizli" id="gHata" role="alert" tabindex="-1"></div>
      <input type="text" autocomplete="username" hidden>
      <div class="kart">
        <div class="alan"><label for="ySifre">Yeni şifre</label><input id="ySifre" type="password" autocomplete="new-password" placeholder="En az 8 karakter, harf ve rakam" required>
          <button type="button" class="sifre-goster" aria-label="Şifreyi göster" data-goster="ySifre">${ikon.goz}</button></div>
        <div class="alan"><label for="ySifre2">Tekrar</label><input id="ySifre2" type="password" autocomplete="new-password" required></div>
      </div>
      <button class="btn vurgu" id="yBtn" data-metin="Şifreyi kaydet">Şifreyi kaydet</button>
      <div class="giris-linkler"><a href="#/giris">Girişe dön</a></div>
    </form>`));
  const btn = $('#yBtn');
  $('#yForm').onsubmit = async e => {
    e.preventDefault();
    $('#gHata').classList.add('gizli');
    const s1 = $('#ySifre').value, s2 = $('#ySifre2').value;
    if (s1.length < 8 || !/\d/.test(s1) || !/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(s1)) return hataGoster('Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermeli.');
    if (s1 !== s2) return hataGoster('Şifreler aynı değil.');
    bekle(btn, 1);
    try { const j = await B.yaz('sifre_yenile', {token, sifre: s1}); B.kullanici = j.kullanici; B.toast('Şifreniz kaydedildi, hoş geldiniz'); history.replaceState(null, '', '#/'); B.goster(); }
    catch (err) { hataGoster(err.message); bekle(btn); }
  };
});

/* ---------- Aydınlatma metni (KVKK) ---------- */
B.rota(/^#\/kvkk$/, async () => {
  B.tamEkran(`<div class="ekran metin-sayfa">
    ${B.ustBar(B.geri('Geri', '#/kayit'))}
    <h1 class="baslik">Aydınlatma metni</h1>
    <div class="kart metin-kart">
      <p><b>Veri sorumlusu:</b> Balat Mimarlık, Fatih, Umutreis Cad. ATİRUS İş Merkezi No:2 Kat:4, 34535 Büyükçekmece / İstanbul.</p>
      <p><b>İşlenen veriler:</b> Ad soyad, e-posta, telefon; proje bilgileri; tarafınızdan yüklenen belgeler (ör. tapu, kimlik, imar belgeleri) ve panel kullanım kayıtları.</p>
      <p><b>Amaç:</b> Aldığınız mimarlık/danışmanlık hizmetinin yürütülmesi, süreç durumunun size bildirilmesi, ilgili kurum başvurularının hazırlanması ve yasal yükümlülüklerin yerine getirilmesi.</p>
      <p><b>Aktarım:</b> Belgeleriniz, yalnızca hizmetin gerektirdiği ölçüde ilgili kamu kurumlarıyla ve projede görevli ekibimizle paylaşılır.</p>
      <p><b>Haklarınız:</b> 6698 sayılı KVKK’nın 11. maddesi kapsamındaki haklarınız için <a href="mailto:info@balatmimarlik.com">info@balatmimarlik.com</a> adresine başvurabilirsiniz.</p>
      <p class="not">Bu metin bir taslaktır; yayına almadan önce hukuk danışmanınızca gözden geçirilmelidir.</p>
    </div></div>`);
});

/* Şifre göster/gizle */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-goster]'); if (!b) return;
  const i = document.getElementById(b.dataset.goster);
  i.type = i.type === 'password' ? 'text' : 'password';
  b.setAttribute('aria-label', i.type === 'password' ? 'Şifreyi göster' : 'Şifreyi gizle');
});
})();
