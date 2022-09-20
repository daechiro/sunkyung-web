var db = firebase.firestore();
const user = firebase.auth().currentUser;

firebase.auth().languageCode = 'ko';
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
    } else {
        form_phone.focus();
        document.getElementsByTagName('body')[0].classList.add('active');
    }
});

form_phone.addEventListener('input', (e) => {
    const p = /^010[0-9]{8}$/;
    if (form_phone.value && p.test(form_phone.value)) {
        form_submit.classList.remove('hidden');
    } else {
        form_submit.classList.add('hidden');
    }
}, false);
form_code.addEventListener('input', (e) => {
    const p = /^[0-9]{6}$/;
    if (form_code.value && p.test(form_code.value)) {
        form_login.classList.remove('hidden');
    } else {
        form_login.classList.add('hidden');
    }
}, false);

var getCode = () => {
    form_phone.disabled = true;
    form_submit.classList.add('hidden');
    form_title.innerText = '선경어학원 로그인';
    firebase.auth().signInWithPhoneNumber('+82' + form_phone.value.slice(1), window.recaptchaVerifier).then((confirmationResult) => {
        window.confirmationResult = confirmationResult;
    }).catch((error) => {
        console.error(error);
        window.recaptchaVerifier.render().then((widgetId) => {
            grecaptcha.reset(widgetId);
        });
        form_phone.value = '';
        form_phone.disabled = false;
        form_title.innerText = '오류가 발생했습니다. 다시 시도해주세요.';
    }).then(() => {
        form_phone_container.classList.remove('no-border');
        form_code_container.classList.remove('hidden');
        form_code.focus();
    });
    return false;
};
form_submit.addEventListener('click', getCode, false);

var login = () => {
    form_code.disabled = true;
    form_login.classList.add('hidden');
    form_title.innerText = '선경어학원 로그인';
    confirmationResult.confirm(form_code.value).then(async (result) => {
        const user = result.user;
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
    }).catch((error) => {
        form_code.disabled = false;
        form_title.innerText = '다시 시도해주세요.';
        form_code.value = '';
        form_code.focus();
    });
}
form_login.addEventListener('click', login, false);

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('form_submit', {
    'size': 'invisible',
    'callback': (response) => {
        console.log('veryfing');
    }
});

// var ui = new firebaseui.auth.AuthUI(firebase.auth());
// ui.start('#firebaseui-auth-container', {
//     signInSuccessUrl: '/',
//     signInOptions: [{
//         provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
//         defaultCountry: 'KR',
//     }],
// });