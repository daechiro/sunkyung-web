let params = location.pathname.split('/');
const bookId = params.pop();
const bookRef = firebase.firestore().collection('words').doc(bookId);

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

Promise.all([
    bookRef.get().then(doc => {
        document.getElementById('name').innerHTML = doc.data().name;
    }).catch(() => location.replace('/words')),
    
    bookRef.collection('groups').get().then(snapshot => {
        document.getElementById('list').innerHTML = snapshot.docs.map(doc => {
            return `<li onclick="location.href = '/words/${bookId}/${doc.id}'">${doc.data().name}</li>`;
        }).join('');
    }).catch(() => location.replace('/words')),
]).then(() => {
    document.getElementsByTagName('body')[0].classList.add('active');
});

var back = () => {
    localStorage.setItem('back', 'true');
    history.back();
};