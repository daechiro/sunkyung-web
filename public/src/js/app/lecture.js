let params = location.pathname.split('/');
const lectureId = params.pop();
const classId = params.pop();
const studentId = params.pop();
const db = firebase.firestore();
const studentRef = db.collection('students').doc(studentId);
const classRef = db.collection('classes').doc(classId);
const lectureRef = classRef.collection('lectures').doc(lectureId);

if (localStorage.getItem('back') === 'true') {
    localStorage.setItem('back', 'false');
    document.getElementsByTagName('body')[0].classList.add('fixed');
}

Promise.all([
    classRef.get().then(doc => {
        document.getElementById('class').innerHTML = doc.data().name;
    }).catch(() => location.replace('/signin')),

    lectureRef.get().then(doc => {
        const lectureData = doc.data();
        document.getElementById('name').innerHTML = lectureData.name;
        document.getElementById('lecture-date').innerHTML = new Date(lectureData.open.seconds * 1000).toLocaleString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        }) + ' — ' + new Date(lectureData.close.seconds * 1000).toLocaleTimeString('ko-KR', {
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });
        if (lectureData.videos.length) {
            document.getElementById('lecture-video').addEventListener('click', () => {
                window.open(lectureData.videos[0], '_blank').focus();
            }, false);
        } else {
            document.getElementById('lecture-video').remove();
        }
        if ('note' in lectureData) {
            document.getElementById('lecture-note').innerText = lectureData.note;
        } else {
            document.getElementById('lecture-note-title').style.display = 'none';
            document.getElementById('lecture-note').style.display = 'none';
            document.getElementById('lecture-note-padding').style.display = 'none';
        }
    }).catch(() => location.replace('/signin')),
    
    lectureRef.collection('attendance').doc(studentId).get().then(doc => {
        if (doc.exists) {
            const Data = doc.data();
            attendance_status.classList.add(`${Data.attendance}`);
            if (Data.attendance) {
                attendance_status.innerText = `출석 (${new Date(Data.time.seconds * 1000).toLocaleDateString('ko-kr', {
                    weekday: 'long',
                })})`;
            } else if (Data.attendance === false) {
                attendance_status.innerText = '결석';
            }
            if ('assignment' in Data) {
                let list = '';
                if ('reading' in Data.assignment) {
                    if ('comment' in Data.assignment && 'reading' in Data.assignment.comment && Data.assignment.comment.reading) {
                        list += `<li class="title assignment ${Data.assignment.reading} no-padding-bottom">독해 과제</li><li class="comment disabled no-padding-bottom">${Data.assignment.comment.reading}</li><li class="disabled no-padding-top"></li>`;
                    } else {
                        list += `<li class="assignment ${Data.assignment.reading}">독해 과제</li>`;
                    }
                }
                if ('syntax' in Data.assignment) {
                    if ('comment' in Data.assignment && 'syntax' in Data.assignment.comment && Data.assignment.comment.syntax) {
                        list += `<li class="title assignment ${Data.assignment.syntax} no-padding-bottom">구문 과제</li><li class="comment disabled no-padding-bottom">${Data.assignment.comment.syntax}</li><li class="disabled no-padding-top"></li>`;
                    } else {
                        list += `<li class="assignment ${Data.assignment.syntax}">구문 과제</li>`;
                    }
                }
                if ('listening' in Data.assignment) {
                    if ('comment' in Data.assignment && 'listening' in Data.assignment.comment && Data.assignment.comment.listening) {
                        list += `<li class="title assignment ${Data.assignment.listening} no-padding-bottom">듣기 과제</li><li class="comment disabled no-padding-bottom">${Data.assignment.comment.listening}</li><li class="disabled no-padding-top"></li>`;
                    } else {
                        list += `<li class="assignment ${Data.assignment.listening}">듣기 과제</li>`;
                    }
                }
                if (list) document.getElementById('list-0').innerHTML = list;
            }
        }
    }).catch(() => location.replace('/signin')),

    lectureRef.collection('tests').get().then(async snapshot => {
        let tests = await Promise.all(snapshot.docs.map((doc => {
            let Data = doc.data();
            Data.id = doc.id;

            return lectureRef.collection('tests').doc(doc.id).collection('grade').get().then(snapshot => {
                Data.grades = snapshot.docs.map(gradeDoc => {
                    const gradeData = gradeDoc.data();
                    if (gradeDoc.id == studentId) {
                        if (gradeDoc.exists) {
                            Data.myGrade = gradeData.grade;
                            Data.comment = 'comment' in gradeData ? gradeData.comment : '';
                        } else {
                            Data.myGrade = null;
                            Data.comment = '';
                        }
                    }

                    return gradeData.grade
                }).sort((a, b) => b - a);

                return Data;
            });
        })));

        document.getElementById('list-1').innerHTML = tests.map(test => {
            if (test.myGrade != null) {
                let graph = '';
                let testOnClick = '';
                const average = Math.round(test.grades.reduce((a, b) => a + b) / test.grades.length * 10) / 10;
                const top30percent = Math.floor(test.grades[Math.floor(test.grades.length * 0.3)]);
                if (test.points > 19) {
                    let gradeDistribution = new Array(20).fill(0);
                    const range = test.points / 20;
                    for (grade of test.grades) {
                        if (grade == test.points) grade -= 0.01;
                        gradeDistribution[Math.floor(grade / range)]++;
                    }
                    const maxDistribution = Math.max(...gradeDistribution);
                    let indexes = [0, 0, 0];
                    if (test.myGrade == test.points) {
                        indexes[0] = 19;
                    } else {
                        indexes[0] = Math.floor(test.myGrade / range)
                    }
                    if (average == test.points) {
                        indexes[1] = 19;
                    } else {
                        indexes[1] = Math.floor(average / range)
                    }
                    if (top30percent == test.points) {
                        indexes[2] = 19;
                    } else {
                        indexes[2] = Math.floor(top30percent / range)
                    }
                    graph = `<div class="graph-histogram">
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
                    const size = Math.floor(test.points) + 1;
                    let gradeDistribution = new Array(size).fill(0);
                    for (grade of test.grades) {
                        gradeDistribution[Math.floor(grade)]++;
                    }
                    const maxDistribution = Math.max(...gradeDistribution);
                    let indexes = [Math.floor(test.myGrade), Math.floor(average), top30percent];
                    graph = `<div class="graph-histogram">
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
                if ('type' in test && (/^T-[0-9]+$/).test(test.type)) {
                    testOnClick = `onclick="location.href = '/app/${studentId}/${classId}/${lectureId}/${test.id}';"`;
                }

                return `<li class="title disabled no-padding-bottom" ${testOnClick}><p><span>${test.name}</span><span>${test.myGrade} / ${test.points}</span></p></li>
                <li class="comment disabled" ${testOnClick}>${String(test.comment).trim()}</li>
                <li class="disabled no-padding-top" ${testOnClick}>${graph}</li>`;
            } else {
                return `<li class="disabled"><span>${test.name}</span><span>정보 없음</span></li>`;
            }
        }).join('');
    }).catch(error => {
        console.error(error);
        document.getElementById('list-1').innerHTML = '<li class="disabled">일시적인 오류가 발생했습니다</li>';
    }),

    // firebase.functions().httpsCallable('getTests')({ classId: classId, lectureId: lectureId, }).then(async data => {
    //     let tests = data.data;
    //     if (!tests.length) return 0;
    //     await Promise.all(tests.map((testData, i) => {
    //         return lectureRef.collection('tests').doc(testData.id).collection('grade').doc(studentId).get().then(gradeDoc => {
    //             const gradeData = gradeDoc.data();
    //             if (gradeDoc.exists) {
    //                 tests[i].myGrade = gradeData.grade;
    //                 tests[i].comment = 'comment' in gradeData ? gradeData.comment : '';
    //             } else {
    //                 tests[i].myGrade = null;
    //                 tests[i].comment = '';
    //             }
    //         });
    //     }));
    //     document.getElementById('list-1').innerHTML = tests.map(test => {
    //         if (test.myGrade != null) {
    //             let graph = '';
    //             let testOnClick = '';
    //             const average = Math.round(test.grades.reduce((a, b) => a + b) / test.grades.length * 10) / 10;
    //             if (test.points > 19) {
    //                 let gradeDistribution = new Array(20).fill(0);
    //                 const range = test.points / 20;
    //                 for (grade of test.grades) {
    //                     if (grade == test.points) grade -= 0.01;
    //                     gradeDistribution[Math.floor(grade / range)]++;
    //                 }
    //                 const maxDistribution = Math.max(...gradeDistribution);
    //                 let indexes = [0, 0];
    //                 if (test.myGrade == test.points) {
    //                     indexes[0] = 19;
    //                 } else {
    //                     indexes[0] = Math.floor(test.myGrade / range)
    //                 }
    //                 if (average == test.points) {
    //                     indexes[1] = 19;
    //                 } else {
    //                     indexes[1] = Math.floor(average / range)
    //                 }
    //                 graph = `<div class="graph-histogram">
    //                     <div class="graph--container">
    //                         ${gradeDistribution.map((x, i) => {
    //                             x = 6 + 34 * x / maxDistribution;
    //                             if (i == indexes[0]) {
    //                                 return `<div style="height: ${x}px;" class="colored"></div>`
    //                             } else if (i == indexes[1]) {
    //                                 return `<div style="height: ${x}px;" class="dark"></div>`
    //                             } else {
    //                                 return `<div style="height: ${x}px;"></div>`
    //                             }
    //                         }).join('')}
    //                     </div>
    //                     <div class="graph--index">
    //                         <p><span class="colored"></span>내 점수</p>
    //                         <p><span class="dark"></span>평균 (${average}점)</p>
    //                     </div>
    //                 </div>`;
    //             } else {
    //                 const size = Math.floor(test.points);
    //                 let gradeDistribution = new Array(size).fill(0);
    //                 for (grade of test.grades) {
    //                     gradeDistribution[Math.floor(grade)]++;
    //                 }
    //                 const maxDistribution = Math.max(...gradeDistribution);
    //                 let indexes = [Math.floor(test.myGrade), Math.floor(average)];
    //                 graph = `<div class="graph-histogram">
    //                     <div class="graph--container">
    //                         ${gradeDistribution.map((x, i) => {
    //                             x = 6 + 34 * x / maxDistribution;
    //                             if (i == indexes[0]) {
    //                                 return `<div style="height: ${x}px;" class="colored"></div>`
    //                             } else if (i == indexes[1]) {
    //                                 return `<div style="height: ${x}px;" class="dark"></div>`
    //                             } else {
    //                                 return `<div style="height: ${x}px;"></div>`
    //                             }
    //                         }).join('')}
    //                     </div>
    //                     <div class="graph--index">
    //                         <p><span class="colored"></span>내 점수</p>
    //                         <p><span class="dark"></span>평균 (${average}점)</p>
    //                     </div>
    //                 </div>`;
    //             }
    //             if ('type' in test && (/^T-[0-9]+$/).test(test.type)) {
    //                 testOnClick = `onclick="location.href = '/app/${studentId}/${classId}/${lectureId}/${test.id}';"`;
    //             }

    //             return `<li class="title disabled no-padding-bottom" ${testOnClick}><p><span>${test.name}</span><span>${test.myGrade} / ${test.points}</span></p></li>
    //             <li class="comment disabled" ${testOnClick}>${String(test.comment).trim()}</li>
    //             <li class="disabled no-padding-top" ${testOnClick}>${graph}</li>`;
    //         } else {
    //             return `<li class="disabled"><span>${test.name}</span><span>정보 없음</span></li>`;
    //         }
    //     }).join('');
    // }).catch(error => {
    //     console.error(error);
    //     document.getElementById('list-1').innerHTML = '<li class="disabled">일시적인 오류가 발생했습니다</li>';
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
