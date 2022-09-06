const words = JSON.parse(localStorage.getItem('words'));
let memorized = [];
let progress = {
    n: 0,
    status: 0,
};
var viewer = (n) => {
    n %= 4;
    return {
        viewer: document.getElementById(`viewer-${n}`),
        progress: (m) => document.getElementById(`viewer-${n}-progress-${m}`),
        title: document.getElementById(`viewer-${n}-title`),
        subtitle: document.getElementById(`viewer-${n}-subtitle`),
        word: document.getElementById(`viewer-${n}-word`),
        pronunciations: document.getElementById(`viewer-${n}-pronunciations`),
        meanings: document.getElementById(`viewer-${n}-meanings`),
        button: document.getElementById(`viewer-${n}-button`),
        buttonText: document.getElementById(`viewer-${n}-button-text`),
    };
};

var next = () => {
    if (progress.status) {
        progress.status = 0;
        show(progress.n + 1);
    } else {
        progress.status = 1;
        const v = viewer(progress.n);
        v.viewer.classList.remove('q');
        // v.progress(0).style.backgroundImage = 'linear-gradient(to right, #444444 100%, #dddddd 100%)';
        startProgressBar();
    }
    return true;
};
var prev = () => {
    if (progress.status) {
        progress.status = 0;
        const v = viewer(progress.n);
        v.viewer.classList.add('q');
        cancelProgressBar();
        startProgressBar();
    } else if (progress.n) {
        cancelProgressBar();
        show(progress.n - 1);
    }
    return true;
};

let activeRotation = false;
var show = (n) => {
    if (n < 0 || n >= words.length || !Number.isInteger(n) || activeRotation) return false;

    const container = document.querySelector('.container');
    const keyframes = [...Array(11).keys()].map((v) => {
        const offset = v / 10;
        return {
            transform: `translateZ(calc(max(-50vw, -240px) * ${Math.sqrt(2) * Math.sin(Math.PI * (2 * offset + 1) / 4)})) rotateY(${-90 * (progress.n * (1 - offset) + n * offset)}deg)`,
            offset: offset,
        };
    });

    activeRotation = true;
    progress.n = n;
    const v = viewer(n);
    v.progress(0).style.backgroundPositionX = '100%';
    v.progress(1).style.backgroundPositionX = '100%';
    v.viewer.classList.add('q');
    v.title.innerText = words[n].group;
    v.subtitle.innerText = `${n + 1} of ${words.length}`;
    v.word.innerText = words[n].word;
    v.pronunciations.innerText = words[n].pronunciations;
    v.meanings.innerText = words[n].meanings;
    if (memorized.includes(words[n].word.toLowerCase())) {
        v.button.classList.add('active');
        v.button.removeEventListener('click', markAsMemorized, false);
        v.button.addEventListener('click', markAsUnmemorized, false);
        v.buttonText.innerText = 'Memorized!';
    } else {
        v.button.classList.remove('active');
        v.button.removeEventListener('click', markAsUnmemorized, false);
        v.button.addEventListener('click', markAsMemorized, false);
        v.buttonText.innerText = 'Mark as Memorized';
    }

    let player = container.animate(keyframes, 350);
    player.addEventListener('finish', () => {
        container.style.transform = `translateZ(max(-50vw, -240px)) rotateY(${-n * 90}deg)`;
        if (n > 0) viewer(n - 1).viewer.classList.add('q');
        startProgressBar();
        activeRotation = false;
    });
};

var read = () => {
    speechSynthesis.cancel();
    let utterance = new SpeechSynthesisUtterance(words[progress.n].word);
    utterance.lang = 'en-US';
    utterance.voice = speechSynthesis.getVoices().find(e => e.lang == 'en-US');
    // console.log(speechSynthesis.getVoices())
    speechSynthesis.speak(utterance);
};

let activeProgress = false;
var startProgressBar = () => {
    finishProgressBar();
    const snapshot = viewer(progress.n).progress(progress.status);
    activeProgress = snapshot.animate([
        {
            backgroundPositionX: '100%'
        },
        {
            backgroundPositionX: '0%'
        }
    ], 6000);
    activeProgress.addEventListener('finish', () => {
        snapshot.style.backgroundPositionX = '0%';
        next();
        return true;
    });
};
var finishProgressBar = () => {
    if (activeProgress) activeProgress.finish();
    activeProgress = false;
};
var cancelProgressBar = () => {
    if (activeProgress) activeProgress.cancel();
    activeProgress = false;
};
var pauseProgressBar = () => {
    if (activeProgress) activeProgress.pause();
};
var playProgressBar = () => {
    if (activeProgress) activeProgress.play();
};

Array.from(document.getElementsByClassName('controller')).forEach((x) => {
    x.addEventListener('touchend', playProgressBar, false);
    x.addEventListener('touchstart', pauseProgressBar, false);
});
Array.from(document.getElementsByClassName('prev')).forEach((x) => {
    x.addEventListener('click', prev, false);
});
Array.from(document.getElementsByClassName('next')).forEach((x) => {
    x.addEventListener('click', finishProgressBar, false);
});

let studentRef;
firebase.auth().onAuthStateChanged((user) => {
    studentRef = firebase.firestore().collection('students').doc(user.uid);
    init();
});
var markAsMemorized = () => {
    const x = words[progress.n].word.toLowerCase();
    memorized.push(x);
    studentRef.update({
        words: firebase.firestore.FieldValue.arrayUnion(x),
    });

    const v = viewer(progress.n);
    v.button.classList.add('active');
    v.button.removeEventListener('click', markAsMemorized, false);
    v.button.addEventListener('click', markAsUnmemorized, false);
    v.buttonText.innerText = 'Memorized!';
};
var markAsUnmemorized = () => {
    const x = words[progress.n].word.toLowerCase();
    memorized = memorized.filter(w => w != x);
    studentRef.update({
        words: firebase.firestore.FieldValue.arrayRemove(x),
    });

    const v = viewer(progress.n);
    v.button.classList.remove('active');
    v.button.removeEventListener('click', markAsUnmemorized, false);
    v.button.addEventListener('click', markAsMemorized, false);
    v.buttonText.innerText = 'Mark as Memorized';
};

var init = () => {
    if (!(words && words.length)) location.replace('/words');

    const v = viewer(0);
    v.title.innerText = words[0].group;
    v.subtitle.innerText = `1 of ${words.length}`;
    v.word.innerText = words[0].word;
    v.pronunciations.innerText = words[0].pronunciations;
    v.meanings.innerText = words[0].meanings;
    v.button.addEventListener('click', markAsMemorized, false);

    startProgressBar();
};

var closeViewer = () => {
    localStorage.setItem('words', '[]');
    localStorage.setItem('back', 'true');
    history.back();
};