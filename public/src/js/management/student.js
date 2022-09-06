const user = firebase.auth().currentUser;
firebase.auth().onAuthStateChanged(async (user) => {
    if (user && (await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false))) {
        refresh();
    } else {
        location.replace('/signin');
    }
});

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
const students = {
    list: [],
    search: {
        option: '',
        query: '',
        search: () => {

        },
    },
    add: {
        modal: document.getElementById('modal_addStudent'),
        form: document.getElementById('form_addStudent'),
        open: () => {
            students.add.modal.classList.remove('inactive');
        },
        close: () => {
            students.add.modal.classList.add('inactive');
            students.add.form.reset();
        },
        add: () => {
            loading.open();
            const data = new FormData(students.add.form);
            const __phone_parent = data.get('phone_parent') ? '+82' + data.get('phone_parent').slice(1) : false;
            const studentData = {
                name: data.get('name'),
                phone: '+82' + data.get('phone').slice(1),
                phone_parent: __phone_parent,
                school: {
                    name: data.get('schoolName'),
                    year: Number(data.get('schoolYear')),
                    status: data.get('schoolStatus'),
                },
            };
            var addStudent = firebase.functions().httpsCallable('addStudent');
            addStudent(studentData).then(refresh).then(loading.close);
            students.add.close();
            return false;
        },
    },
    edit: {
        modal: document.getElementById('modal_editStudent'),
        form: document.getElementById('form_editStudent'),
        uid: '',
        open: (uid) => {
            students.edit.uid = uid;
            firebase.firestore().collection('students').doc(uid).get().then(async doc => {
                const Data = doc.data();
                students.edit.form.querySelector('input[name="name"]').value = Data.name;
                students.edit.form.querySelector('input[name="phone"]').value = `0${Data.phone.slice(3)}`;
                students.edit.form.querySelector('input[name="phone_parent"]').value = Data.parent ? await firebase.firestore().collection('parents').doc(Data.parent).get().then(doc => doc.exists ? `0${doc.data().phone.slice(3)}` : '').catch(() => '') : '';;
                students.edit.form.querySelector('input[name="schoolName"]').value = Data.school.name;
                students.edit.form.querySelector('input[name="schoolYear"]').value = Data.school.year;
                students.edit.form.querySelector('select[name="schoolStatus"]').value = Data.school.status;
            }).then(() => {
                students.edit.modal.classList.remove('inactive');
            });
        },
        close: () => {
            students.edit.modal.classList.add('inactive');
            students.edit.form.reset();
        },
        edit: () => {
            loading.open();
            const data = new FormData(students.edit.form);
            const __phone_parent = data.get('phone_parent') ? '+82' + data.get('phone_parent').slice(1) : false;
            const studentData = {
                uid: students.edit.uid,
                name: data.get('name'),
                phone: '+82' + data.get('phone').slice(1),
                phone_parent: __phone_parent,
                school: {
                    name: data.get('schoolName'),
                    year: Number(data.get('schoolYear')),
                    status: data.get('schoolStatus'),
                },
            };
            var editStudent = firebase.functions().httpsCallable('editStudent');
            editStudent(studentData).then(refresh).then(loading.close);
            students.edit.close();
            return false;
        },
    },
    del: {
        modal: document.getElementById('modal_deleteStudent'),
        name: document.getElementById('name_deleteStudent'),
        uid: '',
        open: (uid, name) => {
            students.del.modal.classList.remove('inactive');
            students.del.name.innerHTML = name;
            students.del.uid = uid;
        },
        close: () => {
            students.del.modal.classList.add('inactive');
            students.del.uid = '';
        },
        del: () => {
            loading.open();
            var deleteStudent = firebase.functions().httpsCallable('deleteStudent');
            deleteStudent({ uid: students.del.uid, }).then(refresh).then(loading.close);
            students.del.close();
            return false;
        },
    },
};

var refresh = (option = {}) => {
    loading.open();
    document.getElementById('students').innerHTML = null;
    return firebase.firestore().collection('students').orderBy('name').get().then(async snapshot => {
        
        // var deleteStudent = firebase.functions().httpsCallable('deleteStudent');
        // for (doc of snapshot.docs) {
        //     if (doc.id == 'mwSNkfrlwDUW4U6vlpQuAewMxmu1') continue;
        //     deleteStudent({ uid: doc.id, });
        // }
        // console.log(snapshot.docs.length);
        students.list = await Promise.all(snapshot.docs.map(doc => Promise.all([
            firebase.firestore().collection('parents').doc(doc.data().parent ? doc.data().parent : 'a').get().then(doc => doc.exists ? doc.data().phone : '').catch(() => ''),
            Promise.all(doc.data().classes.map(classId => firebase.firestore().collection('classes').doc(classId).get().then(doc => {
                if (doc.exists) {
                    return doc.data().name;
                } else {
                    return '';
                }
            }))),
        ]).then(values => Object.assign(doc.data(), { phone_parent: values[0], classNames: values[1].filter(x => x), uid: doc.id, }))));
        if ('orderBy' in option) {
            if (option.orderBy == 'schoolName') {
                students.list.sort((a, b) => {
                    if (a.school.name < b.school.name) return -1;
                    if (a.school.name > b.school.name) return 1;
                    return 0;
                });
            } else if (option.orderBy == 'schoolYear') {
                students.list.sort((a, b) => {
                    if (a.school.year < b.school.year) return -1;
                    if (a.school.year > b.school.year) return 1;
                    return 0;
                });
            }
        }
        for (student of students.list) {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${student.school.name}</td>
                <td class="center">${student.school.year}</td>
                <td class="center">${{ IN: '재학', OFF: '휴학', GRADUATED: '졸업', }[student.school.status]}</td>
                <td>0${student.phone.slice(3)}</td>
                <td>0${student.phone_parent.slice(3)}</td>
                <td>${student.classNames.join(', ')}</td>
                <td class="edit">
                    <span class="material-icons-round" onclick="students.edit.open('${student.uid}');">create</span>
                    <span class="material-icons-round" onclick="students.del.open('${student.uid}', '${student.name}');">delete</span>
                </td>`;
            document.getElementById('students').appendChild(tr);
        }
    }).then(loading.close);
};


// const raw = [];

// var upload = () => {
//     var addStudent = firebase.functions().httpsCallable('addStudent');
//     Promise.all(raw.map(s => {
//         const studentData = {
//             name: s.name,
//             phone: s.phone,
//             phone_parent: s.phone_parent,
//             school: {
//                 name: s.schoolName,
//                 year: 3,
//                 status: 'IN',
//             },
//         };
//         return addStudent(studentData);
//     })).then(refresh);
// };