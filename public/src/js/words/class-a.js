const db = firebase.firestore();
const user = firebase.auth().currentUser;

localStorage.setItem('back', false);

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        const type = await Promise.all([
            db.collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false),
            db.collection('students').doc(user.uid).get().then(doc => doc.exists).catch(() => false),
            db.collection('teachers').doc(user.uid).get().then(doc => doc.exists).catch(() => false),
        ]);
        if (!type.includes(true)) {
            alert('이용할 수 없는 계정입니다');
            firebase.auth().signOut();
            location.replace('/words/signin');
        }
    } else {
        location.replace('/words/signin');
    }
});

Promise.all([
    db.collection('words').get().then(snapshot => {
        document.getElementById('list').innerHTML = snapshot.docs.map(doc => {
            return `<li onclick="location.href = '/words/${doc.id}'">${doc.data().name}</li>`;
        }).join('');
    }).catch(() => location.replace('/words/signin')),
]).then(() => {
    document.getElementsByTagName('body')[0].classList.add('active');
});