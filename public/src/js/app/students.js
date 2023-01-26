const db = firebase.firestore();
const user = firebase.auth().currentUser;

localStorage.setItem('back', false);

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        const data = await Promise.all([
            firebase.firestore().collection('parents').doc(user.uid).get().then(doc => doc.exists ? doc.data().children : false).catch(() => false),
            firebase.firestore().collection('students').doc(user.uid).get().then(doc => doc.exists).catch(() => false),
        ]);
        if (data[0] && data[0].length > 1) {
            const children = await db.collection('parents').doc(user.uid).get().then(doc => doc.exists ? doc.data().children : []).catch(() => false);
            if (children.length < 1) {
                if (await db.collection('students').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
                    location.replace(`/app/${user.uid}`);
                } else if (await db.collection('teachers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
                    location.replace('/class');
                } else if (await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
                    location.replace('/admin');
                } else {
                    alert('이용할 수 없는 계정입니다');
                    firebase.auth().signOut();
                    location.replace('/signin');
                }
                return 0;
            } else if (children.length == 1) {
                location.replace(`/app/${children[0]}`);
            } {
                Promise.all(children.map(student => {
                    return db.collection('students').doc(student).get().then(doc => `<li onclick="location.href = '/app/${student}'">${doc.data().name}</li>`).catch(console.error);
                })).then(values => {
                    document.getElementById('list').innerHTML = values.join('');
                    document.getElementsByTagName('body')[0].classList.add('active');
                }).catch(async () => {
                    if (await db.collection('teachers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
                        location.replace('/class');
                    } else if (await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
                        location.replace('/admin');
                    } else {
                        alert('이용할 수 없는 계정입니다');
                        // firebase.auth().signOut();
                        // location.replace('/signin');
                    }
                    return 0;
                });
            }
        } else if (data[0] && data[0].length) {
            location.replace(`/app/${data[0][0]}`);
        } else if (data[1]) {
            location.replace(`/app/${user.uid}`);
        } else if (await db.collection('teachers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
            location.replace('/class');
        } else if (await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
            location.replace('/admin');
        }
    } else {
        location.replace('/signin');
        return 0;
    }
});