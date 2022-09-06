let bookId = '';
let groupId = '';
let words = [];
let currentIndex = -1;
const ref = firebase.firestore().collection('words');

firebase.auth().onAuthStateChanged(async (user) => {
    if (!(user && await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false))) {
        firebase.auth().signOut();
        location.replace('/words/signin');
    }
});

Promise.all([
    ref.get().then(snapshot => {
        list_a.innerHTML = snapshot.docs.map(doc => {
            return `<li onclick="open_b('${doc.id}', event);">${doc.data().name}</li>`;
        }).join('');
    }).catch(() => location.replace('/words/signin')),
]).then(() => {
    document.getElementsByTagName('body')[0].classList.add('active');
});

var back = () => {
    localStorage.setItem('back', 'true');
    location.href = '/words';
};

var open_b = (_bookId, event) => {
    bookId = _bookId;
    currentIndex = -1;
    ref.doc(bookId).collection('groups').get().then(snapshot => {
        list_b.innerHTML = snapshot.docs.map(doc => {
            return `<li onclick="open_c('${doc.id}', event);">${doc.data().name}</li>`;
        }).join('');
    }).then(() => {
        section_b.classList.add('active');
    }).catch(() => location.replace('/words/signin'));
    document.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
    groupId = '';
    words = [];
    section_c.classList.remove('active');
    section_d.classList.remove('active');
    closeToolSections();
    event.target.classList.add('selected');
};
var open_c = (_groupId, event) => {
    groupId = _groupId;
    currentIndex = -1;
    ref.doc(bookId).collection('groups').doc(groupId).get().then(doc => {
        words = doc.data().words.sort((a, b) => a.index - b.index);
        list_c.innerHTML = words.map(w => {
            return `<li onclick="open_d('${w.word}', event);">${w.word}</li>`;
        }).join('');
    }).then(() => {
        section_c.classList.add('active');
    }).catch(() => location.replace('/words/signin'));
    document.querySelectorAll('#list_b li').forEach(l => l.classList.remove('selected'));
    section_d.classList.remove('active');
    closeToolSections();
    event.target.classList.add('selected');
};
var open_d = (_word, event) => {
    closeToolSections();
    document.querySelectorAll('#list_c li').forEach(l => l.classList.remove('selected'));
    event.target.classList.add('selected');

    currentIndex = words.findIndex(x => x.word == _word);
    const W = words[currentIndex];
    section_d_word.innerText = W.word;
    section_d_index.innerText = W.index;
    section_d_pronunciations.value = W.pronunciations;
    // section-d-meanings').innerText = W.meanings;
    section_d_meanings.value = W.meanings;
    section_d_save.classList.add('hidden');
    section_d.classList.add('active');
};

var updated = () => {
    const W = words[currentIndex];
    if (section_d_pronunciations.value != W.pronunciations || section_d_meanings.value != W.meanings) {
        section_d_save.classList.remove('hidden');
    } else {
        section_d_save.classList.add('hidden');
    }
};
var save = () => {
    words[currentIndex].pronunciations = section_d_pronunciations.value;
    words[currentIndex].meanings = section_d_meanings.value;
    // console.log(words);
    ref.doc(bookId).collection('groups').doc(groupId).update({
        words: words,
    }).then(() => {
        ref.doc(bookId).collection('groups').doc(groupId).get().then(doc => {
            words = doc.data().words.sort((a, b) => a.index - b.index);
        })
    });
    section_d_save.classList.add('hidden');
};

var closeToolSections = () => {
    document.querySelectorAll('#list_tool_a li').forEach(l => l.classList.remove('selected'));
    document.querySelectorAll('#list_tool_b li').forEach(l => l.classList.remove('selected'));
    section_uploadBook.classList.remove('active');
    section_renameBook.classList.remove('active');
    section_deleteBook.classList.remove('active');
}
var openUploadBookSection = (event) => {
    document.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
    section_b.classList.remove('active');
    section_c.classList.remove('active');
    section_d.classList.remove('active');
    closeToolSections();
    event.target.classList.add('selected');
    section_uploadBook.classList.add('active');
    section_uploadBook_save.classList.add('hidden');
};
let bookData = {};
section_uploadBook_file.addEventListener('change', event => {
    section_uploadBook_save.classList.add('hidden');
    let reader = new FileReader();
    reader.onload = () => {
        let data = reader.result;
        let workbook = XLSX.read(data, {type: 'binary'});
        const raw = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        for (const e of raw) {
            if ('group' in e && 'index' in e && 'word' in e) {
                const x = {
                    group: e.group,
                    index: Number(e.index) || 0,
                    word: e.word,
                    meanings: e.meanings || '',
                    pronunciations: e.pronunciations || '',
                };
                if (x.group in bookData) {
                    bookData[x.group].push(x);
                } else {
                    bookData[x.group] = [x];
                }
            } else {
                bookData = {};
                break;
            }
        };
        if (Object.keys(bookData).length && section_uploadBook_title.value) {
            section_uploadBook_save.classList.remove('hidden');
        }
    };
    reader.readAsBinaryString(event.target.files[0]);
}, false);
section_uploadBook_title.addEventListener('change', event => {
    if (Object.keys(bookData).length && section_uploadBook_title.value) {
        section_uploadBook_save.classList.remove('hidden');
    } else {
        section_uploadBook_save.classList.add('hidden');
    }
});
var uploadBook = () => {
    section_uploadBook_save.classList.add('hidden');
    const db = firebase.firestore();
    db.collection('words').add({
        name: section_uploadBook_title.value,
    }).then(ref => {
        const batch = db.batch();
        // const ref = db.collection('words').doc('VGiueOzYbrXoxIBjIhQe').collection('groups');
        ref = db.collection('words').doc(ref.id).collection('groups');
        for (const key in bookData) {
            batch.set(ref.doc(key.replaceAll(' ', '-').toLowerCase()), {
                name: key,
                words: bookData[key],
            });
        }
        batch.commit().then(() => location.reload());
    });
};

var openRenameBookSection = (event) => {
    document.querySelectorAll('#list_b li').forEach(l => l.classList.remove('selected'));
    section_c.classList.remove('active');
    section_d.classList.remove('active');
    closeToolSections();
    event.target.classList.add('selected');
    section_renameBook.classList.add('active');
    section_renameBook_save.classList.add('hidden');
};
section_renameBook_title.addEventListener('change', event => {
    if (section_renameBook_title.value) {
        section_renameBook_save.classList.remove('hidden');
    } else {
        section_renameBook_save.classList.add('hidden');
    }
});
var renameBook = () => {
    section_renameBook_save.classList.add('hidden');
    const db = firebase.firestore();
    db.collection('words').doc(bookId).update({
        name: section_renameBook_title.value,
    }).then(() => {
        location.reload();
    });
};

var openDeleteBookSection = (event) => {
    document.querySelectorAll('#list_b li').forEach(l => l.classList.remove('selected'));
    section_c.classList.remove('active');
    section_d.classList.remove('active');
    closeToolSections();
    event.target.classList.add('selected');
    section_deleteBook.classList.add('active');
};
var deleteBook = () => {
    section_deleteBook_save.classList.add('hidden');
    const db = firebase.firestore();
    db.collection('words').doc(bookId).delete().then(() => {
        location.reload();
    });
};

// let grouped = {};
// raw.forEach(e => {
//     if (e.group in grouped) {
//         grouped[e.group].push(e);
//     } else {
//         grouped[e.group] = [e];
//     }
// });

// var upload = () => {
//     const db = firebase.firestore();
//     const batch = db.batch();
//     const ref = db.collection('words').doc('VGiueOzYbrXoxIBjIhQe').collection('groups');
//     for (const key in grouped) {
//         batch.set(ref.doc(key.replaceAll(' ', '-').toLowerCase()), {
//             name: key,
//             words: grouped[key],
//         });
//     }
//     batch.commit().then(console.log);
// };