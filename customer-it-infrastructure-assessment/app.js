/* =========================================================
   ✅ SAVE AUDIT (JSON)
   ========================================================= */
async function saveAudit() {

    const clientName = document.getElementById("clientName").value.trim();
    const stafferName = document.getElementById("stafferName").value.trim();

    const clientError = document.getElementById("clientNameError");
    const stafferError = document.getElementById("stafferNameError");

    let hasError = false;

    // ✅ Validation
    if (!clientName) {
        clientError.style.display = "block";
        hasError = true;
    } else {
        clientError.style.display = "none";
    }

    if (!stafferName) {
        stafferError.style.display = "block";
        hasError = true;
    } else {
        stafferError.style.display = "none";
    }

    if (hasError) return;

    // ✅ Nom de fichier propre
    const safeName = clientName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9-_]/g, "_");

    const dateString = new Date().toISOString().split("T")[0];
    const fileName = `Audit365-${safeName} (${dateString}).json`;

    /* =====================================================
       ✅ COLLECTE DES CHECKLISTS (NON VM)
       ===================================================== */
    const data = {};

    document.querySelectorAll("ul.checklist input[type=checkbox]").forEach(input => {
        const key = input.name;
        if (!data[key]) data[key] = null;

        if (input.checked) {
            const span = input.nextElementSibling;
            if (span.classList.contains("done")) data[key] = "done";
            else if (span.classList.contains("warn")) data[key] = "warn";
            else if (span.classList.contains("notdone")) data[key] = "notdone";
        }
    });

    /* =====================================================
       ✅ INFOS GÉNÉRALES
       ===================================================== */
    data.clientName = clientName;
    data.stafferName = stafferName;
    data.auditDate = dateString;
    data.comments = document.getElementById("comments").innerText;
    data.date = document.getElementById("date").value;

    /* =====================================================
   ✅ SAVE VM ROWS (DYNAMIQUES)
   ===================================================== */
data.vms = [];

document.querySelectorAll(".vm-row:not(.vm-template)").forEach(row => {

    const vmName =
        row.querySelector(".vm-name-input")?.value || "";

    const states = {};

    row.querySelectorAll("input[type=checkbox]").forEach(cb => {

        if (!cb.checked) return;

        const span = cb.nextElementSibling;

        if (!span) return;

        /* ===== DONE ===== */
        if (span.classList.contains("done")) {

            states[cb.name] = "done";
        }

        /* ===== WARNING ===== */
        else if (span.classList.contains("warn")) {

            states[cb.name] = "warn";
        }

        /* ===== NOT DONE ===== */
        else if (span.classList.contains("notdone")) {

            states[cb.name] = "notdone";
        }

        /* ===== N/A ===== */
        else if (span.classList.contains("na")) {

            states[cb.name] = "na";
        }
    });

    data.vms.push({
        name: vmName,
        states: states
    });
});

/* =====================================================
   ✅ SAVE STAFFER NAME
   ===================================================== */
localStorage.setItem("stafferName", stafferName);

    /* =====================================================
       ✅ SAUVEGARDE DU FICHIER
       ===================================================== */
    const blob = new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json"
    });

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
                description: "Audit JSON",
                accept: { "application/json": [".json"] }
            }]
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        alert("✅ Audit saved successfully!");
    } catch (err) {
        console.warn("Save cancelled", err);
    }
}



/* =========================================================
   ✅ LOAD AUDIT (JSON)
   ========================================================= */
function loadAudit(event) {

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        const data = JSON.parse(e.target.result);

        /* =====================================================
           ✅ RESET COMPLET DES CHECKBOX
           ===================================================== */
        document.querySelectorAll("input[type=checkbox]").forEach(cb => {
            cb.checked = false;
        });

        /* =====================================================
           ✅ RESET DES VM DYNAMIQUES
           ===================================================== */
        document.querySelectorAll(".vm-row:not(.vm-template)").forEach(row => {
    row.remove();
});

        /* =====================================================
           ✅ LOAD CHECKLISTS CLASSIQUES
           ===================================================== */
        document.querySelectorAll("ul.checklist input[type=checkbox]").forEach(r => {

            const key = r.name;
            const span = r.nextElementSibling;

            if (!span) return;

            if (data[key] === "done" && span.classList.contains("done")) {
                r.checked = true;
            }

            if (data[key] === "warn" && span.classList.contains("warn")) {
                r.checked = true;
            }

            if (data[key] === "notdone" && span.classList.contains("notdone")) {
                r.checked = true;
            }

            if (data[key] === "na" && span.classList.contains("na")) {
                r.checked = true;
            }
        });

        /* =====================================================
           ✅ LOAD INFOS GÉNÉRALES
           ===================================================== */
        if (data.clientName) {
            document.getElementById("clientName").value = data.clientName;
        }

        if (data.stafferName) {
            document.getElementById("stafferName").value = data.stafferName;
        }

        if (data.comments) {
            document.getElementById("comments").innerText = data.comments;
        }

        if (data.date) {
            document.getElementById("date").value = data.date;
        }

        /* =====================================================
           ✅ LOAD VM ROWS
           ===================================================== */
        if (Array.isArray(data.vms)) {

            const vmTable = document.querySelector(".vm-table");
            const template = document.querySelector(".vm-row[data-template]");

            data.vms.forEach((vm, index) => {

                const clone = template.cloneNode(true);

clone.removeAttribute("data-template");
clone.classList.remove("vm-template");

clone.style.display = "grid";

                /* ===== VM NAME ===== */
                const nameInput = clone.querySelector(".vm-name-input");
                if (nameInput) {
                    nameInput.value = vm.name || "";
                }

                /* ===== RENAME INPUTS ===== */
                clone.querySelectorAll("input[type='checkbox']").forEach(input => {

    input.checked = false;

    const oldName = input.name;
    const suffix = oldName.split("_")[1];

    input.name = `vm${index + 1}_${suffix}`;
});

                /* ===== RESTORE STATES ===== */
                clone.querySelectorAll("input[type='checkbox']").forEach(input => {

                    const state = vm.states?.[input.name];
                    const span = input.nextElementSibling;

                    if (!state || !span) return;

                    if (state === "done" && span.classList.contains("done")) {
                        input.checked = true;
                    }

                    if (state === "warn" && span.classList.contains("warn")) {
                        input.checked = true;
                    }

                    if (state === "notdone" && span.classList.contains("notdone")) {
                        input.checked = true;
                    }

                    if (state === "na" && span.classList.contains("na")) {
                        input.checked = true;
                    }
                });

                vmTable.appendChild(clone);
            });
        }

        alert("✅ Audit loaded successfully!");
    };

    reader.readAsText(file);
}

/* =========================================================
   ✅ EXPORT PDF — MODERN MICROSOFT STYLE
   ========================================================= */
async function exportPDF() {

    try {

        /* =====================================================
           ✅ VALIDATION
           ===================================================== */

        const clientName = document.getElementById("clientName").value.trim();
        const stafferName = document.getElementById("stafferName").value.trim();
        const auditDate = document.getElementById("date").value;

        const clientError = document.getElementById("clientNameError");
        const stafferError = document.getElementById("stafferNameError");

        let hasError = false;

        if (!clientName) {
            clientError.style.display = "block";
            hasError = true;
        } else {
            clientError.style.display = "none";
        }

        if (!stafferName) {
            stafferError.style.display = "block";
            hasError = true;
        } else {
            stafferError.style.display = "none";
        }

        if (hasError) return;

        /* =====================================================
           ✅ FILE NAME
           ===================================================== */

        const safeName = clientName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9-_]/g, "_");

        const today = new Date().toISOString().split("T")[0];

        const fileName = `Audit365-${safeName} (${today}).pdf`;

        /* =====================================================
           ✅ PDF INIT
           ===================================================== */

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = 210;
        const pageHeight = 297;

        const marginTop = 18;
        const marginBottom = 18;
        const marginLeft = 14;
        const marginRight = 14;

        const usableWidth =
            pageWidth - marginLeft - marginRight;

        let currentPage = 1;

        const sections =
            document.querySelectorAll(".section");

        const exportSections = Array.from(sections).filter(section => {

            return !(
                section.querySelector("#clientName") ||
                section.querySelector("#stafferName")
            );
        });

        const totalPages =
            exportSections.length + 1;

        /* =====================================================
           ✅ COVER PAGE
           ===================================================== */

        pdf.setFillColor(248, 249, 251);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");

        pdf.setDrawColor(0, 120, 212);
        pdf.setLineWidth(1.2);

        pdf.line(30, 60, 180, 60);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(28);

        pdf.setTextColor(0, 102, 204);

        pdf.text(
            "Customer IT Infrastructure",
            pageWidth / 2,
            95,
            { align: "center" }
        );

        pdf.text(
            "Assessment",
            pageWidth / 2,
            112,
            { align: "center" }
        );

        pdf.setFont("helvetica", "normal");

        pdf.setTextColor(70, 70, 70);

        pdf.setFontSize(15);

        pdf.text(
            `Customer : ${clientName}`,
            pageWidth / 2,
            160,
            { align: "center" }
        );

        pdf.text(
            `Engineer : ${stafferName}`,
            pageWidth / 2,
            174,
            { align: "center" }
        );

        pdf.text(
            `Audit date : ${auditDate}`,
            pageWidth / 2,
            188,
            { align: "center" }
        );

        pdf.setFontSize(11);

        pdf.setTextColor(120, 120, 120);

        pdf.text(
            "Generated by ORBID",
            pageWidth / 2,
            260,
            { align: "center" }
        );

        /* =====================================================
           ✅ FOOTER
           ===================================================== */

        function drawFooter(pageNumber) {

            pdf.setDrawColor(0, 120, 212);

            pdf.line(
                marginLeft,
                pageHeight - 14,
                pageWidth - marginRight,
                pageHeight - 14
            );

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);

            pdf.setTextColor(0, 102, 204);

            pdf.text(
                "ORBID",
                marginLeft,
                pageHeight - 8
            );

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);

            pdf.setTextColor(90, 90, 90);

            pdf.text(
                `Engineer: ${stafferName}`,
                55,
                pageHeight - 8,
                { align: "center" }
            );

            pdf.text(
                `Customer: ${clientName}`,
                110,
                pageHeight - 8,
                { align: "center" }
            );

            pdf.text(
                `Audit Date: ${auditDate}`,
                155,
                pageHeight - 8,
                { align: "center" }
            );

            pdf.text(
                `Page ${pageNumber}/${totalPages}`,
                pageWidth - marginRight,
                pageHeight - 8,
                { align: "right" }
            );
        }

        drawFooter(currentPage);

        /* =====================================================
           ✅ EXPORT EACH SECTION
           ===================================================== */

        for (const section of exportSections) {

            const clone = section.cloneNode(true);

            clone.style.width = "1250px";
            clone.style.background = "#ffffff";
            clone.style.padding = "30px";
            clone.style.boxSizing = "border-box";

            /* =================================================
               ✅ REMOVE BUTTONS / USELESS ELEMENTS
               ================================================= */

            clone.querySelectorAll(".vm-delete").forEach(el => {
                el.remove();
            });

            clone.querySelectorAll("#addVmLine").forEach(el => {
                el.remove();
            });

            clone.querySelectorAll(".btn").forEach(el => {
                el.remove();
            });

            /* =================================================
   ✅ REMOVE OK / WARNING / NOK HEADERS
   ================================================= */

clone.querySelectorAll(".table-header .choice-label").forEach(el => {
    el.remove();
});

/* =================================================
   ✅ REMOVE OK / WARNING / NOK TEXT
   ================================================= */

clone.querySelectorAll(".ok-label").forEach(el => {
    el.remove();
});

clone.querySelectorAll(".warn-label").forEach(el => {
    el.remove();
});

clone.querySelectorAll(".nok-label").forEach(el => {
    el.remove();
});

/* =================================================
   ✅ REMOVE WARNING ICONS
   ================================================= */

clone.querySelectorAll(".fa-triangle-exclamation").forEach(el => {
    el.remove();
});

clone.querySelectorAll(".fa-warning").forEach(el => {
    el.remove();
});

clone.querySelectorAll(".fa-exclamation-triangle").forEach(el => {
    el.remove();
});

clone.querySelectorAll("svg").forEach(svg => {

    const html = svg.outerHTML.toLowerCase();

    if (
        html.includes("triangle") ||
        html.includes("warning") ||
        html.includes("exclamation")
    ) {
        svg.remove();
    }
});

/* =================================================
   ✅ FALLBACK REMOVE RAW TEXT
   ================================================= */

clone.querySelectorAll("*").forEach(el => {

    const text = el.textContent?.trim();

    if (
        text === "OK" ||
        text === "NOK" ||
        text === "WARNING" ||
        text === "⚠"
    ) {
        el.remove();
    }
});

/* =================================================
   ✅ NORMAL CHECKLISTS ONLY
   ================================================= */

clone.querySelectorAll("li:not(.vm-row)").forEach(row => {

    const choices =
        Array.from(
            row.querySelectorAll(".choice")
        );

    if (!choices.length) return;

    const checkedChoices =
        choices.filter(choice => {

            const input =
                choice.querySelector("input");

            return input?.checked;
        });

    /* ===== NOTHING CHECKED ===== */
    if (checkedChoices.length === 0) {

        choices.forEach(choice => {
            choice.remove();
        });

        const na =
            document.createElement("div");

        na.textContent = "N/A";

        na.style.fontSize = "16px";
        na.style.fontWeight = "600";
        na.style.color = "#9a9a9a";

        na.style.display = "flex";
        na.style.alignItems = "center";
        na.style.justifyContent = "center";

        na.style.minWidth = "70px";

        row.appendChild(na);

        return;
    }

    /* ===== KEEP ONLY CHECKED ===== */
    choices.forEach(choice => {

        const input =
            choice.querySelector("input");

        if (!input?.checked) {
            choice.remove();
        }
    });
});

/* =================================================
   ✅ VM TABLE
   ================================================= */

clone.querySelectorAll(".vm-row").forEach(row => {

    const vmCells =
        row.querySelectorAll(".vm-cells");

    vmCells.forEach(cell => {

        const choices =
            Array.from(
                cell.querySelectorAll(".choice")
            );

        if (!choices.length) return;

        const checkedChoices =
            choices.filter(choice => {

                const input =
                    choice.querySelector("input");

                return input?.checked;
            });

        /* ===== NO CHECKED ===== */
        if (checkedChoices.length === 0) {

            cell.innerHTML = `
                <div style="
                    font-size:16px;
                    font-weight:600;
                    color:#9a9a9a;
                    text-align:center;
                    width:100%;
                ">
                    N/A
                </div>
            `;

            return;
        }

        /* ===== KEEP ONLY CHECKED ===== */
        cell.innerHTML = "";

        checkedChoices.forEach(choice => {
            cell.appendChild(choice);
        });

        cell.style.display = "flex";
        cell.style.justifyContent = "center";
        cell.style.alignItems = "center";
    });
});

            /* =================================================
               ✅ MODERN VM TABLE
               ================================================= */

            const vmTable = clone.querySelector(".vm-table");

            if (vmTable) {

                vmTable.style.width = "100%";

                vmTable.style.borderRadius = "18px";

                vmTable.style.overflow = "hidden";

                vmTable.style.background = "#ffffff";

                vmTable.style.boxShadow =
                    "0 4px 18px rgba(0,0,0,0.06)";

                vmTable.style.border =
                    "1px solid #e5e5e5";

                /* ===== HEADER ===== */

                const vmHeader =
                    vmTable.querySelector(".vm-header");

                if (vmHeader) {

                    vmHeader.style.display = "grid";

                    vmHeader.style.gridTemplateColumns =
                        "240px repeat(7, 1fr)";

                    vmHeader.style.alignItems =
                        "center";

                    vmHeader.style.background =
                        "#0078D4";

                    vmHeader.style.color =
                        "#ffffff";

                    vmHeader.style.fontWeight =
                        "600";

                    vmHeader.style.fontSize =
                        "18px";

                    vmHeader.style.padding =
                        "18px 22px";

                    vmHeader.style.boxSizing =
                        "border-box";
                }

                vmHeader?.querySelector(".vm-actions")
                    ?.remove();

                /* ===== HEADER CELLS ===== */

                vmTable.querySelectorAll(".vm-col")
                    .forEach(col => {

                        col.style.display = "flex";

                        col.style.alignItems =
                            "center";

                        col.style.justifyContent =
                            "center";

                        col.style.textAlign =
                            "center";
                    });

                vmTable.querySelector(".vm-col.vm-name")
                    ?.style.setProperty(
                        "justify-content",
                        "flex-start"
                    );

                /* ===== ROWS ===== */

                vmTable.querySelectorAll(".vm-row")
                    .forEach((row, index) => {

                        row.style.display = "grid";

                        row.style.gridTemplateColumns =
                            "240px repeat(7, 1fr)";

                        row.style.alignItems =
                            "center";

                        row.style.padding =
                            "16px 22px";

                        row.style.boxSizing =
                            "border-box";

                        row.style.borderBottom =
                            "1px solid #ececec";

                        row.style.background =
                            index % 2 === 0
                                ? "#ffffff"
                                : "#fafafa";
                    });

                /* ===== REMOVE ACTION COLUMN ===== */

                vmTable.querySelectorAll(".vm-actions")
                    .forEach(el => {
                        el.remove();
                    });

                /* ===== VM NAME ===== */

                vmTable.querySelectorAll(".vm-name-input")
                    .forEach(input => {

                        input.style.border = "none";
                        input.style.background = "transparent";

                        input.style.boxShadow = "none";
                        input.style.outline = "none";

                        input.style.fontSize = "20px";
                        input.style.fontWeight = "600";

                        input.style.color = "#202020";

                        input.style.width = "100%";

                        input.style.padding = "0";
                        input.style.margin = "0";

                        input.style.fontFamily =
                            "'Segoe UI', sans-serif";
                    });

                /* ===== CELLS ===== */

                vmTable.querySelectorAll(".vm-cells")
                    .forEach(cell => {

                        cell.style.display = "flex";

                        cell.style.justifyContent =
                            "center";

                        cell.style.alignItems =
                            "center";

                        cell.style.minHeight =
                            "40px";
                    });

                /* ===== BIG CHECKBOX ===== */

                vmTable.querySelectorAll(".chk")
                    .forEach(chk => {

                        chk.style.transform =
                            "scale(1.35)";
                    });
            }

            /* =================================================
               ✅ ENGINEER COMMENTS
               ================================================= */

            const commentsBox =
                clone.querySelector("#comments");

            if (commentsBox) {

                commentsBox.style.height = "auto";
                commentsBox.style.maxHeight = "none";
                commentsBox.style.overflow = "visible";

                commentsBox.style.border = "none";
                commentsBox.style.background = "transparent";

                commentsBox.style.padding = "0";
                commentsBox.style.marginTop = "15px";

                commentsBox.style.whiteSpace = "pre-wrap";
                commentsBox.style.wordBreak = "break-word";

                commentsBox.style.fontSize = "20px";
                commentsBox.style.lineHeight = "1.9";

                commentsBox.style.fontFamily =
                    "'Segoe UI', sans-serif";
            }

            /* =================================================
               ✅ BIGGER TEXT
               ================================================= */

            clone.querySelectorAll("*").forEach(el => {

                const tag =
                    el.tagName?.toLowerCase();

                if (tag === "h2") {

                    el.style.fontSize = "30px";
                    el.style.marginBottom = "25px";
                }

                else if (
                    el.classList.contains("item-label")
                ) {

                    el.style.fontSize = "22px";
                    el.style.fontWeight = "600";
                    el.style.lineHeight = "1.8";
                }

                else if (
                    tag === "li" ||
                    tag === "span" ||
                    tag === "div" ||
                    tag === "p" ||
                    tag === "label" ||
                    tag === "a"
                ) {

                    el.style.fontSize = "18px";
                    el.style.lineHeight = "1.7";
                }
            });

            /* =================================================
               ✅ TEMP CONTAINER
               ================================================= */

            const temp =
                document.createElement("div");

            temp.style.position = "absolute";
            temp.style.left = "-99999px";
            temp.style.top = "0";

            temp.appendChild(clone);

            document.body.appendChild(temp);

            /* =================================================
               ✅ CANVAS
               ================================================= */

            const canvas = await html2canvas(clone, {
                scale: 1.5,
                useCORS: true,
                backgroundColor: "#ffffff"
            });

            document.body.removeChild(temp);

            const imgData =
                canvas.toDataURL("image/png");

            const imgWidth = usableWidth;

            const imgHeight =
                (canvas.height * imgWidth) / canvas.width;

            pdf.addPage();

            currentPage++;

            drawFooter(currentPage);

            const availableHeight =
                pageHeight -
                marginTop -
                marginBottom;

            let finalHeight = imgHeight;

            if (finalHeight > availableHeight) {
                finalHeight = availableHeight;
            }

            pdf.addImage(
                imgData,
                "PNG",
                marginLeft,
                marginTop,
                imgWidth,
                finalHeight
            );
        }

        /* =====================================================
           ✅ SAVE FILE
           ===================================================== */

        if ("showSaveFilePicker" in window) {

            const handle =
                await window.showSaveFilePicker({

                    suggestedName: fileName,

                    types: [{
                        description: "PDF File",
                        accept: {
                            "application/pdf": [".pdf"]
                        }
                    }]
                });

            const writable =
                await handle.createWritable();

            const pdfBlob = pdf.output("blob");

            await writable.write(pdfBlob);

            await writable.close();

        } else {

            pdf.save(fileName);
        }

        alert("✅ PDF exported successfully!");

    } catch (err) {

        console.error(err);

        alert("❌ PDF export failed.");
    }
}


/* =========================================================
   ✅ AUTO-FILL STAFFER NAME & DATE (CLEAN VERSION)
   ========================================================= */

window.addEventListener("DOMContentLoaded", () => {

    /* ===== Staffer name ===== */
    const stafferInput = document.getElementById("stafferName");
    if (stafferInput) {
        const savedStaffer = localStorage.getItem("stafferName");

        // ❌ Nettoyage des anciennes valeurs invalides
        if (savedStaffer === "Windows User" || savedStaffer === "windows user") {
            localStorage.removeItem("stafferName");
            stafferInput.value = "";
            stafferInput.placeholder = "Example : Jasha Eslahi";
        }
        // ✅ Valeur valide
        else if (savedStaffer) {
            stafferInput.value = savedStaffer;
        }
        // ✅ Aucun nom sauvegardé
        else {
            stafferInput.value = "";
            stafferInput.placeholder = "Example : Jasha Eslahi";
        }
    }

    /* ===== Date auto-fill ===== */
    const dateInput = document.getElementById("date");
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
    }
});

/* ===== Button: Today ===== */
document.getElementById("setToday")?.addEventListener("click", () => {
    const dateInput = document.getElementById("date");
    if (!dateInput) return;

    dateInput.value = new Date().toISOString().slice(0, 10);
});

/* =========================================================
   ✅ RADIO BEHAVIOR PAR LIGNE UNIQUEMENT
   ========================================================= */
document.addEventListener("change", (e) => {

    const input = e.target;

    if (
        !input.matches('.choice input[type="checkbox"]') ||
        !input.checked
    ) {
        return;
    }

    /* =====================================================
       ✅ VM TABLE
       ===================================================== */
    const vmRow = input.closest(".vm-row");

    if (vmRow) {

        const currentName = input.name;

        vmRow.querySelectorAll(`input[name="${currentName}"]`)
            .forEach(other => {
                if (other !== input) {
                    other.checked = false;
                }
            });

        return;
    }

    /* =====================================================
       ✅ CHECKLISTS CLASSIQUES
       ===================================================== */
    document.querySelectorAll(`input[name="${input.name}"]`)
        .forEach(other => {
            if (other !== input) {
                other.checked = false;
            }
        });
});

/* =========================================================
   ✅ CREATE VM CELL
   ========================================================= */

function createVmCell(name, hasWarn = true) {

    return `
        <div class="vm-cells">

            <label class="choice">
                <input type="checkbox" name="${name}">
                <span class="chk done"></span>
            </label>

            ${hasWarn ? `
            <label class="choice">
                <input type="checkbox" name="${name}">
                <span class="chk warn"></span>
            </label>
            ` : ""}

            <label class="choice">
                <input type="checkbox" name="${name}">
                <span class="chk notdone"></span>
            </label>

        </div>
    `;
}

/* =========================================================
   ✅ CREATE VM ROW
   ========================================================= */

function createVmRow(vmName = "", index = 1) {

    const row = document.createElement("div");

    row.className = "vm-row";

    row.style.display = "grid";

    row.innerHTML = `

        <div class="vm-actions">
            <i class="fa-solid fa-trash vm-delete"></i>
        </div>

        <div class="vm-name">
            <input
                type="text"
                class="vm-name-input"
                value="${vmName}"
                placeholder="VM name"
            >
        </div>

        ${createVmCell(`vm${index}_updated`, false)}
        ${createVmCell(`vm${index}_restart`, false)}
        ${createVmCell(`vm${index}_cpu`, true)}
        ${createVmCell(`vm${index}_disk`, true)}
        ${createVmCell(`vm${index}_ram`, true)}
        ${createVmCell(`vm${index}_eset`, false)}
        ${createVmCell(`vm${index}_fw`, false)}
    `;

    return row;
}


/* =========================================================
   ✅ ADD VM LINES DYNAMIQUEMENT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    let vmCounter = 1;

    const vmTable = document.querySelector(".vm-table");
    const template = document.querySelector(".vm-row[data-template]");
    const addBtn = document.getElementById("addVmLine");

    /* ==========================
       ✅ ADD LINE
       ========================== */
    addBtn.addEventListener("click", () => {

    const vmName = prompt("Enter VM name:");
    if (!vmName) return;

    const normalizedName = vmName.trim().toLowerCase();

    // ✅ récupérer tous les noms existants
    const existingNames = Array.from(
        document.querySelectorAll(".vm-name-input")
    ).map(input => input.value.trim().toLowerCase());

    // ❌ doublon détecté
    if (existingNames.includes(normalizedName)) {
        alert(`❌ The VM "${vmName}" already exists.`);
        return;
    }

    // ✅ ajout autorisé
const clone = createVmRow(vmName, vmCounter);

vmTable.appendChild(clone);

vmCounter++;
});


    /* ==========================
   ✅ RESET + UNIQUE INPUT NAMES
   ========================== */
function resetAndRenameInputs(row, index) {

    row.querySelectorAll("input[type='checkbox']").forEach(input => {

        input.checked = false;

        /* ===== ancien nom ===== */
        const oldName = input.name;

        /* ===== suffixe ===== */
        const suffix = oldName.split("_")[1];

        /* ===== nouveau nom UNIQUE ===== */
        input.name = `vm${index}_${suffix}`;
    });
}

    /* ==========================
       ✅ DELETE LINE
       ========================== */
    vmTable.addEventListener("click", (e) => {
        if (e.target.classList.contains("vm-delete")) {
            const row = e.target.closest(".vm-row");
            if (!row) return;

            if (confirm("Delete this VM line?")) {
                row.remove();
            }
        }
    });

});

    /* ==========================
       ✅ Listener pour vérifier les doublons de noms de VM en temps réel
       ========================== */

document.addEventListener("input", e => {

    const input = e.target;
    if (!input.classList.contains("vm-name-input")) return;

    const currentValue = input.value.trim().toLowerCase();
    if (!currentValue) return;

    const allInputs = Array.from(
        document.querySelectorAll(".vm-name-input")
    );

    const duplicates = allInputs.filter(i =>
        i !== input &&
        i.value.trim().toLowerCase() === currentValue
    );

    if (duplicates.length > 0) {
        input.setCustomValidity("This VM name already exists");
        input.reportValidity();
    } else {
        input.setCustomValidity("");
    }
});


/* =========================================================
   ✅ CHECK VERS TUTO LINKS
   ========================================================= */

document.addEventListener("click", e => {
    const link = e.target.closest(".item-tuto[data-tuto]");
    if (!link) return;

    const path = link.dataset.tuto;
    window.open(`./tutorials/${path}.html`, "_blank");
});

/* =========================================================
   ✅ AUTO RESIZE ENGINEER COMMENTS
   ========================================================= */

const comments = document.getElementById("comments");

function autoResizeComments() {

    if (!comments) return;

    comments.style.height = "auto";
    comments.style.height = comments.scrollHeight + "px";
}

/* ===== resize live ===== */
comments?.addEventListener("input", autoResizeComments);

/* ===== resize on page load ===== */
window.addEventListener("DOMContentLoaded", autoResizeComments);