let params = location.pathname.split('/');
params.pop();
const classId = params.pop();
const studentId = params.pop();
const db = firebase.firestore();
const studentRef = db.collection('students').doc(studentId);
const classRef = db.collection('classes').doc(classId);

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

var showDetails = (target) => {
    document.querySelectorAll('.showDetails').forEach(x => x.classList.remove('showDetails'));
    target.classList.toggle('showDetails');
};

Promise.all([
    classRef.get().then(doc => {
        document.getElementById('class').innerHTML = doc.data().name;
    }).catch(() => location.replace('/signin')),

    classRef.collection('lectures').orderBy('open').get().then(async snapshot => {
        let testData = {
            'T-12': new Array(snapshot.docs.length),
            'T-15': new Array(snapshot.docs.length),
            'T-45': new Array(snapshot.docs.length),
        };
        await Promise.all(snapshot.docs.map((doc, i) => {
            const testsRef = classRef.collection('lectures').doc(doc.id).collection('tests');
            return testsRef.get().then(snapshot => Promise.all(snapshot.docs.map(tDoc => {
                let Data = tDoc.data();
                if (String(Data.type) in testData) {
                    Data.lectureId = doc.id;
                    Data.testId = tDoc.id;
                    return testsRef.doc(tDoc.id).collection('grade').get().then(snapshot => {
                        Data.grades = snapshot.docs.map(doc => {
                            if (doc.id === studentId) {
                                Data.myGrade = doc.data().grade;
                                Data.myGradeDetail = doc.data().answers.map((x, i) => x == Data.questions[i].answer);
                            }
                            return doc.data().grade;
                        });
                        // Data.questions = Data.questions.map(Q => {
                        //     delete Q.answer;
                        //     return Q;
                        // });
                        testData[`${Data.type}`][i] = Data;
                        return 0;
                    });
                }
                return 0;
            })));
        }));
        return testData;
    }).then(async tests => {
        let answerRateByType = [];
        tests['T-45'] = tests['T-45'].filter(x => x);
        tests['T-15'] = tests['T-15'].filter(x => x);
        tests['T-12'] = tests['T-12'].filter(x => x);

        var testsToGraph = (tests, heightUnit) => {
            return tests.map((test, index) => {
                if (test === null || !test.grades.length) {
                    return '<div></div>';
                } else {
                    const average = test.grades.reduce((a, b) => a + b) / test.grades.length;
                    const min = Math.min(...test.grades);
                    const max = Math.max(...test.grades);
                    const applied = 'myGrade' in test;
                    const bottom = 24;
    
                    if (applied) {
                        for (i = 0; i < test.questions.length; i++) {
                            const j = answerRateByType.findIndex(x => x.type == test.questions[i].type);
                            if (j >= 0) {
                                answerRateByType[j].total++;
                                answerRateByType[j].answer += Number(test.myGradeDetail[i]);
                            } else {
                                answerRateByType.push({
                                    type: test.questions[i].type,
                                    total: 1,
                                    answer: Number(test.myGradeDetail[i]),
                                });
                            }
                        }
                    }
                    return `<div onclick="showDetails(this);" class="${average >= 10 ? 'wide' : ''}">
                        <div style="bottom: ${min * heightUnit + bottom}px; height: ${(max - min) * heightUnit}px" class="bar"></div>
                        <div style="bottom: ${average * heightUnit + bottom}px;" class="dark"></div>
                        ${applied ? `<div style="bottom: ${test.myGrade * heightUnit + bottom}px;" class="highlighted"></div>` : ''}
                        <p class="tag">${index + 1}</p>
                        <p class="detail" style="bottom: ${average * heightUnit + bottom - 4}px;">${Math.round(average * 10) / 10}</p>
                        ${applied ? `<p class="detail left highlighted" style="bottom: ${test.myGrade * heightUnit + bottom - 4}px;">${test.myGrade}</p>` : ''}
                    </div>`;
                }
            }).join('');
        }
        if (tests['T-45'].length && !tests['T-45'].every(x => x === null)) {
            document.getElementById('list-1-graphContainer').innerHTML = testsToGraph(tests['T-45'], 60 / 100);
            document.getElementById('list-1-title').style.display = 'block';
            document.getElementById('list-1').style.display = 'block';
        }
        if (tests['T-15'].length && !tests['T-15'].every(x => x === null)) {
            document.getElementById('list-2-graphContainer').innerHTML = testsToGraph(tests['T-15'], 60 / 15);
            document.getElementById('list-2-title').style.display = 'block';
            document.getElementById('list-2').style.display = 'block';
        }
        if (tests['T-12'].length && !tests['T-12'].every(x => x === null)) {
            document.getElementById('list-3-graphContainer').innerHTML = testsToGraph(tests['T-12'], 60 / 12);
            document.getElementById('list-3-title').style.display = 'block';
            document.getElementById('list-3').style.display = 'block';
        }
        
        document.getElementById('list-4').innerHTML = answerRateByType.map(R => {
            return `<div><li class="disabled"><span>${R.type}</span><span>${Math.round(1000 * R.answer / R.total) / 10}%</span></li></div>`;
        }).join('');
    }).catch(error => {
        console.error(error);
        document.getElementById('list-1').innerHTML = '<li class="disabled">일시적인 오류가 발생했습니다</li>';
        document.getElementById('list-1').style.display = 'block';
    }),

    // firebase.functions().httpsCallable('getTestReport')({ classId: classId, studentId: studentId, }).then(async data => {
    //     let tests = data.data;
    //     let answerRateByType = [];
    //     tests['T-45'] = tests['T-45'].filter(x => x);
    //     tests['T-15'] = tests['T-15'].filter(x => x);
    //     tests['T-12'] = tests['T-12'].filter(x => x);

    //     if (tests['T-45'].length && !tests['T-45'].every(x => x === null)) {
    //         for (i = tests['T-45'].length; i < 12; i++) {
    //             tests['T-45'].push(null);
    //         }
    //         const heightUnit = 80 / 100;
    //         document.getElementById('list-1-graphContainer').innerHTML = tests['T-45'].map(test => {
    //             if (test === null || !test.grades.length) {
    //                 return '<div></div>';
    //             } else {
    //                 const average = test.grades.reduce((a, b) => a + b) / test.grades.length;
    //                 const min = Math.min(...test.grades);
    //                 const max = Math.max(...test.grades);
    //                 const applied = 'myGrade' in test;

    //                 if (applied) {
    //                     // console.log(test.questions, test.myGradeDetail)
    //                     for (i = 0; i < test.questions.length; i++) {
    //                         // if (!test.questions[i].multipleChoice) continue;
    //                         const j = answerRateByType.findIndex(x => x.type == test.questions[i].type);
    //                         if (j >= 0) {
    //                             answerRateByType[j].total++;
    //                             answerRateByType[j].answer += Number(test.myGradeDetail[i]);
    //                         } else {
    //                             answerRateByType.push({
    //                                 type: test.questions[i].type,
    //                                 total: 1,
    //                                 answer: Number(test.myGradeDetail[i]),
    //                             });
    //                         }
    //                     }
    //                 }
    //                 return `<div ${applied ? `onclick="location.href = '/app/${studentId}/${classId}/${test.lectureId}/${test.testId}';"` : ''}>
    //                     <div style="bottom: ${min * heightUnit}px; height: ${(max - min) * heightUnit}px" class="bar"></div>
    //                     <div style="bottom: ${average * heightUnit}px;" class="dark"></div>
    //                     ${applied ? `<div style="bottom: ${test.myGrade * heightUnit}px;" class="colored"></div>` : ''}
    //                 </div>`;
    //             }
    //         }).join('');
    //         document.getElementById('list-1-title').style.display = 'block';
    //         document.getElementById('list-1').style.display = 'block';
    //     }
    //     if (tests['T-15'].length && !tests['T-15'].every(x => x === null)) {
    //         for (i = tests['T-15'].length; i < 12; i++) {
    //             tests['T-15'].push(null);
    //         }
    //         const heightUnit = 80 / 15;
    //         document.getElementById('list-2-graphContainer').innerHTML = tests['T-15'].map(test => {
    //             if (test === null || !test.grades.length) {
    //                 return '<div></div>';
    //             } else {
    //                 const average = test.grades.reduce((a, b) => a + b) / test.grades.length;
    //                 const min = Math.min(...test.grades);
    //                 const max = Math.max(...test.grades);
    //                 const applied = 'myGrade' in test;

    //                 if (applied) {
    //                     // console.log(test.questions, test.myGradeDetail)
    //                     for (i = 0; i < test.questions.length; i++) {
    //                         // if (!test.questions[i].multipleChoice) continue;
    //                         const j = answerRateByType.findIndex(x => x.type == test.questions[i].type);
    //                         if (j >= 0) {
    //                             answerRateByType[j].total++;
    //                             answerRateByType[j].answer += Number(test.myGradeDetail[i]);
    //                         } else {
    //                             answerRateByType.push({
    //                                 type: test.questions[i].type,
    //                                 total: 1,
    //                                 answer: Number(test.myGradeDetail[i]),
    //                             });
    //                         }
    //                     }
    //                 }
    //                 return `<div ${applied ? `onclick="location.href = '/app/${studentId}/${classId}/${test.lectureId}/${test.testId}';"` : ''}>
    //                     <div style="bottom: ${min * heightUnit}px; height: ${(max - min) * heightUnit}px" class="bar"></div>
    //                     <div style="bottom: ${average * heightUnit}px;" class="dark"></div>
    //                     ${applied ? `<div style="bottom: ${test.myGrade * heightUnit}px;" class="colored"></div>` : ''}
    //                 </div>`;
    //             }
    //         }).join('');
    //         document.getElementById('list-2-title').style.display = 'block';
    //         document.getElementById('list-2').style.display = 'block';
    //     }
    //     if (tests['T-12'].length && !tests['T-12'].every(x => x === null)) {
    //         for (i = tests['T-12'].length; i < 12; i++) {
    //             tests['T-12'].push(null);
    //         }
    //         const heightUnit = 80 / 12;
    //         document.getElementById('list-3-graphContainer').innerHTML = tests['T-12'].map(test => {
    //             if (test === null || !test.grades.length) {
    //                 return '<div></div>';
    //             } else {
    //                 const average = test.grades.reduce((a, b) => a + b) / test.grades.length;
    //                 const min = Math.min(...test.grades);
    //                 const max = Math.max(...test.grades);
    //                 const applied = 'myGrade' in test;

    //                 if (applied) {
    //                     // console.log(test.questions, test.myGradeDetail)
    //                     for (i = 0; i < test.questions.length; i++) {
    //                         // if (!test.questions[i].multipleChoice) continue;
    //                         const j = answerRateByType.findIndex(x => x.type == test.questions[i].type);
    //                         if (j >= 0) {
    //                             answerRateByType[j].total++;
    //                             answerRateByType[j].answer += Number(test.myGradeDetail[i]);
    //                         } else {
    //                             answerRateByType.push({
    //                                 type: test.questions[i].type,
    //                                 total: 1,
    //                                 answer: Number(test.myGradeDetail[i]),
    //                             });
    //                         }
    //                     }
    //                 }
    //                 return `<div ${applied ? `onclick="location.href = '/app/${studentId}/${classId}/${test.lectureId}/${test.testId}';"` : ''}>
    //                     <div style="bottom: ${min * heightUnit}px; height: ${(max - min) * heightUnit}px" class="bar"></div>
    //                     <div style="bottom: ${average * heightUnit}px;" class="dark"></div>
    //                     ${applied ? `<div style="bottom: ${test.myGrade * heightUnit}px;" class="colored"></div>` : ''}
    //                 </div>`;
    //             }
    //         }).join('');
    //         document.getElementById('list-3-title').style.display = 'block';
    //         document.getElementById('list-3').style.display = 'block';
    //     }
        
    //     document.getElementById('list-4').innerHTML = answerRateByType.map(R => {
    //         return `<div><li class="disabled"><span>${R.type}</span><span>${Math.round(1000 * R.answer / R.total) / 10}%</span></li></div>`;
    //     }).join('');
    // }).catch(error => {
    //     console.error(error);
    //     document.getElementById('list-1').innerHTML = '<li class="disabled">일시적인 오류가 발생했습니다</li>';
    //     document.getElementById('list-1').style.display = 'block';
    // }),
]).then(() => {
    setTimeout(() => {
        document.getElementsByTagName('body')[0].classList.add('active');
    }, 100);
});

var back = () => {
    localStorage.setItem('back', 'true');
    history.back();
    location.replace(`/app/${studentId}/${classId}`);
};
