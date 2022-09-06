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
const testId = params.pop();
const lectureId = params.pop();
const classId = params.pop();
const CLASS = firebase.firestore().collection('classes').doc(classId);
const LECTURE = CLASS.collection('lectures').doc(lectureId);
const TEST = LECTURE.collection('tests').doc(testId);
const testType = {
    'VOCA': '단어시험',
    'T-12': '미니 모의고사',
    'T-15': '하프 모의고사',
    'T-45': '풀세트 모의고사',
};

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
const editInfo = {
    modal: document.getElementById('modal_editInfo'),
    form: document.getElementById('form_editInfo'),
    open: () => {
        editInfo.modal.classList.remove('inactive');
    },
    close: () => {
        editInfo.form.reset();
        editInfo.modal.classList.add('inactive');
    },
    save: () => {
        loading.open();
        const data = new FormData(editInfo.form);
        const testData = {
            name: data.get('name'),
            note: data.get('note'),
        };
        TEST.update(testData).catch(e => console.error(e)).then(refreshInfo);
        editInfo.close();
        loading.close();
        return false;
    },
};
const deleteTest = {
    modal: document.getElementById('modal_deleteTest'),
    open: () => {
        deleteTest.modal.classList.remove('inactive');
    },
    close: () => {
        deleteTest.modal.classList.add('inactive');
    },
    del: () => {
        loading.open();
        TEST.delete().catch(e => console.error(e)).then(() => {
            location.replace(`/class/${classId}/${lectureId}`);
        });
        deleteTest.close();
        return false;
    },
};
const questions = {
    add: {
        modal: document.getElementById('modal_addQuestion'),
        form: document.getElementById('form_addQuestion'),
        open: () => {
            document.getElementById('n_addQuestion').innerHTML = document.getElementById('test-questions-length').innerHTML * 1 + 1;
            questions.add.modal.classList.remove('inactive');
        },
        close: () => {
            questions.add.modal.classList.add('inactive');
            questions.add.form.reset();
        },
        onTypeChange: () => {
            const mul = questions.add.form.querySelector('input[name="multipleChoice"]').checked;
            questions.add.form.querySelector('input[name="answer"]').style.display = mul ? 'block' : 'none';
            questions.add.form.querySelector('input[name="answer"]').required = mul;
        },
        add: () => {
            loading.open();
            const data = new FormData(questions.add.form);
            const question = data.get('multipleChoice') ? {
                answer: data.get('answer') * 1,
                points: data.get('points') * 1,
                type: data.get('type'),
                note: data.get('note'),
                multipleChoice: true,
            } : {
                points: data.get('points') * 1,
                type: data.get('type'),
                note: data.get('note'),
                multipleChoice: false,
            };
            TEST.update({
                points: firebase.firestore.FieldValue.increment(data.get('points') * 1),
                questions: firebase.firestore.FieldValue.arrayUnion(question),
            }).then(refreshQuestions);
            questions.add.close();
            loading.close();
            return false;
        },
    },
    editAll: {
        modal: document.getElementById('modal_questions_editAll'),
        form: document.getElementById('form_questions_editAll'),
        obj: document.getElementById('obj_questions_editAll'),
        answersContainer: document.getElementById('answersContainer'),
        originalQuestionsData: [],
        open: () => {
            TEST.get().then(doc => {
                const test = doc.data();
                questions.editAll.originalQuestionsData = test.questions;
                questions.editAll.obj.style.display = 'none';
                questions.editAll.answersContainer.innerHTML = null;
                for (const [i, question] of test.questions.entries()) {
                    let input = document.createElement('input');
                    input.classList.add('sk-input');
                    input.type = 'text';
                    input.pattern = '[1-5]';
                    input.name = `Q${i + 1}`;
                    input.autocomplete = 'off';
                    if (question.multipleChoice) {
                        input.placeholder = i + 1;
                        input.onchange = e => {
                            if (e.target.value) {
                                e.target.style.borderColor = 'var(--sk-color-blue)';
                                e.target.style.color = 'var(--sk-color-blue)';
                                e.target.style.fontWeight = 700;
                            } else {
                                e.target.style.borderColor = 'var(--sk-color-lightgray)';
                                e.target.style.color = 'var(--sk-color-lightgray)';
                                e.target.style.fontWeight = 400;
                            }
                        }
                        questions.editAll.answersContainer.appendChild(input);
                        questions.editAll.obj.style.display = 'block';
                    }
                }
                questions.editAll.modal.classList.remove('inactive');
            });
        },
        close: () => {
            questions.editAll.modal.classList.add('inactive');
        },
        save: () => {
            loading.open();
            const data = new FormData(questions.editAll.form);
            TEST.update({
                questions: questions.editAll.originalQuestionsData.map((Q, i) => {
                    if (Q.multipleChoice && data.get(`Q${i + 1}`)) {
                        Q.answer = Number(data.get(`Q${i + 1}`));
                    }
                    return Q;
                }),
            }).then(refreshQuestions);
            questions.editAll.close();
            loading.close();
            return false;
        },
    },
    edit: {

    },
    del: {
        modal: document.getElementById('modal_deleteStudent'),
        n: document.getElementById('n_deleteStudent'),
        button: document.getElementById('button_deleteStudent'),
        open: (n) => {
            students.del.modal.classList.remove('inactive');
            students.del.n.innerHTML = n;
            students.del.button.addEventListener('click', () => { students.del.del(n); }, false);
        },
        close: () => {
            students.del.modal.classList.add('inactive');
        },
        del: (n) => {
            loading.open();
            CLASS.update({
                students: firebase.firestore.FieldValue.arrayRemove(),
            }).then(refreshQuestions);
            students.del.close();
            loading.close();
            return false;
        },
    },
};

var refresh = (auth) => {
    loading.open();
    TEST.get().then(async doc => {
        if (doc.exists) {
            await Promise.all([refreshInfo(auth), refreshQuestions(auth)]);
            loading.close();
        } else {
            alert('존재하지 않는 시험입니다.');
            location.replace(`/class/${classId}/${lectureId}`);
        }
    }).catch(e => {
        console.error(e);
        alert('접근할 수 없는 시험입니다.');
        location.replace(`/class/${classId}/${lectureId}`);
    });
}
var refreshInfo = (auth) => {
    loading.open();
    return Promise.all([
        TEST.get().then(doc => {
            const testData = doc.data();
            document.getElementById('test-title').innerHTML = testData.name;
            document.getElementById('test-name').innerHTML = testData.name;
            document.getElementById('test-name-deleteTest').innerHTML = testData.name;
            document.getElementById('test-points').innerHTML = testData.points;
            document.getElementById('test-questions-length').innerHTML = ('questions' in testData) ? testData.questions.length : 0;
            document.getElementById('test-type').innerHTML = testType[testData.type];
            document.getElementById('test-note').innerHTML = testData.note;
            loading.close();
        }),
        LECTURE.get().then(doc => {
            document.getElementById('test-title').innerHTML += ` | ${doc.data().name}`;
            document.getElementById('lecture-lectureId').setAttribute('href', `/class/${classId}/${lectureId}`);
            document.getElementById('lecture-name').innerHTML = doc.data().name;
        }),
    ]);
};
var refreshQuestions = (auth) => {
    loading.open();
    return TEST.get().then(async doc => {
        const testData = doc.data();
        document.getElementById('test-points').innerHTML = testData.points;
        document.getElementById('test-questions-length').innerHTML = ('questions' in testData) ? testData.questions.length : 0;
        document.getElementById('test-questions').innerHTML = testData.questions.map((Q, i) => `<tr>
            <td>${i + 1}</td>
            <td class="center">${Q.multipleChoice ? Q.answer : '_'}</td>
            <td class="center">${Q.points}</td>
            <td>${Q.type}</td>
            <td>${Q.note}</td>
        </tr>`).join('');
        loading.close();
    });
};