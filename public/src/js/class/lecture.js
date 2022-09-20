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

let params = location.pathname.split('/');
const lectureId = params.pop();
const classId = params.pop();
const CLASS = firebase.firestore().collection('classes').doc(classId);
const LECTURE = CLASS.collection('lectures').doc(lectureId);

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
const addTest = {
    modal: document.getElementById('modal_addTest'),
    form: document.getElementById('form_addTest'),
    open: () => {
        addTest.modal.classList.remove('inactive');
    },
    close: () => {
        addTest.form.reset();
        addTest.modal.classList.add('inactive');
    },
    save: () => {
        loading.open();
        const data = new FormData(addTest.form);
        const _type = data.get('type');
        let _questions = [];
        let _points = 0;
        if (_type == 'VOCA') {
            _points = 100;
            _questions.push({
                multipleChoice: false,
                note: '',
                points: 100,
                type: '단어시험 - 어휘',
            });
        } else if (_type == 'T-12') {
            _points = 12;
            _questions = [
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '밑줄의미', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '주제', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '제목', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '어휘', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '순서', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '순서', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '삽입', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '삽입', },
            ];
        } else if (_type == 'T-15') {
            _points = 15;
            _questions = [
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '밑줄의미', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '주제', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '제목', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '어휘', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '순서', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '순서', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '삽입', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '삽입', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '요약', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '장문', },
                { multipleChoice: true, note: '', answer: 1, points: 1, type: '장문', },      
            ];
        } else if (_type == 'T-45') {
            _points = 100;
            _questions = [
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '듣기', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '목적', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '심경', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '주장', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '밑줄의미', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '요지', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '주제', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '제목', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '도표', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '내용일치', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '안내문', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '안내문', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '어법', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '어휘', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '빈칸', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '무관한', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '순서', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '순서', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '삽입', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '삽입', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '요약', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '장문', },
                { multipleChoice: true, note: '', answer: 1, points: 3, type: '장문', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '장문', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '장문', },
                { multipleChoice: true, note: '', answer: 1, points: 2, type: '장문', },
            ];
        }
        const testData = {
            name: data.get('name'),
            type: _type,
            note: data.get('note'),
            questions: _questions,
            points: _points,
        };
        LECTURE.collection('tests').add(testData).catch(e => console.error(e)).then(Promise.all([refreshTests(), refreshStudents()]));
        addTest.close();
        loading.close();
        return false;
    },
};
const editInfo = {
    modal: document.getElementById('modal_editInfo'),
    form: document.getElementById('form_editInfo'),
    open: () => {
        LECTURE.get().then(doc => {
            const lectureData = doc.data();
            editInfo.form.elements.name.value = lectureData.name;
            editInfo.form.elements.close.value = lectureData.close;
            editInfo.form.elements.note.value = lectureData.note;
            editInfo.form.elements.video.value = lectureData.videos?.[0] ?? null;

            let O = new Date(lectureData.open.seconds * 1000);
            O = new Date(O.getTime() - (O.getTimezoneOffset() * 60 * 1000));
            O = O.toISOString().split('T');
            editInfo.form.elements.open.value = `${O[0]}T${O[1].substring(0, 5)}`;

            let C = new Date(lectureData.close.seconds * 1000);
            C = new Date(C.getTime() - (C.getTimezoneOffset() * 60 * 1000));
            C = C.toISOString().split('T');
            editInfo.form.elements.close.value = `${C[0]}T${C[1].substring(0, 5)}`;

            editInfo.modal.classList.remove('inactive');
        });
    },
    close: () => {
        editInfo.form.reset();
        editInfo.modal.classList.add('inactive');
    },
    autoFill: () => {
        let O = new Date(editInfo.form.querySelector('input[name="open"]').value);
        O = new Date(O.getTime() - (O.getTimezoneOffset() * 60 * 1000));
        editInfo.form.querySelector('input[name="close"]').value = `${O.toISOString().split('T')[0]}T22:00`;
    },
    save: () => {
        loading.open();
        const data = new FormData(editInfo.form);
        const lectureData = {
            name: data.get('name'),
            open: firebase.firestore.Timestamp.fromDate(new Date(data.get('open'))),
            close: firebase.firestore.Timestamp.fromDate(new Date(data.get('close'))),
            note: data.get('note'),
            videos: data.get('video') ? [data.get('video')] : [],
        };
        LECTURE.update(lectureData).catch(e => console.error(e)).then(refreshInfo);
        editInfo.close();
        loading.close();
        return false;
    },
};
const deleteLecture = {
    modal: document.getElementById('modal_deleteLecture'),
    open: () => {
        deleteLecture.modal.classList.remove('inactive');
    },
    close: () => {
        deleteLecture.modal.classList.add('inactive');
    },
    del: () => {
        loading.open();
        LECTURE.delete().catch(e => console.error(e)).then(() => {
            location.replace(`/class/${classId}`);
        });
        deleteLecture.close();
        return false;
    },
};
const students = {
    attend: {
        modal: document.getElementById('modal_students_attend'),
        uid: '',
        time: null,
        open: (uid, name) => {
            students.attend.uid = uid;
            const now = Date.now();
            students.attend.time = firebase.firestore.Timestamp.fromMillis(now);
            document.getElementById('time_students_attend').innerHTML = new Date(now).toLocaleString();
            document.getElementById('name_students_attend').innerHTML = name;
            students.attend.modal.classList.remove('inactive');
        },
        close: () => {
            students.attend.modal.classList.add('inactive');
        },
        save: async (attendance) => {
            // loading.open();
            students.attend.close();
            await LECTURE.collection('attendance').doc(students.attend.uid).set({
                attendance: attendance,
                time: students.attend.time,
            }, { merge: true, }).then(() => {
                const span = document.getElementById(`${students.attend.uid}_attendance`);
                if (attendance) {
                    span.innerHTML = '출석';
                    span.classList.add('blue');
                    span.classList.remove('red');
                } else {
                    span.innerHTML = '결석';
                    span.classList.add('red');
                    span.classList.remove('blue');
                }
            }).catch(refreshStudents);
            // loading.close();
            return false;
        },
    },
    assignment: {
        modal: document.getElementById('modal_students_assignment'),
        form: document.getElementById('form_students_assignment'),
        uid: '',
        type: '',
        open: (uid, name, type) => {
            students.assignment.form.reset();
            students.assignment.uid = uid;
            students.assignment.type = type;
            document.getElementById('name_students_assignment').innerHTML = name;
            document.getElementById('type_assignment').innerHTML = {
                reading: '독해',
                syntax: '구문',
                listening: '듣기',
            }[type];
            LECTURE.collection('attendance').doc(uid).get().then(doc => {
                if (doc.exists) {
                    const Data = doc.data();
                    if ('assignment' in Data && 'comment' in Data.assignment && type in Data.assignment.comment && Data.assignment.comment[type]) {
                        students.assignment.form.querySelector('input[name="comment"]').value = Data.assignment.comment[type];
                    }
                }
            }).then(() => {
                students.assignment.modal.classList.remove('inactive');
            });
        },
        close: () => {
            students.assignment.modal.classList.add('inactive');
        },
        save: async (assignment) => {
            const data = new FormData(students.assignment.form);
            const comment = data.get('comment');
            // loading.open();
            students.assignment.close();
            let updated = {}
            updated[`assignment.${students.assignment.type}`] = assignment;
            updated[`assignment.comment.${students.assignment.type}`] = comment;
            // if (students.assignment.type == 'reading') {
            //     updated = { 'assignment.reading': assignment, };
            // } else if (students.assignment.type == 'syntax') {
            //     updated = { 'assignment.syntax': assignment, };
            // } else {
            //     updated = { 'assignment.listening': assignment, };
            // }
            await LECTURE.collection('attendance').doc(students.assignment.uid).update(updated).then(() => {
                const span = document.getElementById(`${students.assignment.uid}_assignment_${students.assignment.type}`);
                if (assignment) {
                    span.innerHTML = `<b>&nbsp;&nbsp;○${comment ? '*' : ''}&nbsp;&nbsp;</b>`;
                    span.classList.add('blue');
                    span.classList.remove('red');
                } else {
                    span.innerHTML = `<b>&nbsp;&nbsp;⨉${comment ? '*' : ''}&nbsp;&nbsp;</b>`;
                    span.classList.add('red');
                    span.classList.remove('blue');
                }
            }).catch(async (error) => {
                console.log(error)
                // let temp = { assignment: {}, };
                // temp.assignment[`${students.assignment.type}`] = assignment;
                // await LECTURE.collection('attendance').doc(students.assignment.uid).set(temp);
                refreshStudents();
            });
            // loading.close();
            return false;
        },
    },
    grade: {
        modal: document.getElementById('modal_students_grade'),
        form: document.getElementById('form_students_grade'),
        studentName: document.getElementById('studentName_students_grade'),
        testName: document.getElementById('testName_students_grade'),
        testPoints: document.getElementById('testPoints_students_grade'),
        obj: document.getElementById('obj_students_grade'),
        sub: document.getElementById('sub_students_grade'),
        answersContainer: document.getElementById('answersContainer'),
        pointsContainer: document.getElementById('pointsContainer'),
        comment: document.getElementById('comment_students_grade'),
        easy: document.getElementById('easy_students_grade'),
        uid: '',
        testId: '',
        questions: [],
        open: (uid, testId) => {
            students.grade.uid = uid;
            students.grade.testId = testId;
            students.grade.form.reset();
            Promise.all([
                firebase.firestore().collection('students').doc(students.grade.uid).get().then(doc => doc.data()),
                LECTURE.collection('tests').doc(students.grade.testId).get().then(doc => doc.data()),
                LECTURE.collection('tests').doc(students.grade.testId).collection('grade').doc(students.grade.uid).get().then(doc => doc.exists ? doc.data() : {}),
            ]).then(data => {
                const student = data[0];
                const test = data[1];
                const gradeData = data[2];
                const isEasyInputActive = test.questions.findIndex(x => !x.multipleChoice) == -1;
                students.grade.questions = test.questions;
                students.grade.studentName.innerHTML = student.name;
                students.grade.testName.innerHTML = test.name;
                students.grade.testPoints.innerHTML = test.points;
                students.grade.obj.style.display = 'none';
                students.grade.sub.style.display = 'none';
                students.grade.answersContainer.innerHTML = null;
                students.grade.pointsContainer.innerHTML = null;
                if ('comment' in gradeData) students.grade.comment.value = gradeData.comment;
                for (const [i, question] of test.questions.entries()) {
                    let input = document.createElement('input');
                    input.classList.add('sk-input');
                    input.type = 'text';
                    input.name = `Q${i + 1}`;
                    input.id = `Q${i + 1}`;
                    if ('answers' in gradeData) input.value = gradeData.answers[i];
                    input.autocomplete = 'off';
                    if (question.multipleChoice) {
                        input.pattern = '[1-5]';
                        input.placeholder = i + 1;
                        input.onchange = (e, option = true) => {
                            if (e.target.value === `${question.answer}`) {
                                e.target.style.borderColor = 'var(--sk-color-blue)';
                                e.target.style.color = 'var(--sk-color-blue)';
                            } else {
                                e.target.style.borderColor = 'var(--sk-color-red)';
                                e.target.style.color = 'var(--sk-color-red)';
                            }
                            if (isEasyInputActive && option) students.grade.setEasyInput();
                        }
                        if ('answers' in gradeData) {
                            if (Number(gradeData.answers[i]) === Number(question.answer)) {
                                input.style.borderColor = 'var(--sk-color-blue)';
                                input.style.color = 'var(--sk-color-blue)';
                            } else {
                                input.style.borderColor = 'var(--sk-color-red)';
                                input.style.color = 'var(--sk-color-red)';
                            }
                        }
                        students.grade.answersContainer.appendChild(input);
                        students.grade.obj.style.display = 'block';
                    } else {
                        let span = document.createElement('span');
                        students.grade.answersContainer.appendChild(span);
                        let p = document.createElement('p');
                        p.innerHTML = `${i + 1}번`;
                        students.grade.pointsContainer.appendChild(p);
                        input.pattern = '[0-9]{1,}';
                        input.placeholder = `/ ${question.points}`;
                        students.grade.pointsContainer.appendChild(input);
                        students.grade.sub.style.display = 'block';
                    }
                    
                }
                if (isEasyInputActive) {
                    students.grade.easy.style.display = 'inline-block';
                    students.grade.setEasyInput();
                }
                students.grade.modal.classList.remove('inactive');
            });
        },
        setEasyInput: () => {
            const data = new FormData(students.grade.form);
            let answers = students.grade.questions.map((Q, i) => Number(data.get(`Q${i + 1}`)));
            while (answers.at(-1) == 0) {
                answers.pop();
            }
            students.grade.easy.value = answers.join('').match(/.{1,5}/g)?.join(' ') ?? '';
            return;
        },
        easyInput: () => {
            const raw = students.grade.easy.value.replaceAll(' ', '').slice(0, students.grade.questions.length).split('');
            students.grade.easy.value = raw.join('').match(/.{1,5}/g)?.join(' ') ?? '';
            
            for (i = 0; i < students.grade.questions.length; i++) {
                const e = document.getElementById(`Q${i + 1}`);
                const x = raw?.[i] ?? '';
                if (e.value != x) {
                    e.value = x;
                    e.onchange({ target: e, }, false);
                }
            }
            
        },
        close: () => {
            students.grade.modal.classList.add('inactive');
        },
        save: () => {
            loading.open();
            const data = new FormData(students.grade.form);
            const grade = {
                grade: students.grade.questions.map((Q, i) => {
                    if (Q.multipleChoice) return Number(Q.points) * (data.get(`Q${i + 1}`) === `${Q.answer}`);
                    else return Number(data.get(`Q${i + 1}`));
                }).reduce((a, c) => a + c),
                answers: students.grade.questions.map((Q, i) => Number(data.get(`Q${i + 1}`))),
                comment: data.get('comment'),
            };
            LECTURE.collection('tests').doc(students.grade.testId).collection('grade').doc(students.grade.uid).set(grade).catch(e => console.error(e)).then(() => {
                document.getElementById(`${students.grade.uid}_${students.grade.testId}`).innerHTML = `${grade.grade}${grade.comment ? '*' : ''} / ${students.grade.testPoints.innerHTML}`;
            }).catch(refreshStudents);
            students.grade.close();
            loading.close();
            return false;
        },
    },
};

var refresh = (auth) => {
    loading.open();
    LECTURE.get().then(async doc => {
        if (doc.exists) {
            await Promise.all([refreshTests(auth), refreshInfo(auth), refreshStudents(auth)]);
            loading.close();
        } else {
            alert('존재하지 않는 강의입니다.');
            location.replace(`/class/${classId}`);
        }
    }).catch(e => {
        console.error(e);
        alert('접근할 수 없는 강의입니다.');
        location.replace(`/class/${classId}`);
    });
}
var refreshTests = (auth) => {
    loading.open();
    return LECTURE.collection('tests').get().then(snapshot => {
        document.getElementById('tests').innerHTML = '';
        snapshot.forEach(doc => {
            const test = doc.data();
            let a = document.createElement('a');
            a.classList.add('sk-card');
            a.href = `/class/${classId}/${lectureId}/${doc.id}`;
            a.innerHTML = `<p class="title">${test.name}</p>`;
            document.getElementById('tests').appendChild(a);
        });
        loading.close();
    });
};
var refreshInfo = (auth) => {
    loading.open();
    return Promise.all([
        LECTURE.get().then(doc => {
            const lectureData = doc.data();
            document.getElementById('lecture-title').innerHTML = lectureData.name;
            document.getElementById('lecture-name').innerHTML = lectureData.name;
            document.getElementById('lecture-name-deleteLecture').innerHTML = lectureData.name;
            document.getElementById('lecture-open').innerHTML = new Date(lectureData.open.seconds * 1000).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', });
            document.getElementById('lecture-close').innerHTML = new Date(lectureData.close.seconds * 1000).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: 'numeric', });
            document.getElementById('lecture-note').innerHTML = lectureData.note;
            document.getElementById('lecture-videos').innerHTML = lectureData.videos?.[0] ?? "영상 링크 없음";
            loading.close();
        }),
        CLASS.get().then(doc => {
            document.getElementById('lecture-title').innerHTML += ` | ${doc.data().name}`;
            document.getElementById('class-classId').setAttribute('href', `/class/${classId}`);
            document.getElementById('class-name').innerHTML = doc.data().name;
        }),
    ]);
};
var refreshStudents = async (auth, option) => {
    loading.open();
    // attendance = {uid: {},}
    const attendance = Object.fromEntries(await LECTURE.collection('attendance').get().then(S => S.docs.map(D => [D.id, D.data(),])));
    // grade = [testId: '', grade: {uid: {},},},]
    const grade = await LECTURE.collection('tests').get().then(async S => await Promise.all(S.docs.map(D => LECTURE.collection('tests').doc(D.id).collection('grade').get().then(s => Object.assign({ testId: D.id, grade: Object.fromEntries(s.docs.map(d => [d.id, d.data(),])), }, D.data())))));
    return CLASS.get().then(async doc => {
        document.getElementById('lecture-students-header').innerHTML = `
            <tr>
                <th class="small" style="cursor: pointer;" onclick="refreshStudents();">이름</th>
                <th class="small">학교</th>
                <th class="large">학생 연락처</th>
                <th class="large">학부모 연락처</th>
                <th class="small center" style="cursor: pointer;" onclick="refreshStudents('${auth}', { orderBy: 'attendance', });">출결</th>
                <th class="xs center" style="cursor: pointer;" onclick="refreshStudents('${auth}', { orderBy: 'assignment', type:'reading',   });">독해</th>
                <th class="xs center" style="cursor: pointer;" onclick="refreshStudents('${auth}', { orderBy: 'assignment', type:'syntax',    });">구문</th>
                <th class="xs center" style="cursor: pointer;" onclick="refreshStudents('${auth}', { orderBy: 'assignment', type:'listening', });">듣기</th>
                ${grade.map(T => `<th class="center" style="cursor: pointer;" onclick="refreshStudents('${auth}', { orderBy: 'test', type:'${T.testId}', });">${T.name}</th>`).join('')}
            </tr>`;
        document.getElementById('lecture-students').innerHTML = '';

        let classData = (await Promise.all(doc.data().students.map(S => {
            return firebase.firestore().collection('students').doc(S).get().then(doc => {
                if (doc.exists) {
                    const studentData = doc.data();
                    if (studentData.parent) {
                        return firebase.firestore().collection('parents').doc(studentData.parent).get().then(parentDoc => {
                            return Object.assign(studentData, { uid: S, phone_parent: parentDoc.data().phone, });
                        });
                    } else {
                        return Object.assign(studentData, { uid: S, });
                    }
                } else {
                    return false;
                }
            });
        }))).filter(x => x).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        if (option && 'orderBy' in option) {
            if (option.orderBy == 'attendance') {
                var attendanceOf = (uid) => {
                    if (uid in attendance) {
                        if (attendance[uid].attendance) return 2;
                        return 1;
                    }
                    return 0;
                }
                classData = classData.sort((a, b) => attendanceOf(b.uid) - attendanceOf(a.uid));
            } else if (option.orderBy == 'assignment') {
                var assignmentOf = (uid) => {
                    if (uid in attendance && 'assignment' in attendance[uid] && option.type in attendance[uid].assignment) {
                        if (attendance[uid].assignment[option.type]) return 2;
                        return 1;
                    }
                    return 0;
                }
                classData = classData.sort((a, b) => assignmentOf(b.uid) - assignmentOf(a.uid));
            } else if (option.orderBy == 'test') {
                const gradeData = grade.find(T => T.testId == option.type).grade;
                var gradeOf = (uid) => {
                    if (uid in gradeData) return gradeData[uid].grade;
                    return -1;
                }
                classData = classData.sort((a, b) => gradeOf(b.uid) - gradeOf(a.uid));
            } 
        }

        for (const student of classData) {
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${student.school.name}</td>
                <td>0${student.phone.slice(3)}</td>
                <td>${student.parent ? '0' + student.phone_parent.slice(3) : ''}</td>`;

            var hasAssignmentData = (type) => {
                return student.uid in attendance && 'assignment' in attendance[student.uid] && type in attendance[student.uid].assignment;
            }
            var assignmentStatus = (type) => {
                return hasAssignmentData(type) && attendance[student.uid].assignment[type];
            }
            var hasComment = (type) => {
                return 'comment' in attendance[student.uid].assignment && type in attendance[student.uid].assignment.comment && attendance[student.uid].assignment.comment[type];
            }

            tr.innerHTML += `<td class="center"><span class="clickable ${(student.uid in attendance && attendance[student.uid].attendance) ? 'blue' : 'red'}" onclick="students.attend.open('${student.uid}', '${student.name}');" id="${student.uid}_attendance">${(student.uid in attendance && 'attendance' in attendance[student.uid]) ? attendance[student.uid].attendance ? `출석(${new Date(attendance[student.uid].time.seconds * 1000).toLocaleDateString('ko-kr', { weekday: 'short', })})` : '결석' : '-'}</span></td>`;
            tr.innerHTML += `<td class="center"><span class="clickable ${assignmentStatus('reading'  ) ? 'blue' : 'red'}" onclick="students.assignment.open('${student.uid}', '${student.name}', 'reading'  );" id="${student.uid}_assignment_reading"  ><b>${hasAssignmentData('reading'  ) ? attendance[student.uid].assignment.reading   ? `&nbsp;&nbsp;○${hasComment('reading'  ) ? '*' : ''}&nbsp;&nbsp;` : `&nbsp;&nbsp;⨉${hasComment('reading'  ) ? '*' : ''}&nbsp;&nbsp;` : '&nbsp;&nbsp;-&nbsp;&nbsp;'}</b></span></td>`;
            tr.innerHTML += `<td class="center"><span class="clickable ${assignmentStatus('syntax'   ) ? 'blue' : 'red'}" onclick="students.assignment.open('${student.uid}', '${student.name}', 'syntax'   );" id="${student.uid}_assignment_syntax"   ><b>${hasAssignmentData('syntax'   ) ? attendance[student.uid].assignment.syntax    ? `&nbsp;&nbsp;○${hasComment('syntax'   ) ? '*' : ''}&nbsp;&nbsp;` : `&nbsp;&nbsp;⨉${hasComment('syntax'   ) ? '*' : ''}&nbsp;&nbsp;` : '&nbsp;&nbsp;-&nbsp;&nbsp;'}</b></span></td>`;
            tr.innerHTML += `<td class="center"><span class="clickable ${assignmentStatus('listening') ? 'blue' : 'red'}" onclick="students.assignment.open('${student.uid}', '${student.name}', 'listening');" id="${student.uid}_assignment_listening"><b>${hasAssignmentData('listening') ? attendance[student.uid].assignment.listening ? `&nbsp;&nbsp;○${hasComment('listening') ? '*' : ''}&nbsp;&nbsp;` : `&nbsp;&nbsp;⨉${hasComment('listening') ? '*' : ''}&nbsp;&nbsp;` : '&nbsp;&nbsp;-&nbsp;&nbsp;'}</b></span></td>`;

            tr.innerHTML += grade.map(T => `<td class="center"><span class="clickable blue" onclick="students.grade.open('${student.uid}', '${T.testId}');" id="${student.uid}_${T.testId}">${(student.uid in T.grade) ? `${T.grade[student.uid].grade}${'comment' in T.grade[student.uid] && T.grade[student.uid].comment ? '*' : ''} / ${T.points}` : '성적 입력'}</span></td>`).join('');
            document.getElementById('lecture-students').appendChild(tr);
        }
        loading.close();
    });
};