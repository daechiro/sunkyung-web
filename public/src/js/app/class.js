let params = location.pathname.split('/');
const classId = params.pop();
const studentId = params.pop();
const db = firebase.firestore();
const studentRef = db.collection('students').doc(studentId);
const classRef = db.collection('classes').doc(classId);

let list0 = [], list1 = [], list2 = [];

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

Promise.all([
    studentRef.get().then(doc => {
        document.getElementById('student').innerHTML = doc.data().name;
    }).catch(() => location.replace('/signin')),

    classRef.get().then(async doc => {
        const classData = doc.data();
        document.getElementById('name').innerHTML = classData.name;
        document.getElementById('info-time').innerHTML = new Date(classData.open.seconds * 1000).toLocaleDateString('ko-KR') + ' — ' + new Date(classData.close.seconds * 1000).toLocaleDateString('ko-KR');
        document.getElementById('info-teacher').innerHTML = (await Promise.all(classData.teachers.map(x => db.collection('teachers').doc(x).get().then(d => d.data().name)))).join(', ');
    }).catch(() => location.replace('/signin')),

    classRef.collection('lectures').orderBy('open').get().then(snapshot => {
        const today = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
        snapshot.forEach(doc => {
            const lecture = Object.assign(doc.data(), { id: doc.id, });
            const openingDate = Math.floor(lecture.open.seconds / (24 * 60 * 60));
            const closingDate = Math.floor(lecture.close.seconds / (24 * 60 * 60)) + 1;
            if (today >= closingDate) {
                const D = new Date((lecture.open.seconds + lecture.close.seconds) * 500);
                const y = D.getFullYear();
                const m = D.getMonth() + 1;
                const j = list1.findIndex(x => x.month == m && x.year == y);
                if (j == -1) {
                    list1.push({
                        year: y,
                        month: m,
                        lectures: [lecture],
                    });
                } else {
                    list1[j].lectures.push(lecture);
                }
            } else if (today < openingDate) {
                list2.push(lecture);
            } else {
                list0.push(lecture);
            }
        });
        refreshList();
        document.getElementById('banner').innerHTML = `<li onclick="location.href = '/app/${studentId}/${classId}/report'">성적 분석</li>`
    }).catch(() => location.replace('/signin')),
]).then(() => {
    setTimeout(() => {
        document.getElementsByTagName('body')[0].classList.add('active');
    }, 100);
});

var refreshList = () => {
    document.getElementById('list-0').innerHTML = list0.length ? list0.map(lecture => {
        return `<li onclick="location.href = '/app/${studentId}/${classId}/${lecture.id}'">${lecture.name}</li>`;
    }).join('') : '<li class="disabled">오늘은 수업이 없습니다</li>';
    if (list1.length) {
        document.getElementById('list-1').innerHTML = list1.reverse().map(lectureGroup => {
            return `<h3>${lectureGroup.year}년 ${lectureGroup.month}월</h3><ul>${
                lectureGroup.lectures.reverse().map(lecture => {
                    return `<li onclick="location.href = '/app/${studentId}/${classId}/${lecture.id}'">${lecture.name}</li>`;
                }).join('')
            }</ul>`;
        }).join('');
    } else {
        document.getElementById('list-1-title').style.display = 'none';
        document.getElementById('list-1').style.display = 'none';
    }
    if (list2.length) {
        document.getElementById('list-2').innerHTML = list2.map(lecture => {
            return `<li onclick="location.href = '/app/${studentId}/${classId}/${lecture.id}'">${lecture.name}</li>`;
        }).join('');
    } else {
        document.getElementById('list-2-title').style.display = 'none';
        document.getElementById('list-2').style.display = 'none';
    }
};

var back = () => {
    localStorage.setItem('back', 'true');
    history.back();
    location.replace(`/app/${studentId}`);
};