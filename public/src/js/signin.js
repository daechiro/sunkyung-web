var db = firebase.firestore();
const user = firebase.auth().currentUser;

firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        const data = await Promise.all([
            firebase.firestore().collection('parents').doc(user.uid).get().then(doc => doc.exists ? doc.data().children : false).catch(() => false),
            firebase.firestore().collection('students').doc(user.uid).get().then(doc => doc.exists).catch(() => false),
        ]);
        if (data[0] && data[0].length > 1) {
            location.replace('/app/students');
        } else if (data[0] && data[0].length) {
            location.replace(`/app/${data[0][0]}`);
        } else if (data[1]) {
            location.replace(`/app/${user.uid}`);
        } else if (await db.collection('teachers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
            location.replace('/class');
        } else if (await firebase.firestore().collection('managers').doc(user.uid).get().then(doc => doc.exists).catch(() => false)) {
            location.replace('/admin');
        }
    }
});

var ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.start('#firebaseui-auth-container', {
    signInSuccessUrl: '/',
    signInOptions: [{
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        defaultCountry: 'KR',
    }],
});