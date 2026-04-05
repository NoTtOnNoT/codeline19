import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- ฟังก์ชันหลัก: โหลดข้อมูลและเข้าสู่ระบบ ---
function performLogin(myId) {
    currentStudentId = myId;
    Swal.showLoading();

    const juniorRef = ref(db, `juniors/${myId}`);

    onValue(juniorRef, (snapshot) => {
        if (snapshot.exists()) {
            // บันทึก ID ลงเครื่อง (ค้างการล็อกอิน)
            localStorage.setItem('saved_junior_id', myId);
            
            const myData = snapshot.val();

            document.getElementById('junior-name').innerText = myData.name;
            document.getElementById('junior-id-display').innerText = myId;
            document.getElementById('timeline-my-name').innerText = myData.name;

            updateJuniorContactUI(myData.facebook || "", myData.instagram || "");

            // --- ส่วนพี่รหัส ---
            const seniorIdRaw = myData.senior_id ? myData.senior_id.toString() : "";

            if (seniorIdRaw && seniorIdRaw.trim() !== "") {
                const seniorIds = seniorIdRaw.split(',').map(id => id.trim());
                let aliases = [];
                let loadedCount = 0;

                document.getElementById('senior-alias').innerText = "กำลังดึงข้อมูล...";

                seniorIds.forEach((sId) => {
                    const seniorRef = ref(db, `students/${sId}`);
                    onValue(seniorRef, (seniorSnap) => {
                        loadedCount++;
                        if (seniorSnap.exists()) {
                            const sData = seniorSnap.val();
                            aliases.push(sData.alias && sData.alias.trim() !== "" ? sData.alias : "พี่รหัสยังไม่ตั้งฉายา");
                        } else {
                            aliases.push("ไม่พบข้อมูลพี่รหัส");
                        }

                        if (loadedCount === seniorIds.length) {
                            document.getElementById('senior-alias').innerText = aliases.join(" & ");
                            document.getElementById('timeline-senior-name').innerText = aliases[0];
                            
                            const contactMsg = document.getElementById('senior-contact-msg');
                            if (contactMsg) {
                                contactMsg.innerText = aliases.length > 1 ? "สายรหัส (มีพี่รหัส 2 คน)" : "สายรหัสทับหนึ่ง";
                                contactMsg.classList.remove('text-danger');
                            }

                            document.getElementById('senior-container').classList.remove('d-none');
                            document.getElementById('no-senior-view').classList.add('d-none');
                        }
                    });
                });
            } else {
                document.getElementById('timeline-senior-name').innerText = "รอลุ้น...";
                document.getElementById('senior-container').classList.add('d-none');
                document.getElementById('no-senior-view').classList.remove('d-none');
            }

            // สลับหน้า
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('result-section').classList.remove('d-none');
            Swal.close();

        } else {
            // กรณีไม่เจอข้อมูล (อาจโดนลบจาก DB) ให้ล้างค่าที่เซฟไว้ด้วย
            localStorage.removeItem('saved_junior_id');
            Swal.fire({
                icon: 'error',
                title: 'ไม่พบรหัสของคุณ',
                html: 'รหัสไม่ถูกต้อง หรือยังไม่มีข้อมูลในระบบ <br>ติดต่อแอดมิน IG : not_kitti.pat',
                confirmButtonColor: '#ef4444'
            });
        }
    }, (error) => {
        console.error(error);
        Swal.fire('Error', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    });
}

// --- ตรวจสอบ Auto Login เมื่อเปิดเว็บ ---
window.addEventListener('load', () => {
    const savedId = localStorage.getItem('saved_junior_id');
    if (savedId) {
        performLogin(savedId);
    }
});

// --- Event: ปุ่มกดเข้าสู่ระบบ ---
document.getElementById('btn-search').addEventListener('click', () => {
    const myId = document.getElementById('student-id').value.trim();
    if (!myId) {
        Swal.fire({ icon: 'warning', title: 'กรุณากรอกรหัส', text: 'โปรดระบุรหัสนักเรียนของคุณ', confirmButtonColor: '#6366f1' });
        return;
    }
    performLogin(myId);
});

// --- ออกจากระบบ (Logout) ---
window.logout = function() {
    localStorage.removeItem('saved_junior_id'); // ลบข้อมูลที่จำไว้
    location.reload(); // รีโหลดเพื่อกลับหน้า Login
};

// --- แก้ไขช่องทางติดต่อ (UI) ---
function updateJuniorContactUI(fb, ig) {
    const fbRow = document.getElementById('my-fb-row');
    const igRow = document.getElementById('my-ig-row');
    const emptyState = document.getElementById('contact-empty-state');
    if (!fbRow || !igRow || !emptyState) return;

    const fbLink = document.getElementById('my-fb-link');
    const fbName = document.getElementById('my-fb-name');
    const igLink = document.getElementById('my-ig-link');
    const igName = document.getElementById('my-ig-name');

    fbRow.classList.add('d-none');
    igRow.classList.add('d-none');
    emptyState.classList.add('d-none');

    const hasFb = fb && fb.trim() !== "" && fb !== "-";
    const hasIg = ig && ig.trim() !== "" && ig !== "-";

    if (hasFb) {
        fbRow.classList.remove('d-none');
        if (fbName) fbName.innerText = fb.length > 20 ? "Facebook ของฉัน" : fb;
        if (fbLink) fbLink.href = fb.startsWith('http') ? fb : `https://facebook.com/${fb}`;
    } else if (hasIg) {
        igRow.classList.remove('d-none');
        if (igName) igName.innerText = ig.startsWith('@') ? ig : `@${ig}`;
        if (igLink) igLink.href = `https://instagram.com/${ig.replace('@', '')}`;
    } else {
        emptyState.classList.remove('d-none');
    }
}

// --- ฟังก์ชันแก้ไขข้อมูลติดต่อ (Swal) ---
window.openEditContact = async function () {
    const juniorRef = ref(db, `juniors/${currentStudentId}`);
    const snapshot = await get(juniorRef);
    const currentData = snapshot.val() || {};

    let defaultType = currentData.instagram && currentData.instagram !== "" ? 'ig' : 'fb';
    let defaultValue = (defaultType === 'ig' ? currentData.instagram : currentData.facebook) || "";

    const { value: formValues } = await Swal.fire({
        title: '🌐 ช่องทางติดต่อ',
        background: '#1e293b',
        color: '#f8fafc',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save me-2"></i> บันทึกข้อมูล',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: 'transparent',
        html: `
            <div style="text-align: left; font-family: 'Kanit', sans-serif;">
                <div style="margin-bottom: 20px;">
                    <label style="display:block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">เลือกแพลตฟอร์ม:</label>
                    <select id="contact-type-select" style="width: 100%; padding: 15px; background: #0f172a; color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; font-family: 'Kanit'; cursor: pointer;">
                        <option value="fb" ${defaultType === 'fb' ? 'selected' : ''}>🔵 Facebook</option>
                        <option value="ig" ${defaultType === 'ig' ? 'selected' : ''}>🔴 Instagram</option>
                    </select>
                </div>
                <div id="input-area-wrapper">
                    <label id="input-label" style="display:block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">
                        ${defaultType === 'fb' ? 'ลิงก์โปรไฟล์ Facebook:' : 'ชื่อผู้ใช้งาน Instagram:'}
                    </label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <i id="platform-icon" class="${defaultType === 'fb' ? 'fab fa-facebook-f' : 'fab fa-instagram'}" 
                           style="position: absolute; left: 20px; color: ${defaultType === 'fb' ? '#1877F2' : '#E1306C'}; font-size: 1.2rem;"></i>
                        <input id="swal-input-val" class="swal2-input" value="${defaultValue}" placeholder="${defaultType === 'fb' ? 'https://www.facebook.com/...' : '@your.ig.name'}" 
                               style="width: 100%; margin: 0; background: rgba(0,0,0,0.2); color: white; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1); padding-left: 50px;">
                    </div>
                </div>
            </div>
        `,
        didOpen: () => {
            const selectEl = document.getElementById('contact-type-select');
            const icon = document.getElementById('platform-icon');
            const label = document.getElementById('input-label');
            const input = document.getElementById('swal-input-val');
            selectEl.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'fb') {
                    icon.className = 'fab fa-facebook-f'; icon.style.color = '#1877F2';
                    label.innerText = 'ลิงก์โปรไฟล์ Facebook:'; input.placeholder = 'https://www.facebook.com/yourprofile';
                } else {
                    icon.className = 'fab fa-instagram'; icon.style.color = '#E1306C';
                    label.innerText = 'ชื่อผู้ใช้งาน Instagram:'; input.placeholder = '@your.ig.name หรือลิงก์โปรไฟล์';
                }
            });
        },
        preConfirm: () => {
            const type = document.getElementById('contact-type-select').value;
            const val = document.getElementById('swal-input-val').value.trim();
            if (!val) { Swal.showValidationMessage('กรุณากรอกข้อมูลติดต่อ'); return false; }
            return { type, val };
        }
    });

    if (formValues) {
        try {
            Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            const updates = {
                facebook: formValues.type === 'fb' ? formValues.val : "",
                instagram: formValues.type === 'ig' ? formValues.val : ""
            };
            await update(juniorRef, updates);
            updateJuniorContactUI(updates.facebook, updates.instagram);
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', timer: 1500, showConfirmButton: false, background: '#1e293b', color: '#fff' });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', background: '#1e293b' });
        }
    }
};

// --- อื่นๆ ---
document.getElementById('student-id').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { document.getElementById('btn-search').click(); }
});

window.triggerJumpscare = function () {
    const overlay = document.getElementById('jumpscare-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.add('active-jumpscare');
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('active-jumpscare');
            document.body.style.overflow = 'auto';
        }, 2000);
    }
};