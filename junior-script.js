import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- Firebase Configuration ---
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

let currentStudentId = "";

// --- Event: เข้าสู่ระบบ / ค้นหาข้อมูล ---
document.getElementById('btn-search').addEventListener('click', () => {
    const myId = document.getElementById('student-id').value.trim();
    if (!myId) {
        Swal.fire({ icon: 'warning', title: 'กรุณากรอกรหัส', text: 'โปรดระบุรหัสนักเรียนของคุณ', confirmButtonColor: '#6366f1' });
        return;
    }

    currentStudentId = myId;
    Swal.showLoading();

    const juniorRef = ref(db, `juniors/${myId}`);

    onValue(juniorRef, (snapshot) => {
        if (snapshot.exists()) {
            const myData = snapshot.val();

            // แสดงข้อมูลส่วนตัวน้องรหัส
            document.getElementById('junior-name').innerText = myData.name;
            document.getElementById('junior-id-display').innerText = myId;
            document.getElementById('timeline-my-name').innerText = myData.name;

            // อัปเดต UI ช่องทางติดต่อของตัวเอง
            updateJuniorContactUI(myData.facebook || "", myData.instagram || "");

            // ตรวจสอบข้อมูลพี่รหัส
            const seniorId = myData.senior_id;
            if (seniorId && seniorId !== "") {
                const seniorRef = ref(db, `students/${seniorId}`);
                onValue(seniorRef, (seniorSnap) => {
                    if (seniorSnap.exists()) {
                        const sData = seniorSnap.val();
                        const aliasName = sData.alias ? `"${sData.alias}"` : "พี่รหัสยังไม่ตั้งฉายา";
                        document.getElementById('senior-alias').innerText = aliasName;
                        document.getElementById('timeline-senior-name').innerText = sData.alias || "มีพี่รหัสแล้ว";

                        const fbBtn = document.getElementById('link-fb');
                        const igBtn = document.getElementById('link-ig');
                        const contactMsg = document.getElementById('senior-contact-msg');

                        fbBtn.classList.add('d-none');
                        igBtn.classList.add('d-none');

                        if (sData.contact && sData.contact.trim() !== "") {
                            if (sData.contactType === "facebook") {
                                fbBtn.href = sData.contact;
                                fbBtn.classList.remove('d-none');
                            } else if (sData.contactType === "instagram") {
                                igBtn.href = sData.contact;
                                igBtn.classList.remove('d-none');
                            }
                            contactMsg.innerText = "คลิกเพื่อไปยังช่องทางติดต่อของพี่รหัส";
                            contactMsg.classList.remove('text-danger');
                        } else {
                            contactMsg.innerText = "พี่รหัสยังไม่ได้ลงข้อมูลติดต่อไว้";
                            contactMsg.classList.add('text-danger');
                        }

                        document.getElementById('senior-container').classList.remove('d-none');
                        document.getElementById('no-senior-view').classList.add('d-none');
                    }
                });
            } else {
                document.getElementById('timeline-senior-name').innerText = "รอลุ้น...";
                document.getElementById('senior-container').classList.add('d-none');
                document.getElementById('no-senior-view').classList.remove('d-none');
            }

            // สลับหน้าจอ Login -> Result
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('result-section').classList.remove('d-none');
            Swal.close();

        } else {
            Swal.fire({ icon: 'error', title: 'ไม่พบรหัสของคุณ', text: 'โปรดเช็คเลขรหัส หรือสอบถามแอดมิน', confirmButtonColor: '#ef4444' });
        }
    }, (error) => {
        console.error(error);
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    });
});

document.getElementById('student-id').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { document.getElementById('btn-search').click(); }
});

// --- Function: แก้ไขข้อมูลติดต่อ (บันทึกข้อมูล) ---
window.openEditContact = async function () {
    const { value: formValues } = await Swal.fire({
        title: 'ตั้งค่าช่องทางติดต่อ',
        html: `
            <div style="text-align: left; padding: 10px;">
                <p style="font-size:0.85rem; color:#6366f1; margin-bottom:15px; background: rgba(99,102,241,0.1); padding: 8px; border-radius: 8px;">
                    <i class="fas fa-info-circle me-1"></i> เลือกแพลตฟอร์มที่พี่รหัสจะหาคุณได้ง่ายที่สุด
                </p>
                <div style="display: flex; justify-content: space-around; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <label style="cursor:pointer; font-weight:500;"><input type="radio" name="contact-type" value="fb" checked> Facebook</label>
                    <label style="cursor:pointer; font-weight:500;"><input type="radio" name="contact-type" value="ig"> Instagram</label>
                </div>
                <input id="swal-input-val" class="swal2-input" placeholder="URL โปรไฟล์ หรือ @ชื่อไอจี" style="width: 100%; margin: 0; font-family: 'Kanit', sans-serif;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'บันทึกข้อมูล',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#6366f1',
        preConfirm: () => {
            const type = document.querySelector('input[name="contact-type"]:checked').value;
            const val = document.getElementById('swal-input-val').value.trim();

            if (!val) {
                Swal.showValidationMessage('กรุณากรอกข้อมูลติดต่อ');
                return false;
            }
            return { type, val };
        }
    });

    if (formValues) {
        try {
            Swal.showLoading();
            // บันทึกแบบ Clear ข้อมูลเก่าออก (โชว์ได้แค่ 1 อย่าง)
            const updates = {
                facebook: formValues.type === 'fb' ? formValues.val : "",
                instagram: formValues.type === 'ig' ? formValues.val : ""
            };

            const juniorUpdateRef = ref(db, `juniors/${currentStudentId}`);
            await update(juniorUpdateRef, updates);

            // UI จะอัปเดตอัตโนมัติจาก onValue ด้านบน แต่สั่งซ้ำเพื่อความไว
            updateJuniorContactUI(updates.facebook, updates.instagram);

            Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลเรียบร้อย!', timer: 1500, showConfirmButton: false });
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
    }
};

function updateJuniorContactUI(fb, ig) {
    const fbRow = document.getElementById('my-fb-row');
    const igRow = document.getElementById('my-ig-row');
    const emptyState = document.getElementById('contact-empty-state');
    
    // ป้องกัน Error ถ้าหา ID ไม่เจอ
    if (!fbRow || !igRow || !emptyState) return;

    const fbLink = document.getElementById('my-fb-link');
    const fbName = document.getElementById('my-fb-name');
    const igLink = document.getElementById('my-ig-link');
    const igName = document.getElementById('my-ig-name');

    // 1. ซ่อนทุกอย่างก่อนเสมอ (Clear State)
    fbRow.classList.add('d-none');
    igRow.classList.add('d-none');
    emptyState.classList.add('d-none');

    // 2. เช็คค่าจาก Database
    const hasFb = fb && fb.trim() !== "" && fb !== "-";
    const hasIg = ig && ig.trim() !== "" && ig !== "-";

    if (hasFb) {
        // แสดง Facebook
        fbRow.classList.remove('d-none');
        if (fbName) fbName.innerText = fb.length > 20 ? "Facebook ของฉัน" : fb;
        if (fbLink) fbLink.href = fb.startsWith('http') ? fb : `https://facebook.com/${fb}`;
    } 
    else if (hasIg) {
        // แสดง Instagram (จะแสดงก็ต่อเมื่อไม่มี Facebook ตามลำดับความสำคัญ)
        igRow.classList.remove('d-none');
        if (igName) igName.innerText = ig.startsWith('@') ? ig : `@${ig}`;
        if (igLink) igLink.href = `https://instagram.com/${ig.replace('@', '')}`;
    } 
    else {
        // ถ้าไม่มีทั้งคู่ ให้โชว์ Empty State
        emptyState.classList.remove('d-none');
    }
}