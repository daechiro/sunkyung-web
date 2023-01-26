let params = location.pathname.split('/');
const groupId = params.pop();
const bookId = params.pop();
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

    bookRef.collection('groups').doc(groupId).get().then(async doc => {
        const Data = doc.data();
        document.getElementById('name').innerHTML = Data.name;

        const UID = firebase.auth().currentUser.uid;
        const memorized = await db.collection('students').doc(UID).get().then(doc => {
            if (!doc.exists) return [];
            const Data = doc.data();
            if ('words' in Data) {
                return Data.words;
            } else {
                db.collection('students').doc(UID).set({ words: [] }, { merge: true });
                return [];
            }
        }).catch(() => []) || [];
        
        Data.words.sort((a, b) => a.index - b.index).forEach(w => {
            if (memorized.includes(w.word.toLowerCase().trim())) {
                list2.push(w);
            } else {
                list1.push(w);
            }
        });
        refreshList(true);
    }).catch(() => location.replace('/words')),
]).then(() => {
    setTimeout(() => {
        document.getElementsByTagName('body')[0].classList.add('active');
    }, 100);
});

var refreshList = (disabled = false) => {
    const d = disabled ? 'disabled' : '';
    document.getElementById('list-1-title').innerText = `${list1.length} Selected`;
    document.getElementById('list-1').innerHTML = list1.map(w => {
        return `<li class="remove ${d}">${w.word}</li>`;
    }).join('');
    document.getElementById('list-2-title').innerText = `${list2.length} Memorized`;
    document.getElementById('list-2').innerHTML = list2.map(w => {
        return `<li class="add ${d}">${w.word}</li>`;
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
    const memorized = document.querySelectorAll('li.add');
    
    menu.removeEventListener('click', openEdit, false);
    menu.addEventListener('click', closeEdit, false);
    menu.classList.add('active');
    buttons.classList.add('hidden');
    selected.forEach(v => {
        v.classList.remove('disabled');
        v.addEventListener('click', select, false);
    });
    memorized.forEach(v => {
        v.classList.remove('disabled');
        v.addEventListener('click', deselect, false);
    });
};
var closeEdit = () => {
    const menu = document.getElementById('menu');
    const buttons = document.getElementById('buttons');
    const selected = document.querySelectorAll('li.remove');
    const memorized = document.querySelectorAll('li.add');
    
    menu.removeEventListener('click', closeEdit, false);
    menu.addEventListener('click', openEdit, false);
    menu.classList.remove('active');
    buttons.classList.remove('hidden');
    selected.forEach(v => {
        v.classList.add('disabled');
        v.removeEventListener('click', select, false);
    });
    memorized.forEach(v => {
        v.classList.add('disabled');
        v.removeEventListener('click', deselect, false);
    });
    if (list1.length) {
        document.getElementById('buttons').classList.remove('hidden');
    } else {
        document.getElementById('buttons').classList.add('hidden');
    }

    const ref = db.collection('students').doc(firebase.auth().currentUser.uid);
    ref.update({
        words: firebase.firestore.FieldValue.arrayRemove(...list1.map(w => w.word.toLowerCase().trim())),
    });
    ref.update({
        words: firebase.firestore.FieldValue.arrayUnion(...list2.map(w => w.word.toLowerCase().trim())),
    });
};
var select = (event) => {
    const i = list1.findIndex(w => w.word.trim() == event.target.innerText);
    list2.push(list1[i]);
    list2.sort((a, b) => a.index - b.index);
    list1.splice(i, 1);
    refreshList();
};
var deselect = (event) => {
    const i = list2.findIndex(w => w.word.trim() == event.target.innerText);
    list1.push(list2[i]);
    list1.sort((a, b) => a.index - b.index);
    list2.splice(i, 1);
    refreshList();
};

var play = () => {
    localStorage.setItem('words', JSON.stringify(list1));
    location.href = '/words/view';
};
var shuffle = () => {
    localStorage.setItem('words', JSON.stringify(list1.sort(()=> Math.random() - 0.5)));
    location.href = '/words/view';
};

var back = () => {
    localStorage.setItem('back', 'true');
    history.back();
};