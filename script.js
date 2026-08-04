import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ================= FIREBASE CONFIG =================

const firebaseConfig = {
    apiKey: "AIzaSyA6wkoL8jwaHovy_3ERKLV38PNuVgaI_lo",
    authDomain: "free-service-centre2026.firebaseapp.com",
    projectId: "free-service-centre2026",
    storageBucket: "free-service-centre2026.firebasestorage.app",
    messagingSenderId: "1020597353936",
    appId: "1:1020597353936:web:76e0578cc810a940770dd5"
};


// ================= INITIALIZE FIREBASE =================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ================= ADMIN EMAIL =================

const ADMIN_EMAIL = "freeservicecentre2026@gmail.com";


// ================= CATEGORY LIST =================

const categories = {
    "latest-update": "Latest Update",
    "latest-jobs": "Latest Jobs",
    "sarkari-yojana": "Sarkari Yojana",
    "admit-card": "Admit Card",
    "result": "Result",
    "admission": "Admission",
    "scholarship": "Scholarship",
    "university-update": "University Update",
    "other": "Other"
};


// ================= PAGE LOAD =================

document.addEventListener("DOMContentLoaded", () => {

    // Public website links load
    loadWebsiteLinks();

    // Admin mode only when ?admin=1 is used
    const params = new URLSearchParams(window.location.search);

    if (params.get("admin") === "1") {
        createAdminButton();
    }
});


// ================= ADMIN BUTTON =================

function createAdminButton() {

    const button = document.createElement("button");

    button.innerHTML = "🔐 Admin Login";

    button.id = "adminLoginButton";

    button.onclick = adminLogin;

    document.body.appendChild(button);

    addAdminStyles();
}


// ================= GOOGLE LOGIN =================

async function adminLogin() {

    try {

        const result = await signInWithPopup(auth, provider);

        const user = result.user;

        if (
            user.email !== ADMIN_EMAIL ||
            user.emailVerified !== true
        ) {

            alert(
                "❌ Access Denied\n\n" +
                "यह Gmail Admin नहीं है।"
            );

            await signOut(auth);

            return;
        }

        alert("✅ Admin Login Successful");

        showAdminPanel();

    } catch (error) {

        console.error(error);

        alert(
            "Login में समस्या हुई:\n" +
            error.message
        );
    }
}


// ================= AUTH STATE =================

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    if (
        user.email === ADMIN_EMAIL &&
        user.emailVerified === true
    ) {

        const params = new URLSearchParams(window.location.search);

        if (params.get("admin") === "1") {
            showAdminPanel();
        }
    }
});


// ================= ADMIN PANEL =================

function showAdminPanel() {

    if (document.getElementById("adminPanel")) {
        return;
    }

    const panel = document.createElement("div");

    panel.id = "adminPanel";

    panel.innerHTML = `

        <div class="admin-header">

            <h2>🔐 Free Service Centre Admin</h2>

            <button id="adminLogout">
                Logout
            </button>

        </div>


        <div class="admin-form">

            <h3>नई Link जोड़ें</h3>

            <select id="linkCategory">

                ${Object.entries(categories)
                    .map(
                        ([value, text]) =>
                        `<option value="${value}">
                            ${text}
                        </option>`
                    )
                    .join("")}

            </select>


            <input
                id="linkTitle"
                type="text"
                placeholder="Link का नाम लिखें"
            >


            <input
                id="linkURL"
                type="url"
                placeholder="https://example.com"
            >


            <button id="addLinkButton">
                ➕ Add Link
            </button>

        </div>


        <div class="admin-list">

            <h3>Existing Links</h3>

            <div id="adminLinks">
                Loading...
            </div>

        </div>

    `;

    document.body.prepend(panel);


    document.getElementById("adminLogout")
        .onclick = async () => {

            await signOut(auth);

            panel.remove();

            alert("Admin Logout हो गया।");
        };


    document.getElementById("addLinkButton")
        .onclick = addNewLink;


    loadAdminLinks();
}


// ================= ADD LINK =================

async function addNewLink() {

    const category =
        document.getElementById("linkCategory").value;

    const title =
        document.getElementById("linkTitle").value.trim();

    const url =
        document.getElementById("linkURL").value.trim();


    if (!title || !url) {

        alert("Link का नाम और URL दोनों भरें।");

        return;
    }


    const user = auth.currentUser;


    if (
        !user ||
        user.email !== ADMIN_EMAIL ||
        user.emailVerified !== true
    ) {

        alert("Admin Login जरूरी है।");

        return;
    }


    try {

        await addDoc(
            collection(db, "siteLinks"),
            {
                category: category,
                title: title,
                url: url,
                createdAt: serverTimestamp()
            }
        );


        alert("✅ Link successfully added");


        document.getElementById("linkTitle").value = "";
        document.getElementById("linkURL").value = "";


        loadAdminLinks();
        loadWebsiteLinks();


    } catch (error) {

        console.error(error);

        alert(
            "Link save नहीं हुई:\n" +
            error.message
        );
    }
}


// ================= LOAD ADMIN LINKS =================

async function loadAdminLinks() {

    const box =
        document.getElementById("adminLinks");


    if (!box) return;


    box.innerHTML = "Loading...";


    try {

        const snapshot =
            await getDocs(
                collection(db, "siteLinks")
            );


        if (snapshot.empty) {

            box.innerHTML =
                "<p>अभी कोई Link नहीं है।</p>";

            return;
        }


        box.innerHTML = "";


        snapshot.forEach((item) => {

            const data = item.data();


            const row =
                document.createElement("div");

            row.className = "admin-link-row";


            row.innerHTML = `

                <div>

                    <strong>
                        ${escapeHTML(data.title)}
                    </strong>

                    <small>
                        ${categories[data.category] || data.category}
                    </small>

                </div>


                <div>

                    <button class="editBtn">
                        ✏️
                    </button>

                    <button class="deleteBtn">
                        🗑️
                    </button>

                </div>

            `;


            row.querySelector(".editBtn")
                .onclick = () =>
                    editLink(item.id, data);


            row.querySelector(".deleteBtn")
                .onclick = () =>
                    deleteLink(item.id);


            box.appendChild(row);

        });


    } catch (error) {

        console.error(error);

        box.innerHTML =
            "Links load नहीं हुईं।";
    }
}


// ================= EDIT LINK =================

async function editLink(id, data) {

    const newTitle =
        prompt(
            "Link का नया नाम:",
            data.title
        );


    if (newTitle === null) return;


    const newURL =
        prompt(
            "Link का नया URL:",
            data.url
        );


    if (newURL === null) return;


    try {

        await updateDoc(
            doc(db, "siteLinks", id),
            {
                title: newTitle.trim(),
                url: newURL.trim()
            }
        );


        alert("✅ Link updated");

        loadAdminLinks();
        loadWebsiteLinks();


    } catch (error) {

        console.error(error);

        alert(
            "Update नहीं हुआ:\n" +
            error.message
        );
    }
}


// ================= DELETE LINK =================

async function deleteLink(id) {

    const confirmDelete =
        confirm(
            "क्या आप इस Link को delete करना चाहते हैं?"
        );


    if (!confirmDelete) return;


    try {

        await deleteDoc(
            doc(db, "siteLinks", id)
        );


        alert("🗑️ Link deleted");

        loadAdminLinks();
        loadWebsiteLinks();


    } catch (error) {

        console.error(error);

        alert(
            "Delete नहीं हुआ:\n" +
            error.message
        );
    }
}


// ================= LOAD WEBSITE LINKS =================

async function loadWebsiteLinks() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "siteLinks")
            );


        if (snapshot.empty) {
            return;
        }


        const links = [];


        snapshot.forEach((item) => {

            links.push({
                id: item.id,
                ...item.data()
            });

        });


        links.sort((a, b) => {

            const aTime =
                a.createdAt?.seconds || 0;

            const bTime =
                b.createdAt?.seconds || 0;

            return bTime - aTime;

        });


        Object.keys(categories)
            .forEach((category) => {

                const section =
                    document.querySelector(
                        "." + category
                    );


                if (!section) return;


                let container =
                    section.querySelector(
                        ".update-box"
                    );


                if (!container) {

                    container =
                        section.querySelector(
                            ".admission"
                        );
                }


                if (!container) return;


                const categoryLinks =
                    links.filter(
                        item =>
                            item.category === category
                    );


                if (categoryLinks.length === 0) {
                    return;
                }


                container.innerHTML = "";


                categoryLinks
                    .slice(0, 12)
                    .forEach((item) => {

                        const link =
                            document.createElement("a");


                        link.href = item.url;

                        link.target = "_blank";

                        link.rel =
                            "noopener noreferrer";


                        link.textContent =
                            item.title;


                        container.appendChild(link);

                    });

            });


    } catch (error) {

        console.error(
            "Website links error:",
            error
        );
    }
}


// ================= HTML SECURITY =================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ================= ADMIN CSS =================

function addAdminStyles() {

    const style =
        document.createElement("style");


    style.textContent = `

        #adminLoginButton{

            position:fixed;
            right:10px;
            bottom:10px;

            z-index:99999;

            background:#FFD400;
            color:#000;

            border:none;
            border-radius:6px;

            padding:9px 12px;

            font-weight:bold;

            box-shadow:
                0 2px 10px
                rgba(0,0,0,.25);

        }


        #adminPanel{

            position:relative;

            z-index:99998;

            width:95%;

            max-width:600px;

            margin:15px auto;

            padding:15px;

            background:#fff;

            border:2px solid #FFD400;

            border-radius:8px;

            box-shadow:
                0 2px 15px
                rgba(0,0,0,.15);

        }


        .admin-header{

            display:flex;

            justify-content:
                space-between;

            align-items:center;

            gap:10px;

            margin-bottom:15px;

        }


        .admin-header h2{

            font-size:18px;

        }


        .admin-header button{

            background:#e62117;

            color:#fff;

            border:none;

            padding:7px 10px;

            border-radius:5px;

        }


        .admin-form{

            background:#fff8cc;

            padding:12px;

            border-radius:6px;

            margin-bottom:15px;

        }


        .admin-form h3{

            margin-bottom:10px;

        }


        .admin-form select,
        .admin-form input{

            width:100%;

            height:40px;

            margin-bottom:8px;

            padding:8px;

            border:1px solid #ccc;

            border-radius:5px;

        }


        #addLinkButton{

            width:100%;

            padding:10px;

            border:none;

            border-radius:5px;

            background:#FFD400;

            font-weight:bold;

        }


        .admin-link-row{

            display:flex;

            justify-content:
                space-between;

            align-items:center;

            gap:10px;

            padding:10px 0;

            border-bottom:1px solid #ddd;

        }


        .admin-link-row strong{

            display:block;

            font-size:14px;

        }


        .admin-link-row small{

            display:block;

            color:#666;

            margin-top:3px;

        }


        .admin-link-row button{

            border:none;

            padding:7px;

            margin-left:3px;

            border-radius:4px;

        }


        .editBtn{

            background:#FFD400;

        }


        .deleteBtn{

            background:#e62117;

            color:#fff;

        }

    `;


    document.head.appendChild(style);
}