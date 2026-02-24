import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

document.getElementById('btn-search').addEventListener('click', async () => {
    const myId = document.getElementById('student-id').value.trim();
    if (!myId) {
        Swal.fire('กรุณากรอกรหัส', '', 'warning');
        return;
    }

    Swal.showLoading();

    try {
        // 1. ดึงข้อมูลน้องรหัสจากโหนด "juniors"
        const juniorSnap = await get(ref(db, `juniors/${myId}`));

        if (juniorSnap.exists()) {
            const myData = juniorSnap.val();
            
            // แสดงข้อมูลตัวน้องรหัสเอง (ชื่อน้อง และ ID น้อง)
            document.getElementById('junior-name').innerText = myData.name;
            document.getElementById('junior-id-display').innerText = myId;

            // 2. ตรวจสอบว่าแอดมินจับคู่พี่รหัส (senior_id) ให้หรือยัง
            const seniorId = myData.senior_id;

            if (seniorId && seniorId !== "") {
                // ดึงข้อมูลพี่รหัสจากโหนด "students"
                const seniorSnap = await get(ref(db, `students/${seniorId}`));
                
                if (seniorSnap.exists()) {
                    const sData = seniorSnap.val();
                    
                    // --- แสดงเฉพาะ "ฉายา" และ "ข้อมูลติดต่อ" เท่านั้น (ห้ามแสดงชื่อจริง) ---
                    const aliasDisplay = sData.alias ? `"${sData.alias}"` : "พี่รหัสยังไม่ได้ตั้งฉายา";
                    document.getElementById('senior-alias').innerText = aliasDisplay;
                    
                    // แสดงช่องทางติดต่อ (เผื่อน้องต้องการตามหาตัว)
                    document.getElementById('senior-contact').innerText = sData.contact || "- พี่รหัสยังไม่ได้ลงข้อมูลติดต่อ -";
                    
                    // หากใน HTML มี ID senior-name ให้ล้างค่าหรือซ่อนไว้
                    if(document.getElementById('senior-name')) {
                        document.getElementById('senior-name').innerText = "";
                    }

                    // สลับ View ให้โชว์ข้อมูลพี่
                    document.getElementById('senior-container').classList.remove('d-none');
                    document.getElementById('no-senior-view').classList.add('d-none');
                }
            } else {
                // กรณีแอดมินยังไม่จับคู่ให้
                document.getElementById('senior-container').classList.add('d-none');
                document.getElementById('no-senior-view').classList.remove('d-none');
            }

            // แสดงหน้าผลลัพธ์
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('result-section').classList.remove('d-none');
            Swal.close();

        } else {
            Swal.fire('ไม่พบรหัสของคุณ', 'โปรดเช็คเลขรหัส หรือสอบถามแอดมิน', 'error');
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    }
});