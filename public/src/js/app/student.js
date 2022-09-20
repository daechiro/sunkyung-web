const db = firebase.firestore();
const user = firebase.auth().currentUser;
let params = location.pathname.split('/');
const studentId = params.pop();
const studentRef = db.collection('students').doc(studentId);
const classesRef = db.collection('classes');

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

studentRef.get().then(doc => {
    const Data = doc.data();
    if (Data.classes.length == 1) {
        location.replace(`/app/${studentId}/${Data.classes[0]}`);
    };
    document.getElementById('name').innerHTML = Data.name;
    return Promise.all([
        db.collection('parents').doc(Data.parent).get().then(doc => {
            if (doc.exists && doc.data().children.length > 1) {
                document.getElementById('header').style.display = 'flex';
                // document.getElementsByTagName('body')[0].classList.remove('fixed');
            } else {
                localStorage.setItem('back', 'false');
                document.getElementsByTagName('body')[0].classList.add('fixed');
            }
            return true;
        }).catch(() => false),

        Promise.all(Data.classes.map(classId => classesRef.doc(classId).get().then(doc => {
            if (!doc.exists) return '';
            return `<li onclick="location.href = '/app/${studentId}/${doc.id}'">${doc.data().name}</li>`;
        }))).then(values => {
            values = values.filter(x => x);
            if (values.length) document.getElementById('list').innerHTML = values.join('');
        }),
    ]).then(() => {
        setTimeout(() => {
            document.getElementsByTagName('body')[0].classList.add('active');
        }, 100);
    });
}).catch(() => location.replace('/signin'));

// studentRef.get().then(doc => {
//     const Data = doc.data();
//     document.getElementById('name').innerHTML = Data.name;
//     Promise.all(Data.classes.map(classId => classesRef.doc(classId).get().then(doc => {
//         if (!doc.exists) return '';
//         return `<li onclick="location.href = '/app/${studentId}/${doc.id}'">${doc.data().name}</li>`;
//     }))).then(values => {
//         values = values.filter(x => x);
//         if (values.length) document.getElementById('list').innerHTML = values.join('');
//         setTimeout(() => {
//             document.getElementsByTagName('body')[0].classList.add('active');
//         }, 100);
//     });
// }).catch(() => location.replace('/signin'));

// firebase.auth().onAuthStateChanged(async (user) => {
//     if (user) {
//         const children = await db.collection('parents').doc(user.uid).get().then(doc => doc.exists ? doc.data().children : []).catch(() => false);
//         if (children.length > 1) {
//             document.getElementById('header').style.display = 'flex';
//             document.getElementsByTagName('body')[0].classList.remove('fixed');
//         }
//     }
// });

var back = () => {
    localStorage.setItem('back', 'true');
    location.replace(`/app`);
};