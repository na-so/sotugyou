const { Player, Ease } = TextAliveApp;

const player = new Player({
  app: {
    appAuthor: "Jun Kato",
    appName: "Basic example"
  },
  mediaElement: document.querySelector("#media")
});

player.addListener({
  onAppReady,
  onTimerReady,
  onTimeUpdate,
  onThrottledTimeUpdate
});

const playBtn = document.querySelector("#play");
const jumpBtn = document.querySelector("#jump");
const pauseBtn = document.querySelector("#pause");
const rewindBtn = document.querySelector("#rewind");
const positionEl = document.querySelector("#position strong");

const artistSpan = document.querySelector("#artist span");
const songSpan = document.querySelector("#song span");
const phraseEl = document.querySelector("#container p");
const beatbarEl = document.querySelector("#beatbar");

function onAppReady(app) {
  if (!app.managed) {
    document.querySelector("#control").style.display = "block";
    playBtn.addEventListener("click", () => player.video && player.requestPlay());
    jumpBtn.addEventListener("click", () => player.video && player.requestMediaSeek(player.video.firstPhrase.startTime));
    pauseBtn.addEventListener("click", () => player.video && player.requestPause());
    rewindBtn.addEventListener("click", () => player.video && player.requestMediaSeek(0));
  }
  if (!app.songUrl) {
    player.createFromSongUrl("https://www.nicovideo.jp/watch/sm12825985");
  }
}

function onTimerReady() {
  artistSpan.textContent = player.data.song.artist.name;
  songSpan.textContent = player.data.song.name;

  document
    .querySelectorAll("button")
    .forEach((btn) => (btn.disabled = false));

  let p = player.video.firstPhrase;
  jumpBtn.disabled = !p;

  // set `animate` method
  while (p && p.next) {
    p.animate = animatePhrase;
    p = p.next;
  }
}

function onTimeUpdate(position) {

  // show beatbar
  const beat = player.findBeat(position);
  if (!beat) {
    return;
  }
  beatbarEl.style.width = `${Math.ceil(Ease.circIn(beat.progress(position)) * 100)}%`;
}

function onThrottledTimeUpdate(position) {
  positionEl.textContent = String(Math.floor(position));
}

function animatePhrase(now, unit) {
  // フレーズの発声区間に入っているかチェック
  if (unit.contains(now)) {
    phraseEl.textContent = unit.text;

    // 1. 発声区間の進捗率を取得 (0.0 -> 1.0)
    const progress = unit.progress(now);

    // 2. 発声の「入り」と「終わり」にメリハリをつける

    // 発声開始直後 (最初の10%) でバウンドしながら拡大する
    let scale = 1.0;
    if (progress < 0.1) {
      // progressを 0.0 から 1.0 に変換
      const p = progress / 0.1;
      // Ease.elasticOutを使うと、バウンドするような動きになります
      scale = 0.8 + Ease.elasticOut(p) * 0.2; // 0.8倍から1.0倍に拡大
    }

    // 発声終了直前 (最後の20%) で少しだけ縮小する
    if (progress > 0.8) {
      // progressを 1.0 から 0.0 に変換
      const p = (1.0 - progress) / 0.2;
      // Ease.quintOutを使うと、滑らかに元のサイズに戻ります
      scale = 1.0 + Ease.quintOut(p) * 0.05; // 1.0倍から1.05倍に少し縮小
    }

    // 3. 常に少しずつ揺らす (発声中に躍動感を与える)
    // Math.sin(x)で-1から1の周期的な動きを作ります
    // now / 100 で時間経過に応じて変化させます
    const rotation = Math.sin(now / 100) * 1; // 左右に±1度揺らす

    // 4. CSSスタイルを適用
    phraseEl.style.opacity = 1;
    phraseEl.style.transform = `
      scale(${scale})
      rotate(${rotation}deg)
    `;

    // 5. 発声中に色を変える（発声が長くなるほど濃くなるように）
    // progressが0.5に近づくほど色が濃くなる
    const colorProgress = 0.5 - Math.abs(progress - 0.5);
    const red = 200 + Math.floor(colorProgress * 55); // 200から255に変化
    const green = 100 - Math.floor(colorProgress * 100); // 100から0に変化
    phraseEl.style.color = `rgb(${red}, ${green}, 50)`; // 発声中っぽい色に変化

  } else {
    // 非発声時: 非表示にする
    phraseEl.style.opacity = 0;
    phraseEl.style.transform = 'scale(1.0) rotate(0deg)';
    phraseEl.style.color = 'inherit'; // 元の色に戻す
  }
};