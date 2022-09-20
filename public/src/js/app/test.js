let params = location.pathname.split('/');
const testId = params.pop();
const lectureId = params.pop();
const classId = params.pop();
const studentId = params.pop();
const db = firebase.firestore();
const studentRef = db.collection('students').doc(studentId);
const classRef = db.collection('classes').doc(classId);
const lectureRef = classRef.collection('lectures').doc(lectureId);
const testRef = lectureRef.collection('tests').doc(testId);

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

Promise.all([
    lectureRef.get().then(doc => {
        document.getElementById('lecture').innerHTML = doc.data().name;
    }).catch(() => location.replace('/signin')),

    Promise.all([
        testRef.get().then(doc => doc.data()),
        testRef.collection('grade').get().then(snapshot => {
            const gradeData = {
                grades: [],
            };
            gradeData.raw = snapshot.docs.map(gradeDoc => {
                const Data = gradeDoc.data();
                if (gradeDoc.id == studentId) {
                    gradeData.my = Data;
                }
                gradeData.grades.push(Data.grade);

                return Data
            });
            return gradeData;
        }),
        lectureRef.collection('attendance').where('attendance', '==', true).get().then(snapshot => {
            return snapshot.docs.length;
        }).catch(console.error),
    ]).then(v => {
        const testData = v[0];
        const gradeData = v[1];
        testData.attended = v[2];
        testData.questions = testData.questions.map((Q, i) => {
            Q.ratio = Math.floor(gradeData.raw.filter(doc => Number(doc.answers[i]) === Number(Q.answer)).length * 1000 / gradeData.raw.length) / 10;
            Q.answer = Number(Q.answer) === Number(gradeData.my.answers[i]);
            return Q;
        });
        gradeData.grades = gradeData.grades.sort((a, b) => b - a);
        
        document.getElementById('test-name').innerHTML = testData.name;
        document.getElementById('test-type').innerHTML = {
            'T-12': '미니 모의고사',
            'T-15': '하프 모의고사',
            'T-45': '모의고사',
        }[testData.type];
        document.getElementById('test-n').innerHTML = `${gradeData.grades.length} / ${testData.attended}`;
        if (gradeData.grades.length < testData.attended) document.getElementById('test-in-progress').style.display = 'block';
        document.getElementById('test-comment').innerHTML = gradeData.my?.comment ?? '';
        document.getElementById('test-score').innerHTML = `${gradeData.my.grade} / ${testData.points}`;

        const average = Math.round(gradeData.grades.reduce((a, b) => a + b) / gradeData.grades.length * 10) / 10;
        const top30percent = Math.floor(gradeData.grades[Math.floor(gradeData.grades.length * 0.3)]);
        
        if (testData.points > 19) {
            let gradeDistribution = new Array(20).fill(0);
            const range = testData.points / 20;
            for (grade of gradeData.grades) {
                if (grade == testData.points) grade -= 0.01;
                gradeDistribution[Math.floor(grade / range)]++;
            }
            const maxDistribution = Math.max(...gradeDistribution);
            let indexes = [0, 0, 0];
            if (gradeData.my.grade == testData.points) {
                indexes[0] = 19;
            } else {
                indexes[0] = Math.floor(gradeData.my.grade / range)
            }
            if (average == testData.points) {
                indexes[1] = 19;
            } else {
                indexes[1] = Math.floor(average / range)
            }
            if (top30percent == testData.points) {
                indexes[2] = 19;
            } else {
                indexes[2] = Math.floor(top30percent / range)
            }
            document.getElementById('test-graph').innerHTML = `<div class="graph-histogram">
                <div class="graph--container">
                    ${gradeDistribution.map((x, i) => {
                        x = 6 + 34 * x / maxDistribution;
                        if (i == indexes[0]) {
                            return `<div style="height: ${x}px;" class="highlighted"></div>`
                        } else if (i == indexes[1]) {
                            return `<div style="height: ${x}px;" class="dark"></div>`
                        } else if (i == indexes[2]) {
                            return `<div style="height: ${x}px;" class="colored"></div>`
                        } else {
                            return `<div style="height: ${x}px;"></div>`
                        }
                    }).join('')}
                </div>
                <div class="graph--index">
                    <p><span class="highlighted"></span>내 점수</p>
                    <p><span class="dark"></span>평균 (${average}점)</p>
                    <p><span class="colored"></span>상위 30% (${top30percent}점)</p>
                </div>
            </div>`;
        } else {
            const size = Math.floor(testData.points) + 1;
            let gradeDistribution = new Array(size).fill(0);
            for (grade of gradeData.grades) {
                gradeDistribution[Math.floor(grade)]++;
            }
            const maxDistribution = Math.max(...gradeDistribution);
            let indexes = [Math.floor(gradeData.my.grade), Math.floor(average), top30percent];
            document.getElementById('test-graph').innerHTML = `<div class="graph-histogram">
                <div class="graph--container">
                    ${gradeDistribution.map((x, i) => {
                        x = 6 + 34 * x / maxDistribution;
                        if (i == indexes[0]) {
                            return `<div style="height: ${x}px;" class="highlighted"></div>`
                        } else if (i == indexes[1]) {
                            return `<div style="height: ${x}px;" class="dark"></div>`
                        } else if (i == indexes[2]) {
                            return `<div style="height: ${x}px;" class="colored"></div>`
                        } else {
                            return `<div style="height: ${x}px;"></div>`
                        }
                    }).join('')}
                </div>
                <div class="graph--index">
                    <p><span class="highlighted"></span>내 점수</p>
                    <p><span class="dark"></span>평균 (${average}점)</p>
                    <p><span class="colored"></span>상위 30% (${top30percent}점)</p>
                </div>
            </div>`;
        }

        document.getElementById('list-1').innerHTML = testData.questions.map((Q, i) => {
            return `<div><span class="icon">${i + 1}</span><li class="test ${Q.answer}"><p>${Q.type}<span>${Q.ratio}%</span></p></li></div>`;
        }).join('');
    }),//.catch(() => back()),

    // testRef.collection('grade').doc(studentId).get().then(doc => {
    //     const gradeData = doc.data();
    //     const myGrade = gradeData.grade;
        
    //     return firebase.functions().httpsCallable('getTest')({
    //         classId: classId,
    //         lectureId: lectureId,
    //         testId: testId,
    //         answers: gradeData.answers,
    //     }).then(async data => {
    //         let testData = data.data;

    //         document.getElementById('test-name').innerHTML = testData.name;
    //         document.getElementById('test-type').innerHTML = {
    //             'T-12': '미니 모의고사',
    //             'T-15': '하프 모의고사',
    //             'T-45': '모의고사',
    //         }[testData.type];
    //         document.getElementById('test-n').innerHTML = `${testData.grades.length} / ${testData.attended}`;
    //         if (testData.grades.length < testData.attended) document.getElementById('test-in-progress').style.display = 'block';
    //         if ('comment' in gradeData) document.getElementById('test-comment').innerHTML = gradeData.comment;
    //         document.getElementById('test-score').innerHTML = `${myGrade} / ${testData.points}`;

    //         const average = Math.round(testData.grades.reduce((a, b) => a + b) / testData.grades.length * 10) / 10;
    //         if (testData.points > 19) {
    //             let gradeDistribution = new Array(20).fill(0);
    //             const range = testData.points / 20;
    //             for (grade of testData.grades) {
    //                 if (grade == testData.points) grade -= 0.01;
    //                 gradeDistribution[Math.floor(grade / range)]++;
    //             }
    //             const maxDistribution = Math.max(...gradeDistribution);
    //             let indexes = [0, 0];
    //             if (myGrade == testData.points) {
    //                 indexes[0] = 19;
    //             } else {
    //                 indexes[0] = Math.floor(myGrade / range)
    //             }
    //             if (average == testData.points) {
    //                 indexes[1] = 19;
    //             } else {
    //                 indexes[1] = Math.floor(average / range)
    //             }
    //             document.getElementById('test-graph').innerHTML = `<div class="graph-histogram">
    //                 <div class="graph--container">
    //                     ${gradeDistribution.map((x, i) => {
    //                         x = 6 + 34 * x / maxDistribution;
    //                         if (i == indexes[0]) {
    //                             return `<div style="height: ${x}px;" class="colored"></div>`
    //                         } else if (i == indexes[1]) {
    //                             return `<div style="height: ${x}px;" class="dark"></div>`
    //                         } else {
    //                             return `<div style="height: ${x}px;"></div>`
    //                         }
    //                     }).join('')}
    //                 </div>
    //                 <div class="graph--index">
    //                     <p><span class="colored"></span>내 점수</p>
    //                     <p><span class="dark"></span>평균 (${average}점)</p>
    //                 </div>
    //             </div>`;
    //         } else {
    //             const size = Math.floor(testData.points);
    //             let gradeDistribution = new Array(size).fill(0);
    //             for (grade of testData.grades) {
    //                 gradeDistribution[Math.floor(grade)]++;
    //             }
    //             const maxDistribution = Math.max(...gradeDistribution);
    //             let indexes = [Math.floor(myGrade), Math.floor(average)];
    //             document.getElementById('test-graph').innerHTML = `<div class="graph-histogram">
    //                 <div class="graph--container">
    //                     ${gradeDistribution.map((x, i) => {
    //                         x = 6 + 34 * x / maxDistribution;
    //                         if (i == indexes[0]) {
    //                             return `<div style="height: ${x}px;" class="colored"></div>`
    //                         } else if (i == indexes[1]) {
    //                             return `<div style="height: ${x}px;" class="dark"></div>`
    //                         } else {
    //                             return `<div style="height: ${x}px;"></div>`
    //                         }
    //                     }).join('')}
    //                 </div>
    //                 <div class="graph--index">
    //                     <p><span class="colored"></span>내 점수</p>
    //                     <p><span class="dark"></span>평균 (${average}점)</p>
    //                 </div>
    //             </div>`;
    //         }

    //         document.getElementById('list-1').innerHTML = testData.questions.map((Q, i) => {
    //             return `<div><span class="icon">${i + 1}</span><li class="test ${Q.answer}"><p>${Q.type}<span>${Q.ratio}%</span></p></li></div>`;
    //         }).join('');
    //     });
    // }).catch(() => back()),

]).then(() => {
    setTimeout(() => {
        document.getElementsByTagName('body')[0].classList.add('active');
    }, 100);
});

var back = () => {
    localStorage.setItem('back', 'true');
    history.back();
    location.replace(`/app/${studentId}/${classId}/${lectureId}`);
};
