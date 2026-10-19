# OYNAGAME Güvenlik Belirtimi (Security Specification)

## 1. Veri Değişmezleri (Data Invariants)
- **Kimlik Değişmezi:** Her sipariş (`orders`), satış talebi (`sales`) ve bakiye bildirimi (`topups`), oluşturan kullanıcının doğrulanmış kimliğiyle (`request.auth.uid == incoming().userId`) eşleşmelidir.
- **Rol & Bakiye Bütünlüğü:** Kullanıcılar kendi profillerini (`users/{userId}`) oluştururken veya güncellerken `role` alanını `admin` yapamaz veya bakiyelerini (`balance`) istemci tarafından artıramaz.
- **Yönetici Doğrulaması:** Yöneticilik yetkisi yalnızca `isSuperAdmin()` (kurulum sahibi `t0xiboergen@gmail.com`) veya Firestore `admins/{userId}` koleksiyonundaki güvenilir sunucu kaydı ile teyit edilir.
- **Son Durum Kilidi (Terminal State Locking):** 'delivered' ya da 'cancelled' durumundaki bir sipariş kullanıcı tarafından değiştirilemez.
- **Piyasa Kurları:** `servers` koleksiyonu halka açık okunabilir ancak yalnızca yönetici tarafından yazılabilir.

## 2. On İki Şüpheli Saldırı Yükü ("The Dirty Dozen" Payloads)
1. **Rol Yükseltme Saldırısı:** Normal kullanıcının `users/{uid}` kaydına `role: "admin"` göndermesi.
2. **Sahte Bakiye Yükleme:** Kullanıcının kendi profilindeki `balance` değerini 999.999 ₺ yapması.
3. **Başkasının Adına Sipariş:** `auth.uid = "userA"` iken `orders` içine `userId = "userB"` ile sipariş oluşturulması.
4. **Başkasına Ait Siparişleri Okuma:** `userA`'nın `orders` listesinden `userB`'nin siparişini sorgulaması.
5. **Yetkisiz Sipariş Onayı:** Normal kullanıcının sipariş durumunu `status: "delivered"` olarak güncellemesi.
6. **Sahte Satış Onayı:** Kullanıcının kendi satış talebini `status: "completed"` yaparak ödeme tamamlandı göstermesi.
7. **Sahte Bakiye Onayı:** Kullanıcının `topups` talebini `status: "approved"` yapması.
8. **Kur Manipülasyonu:** Giriş yapmış herhangi bir kullanıcının `servers/europe` alış kurunu 0.01 ₺ yapmaya çalışması.
9. **Karakter Adı Zehirlemesi (ID/String Overflow):** 200 KB'lık karakter adı ile DoS/Denial-of-Wallet atağı.
10. **Yetkisiz Bakiye Bildirimi Okuma:** Başka bir müşterinin IBAN veya dekont referansını görüntüleme denemesi.
11. **Doğrulanmamış E-posta ile Yönetici Taklidi:** `email_verified: false` ile sahte admin e-postası gönderme.
12. **Silme Saldırısı:** Müşterinin tamamlanmış sipariş kayıtlarını veya sunucu kur verisini veritabanından silmeye çalışması.

## 3. Test Runner
Tüm bu senaryolar `firestore.rules` kural seti ile engellenmektedir (PERMISSION_DENIED).
