// let params = location.pathname.split('/');
// const groupId = params.pop();
const bookId = location.pathname.split('/')[2];
const db = firebase.firestore();
const bookRef = db.collection('words').doc(bookId);

let list1 = [], list2 = [];

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

Promise.all([
    bookRef.get().then(doc => {
        document.getElementById('class-b').innerHTML = doc.data().name;
    }).catch(() => location.replace('/words')),

    bookRef.collection('groups').get().then(snapshot => {
        const history = localStorage.getItem(bookId) || [];
        snapshot.forEach(doc => {
            if (history.includes(doc.id)) {
                list1.push(Object.assign(doc.data(), { id: doc.id, }));
            } else {
                list2.push(Object.assign(doc.data(), { id: doc.id, }));
            }
        });
        refreshList(true);
        if (!list1.length) openEdit();
    }).catch(() => location.replace('/words')),
]).then(() => {
    setTimeout(() => {
        document.getElementsByTagName('body')[0].classList.add('active');
    }, 100);
});

var refreshList = (disabled = false) => {
    const d = disabled ? 'disabled' : '';
    document.getElementById('list-1-title').innerText = `${list1.length} Selected`;
    document.getElementById('list-1').innerHTML = list1.map(g => {
        return `<li class="remove ${d}">${g.name}</li>`;
    }).join('');
    document.getElementById('list-2').innerHTML = list2.map(g => {
        return `<li class="add ${d}">${g.name}</li>`;
    }).join('');

    if (!disabled) {
        const selected = document.querySelectorAll('li.remove');
        const memorized = document.querySelectorAll('li.add');
        selected.forEach(v => {
            v.addEventListener('click', select, false);
        });
        memorized.forEach(v => {
            v.addEventListener('click', deselect, false);
        });
    } else if (list1.length) {
        document.getElementById('buttons').classList.remove('hidden');
    } else {
        document.getElementById('buttons').classList.add('hidden');
    }
};

var openEdit = () => {
    const menu = document.getElementById('menu');
    const buttons = document.getElementById('buttons');
    const selected = document.querySelectorAll('li.remove');
    const unselected = document.querySelectorAll('li.add');
    
    menu.removeEventListener('click', openEdit, false);
    menu.addEventListener('click', closeEdit, false);
    menu.classList.add('active');
    buttons.classList.add('hidden');
    selected.forEach(v => {
        v.classList.remove('disabled');
        v.addEventListener('click', select, false);
    });
    unselected.forEach(v => {
        v.classList.remove('disabled');
        v.addEventListener('click', deselect, false);
    });
};
var closeEdit = () => {
    const menu = document.getElementById('menu');
    const buttons = document.getElementById('buttons');
    const selected = document.querySelectorAll('li.remove');
    const unselected = document.querySelectorAll('li.add');
    
    menu.removeEventListener('click', closeEdit, false);
    menu.addEventListener('click', openEdit, false);
    menu.classList.remove('active');
    buttons.classList.remove('hidden');
    selected.forEach(v => {
        v.classList.add('disabled');
        v.removeEventListener('click', select, false);
    });
    unselected.forEach(v => {
        v.classList.add('disabled');
        v.removeEventListener('click', deselect, false);
    });
    if (list1.length) {
        document.getElementById('buttons').classList.remove('hidden');
    } else {
        document.getElementById('buttons').classList.add('hidden');
    }
    localStorage.setItem(bookId, JSON.stringify(list1.map(g => g.id)));
};
var select = (event) => {
    const i = list1.findIndex(g => g.name == event.target.innerText);
    list2.push(list1[i]);
    list2.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
    list1.splice(i, 1);
    refreshList();
};
var deselect = (event) => {
    const i = list2.findIndex(g => g.name == event.target.innerText);
    list1.push(list2[i]);
    list1.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
    list2.splice(i, 1);
    refreshList();
};

let memorized = [];
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        memorized = await db.collection('students').doc(user.uid).get().then(doc => {
            if (!doc.exists) return [];
            const Data = doc.data();
            if ('words' in Data) {
                return Data.words;
            } else {
                db.collection('students').doc(user.uid).set({ words: [] }, { merge: true });
                return [];
            }
        }).catch(() => []) || [];
    }
});
var play = async () => {
    const W = list1.reduce((a, c) => a.concat(c.words), []).filter(w => !memorized.includes(w.word));
    localStorage.setItem('words', JSON.stringify(W));
    location.href = '/words/view';
};
var shuffle = async  () => {
    const W = list1.reduce((a, c) => a.concat(c.words), []).filter(w => !memorized.includes(w.word));
    localStorage.setItem('words', JSON.stringify(W.sort(()=> Math.random() - 0.5)));
    location.href = '/words/view';
};

var back = () => {
    localStorage.setItem('back', 'true');
    history.back();
};