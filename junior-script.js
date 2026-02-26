import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCzuhfm2ZBifnYafFaUxMb_xCaW33KHBsg",
    authDomain: "smte18-19.firebaseapp.com",
    databaseURL: "https://smte18-19-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smte18-19",
    storageBucket: "smte18-19.firebasestorage.app",
    messagingSenderId: "114273858896",
    appId: "1:114273858896:web:4b5db82daf24d1fd7da855"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.getElementById('btn-search').addEventListener('click', () => {
    const myId = document.getElementById('student-id').value.trim();
    if (!myId) {
        Swal.fire('กรุณากรอกรหัส', 'โปรดระบุรหัสนักเรียนของคุณ', 'warning');
        return;
    }

    Swal.showLoading();

    // ใช้ onValue เพื่อดึงข้อมูลน้องรหัสแบบ Real-time
    const juniorRef = ref(db, `juniors/${myId}`);

    onValue(juniorRef, async (snapshot) => {
        if (snapshot.exists()) {
            const myData = snapshot.val();

            // 1. แสดงข้อมูลน้องรหัส (ตัวเรา)
            document.getElementById('junior-name').innerText = myData.name;
            document.getElementById('junior-id-display').innerText = myId;
            document.getElementById('timeline-my-name').innerText = myData.name;

            const seniorId = myData.senior_id;

            // 2. ตรวจสอบการจับคู่พี่รหัส
            if (seniorId && seniorId !== "") {
                // ดึงข้อมูลพี่รหัสจากโหนด students
                const seniorSnap = await get(ref(db, `students/${seniorId}`));

                if (seniorSnap.exists()) {
                    const sData = seniorSnap.val();

                    // แสดงฉายาและรูปภาพ
                    const aliasName = sData.alias ? `"${sData.alias}"` : "พี่รหัสยังไม่ตั้งฉายา";
                    document.getElementById('senior-alias').innerText = aliasName;
                    document.getElementById('timeline-senior-name').innerText = sData.alias || "มีพี่รหัสแล้ว";

                    if (sData.photo) {
                        document.getElementById('senior-photo').src = sData.photo;
                    }

                    // --- จัดการช่องทางติดต่อ (Facebook / Instagram) ---
                    const fbBtn = document.getElementById('link-fb');
                    const igBtn = document.getElementById('link-ig');
                    const contactMsg = document.getElementById('senior-contact-msg');

                    let hasContact = false;

                    // ตรวจสอบ Facebook
                    if (sData.facebook && sData.facebook.trim() !== "") {
                        fbBtn.href = sData.facebook;
                        fbBtn.classList.remove('d-none');
                        hasContact = true;
                    } else {
                        fbBtn.classList.add('d-none');
                    }

                    // ตรวจสอบ Instagram
                    if (sData.instagram && sData.instagram.trim() !== "") {
                        igBtn.href = sData.instagram;
                        igBtn.classList.remove('d-none');
                        hasContact = true;
                    } else {
                        igBtn.classList.add('d-none');
                    }

                    // แสดงข้อความแนะนำตามสถานะข้อมูลติดต่อ
                    if (hasContact) {
                        contactMsg.innerText = "คลิกเพื่อไปยังช่องทางติดต่อของพี่รหัส";
                        contactMsg.classList.remove('text-danger');
                    } else {
                        contactMsg.innerText = "พี่รหัสยังไม่ได้ลงข้อมูลติดต่อไว้";
                        contactMsg.classList.add('text-danger');
                    }

                    // สลับการแสดงผลหน้าจอ
                    document.getElementById('senior-container').classList.remove('d-none');
                    document.getElementById('no-senior-view').classList.add('d-none');
                }
            } else {
                // กรณีแอดมินยังไม่ใส่ senior_id
                document.getElementById('timeline-senior-name').innerText = "รอลุ้น...";
                document.getElementById('senior-container').classList.add('d-none');
                document.getElementById('no-senior-view').classList.remove('d-none');
            }

            // เปลี่ยนหน้าจาก Login ไปยัง Result
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('result-section').classList.remove('d-none');
            Swal.close();

        } else {
            Swal.fire('ไม่พบรหัสของคุณ', 'โปรดเช็คเลขรหัส หรือสอบถามแอดมิน', 'error');
        }
    }, (error) => {
        console.error(error);
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    });
});

// เพิ่มระบบกด Enter เพื่อค้นหา
document.getElementById('student-id').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('btn-search').click();
    }
});