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
const classData = {
    add: {
        modal: document.getElementById('modal_addClass'),
        form: document.getElementById('form_addClass'),
        open: () => {
            classData.add.modal.querySelector('.sk-modal-body').style.display = 'block';
            classData.add.modal.querySelector('.sk-loading').style.display = 'none';
            classData.add.modal.classList.remove('inactive');
        },
        close: () => {
            classData.add.form.reset();
            classData.add.modal.classList.add('inactive');
        },
        save: () => {
            loading.open();
            const data = new FormData(classData.edit.form);
            const classData = {
                name: data.get('name'),
                teachers: [],
                students: [],
                open: firebase.firestore.Timestamp.fromDate(new Date(data.get('open'))),
                close: firebase.firestore.Timestamp.fromDate(new Date(data.get('close'))),
                note: data.get('note'),
            };
            firebase.firestore().collection('classes').add(classData).catch(e => console.error(e)).then(refresh);
            classData.add.close();
            loading.close();
            return false;
        },
    },
    edit: {
        modal: document.getElementById('modal_editInfo'),
        form: document.getElementById('form_editInfo'),
        classId: '',
        open: (classId) => {
            classData.edit.classId = classId;
            classData.edit.modal.classList.remove('inactive');
        },
        close: () => {
            classData.edit.classId = '';
            classData.edit.form.reset();
            classData.edit.modal.classList.add('inactive');
        },
        save: () => {
            loading.open();
            const data = new FormData(classData.edit.form);
            const classData = {
                name: data.get('name'),
                open: firebase.firestore.Timestamp.fromDate(new Date(data.get('open'))),
                close: firebase.firestore.Timestamp.fromDate(new Date(data.get('close'))),
                note: data.get('note'),
            };
            firebase.firestore().collection('classes').doc(classData.edit.classId).update(classData).catch(e => console.error(e)).then(refresh);
            classData.edit.close();
            loading.close();
            return false;
        },
    },
    del: {
        modal: document.getElementById('modal_deleteClass'),
        classId: '',
        open: (classId) => {
            classData.del.classId = classId;
            classData.del.modal.classList.remove('inactive');
        },
        close: () => {
            classData.del.classId = '';
            classData.del.modal.classList.add('inactive');
        },
        del: () => {
            loading.open();
            firebase.firestore().collection('classes').doc(classData.del.classId).delete().catch(e => console.error(e)).then(refresh);
            classData.del.close();
            loading.close();
            return false;
        },
    },
};

var refresh = () => {
    loading.open();
    firebase.firestore().collection('classes').orderBy('open').get().then(snapshot => {
        // for (const doc of snapshot.docs) {
        //     const data = doc.data();
        //     const now = new Date();
        //     const open = new Date(data.open.seconds * 1000);
        //     const close = new Date(data.close.seconds * 1000);
        //     let card = document.createElement('a');
        //     card.classList.add('sk-card');
        //     card.href = `/class/${doc.id}`;
        //     card.innerHTML = `<p class="title">${data.name}</p><p class="text">${open.toLocaleDateString()} – ${close.toLocaleDateString()}</p>`;
        //     if (close.getTime() >= now.getTime()) {
        //         document.getElementById('openedClasses').prepend(card);
        //     } else {
        //         document.getElementById('closedClasses').prepend(card);
        //     }
        // }
        loading.close();
    });
};