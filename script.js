/**
 * TextAlive App API basic example
 * https://github.com/taisukef/textalive-app-basic
 * forked from https://github.com/TextAliveJp/textalive-app-basic
 *
 * API チュートリアル「1. 開発の始め方」のサンプルコードを改変したものです。
 * 発声中の歌詞を単語単位で表示します。
 * また、このアプリが TextAlive ホストと接続されていなければ再生コントロールを表示します。
 * https://developer.textalive.jp/app/
 */

const { Player } = TextAliveApp;

const songurl = "https://www.nicovideo.jp/watch/sm12825985";

const appAuthor = "Taisuke Fukuno";
const appName = "Baisc Sample";

const lyricsContainer = document.querySelector("#lyrics");
const wordElementMap = new Map();

const animateWord = (now, unit) => {
  const wordElement = wordElementMap.get(unit);
  if (!wordElement) return;

  // 単語が所属するフレーズ（行）を取得
  // 一旦消す↓
  // const phrase = unit.parentPhrase;

  // 💡 修正1: 新しいモードを定義
  const IS_RIGHT_MODE = (now >= 20000 && now < 25000);

  if (IS_RIGHT_MODE) {
      // 右から出てくるクラスを適用
      wordElement.classList.add('mode-right');
  } else {
      // 対象外の時間帯はクラスを解除
      wordElement.classList.remove('mode-right');
  }

  if (unit.contains(now)) {
    // 発声中: 横から出てくる（.is-active）
    wordElement.classList.add('is-active');
    wordElement.classList.remove('is-gone'); // 消滅を解除
  } else if (now > unit.endTime) {
    // 発声終了後: 上に消える（.is-gone）
    wordElement.classList.add('is-gone');
    wordElement.classList.remove('is-active');
  } else {
    // 発声前: 初期状態（クラス解除）
    wordElement.classList.remove('is-active', 'is-gone');
  }
};

const player = new Player({ app: { appAuthor, appName }, mediaElement: media });

player.addListener({
  onAppReady(app) {
    if (!app.managed) {
      control.style.display = "block";
      const p = player;
      document.querySelectorAll(".play").forEach((btn) => btn.onclick = () => p.video && p.requestPlay());
      jump.onclick = () => p.video && p.requestMediaSeek(p.video.firstChar.startTime);
      pause.onclick = () => p.video && p.requestPause();
      rewind.onclick = () => p.video && p.requestMediaSeek(0);
      document.querySelector("#header a").setAttribute("href", "https://developer.textalive.jp/app/run/?ta_app_url=https%3A%2F%2Ftextalivejp.github.io%2Ftextalive-app-basic%2F&ta_song_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DygY2qObZv24");
    } else {
      document.querySelector("#header a").setAttribute("href", "https://textalivejp.github.io/textalive-app-basic/");
    }
    if (!app.songUrl) {
      player.createFromSongUrl(songurl);
    }
  },
onVideoReady(v) {
    document.querySelector("#artist span").textContent = player.data.song.artist.name;
    document.querySelector("#song span").textContent = player.data.song.name;

    // 💡 変更4: 既存のテキストをクリアし、単語DOM要素を生成
    lyricsContainer.textContent = "";
    wordElementMap.clear();

    let w = player.video.firstWord;
    while (w) {
      w.animate = animateWord;

      const wordSpan = document.createElement('span');
      wordSpan.className = 'lyrics-word'; // CSSクラスを設定
      wordSpan.textContent = w.text;

      // 単語の区切りにスペースを入れる
      llyricsContainer.appendChild(wordSpan);

      wordElementMap.set(w, wordSpan); // 単語データと要素を関連付ける
      w = w.next;
    }
  },

  onTimerReady(t) {
    if (!player.app.managed) {
      document.querySelectorAll("button").forEach((btn) => btn.disabled = false);
    }
    jump.disabled = !player.video.firstChar;
  },
  onThrottledTimeUpdate(pos) {
    document.querySelector("#position strong").textContent = Math.floor(pos);
    // 💡 変更5: 単語単位のアニメーションはanimateWordに任せるため、ここでは特にDOM操作は不要
  },

  onPlay() {
    overlay.style.display = "none";
  },

  onPause() {
    // 💡 変更6: 停止時に文字を初期状態に戻す
    wordElementMap.forEach(element => {
        element.classList.remove('is-active', 'is-gone');
    });
    // text.textContent = "-"; // 元のコードの単語表示テキストは不要
  },

  onStop() {
    // 💡 変更7: 停止時に文字を初期状態に戻す
    wordElementMap.forEach(element => {
        element.classList.remove('is-active', 'is-gone');
    });
    // text.textContent = "再生してください"; // 元のコードの単語表示テキストは不要
  },
});