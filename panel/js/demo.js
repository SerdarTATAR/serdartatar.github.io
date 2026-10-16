/* =========================================================
   Tanıtım sürümü (github.io gibi PHP çalışmayan önizlemeler)
   Sunucunun yaptığı işleri tarayıcıda taklit eder: aynı ekranlar, aynı yetki kuralları.
   Veriler yalnızca bu tarayıcıda tutulur; hiçbir yere gönderilmez.
   ========================================================= */
(function () {
'use strict';
if (!B.DEMO) return;

const ANAHTAR = 'bm-demo-portal-v1', OTURUM = 'bm-demo-oturum';
const DEMO_SIFRE = 'demo';
const simdi = () => new Date().toISOString();
const gun = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const zaman = (n, saat) => { const d = new Date(gun(n) + 'T' + (saat || '10:30') + ':00'); return d.toISOString(); };
const kopya = o => JSON.parse(JSON.stringify(o));
const hata = (m, kod) => { const e = new Error(m); e.kod = kod || 400; throw e; };
const ET_A = {bekliyor:'Bekliyor', devam:'Devam ediyor', musteri:'Sizden işlem bekleniyor', tamamlandi:'Tamamlandı'};
const ET_E = {eksik:'Eksik', yuklendi:'Yüklendi', inceleniyor:'İnceleniyor', onaylandi:'Onaylandı', duzeltme:'Düzeltme gerekli'};
const blobAdresleri = {};   // dosya id → tarayıcı içi adres (yalnızca bu oturum)

/* ---------- Başlangıç verisi (sunucudaki örnek veriyle aynı senaryo) ---------- */
function tohum() {
  const v = {sayac: 100, kullanicilar: [], musteriler: [], sablonlar: [], isler: [], is_personel: [], asamalar: [], evraklar: [], dosyalar: [], guncellemeler: [], bildirimler: [], kayitlar: []};
  const id = () => ++v.sayac;
  const kul = (giris, ad, rol, tel, unvan, mid) => { const k = {id: id(), giris, eposta: giris.includes('@') ? giris : null, ad_soyad: ad, telefon: tel, unvan: unvan || null, rol, musteri_id: mid || null, aktif: 1, olusturma: zaman(-60), son_giris: null}; v.kullanicilar.push(k); return k.id; };
  const yon = kul('demo', 'Balat Mimarlık', 'yonetici', '0533 583 87 75', 'Yönetici');
  const elif = kul('elif@ornek.balat', 'Elif Kaya', 'personel', '0555 000 00 01', 'Proje Mimarı');
  const s = {id: 1, ad: 'Mimari Proje', aciklama: 'Konut ve villa mimari proje süreci', olusturma: zaman(-60),
    asamalar: [['Başvuru alındı', 'Başvurunuzu aldık, ilk değerlendirmeyi yapıyoruz.'], ['Evraklar hazırlanıyor', 'Proje için gerekli belgeler toplanıyor.'], ['Proje çizimi devam ediyor', 'Mimari çizimler hazırlanıyor.'], ['Onaya sunuldu', 'Proje ilgili kuruma onay için sunuldu.'], ['Revizyon bekleniyor', 'Kurumdan gelen düzeltme talepleri işleniyor.'], ['Onaylandı', 'Proje onaylandı.'], ['Tamamlandı', 'Süreç tamamlandı.']].map(([ad, aciklama]) => ({ad, aciklama})),
    evraklar: [['Tapu belgesi', 'Tapunun tüm sayfalarının okunaklı fotoğrafı veya taraması.'], ['Kimlik fotokopisi', 'Malik(ler)in kimlik kartının ön ve arka yüzü.'], ['İmar durumu belgesi', 'Belediyeden alınan güncel imar durumu.'], ['Röperli kroki / aplikasyon', 'Varsa parselin aplikasyon krokisi.']].map(([ad, aciklama]) => ({ad, aciklama}))};
  v.sablonlar.push(s); v.sayac = Math.max(v.sayac, 1);

  const m1 = id(); v.musteriler.push({id: m1, ad: 'Ahmet Yılmaz', telefon: '0555 000 00 02', eposta: 'ahmet@ornek.balat', adres: 'Bahçeşehir, Başakşehir / İstanbul', ic_not: 'Tanıtım için kurgusal müşteri.', olusturma: zaman(-42)});
  const ahmet = kul('ahmet@ornek.balat', 'Ahmet Yılmaz', 'musteri', '0555 000 00 02', null, m1);
  const is1 = id();
  v.isler.push({id: is1, musteri_id: m1, sablon_id: 1, ad: 'Bahçeşehir Villa Projesi', hizmet: 'Mimari Proje', konum: 'Bahçeşehir, İstanbul', aciklama: '420 m² arsa üzerinde iki katlı müstakil villa mimari projesi ve ruhsat süreci.', durum: 'aktif', sorumlu_id: elif, baslangic: gun(-40), tahmini_bitis: gun(75), olusturma: zaman(-40), guncelleme: zaman(-1)});
  v.is_personel.push([is1, elif]);
  [['Başvuru alındı', 'tamamlandi', 'Başvurunuz alındı ve ilk görüşme yapıldı.', null, null, -40],
   ['Evraklar hazırlanıyor', 'tamamlandi', 'Gerekli belgelerin listesi çıkarıldı ve toplandı.', null, null, -30],
   ['Proje çizimi devam ediyor', 'tamamlandi', 'Avan proje çizimleri tamamlandı ve size paylaşıldı.', null, 'Statik proje için Yapı Statik ile görüşüldü.', -5],
   ['Onaya sunuldu', 'musteri', 'Proje çizimleri tamamlandı. İlgili kurumun onayı bekleniyor.', 'Tapu belgesini yüklemeniz gerekiyor.', 'Belediye ön incelemesi için tapu şart.', 10],
   ['Revizyon bekleniyor', 'bekliyor', 'Kurumdan gelebilecek düzeltme talepleri bu aşamada işlenecek.', null, null, 30],
   ['Onaylandı', 'bekliyor', null, null, null, 50], ['Tamamlandı', 'bekliyor', null, null, null, 75]].forEach((a, i) =>
    v.asamalar.push({id: id(), is_id: is1, sira: i + 1, ad: a[0], durum: a[1], aciklama: a[2], musteri_islemi: a[3], ic_not: a[4], tahmini_tarih: gun(a[5]),
      tamamlanma: a[1] === 'tamamlandi' ? gun(a[5]) : null, guncelleme: zaman(a[1] === 'bekliyor' ? -40 : Math.min(a[5], -1)), guncelleyen_id: elif}));
  const evrak = (isId, ad, aciklama, durum, not, sira, yonu) => { const e = {id: id(), is_id: isId, yon: yonu || 'talep', ad, aciklama, durum, musteri_notu: not, ic_not: null, sira, olusturma: zaman(-38), guncelleme: zaman(-2), guncelleyen_id: elif}; v.evraklar.push(e); return e.id; };
  const dosya = (eid, ad, kim, n) => v.dosyalar.push({id: id(), evrak_id: eid, ad, boyut: 690 + ad.length, tur: 'application/pdf', yukleyen_id: kim, tarih: zaman(n, '14:10'), ornek: 1});
  evrak(is1, 'Tapu belgesi', 'Tapunun tüm sayfalarının okunaklı fotoğrafı veya taraması.', 'eksik', null, 1);
  dosya(evrak(is1, 'Kimlik fotokopisi', 'Malik(ler)in kimlik kartının ön ve arka yüzü.', 'onaylandi', null, 2), 'kimlik-on-arka.pdf', ahmet, -33);
  dosya(evrak(is1, 'İmar durumu belgesi', 'Belediyeden alınan güncel imar durumu.', 'inceleniyor', null, 3), 'imar-durumu-2026.pdf', ahmet, -3);
  dosya(evrak(is1, 'Röperli kroki / aplikasyon', 'Varsa parselin aplikasyon krokisi.', 'duzeltme', 'Yüklediğiniz kroki okunaklı değil; lütfen daha net bir tarama veya fotoğraf yükleyin.', 4), 'kroki.pdf', ahmet, -6);
  dosya(evrak(is1, 'Avan proje çizimleri', 'Villanın kat planları ve görünüşleri (ön proje).', 'onaylandi', null, 5, 'paylasim'), 'avan-proje-cizimleri.pdf', elif, -5);
  [[-40, 'Projeniz oluşturuldu. Süreci bu sayfadan takip edebilirsiniz.', 'musteri'], [-30, '“Evraklar hazırlanıyor” aşaması tamamlandı.', 'musteri'],
   [-6, 'Röperli kroki / aplikasyon için düzeltme gerekli: Yüklediğiniz kroki okunaklı değil; lütfen daha net bir tarama veya fotoğraf yükleyin.', 'musteri'],
   [-5, '“Proje çizimi devam ediyor” aşaması tamamlandı. Avan proje çizimleri tamamlandı ve size paylaşıldı.', 'musteri'], [-5, 'Yeni dosya paylaşıldı: Avan proje çizimleri', 'musteri'],
   [-3, 'İmar durumu belgesi inceleniyor.', 'musteri'], [-2, 'Belediye ön incelemesi için randevu talep edildi; tapu gelince dosya teslim edilecek.', 'ic'],
   [-1, '“Onaya sunuldu” aşamasında sizden işlem bekleniyor: Tapu belgesini yüklemeniz gerekiyor.', 'musteri']].forEach(g =>
    v.guncellemeler.push({id: id(), is_id: is1, metin: g[1], gorunurluk: g[2], yazan_id: elif, tarih: zaman(g[0], g[2] === 'ic' ? '16:45' : '11:00')}));
  [[-5, 'asama', 'Bahçeşehir Villa Projesi: “Proje çizimi devam ediyor” aşaması tamamlandı.', 1], [-5, 'dosya', 'Bahçeşehir Villa Projesi: size yeni bir dosya paylaşıldı — Avan proje çizimleri', 1],
   [-3, 'evrak', 'Bahçeşehir Villa Projesi: İmar durumu belgesi inceleniyor.', 0], [-1, 'islem', 'Bahçeşehir Villa Projesi: Sizden işlem bekleniyor — Tapu belgesini yüklemeniz gerekiyor.', 0]].forEach(b =>
    v.bildirimler.push({id: id(), kullanici_id: ahmet, is_id: is1, tur: b[1], metin: b[2], okundu: b[3], tarih: zaman(b[0], '11:05')}));
  v.bildirimler.push({id: id(), kullanici_id: elif, is_id: is1, tur: 'evrak', metin: 'Ahmet Yılmaz “İmar durumu belgesi” evrakını yükledi (Bahçeşehir Villa Projesi).', okundu: 0, tarih: zaman(-3, '14:12')});

  const m2 = id(); v.musteriler.push({id: m2, ad: 'Zeynep Demir', telefon: '0555 000 00 03', eposta: 'zeynep@ornek.balat', adres: 'Kadıköy / İstanbul', ic_not: 'İkinci kurgusal müşteri.', olusturma: zaman(-12)});
  kul('zeynep@ornek.balat', 'Zeynep Demir', 'musteri', '0555 000 00 03', null, m2);
  const is2 = id();
  v.isler.push({id: is2, musteri_id: m2, sablon_id: null, ad: 'Kadıköy Daire İç Mimari', hizmet: 'İç Mimarlık', konum: 'Kadıköy, İstanbul', aciklama: '3+1 dairenin iç mimari yenileme projesi.', durum: 'aktif', sorumlu_id: yon, baslangic: gun(-10), tahmini_bitis: gun(45), olusturma: zaman(-10), guncelleme: zaman(-2)});
  [['Keşif ve ölçüm', 'tamamlandi', -8], ['Konsept tasarım', 'devam', 7], ['Uygulama projesi', 'bekliyor', 25], ['Uygulama', 'bekliyor', 45]].forEach((a, i) =>
    v.asamalar.push({id: id(), is_id: is2, sira: i + 1, ad: a[0], durum: a[1], aciklama: null, musteri_islemi: null, ic_not: null, tahmini_tarih: gun(a[2]), tamamlanma: a[1] === 'tamamlandi' ? gun(a[2]) : null, guncelleme: zaman(-2), guncelleyen_id: yon}));
  evrak(is2, 'Daire planı (varsa)', null, 'eksik', null, 1);

  kul('mehmet@ornek.balat', 'Mehmet Öz', 'musteri', '0555 000 00 04');
  v.bildirimler.push({id: id(), kullanici_id: yon, is_id: null, tur: 'hesap', metin: 'Yeni müşteri hesabı eşleştirme bekliyor: Mehmet Öz (mehmet@ornek.balat)', okundu: 0, tarih: simdi()});
  v.kayitlar.push({id: id(), kullanici_ad: 'Elif Kaya', islem: 'Evrak durumunu değiştirdi: İmar durumu belgesi (Yüklendi → İnceleniyor)', is_id: is1, tarih: zaman(-3, '15:00')});
  return v;
}

let V = null;
function yukle() {
  if (V) return V;
  try { V = JSON.parse(localStorage.getItem(ANAHTAR)); } catch (e) { V = null; }
  if (!V || !V.kullanicilar) V = tohum();
  // Önceki oturumda tarayıcıda yüklenen dosyaların içeriği saklanmaz; kaydı kalır
  return V;
}
function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) {} }
const yeniId = () => ++V.sayac;
const ben = () => { let id = null; try { id = +sessionStorage.getItem(OTURUM); } catch (e) {} return id ? V.kullanicilar.find(k => k.id === id && k.aktif) : null; };
const kisi = id => { const u = V.kullanicilar.find(k => k.id === id); return u ? {id: u.id, ad_soyad: u.ad_soyad, unvan: u.unvan, telefon: u.telefon, eposta: u.eposta} : null; };
const ozetK = k => ({id: k.id, ad_soyad: k.ad_soyad, rol: k.rol, giris: k.giris, eposta: k.eposta, telefon: k.telefon, unvan: k.unvan, musteri_id: k.musteri_id});
const ekip = k => k.rol === 'personel' || k.rol === 'yonetici';
const log = (islem, isId) => { const k = ben(); V.kayitlar.push({id: yeniId(), kullanici_ad: k ? k.ad_soyad : 'Sistem', islem, is_id: isId || null, tarih: simdi()}); };
const dokun = isId => { const i = V.isler.find(x => x.id === isId); if (i) i.guncelleme = simdi(); };
const bildir = (kid, isId, tur, metin) => V.bildirimler.push({id: yeniId(), kullanici_id: kid, is_id: isId, tur, metin, okundu: 0, tarih: simdi()});
const musteriyeBildir = (isId, tur, metin) => { const is = V.isler.find(i => i.id === isId); V.kullanicilar.filter(k => k.rol === 'musteri' && k.aktif && k.musteri_id === is.musteri_id).forEach(k => bildir(k.id, isId, tur, metin)); };
const ekibeBildir = (isId, tur, metin) => {
  const is = V.isler.find(i => i.id === isId), b = ben();
  let idler = [is.sorumlu_id, ...V.is_personel.filter(p => p[0] === isId).map(p => p[1])].filter(Boolean);
  if (!idler.length) idler = V.kullanicilar.filter(k => k.rol === 'yonetici').map(k => k.id);
  [...new Set(idler)].filter(i => !b || i !== b.id).forEach(i => bildir(i, isId, tur, metin));
};
const guncelleme = (isId, metin, gor) => V.guncellemeler.push({id: yeniId(), is_id: isId, metin, gorunurluk: gor || 'musteri', yazan_id: (ben() || {}).id, tarih: simdi()});

function girisGerekli() { const k = ben(); if (!k) { B.oturumBitti(); hata('Oturum süresi doldu, lütfen tekrar giriş yapın.', 401); } return k; }
function rol(roller) { const k = girisGerekli(); if (!roller.split(',').includes(k.rol)) hata('Bu işlem için yetkiniz yok.', 403); return k; }
function isErisim(k, id, yazma) {
  const is = V.isler.find(i => i.id === +id);
  if (!is) hata('Proje bulunamadı.', 404);
  if (k.rol === 'yonetici') return is;
  if (k.rol === 'personel' && (is.sorumlu_id === k.id || V.is_personel.some(p => p[0] === is.id && p[1] === k.id))) return is;
  if (k.rol === 'musteri' && !yazma && k.musteri_id && is.musteri_id === k.musteri_id) return is;
  hata('Proje bulunamadı.', 404);
}
function evrakErisim(k, id, yazma) { const e = V.evraklar.find(x => x.id === +id); if (!e) hata('Evrak bulunamadı.', 404); return [e, isErisim(k, e.is_id, yazma)]; }

/* ---------- Görünümler (sunucudakiyle aynı biçim) ---------- */
function isOzet(is) {
  const a = V.asamalar.filter(x => x.is_id === is.id).sort((x, y) => x.sira - y.sira);
  const tamam = a.filter(x => x.durum === 'tamamlandi').length, ilk = a.find(x => x.durum !== 'tamamlandi');
  const sayi = {eksik: 0, yuklendi: 0, inceleniyor: 0, onaylandi: 0, duzeltme: 0};
  V.evraklar.filter(e => e.is_id === is.id && e.yon === 'talep').forEach(e => sayi[e.durum]++);
  const m = V.musteriler.find(x => x.id === is.musteri_id);
  return {id: is.id, ad: is.ad, hizmet: is.hizmet, konum: is.konum, durum: is.durum, baslangic: is.baslangic, tahmini_bitis: is.tahmini_bitis, guncelleme: is.guncelleme,
    musteri: m ? {id: m.id, ad: m.ad} : null, sorumlu: kisi(is.sorumlu_id),
    ilerleme: {toplam: a.length, tamam, oran: a.length ? Math.round(tamam * 100 / a.length) : 0},
    aktif_asama: ilk ? {ad: ilk.ad, durum: ilk.durum, etiket: ET_A[ilk.durum]} : null, evrak: sayi,
    dikkat: a.filter(x => x.durum === 'musteri').length + sayi.eksik + sayi.duzeltme};
}
function bekleyenler(is) {
  const tumu = V.evraklar.filter(e => e.is_id === is.id && e.yon === 'talep').sort((x, y) => x.sira - y.sira);
  const evraklar = tumu.filter(e => e.durum === 'eksik' || e.durum === 'duzeltme'), eslesen = new Set(), l = [];
  const ilkKelime = e => e.ad.toLocaleLowerCase('tr').split(/\s/)[0];
  V.asamalar.filter(a => a.is_id === is.id && a.durum === 'musteri').sort((x, y) => x.sira - y.sira).forEach(a => {
    const islem = (a.musteri_islemi || '').toLocaleLowerCase('tr');
    if (islem && tumu.some(e => ['yuklendi', 'inceleniyor', 'onaylandi'].includes(e.durum) && ilkKelime(e).length >= 4 && islem.includes(ilkKelime(e)))) return;
    const o = {tur: 'asama', id: a.id, is_id: is.id, is_ad: is.ad, baslik: a.musteri_islemi || a.ad + ' aşaması için sizden işlem bekleniyor.', ayrinti: a.aciklama, asama: a.ad};
    const e = evraklar.find(e => !eslesen.has(e.id) && ilkKelime(e).length >= 4 && islem && islem.includes(ilkKelime(e)));
    if (e) { o.evrak_id = e.id; o.durum = e.durum; eslesen.add(e.id); }
    l.push(o);
  });
  evraklar.filter(e => !eslesen.has(e.id)).forEach(e => l.push({tur: 'evrak', id: e.id, evrak_id: e.id, is_id: is.id, is_ad: is.ad,
    baslik: e.durum === 'duzeltme' ? e.ad + ' için düzeltme gerekli' : e.ad + ' yüklemeniz bekleniyor', ayrinti: e.durum === 'duzeltme' ? e.musteri_notu : e.aciklama, durum: e.durum}));
  return l;
}
function dosyaGorunum(d, k) {
  const y = V.kullanicilar.find(u => u.id === d.yukleyen_id);
  const yukleyen = !y ? '—' : y.rol === 'musteri' ? (k.rol === 'musteri' ? (y.id === k.id ? 'Siz' : y.ad_soyad) : y.ad_soyad + ' (müşteri)') : (k.rol === 'musteri' ? 'Balat Mimarlık' : y.ad_soyad);
  return {id: d.id, ad: d.ad, boyut: d.boyut, tur: d.tur, tarih: d.tarih, yukleyen, benim: d.yukleyen_id === k.id};
}
function isDetay(is, k) {
  const e = ekip(k), o = isOzet(is);
  o.aciklama = is.aciklama;
  o.asamalar = V.asamalar.filter(a => a.is_id === is.id).sort((x, y) => x.sira - y.sira).map(a => Object.assign(
    {id: a.id, ad: a.ad, durum: a.durum, etiket: ET_A[a.durum], aciklama: a.aciklama, musteri_islemi: a.musteri_islemi, tahmini_tarih: a.tahmini_tarih, tamamlanma: a.tamamlanma, guncelleme: a.guncelleme},
    e ? {ic_not: a.ic_not, guncelleyen: kisi(a.guncelleyen_id)} : {}));
  o.evraklar = V.evraklar.filter(x => x.is_id === is.id).sort((x, y) => (x.yon > y.yon ? 1 : x.yon < y.yon ? -1 : x.sira - y.sira)).map(x => Object.assign(
    {id: x.id, yon: x.yon, ad: x.ad, aciklama: x.aciklama, durum: x.durum, etiket: ET_E[x.durum], musteri_notu: x.musteri_notu, guncelleme: x.guncelleme,
     dosyalar: V.dosyalar.filter(d => d.evrak_id === x.id).sort((a, b) => b.tarih.localeCompare(a.tarih)).map(d => dosyaGorunum(d, k))}, e ? {ic_not: x.ic_not} : {}));
  o.guncellemeler = V.guncellemeler.filter(g => g.is_id === is.id && (e || g.gorunurluk === 'musteri')).sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 100)
    .map(g => ({id: g.id, metin: g.metin, gorunurluk: g.gorunurluk, tarih: g.tarih, yazan: e ? ((kisi(g.yazan_id) || {}).ad_soyad || '—') : 'Balat Mimarlık', benim: g.yazan_id === k.id}));
  o.bekleyenler = bekleyenler(is);
  if (e) {
    o.ekip = V.is_personel.filter(p => p[0] === is.id).map(p => kisi(p[1]));
    o.kayitlar = V.kayitlar.filter(x => x.is_id === is.id).slice(-60).reverse().map(x => ({kullanici_ad: x.kullanici_ad, islem: x.islem, tarih: x.tarih}));
    o.musteri_hesaplari = V.kullanicilar.filter(u => u.rol === 'musteri' && u.musteri_id === is.musteri_id).map(u => ({ad_soyad: u.ad_soyad, eposta: u.eposta, telefon: u.telefon}));
  }
  return o;
}
const detay = (is, k) => ({ok: true, is: isDetay(V.isler.find(i => i.id === is.id), k)});
const metin = (s, maks) => String(s == null ? '' : s).replace(/<[^>]*>/g, '').trim().slice(0, maks || 2000);

/* ---------- İşlemler ---------- */
const ISLEMLER = {
  oturum() { const k = ben(); return k ? {ok: true, kullanici: ozetK(k), okunmamis: V.bildirimler.filter(b => b.kullanici_id === k.id && !b.okundu).length} : {ok: false}; },
  giris(g) {
    const ad = String(g.kullanici || '').trim().toLocaleLowerCase('tr');
    const k = V.kullanicilar.find(u => u.giris === ad || (u.eposta && u.eposta === ad));
    if (!k || g.sifre !== DEMO_SIFRE) hata('E-posta/kullanıcı adı veya şifre hatalı. (Tanıtımda tüm şifreler: demo)', 401);
    if (!k.aktif) hata('Hesabınız kapatılmış.', 403);
    try { sessionStorage.setItem(OTURUM, k.id); sessionStorage.setItem('bm-demo-giris', '1'); } catch (e) {}
    k.son_giris = simdi(); kaydet();
    return {ok: true, kullanici: ozetK(k)};
  },
  cikis() { try { sessionStorage.removeItem(OTURUM); sessionStorage.removeItem('bm-demo-giris'); } catch (e) {} return {ok: true}; },
  kayit_ol(g) {
    const ad = metin(g.ad_soyad, 80), e = String(g.eposta || '').trim().toLocaleLowerCase('tr');
    if (!ad) hata('Ad soyad boş olamaz.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) hata('Geçerli bir e-posta adresi girin.');
    if (!g.kvkk) hata('Devam etmek için aydınlatma metnini onaylayın.');
    if (V.kullanicilar.some(u => u.giris === e || u.eposta === e)) hata('Bu e-posta adresiyle zaten bir hesap var.', 409);
    const k = {id: yeniId(), giris: e, eposta: e, ad_soyad: ad, telefon: metin(g.telefon, 30) || null, unvan: null, rol: 'musteri', musteri_id: null, aktif: 1, olusturma: simdi()};
    V.kullanicilar.push(k);
    V.kullanicilar.filter(u => u.rol === 'yonetici').forEach(y => bildir(y.id, null, 'hesap', 'Yeni müşteri hesabı eşleştirme bekliyor: ' + ad + ' (' + e + ')'));
    try { sessionStorage.setItem(OTURUM, k.id); sessionStorage.setItem('bm-demo-giris', '1'); } catch (x) {}
    kaydet(); return {ok: true, kullanici: ozetK(k)};
  },
  sifre_unuttum() { return {ok: true, mesaj: 'Tanıtım sürümünde e-posta gönderilmez. Tüm tanıtım hesaplarının şifresi: demo'}; },
  sifre_yenile() { hata('Tanıtım sürümünde şifre sıfırlama kapalı. Tüm hesapların şifresi: demo'); },
  sifre_degistir() { hata('Tanıtım sürümünde şifre değiştirilemez.'); },
  profil_guncelle(g) { const k = girisGerekli(); k.ad_soyad = metin(g.ad_soyad, 80) || k.ad_soyad; k.telefon = metin(g.telefon, 30) || null; kaydet(); return {ok: true, kullanici: ozetK(k)}; },

  panom() {
    const k = rol('musteri');
    if (!k.musteri_id) return {ok: true, onay_bekliyor: true};
    const isler = V.isler.filter(i => i.musteri_id === k.musteri_id && i.durum !== 'iptal');
    const son = V.guncellemeler.filter(g => g.gorunurluk === 'musteri' && isler.some(i => i.id === g.is_id)).sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 8)
      .map(g => ({id: g.id, metin: g.metin, tarih: g.tarih, is_id: g.is_id, is_ad: isler.find(i => i.id === g.is_id).ad}));
    return {ok: true, onay_bekliyor: false, isler: isler.map(isOzet), bekleyenler: [].concat(...isler.map(bekleyenler)), son_guncellemeler: son};
  },
  isler() {
    const k = rol('personel,yonetici');
    const l = V.isler.filter(i => k.rol === 'yonetici' || i.sorumlu_id === k.id || V.is_personel.some(p => p[0] === i.id && p[1] === k.id));
    const sira = {aktif: 0, beklemede: 1, tamamlandi: 2, iptal: 3};
    return {ok: true, isler: l.sort((a, b) => sira[a.durum] - sira[b.durum] || b.guncelleme.localeCompare(a.guncelleme)).map(isOzet)};
  },
  is_detay(g) {
    const k = girisGerekli(), is = isErisim(k, g.id);
    if (k.rol === 'musteri') { V.bildirimler.filter(b => b.kullanici_id === k.id && b.is_id === is.id).forEach(b => b.okundu = 1); kaydet(); }
    return {ok: true, is: isDetay(is, k)};
  },
  is_kaydet(g) {
    const k = rol('personel,yonetici');
    const tarih = s => s || null;
    let is;
    if (g.id) {
      is = isErisim(k, g.id, true);
      const eskiDurum = is.durum, eskiTarih = is.tahmini_bitis;
      Object.assign(is, {aciklama: metin(g.aciklama), durum: g.durum, baslangic: tarih(g.baslangic), tahmini_bitis: tarih(g.tahmini_bitis), guncelleme: simdi()});
      if (k.rol === 'yonetici') {
        Object.assign(is, {ad: metin(g.ad, 120) || is.ad, hizmet: metin(g.hizmet, 80), konum: metin(g.konum, 120), sorumlu_id: g.sorumlu_id || null});
        if (Array.isArray(g.personel_idler)) { V.is_personel = V.is_personel.filter(p => p[0] !== is.id).concat(g.personel_idler.map(p => [is.id, +p])); }
      }
      if (eskiDurum !== is.durum) { const m = 'Proje ' + {aktif: 'devam ediyor', beklemede: 'beklemeye alındı', tamamlandi: 'tamamlandı', iptal: 'iptal edildi'}[is.durum] + '.'; guncelleme(is.id, m); musteriyeBildir(is.id, 'durum', is.ad + ': ' + m); }
      if (eskiTarih !== is.tahmini_bitis && is.tahmini_bitis) musteriyeBildir(is.id, 'tarih', is.ad + ': tahmini tamamlanma tarihi güncellendi.');
      log('Proje bilgilerini güncelledi', is.id);
    } else {
      if (k.rol !== 'yonetici') hata('Yeni projeyi yalnızca yönetici oluşturabilir.', 403);
      if (!g.musteri_id || !V.musteriler.some(m => m.id === +g.musteri_id)) hata('Müşteri seçin.');
      if (!metin(g.ad, 120)) hata('Proje adı boş olamaz.');
      is = {id: yeniId(), musteri_id: +g.musteri_id, sablon_id: g.sablon_id || null, ad: metin(g.ad, 120), hizmet: metin(g.hizmet, 80), konum: metin(g.konum, 120), aciklama: metin(g.aciklama),
        durum: 'aktif', sorumlu_id: g.sorumlu_id || null, baslangic: tarih(g.baslangic), tahmini_bitis: tarih(g.tahmini_bitis), olusturma: simdi(), guncelleme: simdi()};
      V.isler.push(is);
      const s = V.sablonlar.find(x => x.id === +g.sablon_id);
      if (s) {
        s.asamalar.forEach((a, i) => V.asamalar.push({id: yeniId(), is_id: is.id, sira: i + 1, ad: a.ad, aciklama: a.aciklama, durum: i === 0 ? 'devam' : 'bekliyor', musteri_islemi: null, ic_not: null, tahmini_tarih: null, tamamlanma: null, guncelleme: simdi(), guncelleyen_id: k.id}));
        s.evraklar.forEach((e, i) => V.evraklar.push({id: yeniId(), is_id: is.id, yon: 'talep', ad: e.ad, aciklama: e.aciklama, durum: 'eksik', musteri_notu: null, ic_not: null, sira: i + 1, olusturma: simdi(), guncelleme: simdi(), guncelleyen_id: k.id}));
      }
      (g.personel_idler || []).forEach(p => V.is_personel.push([is.id, +p]));
      guncelleme(is.id, 'Projeniz oluşturuldu. Süreci bu sayfadan takip edebilirsiniz.');
      musteriyeBildir(is.id, 'yeni', 'Yeni projeniz oluşturuldu: ' + is.ad);
      log('Proje oluşturdu: ' + is.ad, is.id);
    }
    kaydet(); return detay(is, k);
  },
  is_sil(g) {
    const k = rol('yonetici'), is = isErisim(k, g.id, true);
    const eids = V.evraklar.filter(e => e.is_id === is.id).map(e => e.id);
    V.dosyalar = V.dosyalar.filter(d => !eids.includes(d.evrak_id));
    ['asamalar', 'evraklar', 'guncellemeler', 'bildirimler'].forEach(t => V[t] = V[t].filter(x => x.is_id !== is.id));
    V.is_personel = V.is_personel.filter(p => p[0] !== is.id); V.isler = V.isler.filter(i => i.id !== is.id);
    log('Projeyi sildi: ' + is.ad); kaydet(); return {ok: true};
  },
  asama_kaydet(g) {
    const k = rol('personel,yonetici');
    if (!metin(g.ad, 120)) hata('Aşama adı boş olamaz.');
    if (!ET_A[g.durum]) hata('Aşama durumu geçerli değil.');
    const alan = {ad: metin(g.ad, 120), durum: g.durum, aciklama: metin(g.aciklama, 1000), musteri_islemi: metin(g.musteri_islemi, 500), ic_not: metin(g.ic_not), tahmini_tarih: g.tahmini_tarih || null, guncelleme: simdi(), guncelleyen_id: k.id};
    let is;
    if (g.id) {
      const a = V.asamalar.find(x => x.id === +g.id); if (!a) hata('Aşama bulunamadı.', 404);
      is = isErisim(k, a.is_id, true);
      const eski = a.durum;
      alan.tamamlanma = alan.durum === 'tamamlandi' ? (eski === 'tamamlandi' ? a.tamamlanma : gun(0)) : null;
      Object.assign(a, alan);
      if (eski !== alan.durum) {
        let m = {tamamlandi: '“' + alan.ad + '” aşaması tamamlandı.', devam: '“' + alan.ad + '” aşamasına başlandı.', musteri: '“' + alan.ad + '” aşamasında sizden işlem bekleniyor' + (alan.musteri_islemi ? ': ' + alan.musteri_islemi : '.'), bekliyor: '“' + alan.ad + '” aşaması beklemeye alındı.'}[alan.durum];
        if (alan.aciklama && alan.durum !== 'musteri') m += ' ' + alan.aciklama;
        guncelleme(is.id, m); musteriyeBildir(is.id, alan.durum === 'musteri' ? 'islem' : 'asama', is.ad + ': ' + m);
      }
      log('Aşamayı güncelledi: ' + alan.ad + (eski !== alan.durum ? ' (' + ET_A[eski] + ' → ' + ET_A[alan.durum] + ')' : ''), is.id);
    } else {
      is = isErisim(k, g.is_id, true);
      V.asamalar.push(Object.assign({id: yeniId(), is_id: is.id, sira: Math.max(0, ...V.asamalar.filter(a => a.is_id === is.id).map(a => a.sira)) + 1, tamamlanma: alan.durum === 'tamamlandi' ? gun(0) : null}, alan));
      log('Aşama ekledi: ' + alan.ad, is.id);
    }
    dokun(is.id); kaydet(); return detay(is, k);
  },
  asama_sil(g) { const k = rol('personel,yonetici'), a = V.asamalar.find(x => x.id === +g.id); if (!a) hata('Aşama bulunamadı.', 404); const is = isErisim(k, a.is_id, true); V.asamalar = V.asamalar.filter(x => x.id !== a.id); log('Aşamayı sildi: ' + a.ad, is.id); kaydet(); return detay(is, k); },
  asamalari_sirala(g) { const k = rol('personel,yonetici'), is = isErisim(k, g.is_id, true); g.idler.forEach((id, i) => { const a = V.asamalar.find(x => x.id === +id && x.is_id === is.id); if (a) a.sira = i + 1; }); log('Aşama sırasını değiştirdi', is.id); kaydet(); return {ok: true}; },
  evrak_kaydet(g) {
    const k = rol('personel,yonetici');
    if (!metin(g.ad, 120)) hata('Evrak adı boş olamaz.');
    let is, id = g.id;
    if (id) { const [e, i] = evrakErisim(k, id, true); is = i; Object.assign(e, {ad: metin(g.ad, 120), aciklama: metin(g.aciklama, 600), guncelleme: simdi()}); log('Evrak bilgisini güncelledi: ' + e.ad, is.id); }
    else {
      is = isErisim(k, g.is_id, true);
      const e = {id: yeniId(), is_id: is.id, yon: g.yon === 'paylasim' ? 'paylasim' : 'talep', ad: metin(g.ad, 120), aciklama: metin(g.aciklama, 600), durum: 'eksik', musteri_notu: null, ic_not: null,
        sira: Math.max(0, ...V.evraklar.filter(x => x.is_id === is.id).map(x => x.sira)) + 1, olusturma: simdi(), guncelleme: simdi(), guncelleyen_id: k.id};
      V.evraklar.push(e); id = e.id;
      if (e.yon === 'talep') { musteriyeBildir(is.id, 'evrak', is.ad + ': sizden yeni bir evrak istendi — ' + e.ad); log('Evrak talep etti: ' + e.ad, is.id); }
    }
    dokun(is.id); kaydet(); return Object.assign(detay(is, k), {evrak_id: id});
  },
  evrak_durum(g) {
    const k = rol('personel,yonetici'), [e, is] = evrakErisim(k, g.id, true);
    if (!ET_E[g.durum]) hata('Evrak durumu geçerli değil.');
    const not = metin(g.musteri_notu, 600);
    if (g.durum === 'duzeltme' && !not) hata('Düzeltme isterken müşteriye ne yapması gerektiğini yazın.');
    const eski = e.durum;
    Object.assign(e, {durum: g.durum, musteri_notu: not || null, ic_not: metin(g.ic_not), guncelleme: simdi(), guncelleyen_id: k.id});
    if (eski !== g.durum && ['onaylandi', 'duzeltme', 'inceleniyor', 'eksik'].includes(g.durum)) {
      const m = {onaylandi: e.ad + ' onaylandı.', duzeltme: e.ad + ' için düzeltme gerekli: ' + not, inceleniyor: e.ad + ' inceleniyor.', eksik: e.ad + ' yeniden istendi.'}[g.durum];
      guncelleme(is.id, m); musteriyeBildir(is.id, 'evrak', is.ad + ': ' + m);
    }
    log('Evrak durumunu değiştirdi: ' + e.ad + ' (' + ET_E[eski] + ' → ' + ET_E[g.durum] + ')', is.id);
    dokun(is.id); kaydet(); return detay(is, k);
  },
  evrak_sil(g) { const k = rol('personel,yonetici'), [e, is] = evrakErisim(k, g.id, true); V.evraklar = V.evraklar.filter(x => x.id !== e.id); V.dosyalar = V.dosyalar.filter(d => d.evrak_id !== e.id); log('Evrakı sil: ' + e.ad, is.id); kaydet(); return detay(is, k); },
  dosya_sil(g) {
    const k = girisGerekli(), d = V.dosyalar.find(x => x.id === +g.id); if (!d) hata('Dosya bulunamadı.', 404);
    const [e, is] = evrakErisim(k, d.evrak_id);
    if (k.rol === 'musteri' && (d.yukleyen_id !== k.id || !['yuklendi', 'eksik', 'duzeltme'].includes(e.durum))) hata('Bu dosyayı silemezsiniz; incelemeye alınmış olabilir.', 403);
    V.dosyalar = V.dosyalar.filter(x => x.id !== d.id);
    if (e.yon === 'talep' && e.durum === 'yuklendi' && !V.dosyalar.some(x => x.evrak_id === e.id)) e.durum = 'eksik';
    log('Dosya sildi: ' + d.ad, is.id); kaydet(); return detay(is, k);
  },
  guncelleme_ekle(g) {
    const k = rol('personel,yonetici'), is = isErisim(k, g.is_id, true), m = metin(g.metin, 3000);
    if (!m) hata('Mesaj boş olamaz.');
    guncelleme(is.id, m, g.gorunurluk === 'ic' ? 'ic' : 'musteri');
    if (g.gorunurluk !== 'ic') musteriyeBildir(is.id, 'guncelleme', is.ad + ': ' + m.slice(0, 140));
    log(g.gorunurluk === 'ic' ? 'İç not ekledi' : 'Müşteriye açıklama yazdı', is.id); dokun(is.id); kaydet(); return detay(is, k);
  },
  guncelleme_sil(g) { const k = rol('personel,yonetici'), x = V.guncellemeler.find(y => y.id === +g.id); if (!x) hata('Kayıt bulunamadı.', 404); const is = isErisim(k, x.is_id, true); V.guncellemeler = V.guncellemeler.filter(y => y.id !== x.id); kaydet(); return detay(is, k); },
  bildirimler() { const k = girisGerekli(); const l = V.bildirimler.filter(b => b.kullanici_id === k.id).sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 100); return {ok: true, bildirimler: kopya(l).map(b => Object.assign(b, {okundu: !!b.okundu})), okunmamis: l.filter(b => !b.okundu).length}; },
  bildirim_okundu(g) { const k = girisGerekli(); V.bildirimler.filter(b => b.kullanici_id === k.id && (g.hepsi || b.id === +g.id)).forEach(b => b.okundu = 1); kaydet(); return {ok: true}; },

  musteriler() {
    const k = rol('yonetici,personel');
    const l = V.musteriler.map(m => Object.assign({}, m, {is_sayisi: V.isler.filter(i => i.musteri_id === m.id).length, hesap_sayisi: V.kullanicilar.filter(u => u.rol === 'musteri' && u.musteri_id === m.id).length}, k.rol === 'yonetici' ? {} : {ic_not: undefined}))
      .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return {ok: true, musteriler: l, eslesme_bekleyen: k.rol === 'yonetici' ? V.kullanicilar.filter(u => u.rol === 'musteri' && !u.musteri_id && u.aktif).map(u => ({id: u.id, ad_soyad: u.ad_soyad, eposta: u.eposta, telefon: u.telefon, olusturma: u.olusturma})) : []};
  },
  musteri_detay(g) {
    const k = rol('yonetici'), m = V.musteriler.find(x => x.id === +g.id); if (!m) hata('Müşteri bulunamadı.', 404);
    return {ok: true, musteri: m, isler: V.isler.filter(i => i.musteri_id === m.id).map(isOzet),
      hesaplar: V.kullanicilar.filter(u => u.rol === 'musteri' && u.musteri_id === m.id).map(u => ({id: u.id, ad_soyad: u.ad_soyad, eposta: u.eposta, telefon: u.telefon, aktif: u.aktif, son_giris: u.son_giris}))};
  },
  musteri_kaydet(g) {
    rol('yonetici'); if (!metin(g.ad, 120)) hata('Müşteri adı boş olamaz.');
    const v = {ad: metin(g.ad, 120), telefon: metin(g.telefon, 30) || null, eposta: metin(g.eposta, 120) || null, adres: metin(g.adres, 300) || null, ic_not: metin(g.ic_not) || null};
    let m = g.id ? V.musteriler.find(x => x.id === +g.id) : null;
    if (m) Object.assign(m, v); else { m = Object.assign({id: yeniId(), olusturma: simdi()}, v); V.musteriler.push(m); }
    log((g.id ? 'Müşteri bilgilerini güncelledi: ' : 'Müşteri oluşturdu: ') + m.ad); kaydet(); return {ok: true, musteri: m};
  },
  musteri_sil(g) {
    rol('yonetici'); const m = V.musteriler.find(x => x.id === +g.id); if (!m) hata('Müşteri bulunamadı.', 404);
    if (V.isler.some(i => i.musteri_id === m.id)) hata('Bu müşterinin projeleri var. Önce projeleri silin.', 409);
    V.musteriler = V.musteriler.filter(x => x.id !== m.id); V.kullanicilar.forEach(u => { if (u.musteri_id === m.id) u.musteri_id = null; });
    log('Müşteriyi sildi: ' + m.ad); kaydet(); return {ok: true};
  },
  hesap_eslestir(g) {
    rol('yonetici'); const u = V.kullanicilar.find(x => x.id === +g.kullanici_id && x.rol === 'musteri'); if (!u) hata('Hesap bulunamadı.', 404);
    let mid = g.musteri_id == null ? null : +g.musteri_id;
    if (g.yeni_musteri) { const m = {id: yeniId(), ad: u.ad_soyad, telefon: u.telefon, eposta: u.eposta, adres: null, ic_not: null, olusturma: simdi()}; V.musteriler.push(m); mid = m.id; }
    u.musteri_id = mid;
    if (mid) { bildir(u.id, null, 'hesap', 'Hesabınız onaylandı. Projelerinizi artık buradan takip edebilirsiniz.'); log('Hesabı müşteriyle eşleştirdi: ' + u.ad_soyad); }
    kaydet(); return {ok: true, musteri_id: mid};
  },
  kullanicilar() { rol('yonetici'); return {ok: true, kullanicilar: V.kullanicilar.map(u => Object.assign({}, u, {musteri_ad: (V.musteriler.find(m => m.id === u.musteri_id) || {}).ad || null})).sort((a, b) => ({yonetici: 0, personel: 1, musteri: 2}[a.rol] - {yonetici: 0, personel: 1, musteri: 2}[b.rol]) || a.ad_soyad.localeCompare(b.ad_soyad, 'tr'))}; },
  personeller() { rol('yonetici,personel'); return {ok: true, personeller: V.kullanicilar.filter(u => ekip(u) && u.aktif).map(u => ({id: u.id, ad_soyad: u.ad_soyad, unvan: u.unvan, rol: u.rol}))}; },
  kullanici_kaydet(g) {
    const b = rol('yonetici'); if (!metin(g.ad_soyad, 80)) hata('Ad soyad boş olamaz.');
    if (!['musteri', 'personel', 'yonetici'].includes(g.rol)) hata('Rol geçerli değil.');
    const e = String(g.eposta || '').trim().toLocaleLowerCase('tr') || null;
    let u = g.id ? V.kullanicilar.find(x => x.id === +g.id) : null, baglanti = null;
    if (u) {
      if (u.id === b.id && (g.rol !== 'yonetici' || !g.aktif)) hata('Kendi yönetici yetkinizi kaldıramaz veya hesabınızı kapatamazsınız.');
      Object.assign(u, {ad_soyad: metin(g.ad_soyad, 80), eposta: e || u.eposta, telefon: metin(g.telefon, 30) || null, unvan: metin(g.unvan, 60) || null, rol: g.rol, musteri_id: g.rol === 'musteri' ? (g.musteri_id || null) : null, aktif: g.aktif ? 1 : 0});
      log('Kullanıcıyı güncelledi: ' + u.ad_soyad);
    } else {
      if (!e) hata('Yeni kullanıcı için e-posta gerekli.');
      if (V.kullanicilar.some(x => x.giris === e || x.eposta === e)) hata('Bu e-posta ile zaten bir hesap var.', 409);
      u = {id: yeniId(), giris: e, eposta: e, ad_soyad: metin(g.ad_soyad, 80), telefon: metin(g.telefon, 30) || null, unvan: metin(g.unvan, 60) || null, rol: g.rol, musteri_id: g.rol === 'musteri' ? (g.musteri_id || null) : null, aktif: g.aktif ? 1 : 0, olusturma: simdi()};
      V.kullanicilar.push(u); baglanti = location.origin + location.pathname + '#/sifre-yenile/tanitim-baglantisi-ornek';
      log('Kullanıcı oluşturdu: ' + u.ad_soyad + ' (' + u.rol + ')');
    }
    kaydet(); return {ok: true, id: u.id, baglanti};
  },
  kullanici_baglanti() { rol('yonetici'); return {ok: true, baglanti: location.origin + location.pathname + '#/sifre-yenile/tanitim-baglantisi-ornek'}; },
  sablonlar() { rol('yonetici,personel'); return {ok: true, sablonlar: kopya(V.sablonlar)}; },
  sablon_kaydet(g) {
    rol('yonetici'); if (!metin(g.ad, 80)) hata('Şablon adı boş olamaz.'); if (!(g.asamalar || []).length) hata('Şablonda en az bir aşama olmalı.');
    let s = g.id ? V.sablonlar.find(x => x.id === +g.id) : null;
    const v = {ad: metin(g.ad, 80), aciklama: metin(g.aciklama, 300), asamalar: g.asamalar.map(a => ({ad: metin(a.ad, 120), aciklama: metin(a.aciklama, 600)})), evraklar: (g.evraklar || []).map(a => ({ad: metin(a.ad, 120), aciklama: metin(a.aciklama, 600)}))};
    if (s) Object.assign(s, v); else { s = Object.assign({id: yeniId(), olusturma: simdi()}, v); V.sablonlar.push(s); }
    log('Süreç şablonunu kaydetti: ' + s.ad); kaydet(); return {ok: true, id: s.id};
  },
  sablon_sil(g) { rol('yonetici'); V.sablonlar = V.sablonlar.filter(s => s.id !== +g.id); kaydet(); return {ok: true}; },
  kayitlar(g) {
    rol('yonetici'); const q = String(g.q || '').toLocaleLowerCase('tr');
    const l = V.kayitlar.slice().reverse().map(x => Object.assign({}, x, {is_ad: (V.isler.find(i => i.id === x.is_id) || {}).ad || null}))
      .filter(x => !q || [x.kullanici_ad, x.islem, x.is_ad].join(' ').toLocaleLowerCase('tr').includes(q));
    const s = (+g.sayfa || 1) - 1;
    return {ok: true, kayitlar: l.slice(s * 50, s * 50 + 50), devam: l.length > (s + 1) * 50};
  },
  ornek_veri_olustur() { hata('Tanıtım sürümünde örnek veriler zaten yüklü.'); },
  ornek_veri_sil() { hata('Tanıtım sürümünde bu işlem kapalı. “Tanıtımı baştan başlat” ile her şeyi sıfırlayabilirsiniz.'); },
};
const PORTFOY = ['projeler', 'proje_kaydet', 'proje_sil', 'projeleri_sirala', 'gorsel_yukle', 'gorsel_sil', 'gorselleri_sirala'];

B.demoApi = async (islem, girdi) => {
  yukle();
  await new Promise(r => setTimeout(r, 120));          // gerçek sunucu hissi
  if (PORTFOY.includes(islem)) { rol('yonetici'); return B.portfoyDemoApi(islem, girdi); }
  const f = ISLEMLER[islem];
  if (!f) hata('Bu işlem tanıtım sürümünde kapalı.');
  return kopya(f(girdi || {}));
};

/* Dosya yükleme: dosya yalnızca bu tarayıcı oturumunda tutulur */
B.demoGonder = async (islem, form, ilerleme) => {
  yukle();
  if (islem === 'gorsel_yukle') return B.portfoyDemoGonder(form, ilerleme);
  if (islem !== 'dosya_yukle') hata('Bu işlem tanıtım sürümünde kapalı.');
  for (let i = 1; i <= 8; i++) { await new Promise(r => setTimeout(r, 60)); ilerleme && ilerleme(i / 8); }
  const k = girisGerekli(), dosya = form.get('dosya'), [e, is] = evrakErisim(k, form.get('evrak_id'));
  if (k.rol === 'musteri') {
    if (e.yon !== 'talep') hata('Bu bölüme dosya yükleyemezsiniz.', 403);
    if (e.durum === 'onaylandi') hata('Bu evrak onaylandı; yeni dosya yüklenemez.');
  } else isErisim(k, is.id, true);
  const uz = (dosya.name.split('.').pop() || '').toLowerCase();
  if (!['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx', 'xls', 'xlsx', 'dwg', 'dxf', 'zip'].includes(uz)) hata('Bu dosya türü desteklenmiyor. PDF, fotoğraf, Word, Excel, DWG/DXF veya ZIP yükleyebilirsiniz.');
  const d = {id: yeniId(), evrak_id: e.id, ad: dosya.name, boyut: dosya.size, tur: dosya.type || 'application/octet-stream', yukleyen_id: k.id, tarih: simdi()};
  V.dosyalar.push(d); blobAdresleri[d.id] = URL.createObjectURL(dosya);
  if (e.yon === 'talep' && ['eksik', 'duzeltme'].includes(e.durum)) e.durum = 'yuklendi';
  if (k.rol === 'musteri') { ekibeBildir(is.id, 'evrak', k.ad_soyad + ' “' + e.ad + '” evrakını yükledi (' + is.ad + ').'); guncelleme(is.id, e.ad + ' yüklendi, incelenecek.'); }
  else if (e.yon === 'paylasim') { musteriyeBildir(is.id, 'dosya', is.ad + ': size yeni bir dosya paylaşıldı — ' + e.ad); guncelleme(is.id, 'Yeni dosya paylaşıldı: ' + e.ad); }
  log('Dosya yükledi: ' + d.ad + ' → ' + e.ad, is.id); dokun(is.id); kaydet();
  return detay(is, k);
};

/* İndirme: örnek dosyalar için tarayıcıda küçük bir tanıtım PDF'i üretilir */
function tanitimPdf(baslik, not) {
  const t = s => s.replace(/[çÇğĞıİöÖşŞüÜ]/g, c => ({ç:'c',Ç:'C',ğ:'g',Ğ:'G',ı:'i',İ:'I',ö:'o',Ö:'O',ş:'s',Ş:'S',ü:'u',Ü:'U'}[c])).replace(/[()\\]/g, '');
  const akis = `BT /F1 20 Tf 60 760 Td (Balat Mimarlik - TANITIM BELGESI) Tj 0 -36 Td /F1 14 Tf (${t(baslik)}) Tj 0 -24 Td (${t(not)}) Tj ET`;
  const n = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${akis.length} >>\nstream\n${akis}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let pdf = '%PDF-1.4\n'; const yer = [];
  n.forEach((o, i) => { yer.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = pdf.length;
  pdf += `xref\n0 ${n.length + 1}\n0000000000 65535 f \n` + yer.map(y => String(y).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${n.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return new Blob([pdf], {type: 'application/pdf'});
}
B.demoDosyaAdres = id => {
  yukle();
  if (blobAdresleri[id]) return blobAdresleri[id];
  const d = V.dosyalar.find(x => x.id === +id);
  const not = d && d.ornek ? 'Bu dosya yalnizca tanitim icin olusturulmustur.' : 'Tanitimda yuklenen dosyalar yalnizca yuklendigi oturumda saklanir.';
  blobAdresleri[id] = URL.createObjectURL(tanitimPdf(d ? d.ad : 'Belge', not));
  return blobAdresleri[id];
};
B.demoSifirla = () => {
  try { localStorage.removeItem(ANAHTAR); } catch (e) {}
  V = null; yukle(); kaydet();
  B.portfoyDemoSifirla && B.portfoyDemoSifirla();
};
})();
