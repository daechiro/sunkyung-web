const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const ref = {
    manager: uid => db.collection('managers').doc(uid),
    teacher: uid => db.collection('teachers').doc(uid),
    student: uid => db.collection('students').doc(uid),
    parent: uid => db.collection('parents').doc(uid),
    class: classId => db.collection('classes').doc(classId),
};

exports.addStudent = functions.https.onCall(async (data, context) => {
    if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
    if (!(data.name && data.phone && data.school)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
    if (data.phone_parent) {
        const studentUid = (await admin.auth().getUserByPhoneNumber(data.phone).then(userRecord => userRecord.uid).catch(() => null)) || (await admin.auth().createUser({ phoneNumber: data.phone, }).then(userRecord => userRecord.uid).catch(() => null));
        const parentUid = (await admin.auth().getUserByPhoneNumber(data.phone_parent).then(userRecord => userRecord.uid).catch(() => null)) || (await admin.auth().createUser({ phoneNumber: data.phone_parent, }).then(userRecord => userRecord.uid).catch(() => null));
        if (await ref.student(studentUid).get().then(doc => doc.exists)) throw new functions.https.HttpsError('invalid-argument', 'Existing student data.');
        if (await ref.manager(studentUid).get().then(doc => doc.exists)) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');
        if (await ref.teacher(studentUid).get().then(doc => doc.exists)) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');
        if (await ref.parent(studentUid).get().then(doc => doc.exists)) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');

        return {
            res: await Promise.all([
                ref.student(studentUid).set({
                    name: data.name.trim(),
                    mail: '',
                    phone: data.phone,
                    parent: parentUid,
                    classes: [],
                    school: {
                        name: data.school.name,
                        year: data.school.year,
                        status: data.school.status,
                    },
                }, { merge: true }),
                ref.parent(parentUid).set({
                    children: admin.firestore.FieldValue.arrayUnion(studentUid),
                    phone: data.phone_parent,
                }, { merge: true }),
            ]).then(() => true).catch(() => false),
        };
    } else {
        const studentUid = (await admin.auth().getUserByPhoneNumber(data.phone).then(userRecord => userRecord.uid).catch(() => null)) || (await admin.auth().createUser({ phoneNumber: data.phone, }).then(userRecord => userRecord.uid).catch(() => null));
        if (await ref.student(studentUid).get().then(doc => doc.exists)) throw new functions.https.HttpsError('invalid-argument', 'Existing student data.');
        
        return ref.student(studentUid).set({
            name: data.name,
            mail: '',
            phone: data.phone,
            parent: '',
            classes: [],
            school: {
                name: data.school.name,
                year: data.school.year,
                status: data.school.status,
            },
        }, { merge: true });
    }
});

exports.updateStudentPhone = functions.https.onCall(async (data, context) => {
    if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
    if (!(data.uid && data.phone)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
    const currentUser = await admin.auth().getUserByPhoneNumber(data.phone).then(userRecord => userRecord.uid).catch(() => null);
    if (currentUser) {
        if (currentUser == data.uid) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');

        const existence = await Promise.all([
            ref.student(currentUser).get().then(doc => doc.exists),
            ref.parent(currentUser).get().then(doc => {
                if (doc.exists) {
                    if (doc.data().children.length) return true;
                    else return ref.parent(currentUser).delete().then(() => false);
                } else return false;
            }),
            ref.teacher(currentUser).get().then(doc => doc.exists),
            ref.manager(currentUser).get().then(doc => doc.exists),
        ]);
        if (existence.includes(true)) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');

        await admin.auth().deleteUser(currentUser);
    }

    return admin.auth().updateUser(data.uid, {
        phoneNumber: data.phone,
    }).catch(console.error).then(() => {
        return ref.student(data.uid).update({
            phone: data.phone,
        });
    });
});

exports.updateParentPhone = functions.https.onCall(async (data, context) => {
    if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
    if (!(data.uid && data.phone)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
    const currentUser = await admin.auth().getUserByPhoneNumber(data.phone).then(userRecord => userRecord.uid).catch(() => null);
    if (currentUser) {
        if (currentUser == data.uid) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');
        const existence = await Promise.all([
            ref.student(currentUser).get().then(doc => doc.exists),
            ref.teacher(currentUser).get().then(doc => doc.exists),
            ref.manager(currentUser).get().then(doc => doc.exists),
        ]);
        if (existence.includes(true)) throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');

        const isParent = await ref.parent(currentUser).get().then(doc => {
            if (doc.exists) {
                if (doc.data().children.length) return true;
                else return ref.parent(currentUser).delete().then(() => false);
            } else return false;
        });
        if (isParent) {
            return Promise.all([
                ref.parent(currentUser).set({
                    children: admin.firestore.FieldValue.arrayUnion(data.uid),
                    phone: data.phone,
                }, { merge: true }),
                data.parent ? ref.parent(data.parent).get().then(doc => {
                    if (doc.data().children.length > 1) {
                        return ref.parent(data.parent).update({
                            children: admin.firestore.FieldValue.arrayRemove(data.uid),
                        });
                    } else {
                        return ref.parent(data.parent).delete();
                    }
                }) : true,
                ref.student(data.uid).update({
                    parent: currentUser,
                }),
            ]);
        } else {
            await admin.auth().deleteUser(currentUser);
        }
    }
    return admin.auth().createUser({ phoneNumber: data.phone, }).then(userRecord => Promise.all([
        ref.parent(userRecord.uid).set({
            children: admin.firestore.FieldValue.arrayUnion(data.uid),
            phone: data.phone,
        }, { merge: true }),
        data.parent ? ref.parent(data.parent).get().then(doc => {
            if (doc.data().children.length > 1) {
                return ref.parent(data.parent).update({
                    children: admin.firestore.FieldValue.arrayRemove(data.uid),
                });
            } else {
                return ref.parent(data.parent).delete();
            }
        }) : true,
        ref.student(data.uid).update({
            parent: userRecord.uid,
        }),
    ]));
});

// exports.editStudent = functions.https.onCall(async (data, context) => {
//     if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
//     if (!(data.name && data.phone && data.school)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
//     const currentUser = await admin.auth().getUserByPhoneNumber(data.phone).then(userRecord => userRecord.uid).catch(() => null);
//     if (currentUser !== data.uid) {
//         if (await ref.student(currentUser).get().then(doc => !doc.exists) && await ref.parent(currentUser).get().then(doc => !doc.exists)) {
//             admin.auth().deleteUser(currentUser).then(() => {
//                 return admin.auth().updateUser(data.uid, {
//                     phoneNumber: data.phone,
//                 }).catch(console.error);
//             }).catch(console.error);
//         } else throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');
//     } else {
//         admin.auth().updateUser(data.uid, {
//             phoneNumber: data.phone,
//         }).catch(console.error);
//     }

//     if (data.phone_parent) {
//         data.parent = await ref.student(data.uid).get().then(doc => doc.data().parent).catch(() => '');
//         if (data.parent) {
//             admin.auth().updateUser(data.parent, {
//                 phoneNumber: data.phone_parent,
//             }).then(() => {
//                 return ref.parent(data.parent).update({
//                     phone: data.phone_parent,
//                 });
//             }).catch(console.error);
//         } else {
//             data.parent = (await admin.auth().getUserByPhoneNumber(data.phone_parent).then(userRecord => userRecord.uid).catch(() => null)) || (await admin.auth().createUser({ phoneNumber: data.phone_parent, }).then(userRecord => userRecord.uid).catch(() => null));
//             ref.parent(data.parent).set({
//                 children: admin.firestore.FieldValue.arrayUnion(data.uid),
//                 phone: data.phone_parent,
//             }, { merge: true });
//         }
//     } else {
//         data.parent = '';
//     }

//     ref.student(data.uid).update({
//         name: data.name,
//         phone: data.phone,
//         school: {
//             name: data.school.name,
//             year: data.school.year,
//             status: data.school.status,
//         },
//     });
// });

exports.deleteStudent = functions.https.onCall(async (data, context) => {
    if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
    if (!data.uid) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
    const studentData = await ref.student(data.uid).get().then(doc => doc.exists ? doc.data() : false).catch(() => false);
    console.log(data.uid, studentData);
    if (!studentData) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');

    return {
        res: await Promise.all([
            studentData.parent ? ref.parent(studentData.parent).update({
                children: admin.firestore.FieldValue.arrayRemove(data.uid),
            }) : true,
            ...studentData.classes.map(classId => {
                return ref.class(classId).update({
                    students: admin.firestore.FieldValue.arrayRemove(data.uid),
                });
            }),
            ref.student(data.uid).delete(),
            admin.auth().deleteUser(data.uid),
        ]).then(() => true).catch(() => false),
    };
});

exports.addTeacher = functions.https.onCall(async (data, context) => {
    if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
    if (!(data.name && data.phone)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');

    const uid = (await admin.auth().getUserByPhoneNumber(data.phone).then(userRecord => userRecord.uid).catch(() => null)) || (await admin.auth().createUser({ phoneNumber: data.phone, }).then(userRecord => userRecord.uid).catch(() => null));

    if ((await Promise.all([
        ref.student(uid).get().then(doc => doc.exists),
        ref.manager(uid).get().then(doc => doc.exists),
        ref.parent(uid).get().then(doc => doc.exists),
    ])).includes(true)) {
        throw new functions.https.HttpsError('invalid-argument', 'Existing user data.');
    }
    
    return ref.teacher(uid).set({
        name: data.name,
    }, { merge: true }).then(() => true).catch(() => false);;
});

exports.deleteTeacher = functions.https.onCall(async (data, context) => {
    if (!(await ref.manager(context.auth.uid).get().then(doc => doc.exists))) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
    if (!data.uid) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
    const teacherData = await ref.teacher(data.uid).get().then(doc => doc.exists ? doc.data() : false).catch(() => false);
    if (!teacherData) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');

    return Promise.all([
        db.collection('classes').where('teachers', 'array-contains', data.uid).get().then(snapshot => {
            return Promise.all(snapshot.docs.map(doc => {
                return doc.ref.update({
                    teachers: admin.firestore.FieldValue.arrayRemove(data.uid),
                });
            }));
        }),
        ref.teacher(data.uid).delete(),
        admin.auth().deleteUser(data.uid),
    ]).then(() => true).catch(() => false);
});

// exports.getTests = functions.https.onCall(async (data, context) => {
//     if ((await Promise.all([ref.student(context.auth.uid).get().then(doc => doc.exists), ref.parent(context.auth.uid).get().then(doc => doc.exists), ])).every(x => !x)) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
//     if (!(data.classId && data.lectureId)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
//     const testData = await ref.class(data.classId).collection('lectures').doc(data.lectureId).collection('tests').get().then(snapshot => snapshot.docs).catch(() => false);
//     if (!testData) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');

//     return await Promise.all(testData.map(doc => {
//         let Data = doc.data();
//         Data.id = doc.id;
//         Data.questions = Data.questions.map(Q => {
//             delete Q.answer;
//             return Q;
//         });
//         return ref.class(data.classId).collection('lectures').doc(data.lectureId).collection('tests').doc(doc.id).collection('grade').get().then(snapshot => {
//             Data.grades = snapshot.docs.map(doc => doc.data().grade);
//             return Data;
//         });
//     }));
// });

// exports.getTest = functions.https.onCall(async (data, context) => {
//     if ((await Promise.all([ref.student(context.auth.uid).get().then(doc => doc.exists), ref.parent(context.auth.uid).get().then(doc => doc.exists), ])).every(x => !x)) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
//     if (!(data.classId && data.lectureId && data.testId && data.answers)) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');
    
//     const classRef = ref.class(data.classId).collection('lectures').doc(data.lectureId);
//     const testRef = classRef.collection('tests').doc(data.testId);
//     const testData = await testRef.get().then(doc => doc.data()).catch(() => false);
//     if (!testData) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');

//     await Promise.all([
//         testRef.collection('grade').get().then(snapshot => {
//             testData.grades = snapshot.docs.map(doc => doc.data().grade);
//             testData.questions = testData.questions.map((Q, i) => {
//                 Q.ratio = Math.floor(snapshot.docs.filter(doc => Number(doc.data().answers[i]) === Number(Q.answer)).length * 1000 / snapshot.docs.length) / 10;
//                 Q.answer = Number(Q.answer) === Number(data.answers[i]);
//                 return Q;
//             });
//             return 0;
//         }),
//         classRef.collection('attendance').where('attendance', '==', true).get().then(snapshot => {
//             testData.attended = snapshot.docs.length;
//             return 0;
//         }),
//     ]);
//     return testData;
// });

// exports.getTestReport = functions.https.onCall(async (data, context) => {
//     if ((await Promise.all([ref.student(context.auth.uid).get().then(doc => doc.exists && context.auth.uid === data.studentId), ref.parent(context.auth.uid).get().then(doc => doc.exists && doc.data().children.includes(data.studentId)), ])).every(x => !x)) throw new functions.https.HttpsError('unauthorized', 'Unauthorized user access.');
//     if (!data.classId) throw new functions.https.HttpsError('invalid-argument', 'Invalid or insufficient arguments.');

//     let testData;
//     const lecturesRef = ref.class(data.classId).collection('lectures');
//     await lecturesRef.orderBy('open').get().then(snapshot => {
//         testData = {
//             'T-12': new Array(snapshot.docs.length),
//             'T-15': new Array(snapshot.docs.length),
//             'T-45': new Array(snapshot.docs.length),
//         };
//         return Promise.all(snapshot.docs.map((doc, i) => {
//             const testsRef = lecturesRef.doc(doc.id).collection('tests');
//             return testsRef.get().then(snapshot => Promise.all(snapshot.docs.map(tDoc => {
//                 let Data = tDoc.data();
//                 if (String(Data.type) in testData) {
//                     Data.lectureId = doc.id;
//                     Data.testId = tDoc.id;
//                     return testsRef.doc(tDoc.id).collection('grade').get().then(snapshot => {
//                         Data.grades = snapshot.docs.map(doc => {
//                             if (doc.id === data.studentId) {
//                                 Data.myGrade = doc.data().grade;
//                                 Data.myGradeDetail = doc.data().answers.map((x, i) => x == Data.questions[i].answer);
//                             }
//                             return doc.data().grade;
//                         });
//                         Data.questions = Data.questions.map(Q => {
//                             delete Q.answer;
//                             return Q;
//                         });
//                         testData[`${Data.type}`][i] = Data;
//                         return 0;
//                     });
//                 }
//                 return 0;
//             })));
//         }));
//     });
//     return testData;
// });

/* Designed by daechiro@gmail.com */