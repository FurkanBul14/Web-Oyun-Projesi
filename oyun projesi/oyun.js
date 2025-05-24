// 🎵 İlk tıklamada arka plan müziğini başlatır
document.addEventListener("click", () => {
  const audio = document.getElementById("backgroundMusic"); 
  if (audio.paused) { // Müzik çalmıyorsa başlat
    audio.volume = 0.6; // Varsayılan ses seviyesi %60
    audio.play().catch((e) => {
      console.log("Ses engellendi", e); // Tarayıcı ses oynatmayı engellerse hata mesajı
    });
  }
}, { once: true }); // Olay sadece bir kez tetiklenir

// 🏆 En yüksek skoru yükler ve ana menüde gösterir
window.addEventListener("load", () => {
  const bestScore = localStorage.getItem('bestScore') || 0; 
  document.getElementById("bestScoreDisplay").textContent = bestScore; // Skoru ana menüde gösterir
  document.getElementById("backgroundMusic").volume = 0.6; // Arka plan müziği ses seviyesini ayarlar
});

// ⚙️ Ayar penceresini açar ve kapatır
function openSettings() {
  document.getElementById("settingsModal").style.display = 'block'; // Ayar penceresini görünür yapar
}
function closeSettings() {
  document.getElementById("settingsModal").style.display = 'none'; // Ayar penceresini gizler
}

// 🔊 Müzik ve efekt sesi seviyesini kontrol eder
document.getElementById("volumeSlider").addEventListener('input', function () {
  document.getElementById("backgroundMusic").volume = this.value; // Müzik ses seviyesini kaydırma çubuğuna göre ayarlar
});
document.getElementById("effectSlider").addEventListener('input', function () {
  document.getElementById("effectSound").volume = this.value; // Efekt ses seviyesini kaydırma çubuğuna göre ayarlar
});

// 🎮 Oyunu başlatır: Ana menüyü gizler, oyun alanını gösterir
function startGame() {
  document.getElementById("mainMenu").style.display = "none"; // Ana menüyü gizler
  document.getElementById("gameCanvas").style.display = "block"; // Oyun canvas'ını gösterir
  document.getElementById("hud").style.display = "block"; // HUD (süre ve skor) ekranını gösterir
  document.getElementById("backgroundMusic").volume = 0.2; // Oyun sırasında müzik sesini düşürür

  // ☰ Ayar butonunu oyun sırasında görünür yapar
  document.getElementById("settingsBtn").style.display = "block";

  resetGame(); // Oyunu sıfırlama fonksiyonunu çağırır
  draw(); // Oyun çizim döngüsünü başlatır
}

// ❌ Oyunu kapatır: Tarayıcı penceresini kapatmaya çalışır
function exitGame() {
  window.close(); // Tarayıcıyı kapatır (bazı tarayıcılarda çalışmayabilir)
}

// 🆘 Yardım penceresini otomatik gösterir ve kapatma işlevi
document.addEventListener("DOMContentLoaded", () => {
  const helpModal = document.getElementById("helpModal"); // Yardım penceresi elementi
  const closeHelp = document.querySelector(".close-help"); // Kapatma butonu
  setTimeout(() => { helpModal.style.display = "flex"; }, 1500); // 1.5 saniye sonra yardım penceresini gösterir
  closeHelp.addEventListener("click", () => {
    helpModal.style.display = "none"; // Kapatma butonuna tıklayınca yardım penceresini gizler
  });
});

// 🧠 Oyun için temel değişkenler
let player, score, timeLeft, items, dangerItems, isGameOver, allowControl;
const canvas = document.getElementById("gameCanvas"); // Oyun canvas elementi
const ctx = canvas.getContext("2d"); // 2D çizim bağlamı
canvas.width = window.innerWidth; // Canvas genişliğini tarayıcı genişliğine ayarlar
canvas.height = window.innerHeight; // Canvas yüksekliğini tarayıcı yüksekliğine ayarlar

// 🎵 Ses ve ekran elementleri
const effectSound = document.getElementById("effectSound"); // Efekt sesi elementi
const countdownEl = document.getElementById("countdown"); // Geri sayım ekranı
const gameOverEl = document.getElementById("gameOverScreen"); // Oyun sonu ekranı
const timeDisplay = document.getElementById("time"); // Süre göstergesi
const scoreDisplay = document.getElementById("score"); // Skor göstergesi

// 🎨 Görsel varlıklar: Oyun öğeleri için resimler
const snowballImage = new Image();
snowballImage.src = "kar_topu.png"; // Oyuncu kar topu resmi
const damageImage = new Image();
damageImage.src = "item_zarar.png"; // Tehlikeli öğe resmi
const timeBonusImage = new Image();
timeBonusImage.src = "item_sure.png"; // Süre bonusu resmi

// Normal öğe resimleri
const itemImages = {
  100: new Image(),
  150: new Image(),
  200: new Image(),
  250: new Image()
};
itemImages[100].src = "item_100.png"; // 100 puanlık öğe
itemImages[150].src = "item_150.png"; // 150 puanlık öğe
itemImages[200].src = "item_200.png"; // 200 puanlık öğe
itemImages[250].src = "item_250.png"; // 250 puanlık öğe

// 🧱 Oyun alanı sınırları
const WALL_WIDTH = 1150; // Oyun alanının genişliği
const LEFT_BOUND = canvas.width / 2 - WALL_WIDTH / 2; // Sol sınır
const RIGHT_BOUND = canvas.width / 2 + WALL_WIDTH / 2 - 63; // Sağ sınır (oyuncu boyutu hesaba katılır)

// 🔁 Oyunu sıfırlama: Yeni oyun başlatır
function resetGame() {
  player = {
    x: canvas.width / 2 - 40, // Oyuncunun başlangıç x konumu
    y: canvas.height - 140, // Oyuncunun başlangıç y konumu
    size: 50, // Oyuncunun başlangıç boyutu
    speed: 10 // Oyuncunun hareket hızı
  };
  score = 0; // Skoru sıfırlar
  timeLeft = 60; // Süreyi 60 saniyeye ayarlar
  isGameOver = false; // Oyun sonu durumunu sıfırlar
  allowControl = false; // Kontrolleri başlangıçta devre dışı bırakır

  items = []; // Normal öğe listesini sıfırlar
  for (let i = 0; i < 4; i++) items.push(spawnItem()); // 4 tane öğe üretir
  dangerItems = [spawnDangerItem()]; // 1 tane tehlikeli öğe üretir
  dangerSpawnInterval = 6000; // Tehlikeli öğe üretme aralığı (ms)
  itemSpawnInterval = 3000; // Normal öğe üretme aralığı (ms)
  scoreIncreasePerSecond = 15; // Saniyede artan skor miktarı
  timeBonusItem = null; // Süre bonusu öğesini sıfırlar

  timeDisplay.textContent = timeLeft; // Süre ekranını günceller
  scoreDisplay.textContent = score; // Skor ekranını günceller
  gameOverEl.style.display = "none"; // Oyun sonu ekranını gizler
  countdown(3); // 3 saniyelik geri sayımı başlatır
}

let timeBonusItem = null; // Süre bonusu öğesi
let dangerSpawnInterval = 6000; // Tehlikeli öğe üretme aralığı
let itemSpawnInterval = 3000; // Normal öğe üretme aralığı
let scoreIncreasePerSecond = 15; // Saniyede artan skor

// 🔧 Yeni öğe üretme fonksiyonları
function spawnItem() {
  const types = [100, 150, 200, 250]; // Olası öğe türleri
  const type = types[Math.floor(Math.random() * types.length)]; 
  return {
    x: getPlayableX(), 
    y: -Math.random() * canvas.height, // Ekranın üstünden rastgele başlangıç
    size: 100, // Öğe boyutu
    type: type // Öğe türü
  };
}

function spawnDangerItem() {
  return {
    x: getPlayableX(), // Oyun alanı içinde rastgele x konumu
    y: -Math.random() * canvas.height, // Ekranın üstünden rastgele başlangıç
    size: 100, // Tehlikeli öğe boyutu
    type: "danger" // Öğe türü: tehlikeli
  };
}

function getPlayableX() {
  return LEFT_BOUND + Math.random() * (RIGHT_BOUND - LEFT_BOUND); // Oyun alanı içinde rastgele x konumu üretir
}

// ⏳ Geri sayım: Oyunu başlatmadan önce 3-2-1 sayar
function countdown(n) {
  if (n === 0) {
    countdownEl.style.display = "none"; // Geri sayım ekranını gizler
    allowControl = true; // Oyuncu kontrollerini etkinleştirir
    return;
  }
  countdownEl.textContent = n; // Geri sayım değerini gösterir
  countdownEl.style.display = "block"; // Geri sayım ekranını görünür yapar
  setTimeout(() => countdown(n - 1), 1000); // 1 saniye sonra bir sonraki sayıya geçer
}

// 🎮 Oyuncu hareketi için tuş kontrolleri
let keys = {}; // Basılı tuşları takip eden nesne
window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") { // R tuşu ile oyunu sıfırlama
    resetGame();
    return;
  }
  keys[e.key] = true; // Basılan tuşu kaydeder
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = false; // Bırakılan tuşu siler
});

// ⏱ Zamanlayıcılar: Öğeler ve süre için düzenli işlemler
setInterval(() => {
  if (!isGameOver && allowControl) items.push(spawnItem()); // Her 3 saniyede bir yeni öğe üretir
}, itemSpawnInterval);

setInterval(() => {
  if (!isGameOver && allowControl) {
    const elapsed = 60 - timeLeft; // Geçen süreyi hesaplar
    const count = Math.floor(elapsed / 10) + 1; // Her 10 saniyede bir tehlikeli öğe sayısı artar
    for (let i = 0; i < count; i++) {
      dangerItems.push(spawnDangerItem()); // Tehlikeli öğe üretir
    }
  }
}, dangerSpawnInterval);

setInterval(() => {
  if (!isGameOver && allowControl && !timeBonusItem) {
    timeBonusItem = {
      x: getPlayableX(), // Rastgele x konumu
      y: -100, // Ekranın üstünden başlar
      size: 80, // Süre bonusu boyutu
      type: "timeBonus" // Öğe türü: süre bonusu
    };
  }
}, 10000); // Her 10 saniyede bir süre bonusu üretir

setInterval(() => {
  if (!isGameOver && allowControl) {
    applyScore(scoreIncreasePerSecond); // Saniyede skoru artırır
  }
}, 1000);

setInterval(() => {
  if (!isGameOver && allowControl && timeLeft > 0) {
    timeLeft--; // Süreyi 1 saniye azaltır
    timeDisplay.textContent = timeLeft; // Süre ekranını günceller
    if (timeLeft <= 0) { // Süre biterse oyun sona erer
      isGameOver = true;
      showGameOver();
    }
  }
}, 1000);

// 🧠 Çarpışma kontrolü: İki nesnenin çarpışıp çarpışmadığını hesaplar
function collides(a, b) {
  if (!a || !b) return false; // Nesne yoksa çarpışma yoktur
  const dx = (a.x + a.size / 2) - (b.x + b.size / 2); // X eksenindeki mesafe
  const dy = (a.y + a.size / 2) - (b.y + b.size / 2); // Y eksenindeki mesafe
  return Math.sqrt(dx * dx + dy * dy) < (a.size / 2 + b.size / 2); // Çarpışma kontrolü
}

// 🎯 Skor güncelleme ve oyuncu boyutu ayarlama
function applyScore(val) {
  if (!allowControl) return; // Kontroller kapalıysa skoru değiştirmez
  score += val; // Skoru günceller

  if (score <= 0) { // Skor sıfırın altına düşerse oyun biter
    score = 0;
    isGameOver = true;
    showGameOver();
    return;
  }

  // Skora göre oyuncu boyutunu artırır
  if (score >= 3000) {
    player.size = 150; // Dev kar topu
  } else if (score >= 2000) {
    player.size = 125; // Büyük kar topu
  } else if (score >= 1000) {
    player.size = 100; // Orta kar topu
  } else if (score >= 500) {
    player.size = 75; // Küçük kar topu
  } else {
    player.size = 50; // Varsayılan boyut
  }

  scoreDisplay.textContent = score; // Skor ekranını günceller
}

// 🖌️ Oyun çizim döngüsü: Tüm görselleri çizer
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Canvas'ı temizler

  // 🎮 Oyuncu hareket kontrolü
  if (!isGameOver && allowControl) {
    if (keys["ArrowLeft"]) player.x -= player.speed; // Sola hareket
    if (keys["ArrowRight"]) player.x += player.speed; // Sağa hareket

    // Oyuncu sınırlar içinde kalır
    if (player.x < LEFT_BOUND) {
      player.x = LEFT_BOUND; // Sol sınıra çarparsa durdur
      applyScore(-10); // Ceza puanı uygula
    }
    if (player.x + player.size > RIGHT_BOUND) {
      player.x = RIGHT_BOUND - player.size; // Sağ sınıra çarparsa durdur
      applyScore(-10); // Ceza puanı uygula
    }
  }

  // ❄️ Oyuncu kar topunu çizer
  if (snowballImage.complete) {
    ctx.drawImage(snowballImage, player.x, player.y, player.size, player.size); // Oyuncuyu çizer
  }

  // ✅ Normal öğeleri çizer ve kontrol eder
  items.forEach((item, i) => {
    if (itemImages[item.type].complete) {
      ctx.drawImage(itemImages[item.type], item.x - item.size / 2, item.y - item.size / 2, item.size, item.size); // Öğe resmini çizer
    }
    if (!isGameOver && allowControl) {
      item.y += 2; // Öğe aşağı hareket eder
      if (collides(player, item)) { // Oyuncu öğeye çarparsa
        if (canCollect(item.type)) { // Öğe toplanabilir mi?
          applyScore(getItemScore(item.type)); // Skoru artır
          applyScore(-1 * getPenalty(item.type)); // Ceza puanı uygula
          effectSound.play(); // Efekt sesini çal
        } else {
          applyScore(-10); // Toplanamayan öğe için ceza
        }
        items[i] = spawnItem(); // Yeni öğe üret
      }
      if (item.y > canvas.height) items[i] = spawnItem(); // Ekran dışına çıkan öğeyi yeniler
    }
  });

  // 🚫 Tehlikeli öğeleri çizer ve kontrol eder
  dangerItems.forEach((dangerItem, i) => {
    if (damageImage.complete) {
      ctx.drawImage(damageImage, dangerItem.x - dangerItem.size / 2, dangerItem.y - dangerItem.size / 2, dangerItem.size, dangerItem.size); // Tehlikeli öğeyi çizer
    }
    if (!isGameOver && allowControl) {
      dangerItem.y += 2; // Öğe aşağı hareket eder
      if (collides(player, dangerItem)) { // Oyuncu tehlikeli öğeye çarparsa
        applyScore(-20); // Skoru düşür
        effectSound.play(); // Efekt sesini çal
        dangerItems.splice(i, 1); // Öğe kaldırılır
      }
      if (dangerItem.y > canvas.height) { // Ekran dışına çıkarsa
        dangerItems.splice(i, 1); // Öğe kaldırılır
      }
    }
  });

  // ⏱ Süre bonusu öğesini çizer ve kontrol eder
  if (timeBonusItem && timeBonusImage.complete) {
    ctx.drawImage(timeBonusImage, timeBonusItem.x - timeBonusItem.size / 2, timeBonusItem.y - timeBonusItem.size / 2, timeBonusItem.size, timeBonusItem.size); // Süre bonusunu çizer
    if (!isGameOver && allowControl) {
      timeBonusItem.y += 2; // Öğe aşağı hareket eder
      if (collides(player, timeBonusItem)) { // Oyuncu süre bonusuna çarparsa
        timeLeft += 10; // Süreyi 10 saniye artır
        timeDisplay.textContent = timeLeft; // Süre ekranını günceller
        effectSound.play(); // Efekt sesini çal
        timeBonusItem = null; // Süre bonusunu kaldır
      }
      if (timeBonusItem && timeBonusItem.y > canvas.height) { // Ekran dışına çıkarsa
        timeBonusItem = null; // Süre bonusunu kaldır
      }
    }
  }

  requestAnimationFrame(draw); // Bir sonraki kareyi çizer
}

// 🛑 Oyun sonu ekranını gösterir
function showGameOver() {
  gameOverEl.style.display = "block"; // Oyun sonu ekranını gösterir
  allowControl = false; // Kontrolleri devre dışı bırakır
  const bestScore = localStorage.getItem('bestScore') || 0; // En yüksek skoru alır
  if (score > bestScore) { // Mevcut skor daha yüksekse
    localStorage.setItem('bestScore', score); // Yeni skoru kaydeder
  }
}

// 🧠 Öğe toplama kuralları
function canCollect(type) {
  if (typeof type !== "number") return false; // Sayısal olmayan türler toplanamaz
  return score >= getRequiredScore(type); // Gerekli skoru kontrol eder
}

function getRequiredScore(type) {
  if (type === 150) return 500; // Ağaç için gerekli skor
  if (type === 200) return 800; // Kütük için gerekli skor
  if (type === 250) return 1200; // Kaya için gerekli skor
  return 0; // Kar topu için gerekli skor
}

function getPenalty(type) {
  if (type === 150) return 50; // Ağaç cezası
  if (type === 200) return 100; // Kütük cezası
  if (type === 250) return 150; // Kaya cezası
  return 0; // Kar topu cezası
}

function getItemScore(type) {
  if (type === 100) return 50; // Kar topu skoru
  if (type === 150) return 75; // Ağaç skoru
  if (type === 200) return 100; // Kütük skoru
  if (type === 250) return 150; // Kaya skoru
  return 0; // Varsayılan
}

// 🏠 Ana menüye dönüş
function goToMainMenu() {
  document.getElementById("settingsModal").style.display = "none"; // Ayar penceresini gizler
  document.getElementById("settingsBtn").style.display = "none"; // Ayar butonunu gizler
  document.getElementById("mainMenu").style.display = "flex"; // Ana menüyü gösterir
  document.getElementById("gameCanvas").style.display = "none"; // Canvas'ı gizler
  document.getElementById("hud").style.display = "none"; // HUD'u gizler
}

// ☰ Oyun içi ayar menüsünü açar
function openSettings() {
  document.getElementById("inGameMenu").style.display = 'block'; // Oyun içi menüyü gösterir
}

// ❌ Oyun içi ayar menüsünü kapatır
function closeInGameMenu() {
  document.getElementById("inGameMenu").style.display = 'none'; // Oyun içi menüyü gizler
}