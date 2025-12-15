/**
 * TextAlive App API script tag example
 * https://github.com/TextAliveJp/textalive-app-script-tag
 *
 * 発声中の歌詞をフレーズ単位で表示します。
 * また、このアプリが TextAlive ホストと接続されていなければ再生コントロールを表示します。
 *
 * `script` タグで TextAlive App API を読み込んでいること以外は https://github.com/TextAliveJp/textalive-app-phrase と同内容です。
 */

const { Player, Ease } = TextAliveApp;

const player = new Player({
  app: {
    token:"OGUYvAydu4GEHawZ",
    appAuthor: "Jun Kato",
    appName: "Basic example"
  },
  mediaElement: document.querySelector("#media")
});

// 💡 追加：p5.jsで利用するためのグローバル変数
/** @type {TextAliveApp.Phrase | null} */
let currentPhrase = null;
/** @type {TextAliveApp.Word | null} */
let currentWord = null;
let currentPosition = 0; // 現在の再生位置を保持

player.addListener({
  onAppReady,
  onTimerReady,
  onTimeUpdate
  // 💡 削除：onThrottledTimeUpdate
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
    player.createFromSongUrl("https://www.nicovideo.jp/watch/sm45705344");
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
  // 💡 変更：各フレーズに`setPhrase`を割り当て、p5.js側に情報を渡す
  while (p) {
    p.animate = setPhrase;
    p = p.next;
  }
}

function onTimeUpdate(position) {
  // 💡 変更：現在の再生位置を保持
  currentPosition = position;

  // show beatbar
  const beat = player.findBeat(position);
  if (!beat) {
    return;
  }
  beatbarEl.style.width = `${Math.ceil(Ease.circIn(beat.progress(position)) * 100)}%`;

  // 💡 削除されていたonThrottledTimeUpdateの内容をonTimeUpdateに移動 (任意)
  positionEl.textContent = String(Math.floor(position));
}

// 💡 変更：再生されたフレーズをグローバル変数に設定する関数
function setPhrase(now, unit) {
  // show current phrase
  if (unit.contains(now)) {
    phraseEl.textContent = unit.text;
    currentPhrase = unit;

    // 現在発声中の単語を検索し、グローバル変数に設定
    let w = unit.findWord(now);
    if (w) {
      currentWord = w;
    } else if (now < unit.startTime) {
      currentWord = null; // フレーズ開始前
    }
  } else if (unit.endTime < now) {
    currentPhrase = null; // フレーズ終了後
    currentWord = null;
    phraseEl.textContent = ""; // フレーズが終了したら非表示にする
  }
};


//ここからエフェクトのやつ
// 図形を管理する配列
let shapes = [];
let numShapes = 40; // 図形の数

// パステルカラーのパレット（動画の雰囲気に合わせた色）
let palette;

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('p5-canvas-container');

  // カラーパレットの定義（HSBモード推奨）
  colorMode(HSB, 360, 100, 100, 100);
  palette = [
    color(330, 60, 100), // Pink
    color(260, 60, 100), // Purple
    color(190, 60, 100), // Cyan
    color(150, 50, 100), // Green
    color(40, 60, 100),  // Yellow/Orange
  ];

  // 図形オブジェクトを生成
  for (let i = 0; i < numShapes; i++) {
    shapes.push(new FloatingShape());
  }

  noStroke();
}

function draw() {
  // 背景のグラデーション（ゆっくり色が変化する）
  drawBackgroundGradient();

  // 各図形の更新と描画
  for (let s of shapes) {
    s.update();
    s.display();
  }

  // 💡 追加：歌詞の描画をp5.jsで行う
  drawLyricsEffect(currentPhrase, currentWord, currentPosition);
}

// ウィンドウサイズが変わった時の対応
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 背景を描画する関数
function drawBackgroundGradient() {
  let ctx = drawingContext;
  let t = frameCount * 0.002;

  // 背景用のグラデーション作成
  let grad = ctx.createLinearGradient(0, 0, width, height);
  // 時間経過で少しずつ色相がずれるように計算
  let c1 = color((frameCount * 0.1) % 360, 30, 95);
  let c2 = color((frameCount * 0.1 + 60) % 360, 30, 90);

  grad.addColorStop(0, c1.toString());
  grad.addColorStop(1, c2.toString());

  ctx.fillStyle = grad;
  rect(0, 0, width, height);
}

// 浮遊する図形のクラス
class FloatingShape {
  constructor() {
    this.init(true); // true = ランダムな位置に初期化
  }

  init(randomY) {
    // 奥行き（z）を0.5〜2.0の間でランダムに設定（手前が大きい）
    this.z = random(0.5, 2.0);

    // サイズ決定
    this.r = random(30, 80) * this.z;

    // 初期位置
    this.x = random(width);
    if (randomY) {
      this.y = random(height);
    } else {
      this.y = height + this.r; // 画面の下からスポーン
    }

    // 速度（奥行きによって変える＝パララックス効果）
    this.speedY = random(1, 2.5) * this.z;
    this.speedX = random(-0.5, 0.5) * this.z;

    // 回転
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.02, 0.02);

    // 形の種類 (0:四角, 1:五角形, 2:六角形, 3:キラキラ)
    this.type = floor(random(4));

    // 色の選択（パレットから2色選んでグラデーションにする）
    this.c1 = random(palette);
    this.c2 = random(palette);

    // キラキラの場合は少し透明度を上げるなどの調整
    if(this.type === 3) {
      this.r *= 0.6; // キラキラは少し小さめに
    }
  }

  update() {
    // 位置更新（上に移動）
    this.y -= this.speedY;
    this.x += this.speedX;

    // 回転更新
    this.angle += this.rotationSpeed;

    // 画面外（上）に出たらリセット
    if (this.y < -this.r * 2) {
      this.init(false); // 画面下から再登場
    }
    // 横にはみ出た場合のループ処理
    if (this.x > width + this.r) this.x = -this.r;
    if (this.x < -this.r) this.x = width + this.r;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    // 図形ごとのグラデーション設定
    let ctx = drawingContext;
    // グラデーションの方向を少し傾ける
    let grad = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
    grad.addColorStop(0, this.c1.toString());
    grad.addColorStop(1, this.c2.toString());
    ctx.fillStyle = grad;

    // 形の描画
    if (this.type === 0) {
      this.drawPolygon(4); // 四角形（ひし形）
    } else if (this.type === 1) {
      this.drawPolygon(5); // 五角形
    } else if (this.type === 2) {
      this.drawPolygon(6); // 六角形
    } else if (this.type === 3) {
      this.drawStar(4, this.r, this.r * 0.4); // 4本足のキラキラ
    }

    pop();
  }

  // 多角形を描画する関数
  drawPolygon(sides) {
    beginShape();
    for (let i = 0; i < sides; i++) {
      let theta = map(i, 0, sides, 0, TWO_PI);
      let sx = cos(theta) * this.r;
      let sy = sin(theta) * this.r;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  // 星（キラキラ）を描画する関数
  drawStar(pointCount, outerRadius, innerRadius) {
    beginShape();
    for (let i = 0; i < pointCount * 2; i++) {
      let theta = map(i, 0, pointCount * 2, 0, TWO_PI);
      let r = (i % 2 === 0) ? outerRadius : innerRadius;
      let sx = cos(theta) * r;
      let sy = sin(theta) * r;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}

// 💡 新規追加：歌詞をp5.jsで描画するための関数
 function drawLyricsEffect(phrase, word, position) {
 push();
}