const db = firebase.firestore();
firebase.auth().onAuthStateChanged(async (user) => {
    if (!(user && await db.collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false))) {
        firebase.auth().signOut();
        location.replace('/signin');
    }
    document.getElementsByTagName('body')[0].classList.add('active');
});

let liveSection = ['menu', ];

// words
let ref = {
    classes: {
        ref: db.collection('classes'),
    },
    students: {
        ref: db.collection('students'),
        data: {},
        uid: '',
        rawData: [],
    },
    parents: {
        ref: db.collection('parents'),
    },
    teachers: {
        ref: db.collection('teachers'),
        data: {},
        uid: '',
    },
    words: {
        ref: db.collection('words'),
        bookId: '',
        groupId: '',
        words: [],
        currentIndex: -1,
        bookData: {},
    },
};

let beforeOpen = {
    //students
    'students_main': () => {
        ref.students.uid = '';
        return ref.students.ref.orderBy('name').get().then(snapshot => {
            students_main__list.innerHTML = snapshot.docs.map(doc => {
                const Data = doc.data();
                ref.students.data[doc.id] = Data;
                return `<li id="open__students_edit:${doc.id}" onclick="openSection(2, 'students_edit', '${doc.id}');"><span>${Data.name}</span><span class="detail">${Data.school.name} ${Data.school.year}</span></li>`;
            }).join('');
            return;
        });
    },
    'students_edit': async (studentId) => {
        ref.students.uid = studentId;
        let Data = ref.students.data[studentId];
        const values = await Promise.all([
            ref.parents.ref.doc(Data.parent || 'a').get().then(doc => doc.exists ? `0${doc.data().phone.slice(3)}` : '').catch(() => ''),
            Data.classes.length ? Promise.all(Data.classes.map(classId => ref.classes.ref.doc(classId).get().then(doc => {
                if (doc.exists) {
                    return doc.data().name;
                } else {
                    return '';
                }
            }))) : '정보 없음',
        ]);
        // Data.phone_parent = values[0];
        
        students_edit__form.elements['name'].value = Data.name;
        students_edit__form.elements['phone'].value = `0${Data.phone.slice(3)}`;
        students_edit__form.elements['phone_parent'].value = Data.phone_parent = values[0];
        students_edit__form.elements['schoolName'].value = Data.school.name;
        students_edit__form.elements['schoolYear'].value = Data.school.year;
        students_edit__form.elements['schoolStatus'].value = Data.school.status;
        students_edit__form_className.innerText = values[1];
        return;
    },
    'students_delete': () => {
        students_delete__save.classList.remove('hidden');
    },

    //teachers
    'teachers_main': () => {
        return ref.teachers.ref.orderBy('name').get().then(snapshot => {
            teachers_main__list.innerHTML = snapshot.docs.map(doc => {
                const Data = doc.data();
                ref.teachers.data[doc.id] = Data;
                return `<li id="open__teachers_edit:${doc.id}" onclick="openSection(2, 'teachers_edit', '${doc.id}');">${Data.name}</li>`;
            }).join('');
            return;
        });
    },
    'teachers_edit': async (teacherId) => {
        ref.teachers.uid = teacherId;
        let Data = ref.teachers.data[teacherId];
        
        teachers_edit__form.elements['name'].value = Data.name;
        // teachers_edit__form.elements['phone'].value = `0${Data.phone.slice(3)}`;
        return;
    },
    'teachers_delete': () => {
        teachers_delete__save.classList.remove('hidden');
    },

    // words
    'words_manageBooks_A': () => {
        return ref.words.ref.get().then(snapshot => {
            words_manageBooks_A__list.innerHTML = snapshot.docs.map(doc => {
                return `<li id="open__words_manageBooks_B:${doc.id}" onclick="openSection(2, 'words_manageBooks_B', '${doc.id}');">${doc.data().name}</li>`;
            }).join('');
            return;
        });
    },
    'words_manageBooks_B': (_bookId) => {
        ref.words.bookId = _bookId;
        ref.words.groupId = '';
        ref.words.words = [];
        ref.words.currentIndex = -1;
        return ref.words.ref.doc(_bookId).collection('groups').get().then(snapshot => {
            words_manageBooks_B__list.innerHTML = snapshot.docs.map(doc => {
                return `<li id="open__words_manageBooks_C:${doc.id}" onclick="openSection(3, 'words_manageBooks_C', '${doc.id}');">${doc.data().name}</li>`;
            }).join('');
        }).catch(() => location.replace('/signin'));
    },
    'words_manageBooks_C': (_groupId) => {
        ref.words.groupId = _groupId;
        ref.words.currentIndex = -1;
        return ref.words.ref.doc(ref.words.bookId).collection('groups').doc(_groupId).get().then(doc => {
            ref.words.words = doc.data().words.sort((a, b) => a.index - b.index);
            words_manageBooks_C__list.innerHTML = ref.words.words.map(w => {
                return `<li id="open__words_manageBooks_D:${w.word.replaceAll(' ', '_')}" onclick="openSection(4, 'words_manageBooks_D', '${w.word}');">${w.word}</li>`;
            }).join('');
        }).catch(() => location.replace('/signin'));
    },
    'words_manageBooks_D': (_word) => {
        ref.words.currentIndex = ref.words.words.findIndex(x => x.word == _word);

        const W = ref.words.words[ref.words.currentIndex];
        words_manageBooks_D__word.innerText = W.word;
        words_manageBooks_D__index.innerText = W.index;
        words_manageBooks_D__pronunciations.value = W.pronunciations;
        words_manageBooks_D__meanings.value = W.meanings;
        return;
    },
    'words_manageBooks_deleteBook': () => {
        words_manageBooks_deleteBook__save.classList.remove('hidden');
    },
};
let beforeClose = {
    // students
    'students_add': (_event) => {
        if (_event !== 'SA') return;
        
        students_add__save.classList.add('hidden');
        const data = new FormData(students_add__form);
        // const __phone_parent = data.get('phone_parent') ? '+82' + data.get('phone_parent').slice(1) : false;
        const studentData = {
            name: data.get('name'),
            phone: '+82' + data.get('phone').slice(1),
            phone_parent: data.get('phone_parent') ? '+82' + data.get('phone_parent').slice(1) : false,
            school: {
                name: data.get('schoolName'),
                year: Number(data.get('schoolYear')),
                status: data.get('schoolStatus'),
            },
        };

        return firebase.functions().httpsCallable('addStudent')(studentData).catch(alert).then(() => {
            students_add__form.reset();
            students_add__save.classList.remove('hidden');
            return false;
        });
    },
    'students_upload': (_event) => {
        if (!(_event === 'SU' && ref.students.rawData.length)) return;
        
        students_upload__save.classList.add('hidden');
        return Promise.all(ref.students.rawData.map(studentData => firebase.functions().httpsCallable('addStudent')(studentData).catch(e => alert(studentData.name + ': ' + e)))).then(() => {
            students_upload__file.value = null;
            ref.students.rawData = [];
            return;
        });
    },
    'students_edit': (_event) => {
        students_edit__save.classList.add('hidden');
        if (_event !== 'SE') return;
        
        const original = ref.students.data[ref.students.uid];
        const data = new FormData(students_edit__form);
        let queue = [];

        if (data.get('phone') != `0${original.phone.slice(3)}`) {
            queue.push(firebase.functions().httpsCallable('updateStudentPhone')({
                uid: ref.students.uid,
                phone: `+82${data.get('phone').slice(1)}`,
            }).catch(alert));
        }
        if (data.get('phone_parent') != original.phone_parent) {
            queue.push(firebase.functions().httpsCallable('updateParentPhone')({
                uid: ref.students.uid,
                parent: original.parent,
                phone: `+82${data.get('phone_parent').slice(1)}`,
            }).catch(alert));
        }
        if (data.get('name') != original.name || data.get('schoolName') != original.school.name || Number(data.get('schoolYear')) != Number(original.school.year) || data.get('schoolStatus') != original.school.status) {
            const studentData = {
                name: data.get('name'),
                school: {
                    name: data.get('schoolName'),
                    year: Number(data.get('schoolYear')),
                    status: data.get('schoolStatus'),
                },
            };
            queue.push(ref.students.ref.doc(ref.students.uid).update(studentData).catch(alert));
        }

        return Promise.all(queue).then(() => {
            students_edit__form.reset();
            return false;
        });
    },
    'students_delete': (_event) => {
        if (_event !== 'SD') return;

        students_delete__save.classList.add('hidden');

        return firebase.functions().httpsCallable('deleteStudent')({
            uid: ref.students.uid,
        }).catch(alert).then(() => {
            students_delete__save.classList.remove('hidden');
            return false;
        });
    },

    // teachers
    'teachers_add': (_event) => {
        const p = /^010[0-9]{8}$/g;
        if (!(_event === 'TA' && teachers_add__name.value && p.test(teachers_add__phone.value))) return;
        
        teachers_add__save.classList.add('hidden');
        const data = {
            name: teachers_add__name.value,
            phone: '+82' + teachers_add__phone.value.slice(1),
        };
        
        return firebase.functions().httpsCallable('addTeacher')(data).catch(alert).then(() => {
            teachers_add__name.value = null;
            teachers_add__phone.value = null;
            return;
        });
    },
    'teachers_delete': (_event) => {
        if (_event !== 'TD') return;

        teachers_delete__save.classList.add('hidden');

        return firebase.functions().httpsCallable('deleteTeacher')({
            uid: ref.teachers.uid,
        }).catch(alert).then(() => {
            teachers_delete__save.classList.remove('hidden');
            return false;
        });
    },

    // words
    'words_manageBooks_D': (_event) => {
        const W = ref.words.words[ref.words.currentIndex];
        if (_event !== 'WE' || (words_manageBooks_D__pronunciations.value == W.pronunciations && words_manageBooks_D__meanings.value == W.meanings)) return;

        words_manageBooks_D__save.classList.add('hidden');
        ref.words.words[ref.words.currentIndex].pronunciations = words_manageBooks_D__pronunciations.value;
        ref.words.words[ref.words.currentIndex].meanings = words_manageBooks_D__meanings.value;
        // console.log(words);
        return ref.words.ref.doc(ref.words.bookId).collection('groups').doc(ref.words.groupId).update({
            words: ref.words.words,
        });
    },
    'words_uploadBook': (_event) => {
        if (!(_event === 'WU' && Object.keys(ref.words.bookData).length && words_uploadBook__title.value)) return;
        
        words_uploadBook__save.classList.add('hidden');
        return ref.words.ref.add({
            name: words_uploadBook__title.value,
        }).then(bookRef => {
            const batch = db.batch();
            bookRef = ref.words.ref.doc(bookRef.id).collection('groups');
            for (const key in ref.words.bookData) {
                batch.set(bookRef.doc(key.replaceAll(' ', '-').toLowerCase()), {
                    name: key,
                    words: ref.words.bookData[key],
                });
            }
            
            words_uploadBook__title.value = null;
            words_uploadBook__file.value = null;
            ref.words.bookData = {};

            return batch.commit();
        });
    },
    'words_manageBooks_renameBook': (_event) => {
        if (!(_event === 'WR' && words_manageBooks_renameBook__title.value)) return;

        words_manageBooks_renameBook__save.classList.add('hidden');
        return ref.words.ref.doc(ref.words.bookId).update({
            name: words_manageBooks_renameBook__title.value,
        }).then(() => {
            words_manageBooks_renameBook__title.value = null;
        });
    },
    'words_manageBooks_deleteBook': (_event) => {
        if (_event !== 'WD') return;

        words_manageBooks_deleteBook__save.classList.add('hidden');
        return ref.words.ref.doc(ref.words.bookId).delete();
    },
};

var openSection = async (depth, sectionId, openingOption, closingOption) => {
    container.classList.remove('active');
    for (i = liveSection.length; i > depth; i--) {
        const x = liveSection.pop();
        const e = document.getElementById(x);

        if (x in beforeClose) {
            await beforeClose[x](closingOption);
        }
        e.classList.remove('active');
        e.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
    }

    document.querySelectorAll(`#${liveSection[depth - 1]} li`).forEach(l => l.classList.remove('selected'));
    document.getElementById(`open__${sectionId}${openingOption ? `:${openingOption.replaceAll(' ', '_')}` : ''}`).classList.add('selected');

    if (sectionId in beforeOpen) {
        await beforeOpen[sectionId](openingOption);
    }

    document.getElementById(sectionId).classList.add('active');
    liveSection.push(sectionId);
    document.getElementsByTagName('html')[0].scrollLeft += 10000;
    container.classList.add('active');
    return false;
};


var students_main__updated = () => {
    const data = new FormData(students_main__form);
    const name = data.get('name');
    const schoolName = data.get('schoolName');
    const schoolYear = Number(data.get('schoolYear'));
    const schoolStatus = data.get('schoolStatus');
    
    let res = [];
    for (const [studentId, Data] of Object.entries(ref.students.data)) {
        if (name && !Data.name.includes(name)) continue;
        if (schoolName && !Data.school.name.includes(schoolName)) continue;
        if (schoolYear && Data.school.year != schoolYear) continue;
        if (schoolStatus && Data.school.status != schoolStatus) continue;

        res.push(`<li id="open__students_edit:${studentId}" onclick="openSection(2, 'students_edit', '${studentId}');"><span>${Data.name}</span><span class="detail">${Data.school.name} ${Data.school.year}</span></li>`);
    }
    students_main__list.innerHTML = res.join('');
};

students_upload__file.addEventListener('change', event => {
    students_upload__save.classList.add('hidden');
    let reader = new FileReader();
    reader.onload = () => {
        let data = reader.result;
        let workbook = XLSX.read(data, {type: 'binary'});
        const raw = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        for (const e of raw) {
            if ('name' in e && 'phone' in e && 'schoolName' in e && 'schoolYear' in e) {
                const x = {
                    name: e.name,
                    phone: '+82' + e.phone.replaceAll('-', '').slice(1),
                    phone_parent: 'phone_parent' in e ? '+82' + e.phone_parent.replaceAll('-', '').slice(1) : false,
                    school: {
                        name: e.schoolName,
                        year: e.schoolYear,
                        status: 'IN',
                    },
                };
                ref.students.rawData.push(x);
            } else {
                alert('비정상적인 데이터가 포함되어있습니다: ' + e);
                ref.students.rawData = [];
                break;
            }
        };
        if (Object.keys(ref.students.rawData).length) {
            students_upload__save.classList.remove('hidden');
        }
    };
    reader.readAsBinaryString(event.target.files[0]);
}, false);
var students_edit__updated = () => {
    const original = ref.students.data[ref.students.uid];
    const data = new FormData(students_edit__form);
    const p = /^010[0-9]{8}$/;
    
    if (
        p.test(data.get('phone')) && (
            (!data.get('phone_parent') && !original.phone_parent) || p.test(data.get('phone_parent'))
        ) && (
            data.get('name') != original.name || data.get('schoolName') != original.school.name || Number(data.get('schoolYear')) != Number(original.school.year) || data.get('schoolStatus') != original.school.status || data.get('phone') != `0${original.phone.slice(3)}` || data.get('phone_parent') != original.phone_parent
        )
    ) {
        students_edit__save.classList.remove('hidden');
    } else {
        students_edit__save.classList.add('hidden');
    }
};

var teachers_add__updated = () => {
    const p = /^010[0-9]{8}$/;
    if (teachers_add__name.value && p.test(teachers_add__phone.value)) {
        teachers_add__save.classList.remove('hidden');
    } else {
        teachers_add__save.classList.add('hidden');
    }
};

var words_manageBooks_D__updated = () => {
    const W = ref.words.words[ref.words.currentIndex];
    if (words_manageBooks_D__pronunciations.value != W.pronunciations || words_manageBooks_D__meanings.value != W.meanings) {
        words_manageBooks_D__save.classList.remove('hidden');
    } else {
        words_manageBooks_D__save.classList.add('hidden');
    }
};
words_uploadBook__file.addEventListener('change', event => {
    words_uploadBook__save.classList.add('hidden');
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
                if (x.group in ref.words.bookData) {
                    ref.words.bookData[x.group].push(x);
                } else {
                    ref.words.bookData[x.group] = [x];
                }
            } else {
                ref.words.bookData = {};
                break;
            }
        };
        if (Object.keys(ref.words.bookData).length && words_uploadBook__title.value) {
            words_uploadBook__save.classList.remove('hidden');
        }
    };
    reader.readAsBinaryString(event.target.files[0]);
}, false);
words_uploadBook__title.addEventListener('change', event => {
    if (Object.keys(ref.words.bookData).length && words_uploadBook__title.value) {
        words_uploadBook__save.classList.remove('hidden');
    } else {
        words_uploadBook__save.classList.add('hidden');
    }
});
words_manageBooks_renameBook__title.addEventListener('change', event => {
    if (words_manageBooks_renameBook__title.value) {
        words_manageBooks_renameBook__save.classList.remove('hidden');
    } else {
        words_manageBooks_renameBook__save.classList.add('hidden');
    }
});