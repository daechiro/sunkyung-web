const user = firebase.auth().currentUser;
firebase.auth().onAuthStateChanged(async (user) => {
    if (user && (await firebase.firestore().collection('teachers').doc(user.uid).get().then(doc => doc.exists).catch(() => false))) {
        refresh();
    } else if (user && (await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false))) {
        refresh('manager');
        // document.getElementById('navigation').innerHTML = '<a class="active" href="/class">수업</a><a href="/management/student">학생</a><a href="/management/teacher">강사</a><a href="/words/manage">단어</a>';
    } else {
        location.replace('/signin');
    }
});

const classId = location.pathname.split('/').pop();
const CLASS = firebase.firestore().collection('classes').doc(classId);

const loading = {
    modal: document.getElementById('modal_loading'),
    que: 0,
    open: () => {
        loading.modal.classList.remove('inactive');
        loading.que++;
    },
    close: () => {
        loading.que--;
        if (!loading.que) loading.modal.classList.add('inactive');
    },
}
const addLecture = {
    modal: document.getElementById('modal_addLecture'),
    form: document.getElementById('form_addLecture'),
    open: () => {
        addLecture.modal.classList.remove('inactive');
    },
    close: () => {
        addLecture.form.reset();
        addLecture.modal.classList.add('inactive');
    },
    autoFill: () => {
        let O = new Date(addLecture.form.querySelector('input[name="open"]').value);
        O = new Date(O.getTime() - (O.getTimezoneOffset() * 60 * 1000));
        addLecture.form.querySelector('input[name="close"]').value = `${O.toISOString().split('T')[0]}T22:00`;
    },
    save: () => {
        loading.open();
        const data = new FormData(addLecture.form);
        const lectureData = {
            name: data.get('name'),
            open: firebase.firestore.Timestamp.fromDate(new Date(data.get('open'))),
            close: firebase.firestore.Timestamp.fromDate(new Date(data.get('close'))),
            note: data.get('note'),
            videos: [],
            tests: [],
        };
        CLASS.collection('lectures').add(lectureData).catch(e => console.error(e)).then(refreshLectures);
        addLecture.close();
        loading.close();
        return false;
    },
};
const editInfo = {
    modal: document.getElementById('modal_editInfo'),
    form: document.getElementById('form_editInfo'),
    open: () => {
        editInfo.modal.classList.remove('inactive');
    },
    close: () => {
        editInfo.form.reset();
        editInfo.modal.classList.add('inactive');
    },
    save: () => {
        loading.open();
        const data = new FormData(editInfo.form);
        const classData = {
            name: data.get('name'),
            open: firebase.firestore.Timestamp.fromDate(new Date(data.get('open'))),
            close: firebase.firestore.Timestamp.fromDate(new Date(data.get('close'))),
            note: data.get('note'),
        };
        CLASS.update(classData).catch(e => console.error(e)).then(refreshInfo);
        editInfo.close();
        loading.close();
        return false;
    },
};
const deleteClass = {
    modal: document.getElementById('modal_deleteClass'),
    open: () => {
        deleteClass.modal.classList.remove('inactive');
    },
    close: () => {
        deleteClass.modal.classList.add('inactive');
    },
    del: () => {
        loading.open();
        CLASS.delete().catch(e => console.error(e)).then(() => {
            location.replace('/class');
        });
        deleteClass.close();
        return false;
    },
};
const students = {
    add: {
        modal: document.getElementById('modal_addStudent'),
        query: document.getElementById('query_addStudent'),
        tbody: document.getElementById('tbody_addStudent'),
        list: [],
        open: async () => {
            loading.open();
            students.add.modal.classList.remove('inactive');
            students.add.list = await firebase.firestore().collection('students').get().then(s => s.docs.map(D => Object.assign(D.data(), { uid: D.id, })));
            loading.close();
        },
        close: () => {
            students.add.query.value = '';
            students.add.tbody.innerHTML = '';
            students.add.modal.classList.add('inactive');
        },
        search: () => {
            students.add.tbody.innerHTML = '';
            if (students.add.query.value) {
                for (const student of students.add.list.filter(s => s.name.includes(students.add.query.value))) {
                    let tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${student.name}</td>
                        <td>${student.school.name}</td>
                        <td>0${student.phone.slice(3)}</td>
                        <td class="edit">
                            <span class="material-icons-round" onclick="students.add.add('${student.uid}');">add</span>
                        </td>`;
                    students.add.tbody.appendChild(tr);
                }
            }
        },
        add: (uid) => {
            loading.open();
            students.add.query.select();
            CLASS.update({
                students: firebase.firestore.FieldValue.arrayUnion(uid),
            }).then(refreshStudents);
            firebase.firestore().collection('students').doc(uid).update({
                classes: firebase.firestore.FieldValue.arrayUnion(classId),
            });
            loading.close();
            return false;
        },
    },
    edit: {

    },
    del: {
        modal: document.getElementById('modal_deleteStudent'),
        name: document.getElementById('name_deleteStudent'),
        button: document.getElementById('button_deleteStudent'),
        open: (uid, name) => {
            students.del.modal.classList.remove('inactive');
            students.del.name.innerHTML = name;
            students.del.button.addEventListener('click', () => { students.del.del(uid); }, false);
        },
        close: () => {
            students.del.modal.classList.add('inactive');
        },
        del: (uid) => {
            loading.open();
            Promise.all([
                CLASS.update({
                    students: firebase.firestore.FieldValue.arrayRemove(uid),
                }),
                firebase.firestore().collection('students').doc(uid).update({
                    classes: firebase.firestore.FieldValue.arrayRemove(classId),
                }),
            ]).then(refreshStudents);
            students.del.close();
            loading.close();
            return false;
        },
    },
};

var refresh = (auth) => {
    loading.open();
    CLASS.get().then(async doc => {
        if (doc.exists) {
            await Promise.all([refreshLectures(auth), refreshInfo(auth), refreshStudents(auth)]);
            loading.close();
        } else {
            alert('존재하지 않는 수업입니다.');
            location.replace('/class');
        }
    }).catch(e => {
        console.error(e);
        alert('접근할 수 없는 수업입니다.');
        location.replace('/class');
    });
}
var refreshLectures = (auth) => {
    loading.open();
    return CLASS.collection('lectures').orderBy('open').get().then(snapshot => {
        document.getElementById('lecture-today').innerHTML = '';
        document.getElementById('lecture-scheduled').innerHTML = '';
        document.getElementById('lecture-past').innerHTML = '';

        const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
        snapshot.forEach(doc => {
            const lecture = doc.data();
            let a = document.createElement('a');
            a.classList.add('sk-card');
            a.href = `/class/${classId}/${doc.id}`;
            a.innerHTML = `<p class="title">${lecture.name}</p>`;
            const date = Math.floor(lecture.open.seconds / (24 * 60 * 60));
            if (today == date) {
                document.getElementById('lecture-today').appendChild(a);
            } else if (today > date) {
                document.getElementById('lecture-past').appendChild(a);
            } else {
                document.getElementById('lecture-scheduled').appendChild(a);
            }
        });
        loading.close();
    });
};
var refreshInfo = (auth) => {
    loading.open();
    return CLASS.get().then(async doc => {
        const classData = doc.data();
        document.getElementById('class-title').innerHTML = classData.name;
        document.getElementById('class-name').innerHTML = classData.name;
        document.getElementById('class-name-deleteClass').innerHTML = classData.name;
        document.getElementById('class-open').innerHTML = new Date(classData.open.seconds * 1000).toLocaleDateString('ko-KR');
        document.getElementById('class-close').innerHTML = new Date(classData.close.seconds * 1000).toLocaleDateString('ko-KR');
        document.getElementById('class-note').innerHTML = classData.note;
        document.getElementById('class-teachers').innerHTML = (await Promise.all(classData.teachers.map(T => firebase.firestore().collection('teachers').doc(T).get().then(doc => doc.data().name)))).join(', ');
        loading.close();
    });
};
var refreshStudents = (auth) => {
    loading.open();
    return CLASS.get().then(async doc => {
        document.getElementById('class-students').innerHTML = '';
        const classData = doc.data();
        for (const student of (await Promise.all(classData.students.map(S => {
            return firebase.firestore().collection('students').doc(S).get().then(doc => {
                if (doc.exists) {
                    const studentData = doc.data();
                    if (studentData.parent) {
                        return firebase.firestore().collection('parents').doc(studentData.parent).get().then(parentDoc => {
                            return Object.assign(studentData, { uid: S, phone_parent: parentDoc.data().phone, });
                        });
                    } else {
                        return Object.assign(studentData, { uid: S, });
                    }
                } else {
                    CLASS.update({
                        students: firebase.firestore.FieldValue.arrayRemove(S),
                    });
                    return false;
                }
            });
        }))).filter(x => x).sort((a, b) => {
            const A = String(a.name);
            const B = String(b.name);
            return A.localeCompare(B, 'ko');
            // if (A < B) return -1;
            // else if (A > B) return 1;
            // else return 0;
        })) {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${student.school.name}</td>
                <td>0${student.phone.slice(3)}</td>
                <td>${student.parent ? '0' + student.phone_parent.slice(3) : ''}</td>
                <td class="edit">
                    <!-- <span class="material-icons-round">create</span> -->
                    <span class="material-icons-round" onclick="students.del.open('${student.uid}', '${student.name}');">delete</span>
                </td>`;
            document.getElementById('class-students').appendChild(tr);
        }
        loading.close();
    });
};