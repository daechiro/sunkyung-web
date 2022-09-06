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


const addClass = {
    modal: document.getElementById('modal_addClass'),
    form: document.getElementById('form_addClass'),
    open: () => {
        addClass.modal.querySelector('.sk-modal-body').style.display = 'block';
        addClass.modal.querySelector('.sk-loading').style.display = 'none';
        addClass.modal.classList.remove('inactive');
    },
    close: () => {
        addClass.form.reset();
        addClass.modal.classList.add('inactive');
    },
    wait: () => {
        addClass.modal.querySelector('.sk-modal-body').style.display = 'none';
        addClass.modal.querySelector('.sk-loading').style.display = 'block';
    },
    save: () => {
        const classData = {
            name: addClass.form.children[0].value,
            teachers: [firebase.auth().currentUser.uid],
            students: [],
            open: firebase.firestore.Timestamp.fromDate(new Date(addClass.form.children[1].value)),
            close: firebase.firestore.Timestamp.fromDate(new Date(addClass.form.children[2].value)),
            note: addClass.form.children[3].value,
        };
        firebase.firestore().collection('classes').add(classData).catch(e => console.error(e)).then(refresh);
        addClass.wait();
        return false;
    },
};

var refresh = (auth) => {
    document.getElementById('openedClasses').innerHTML = null;
    document.getElementById('closedClasses').innerHTML = null;
    let classRef = '';
    if (auth == 'manager') {
        classRef = firebase.firestore().collection('classes').orderBy('open');
    } else {
        classRef = firebase.firestore().collection('classes').where('teachers', 'array-contains', firebase.auth().currentUser.uid).orderBy('open')
    }
    classRef.get().then(snapshot => {
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const now = new Date();
            const open = new Date(data.open.seconds * 1000);
            const close = new Date(data.close.seconds * 1000);
            let card = document.createElement('a');
            card.classList.add('sk-card');
            card.href = `/class/${doc.id}`;
            card.innerHTML = `<p class="title">${data.name}</p><p class="text">${open.toLocaleDateString()} – ${close.toLocaleDateString()}</p>`;
            if (close.getTime() >= now.getTime()) {
                document.getElementById('openedClasses').prepend(card);
            } else {
                document.getElementById('closedClasses').prepend(card);
            }
        }
        addClass.close();
    });
};