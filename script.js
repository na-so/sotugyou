
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
    player.createFromSongUrl("http://www.youtube.com/watch?v=ygY2qObZv24");
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

  // show current phrase
  if (unit.contains(now)) {
    phraseEl.textContent = unit.text;
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

//文字の処理
function DFlowingText() {
  this.name = "流れるテキスト";
  this.type = PUBLIC | PHRASE;
  this.headTime = 0;
  this.tailTime = 5000;

  // UI設定
  this.color = new Color("#000000");
  this.fontSizeMin = 13;
  this.fontSizeMax = 20;
  this.letterSpacing = 30;
  this.letterSpeed = 30;
  this.seed = 0;

  const DUtil = require("DUtil@1247");
  const util = DUtil ? new DUtil() : null;
  const DPolyText = require("DPolyText@1255");
  const polyText = DPolyText ? new DPolyText() : null;

  this.animate = (now) => {
    const p = this.getAssignedUnit();
    Object.assign(polyText, {
      color: this.color,
      fontSizeMin: this.fontSizeMin,
      fontSizeMax: this.fontSizeMax,
      thickness: this.thickness,
      colorLine: this.colorLine,
      colorFill: this.colorFill,
      alphaFill: this.alphaFill,
      effectIntensity: this.effectIntensity,
    });

    util.seed = p.duration * 123 + 123 + this.seed;
    let c = 0, dd = 0, list = [];

    const endProg = Math.pow(Math.max((now - p.endTime) / 1000, 0), 2);

    p.children.forEach((word) => {
      word.children.forEach((char) => {
        char.rendering.visible = char.startTime <= now;

        const px = (0.2 + (c * this.letterSpacing) / 450) * width;
        const py = util.rand(height * 0.3, height * 0.7);
        const dt = (now - char.startTime) / 1000;

        const sx = (util.rand(-100, -40) * dt * this.letterSpeed) / 30 +
                   util.rand(-160, -60) * endProg;
        const sy = ((util.rand(-150, 150) * dt * this.letterSpeed) / 30) * (endProg + 1);

        char.rendering.tx.translate(px + sx, py + sy);
        polyText.draw(now, char);

        if (char.rendering.visible) {
          dd += char.duration;
          if (dd > 500 || p.charCount <= c + 1) {
            dd = 0;
            const ny = (py - height * 0.5) * 0.3 + height * 0.5;
            if (!list.length) list.push([p.firstChar.startTime, px - (0.2 + c / 15) * width, ny]);
            list.push([char.startTime + 100, px, ny]);
          }
        }
        c++;
      });
    });

    for (let i = list.length - 2; i >= 0; i--) {
      if (list[i][0] <= now) {
        const [preT, preX, preY] = list[i];
        const [nowT, nowX, nowY] = list[i + 1];
        const prog = sineOut(Math.min((now - preT) / (nowT - preT), 1));
        const ptx = preX + (nowX - preX) * prog;
        const pty = preY + (nowY - preY) * prog;
        p.rendering.tx.translate(-ptx + width * 0.8, -pty + height * 0.5);
        break;
      }
    }

    p.rendering.visible = (p.startTime - this.headTime) <= now && now < (p.endTime + this.tailTime);
  };
}
