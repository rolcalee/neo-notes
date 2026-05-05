    // ---------- DOM elements ----------
    const modal = document.getElementById("modal");
    const deleteModal = document.getElementById("deleteModal");
    const openModalBtn = document.getElementById("openModal");
    const closeModalBtn = document.getElementById("closeModal");
    const saveNoteBtn = document.getElementById("saveNote");
    const noteTitleInput = document.getElementById("noteTitle");
    const noteContentInput = document.getElementById("noteContent");
    const notesContainer = document.getElementById("notesContainer");
    const confirmDeleteBtn = document.getElementById("confirmDelete");
    const cancelDeleteBtn = document.getElementById("cancelDelete");
    const toastContainer = document.getElementById("toastContainer");
    const titleCounterSpan = document.getElementById("titleCounter");
    const contentCounterSpan = document.getElementById("contentCounter");

    // character limits 
    const TITLE_MAX = 20;
    const CONTENT_MAX = 200;

    // ---------- Data ----------
    let notes = [];
    let editIndex = null;
    let deleteIndex = null;

    // ---------- character counter update ----------
    function updateTitleCounter() {
      const currentLen = noteTitleInput.value.length;
      if (titleCounterSpan) {
        titleCounterSpan.innerText = `${currentLen} / ${TITLE_MAX}`;
        if (currentLen === TITLE_MAX) {
          titleCounterSpan.classList.add("warning");
        } else {
          titleCounterSpan.classList.remove("warning");
        }
      }
    }

    function updateContentCounter() {
      const currentLen = noteContentInput.value.length;
      if (contentCounterSpan) {
        contentCounterSpan.innerText = `${currentLen} / ${CONTENT_MAX}`;
        if (currentLen === CONTENT_MAX) {
          contentCounterSpan.classList.add("warning");
        } else {
          contentCounterSpan.classList.remove("warning");
        }
      }
    }

    // ---------- Alert ----------
    function showAlert(message, type = "success") {
      const toast = document.createElement("div");
      const bgColor = type === "success" ? "bg-green-400" : "bg-red-400";
      
      toast.className = `${bgColor} border-4 border-black text-black font-bold py-3 px-5 rounded-none shadow-[6px_6px_0px_black] flex items-center gap-3 max-w-[300px] sm:max-w-sm w-full alert-toast`;
      
      let iconHtml = "";
      if (type === "success") {
        if (message.toLowerCase().includes("added")) {
          iconHtml = `<i class="ph ph-note-plus text-2xl"></i>`;
        } else if (message.toLowerCase().includes("updated")) {
          iconHtml = `<i class="ph ph-pencil-simple-line text-2xl"></i>`;
        } else {
          iconHtml = `<i class="ph ph-check-circle text-2xl"></i>`;
        }
      } else {
        iconHtml = `<i class="ph ph-trash-simple text-2xl"></i>`;
      }
      
      toast.innerHTML = `
        ${iconHtml}
        <span class="flex-1 text-base uppercase tracking-wide">${message}</span>
        <button class="toast-close text-black font-black text-xl leading-5 hover:scale-110 transition">
          <i class="ph ph-x"></i>
        </button>
      `;
      
      toastContainer.appendChild(toast);
      
      let timeoutId = setTimeout(() => {
        removeToast(toast);
      }, 3200);
      
      const closeBtn = toast.querySelector(".toast-close");
      closeBtn.addEventListener("click", () => {
        clearTimeout(timeoutId);
        removeToast(toast);
      });
      
      function removeToast(toastEl) {
        if (!toastEl.parentNode) return;
        toastEl.classList.add("alert-hide");
        toastEl.addEventListener("animationend", () => {
          if (toastEl.parentNode) toastEl.remove();
        }, { once: true });
      }
    }

    function escapeHtml(str) {
      if (!str) return "";
      return str.replace(/[&<>]/g, function(m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
      });
    }
    
    function persistNotes() {
      localStorage.setItem("neoNotesPersist", JSON.stringify(notes));
    }
    
    // ---------- Render notes ----------
    function renderNotes() {
      notesContainer.innerHTML = "";
      
      if (notes.length === 0) {
        notesContainer.innerHTML = `
          <div class="col-span-full flex items-center justify-center min-h-[280px]">
            <div class="bg-white border-4 border-black p-8 sm:p-10 text-center shadow-[10px_10px_0px_black] transition-all hover:shadow-[14px_14px_0px_black] hover:-translate-y-1 duration-200">
              <i class="ph ph-note-blank text-6xl mb-3 inline-block"></i>
              <h2 class="text-3xl sm:text-4xl uppercase font-black mb-3">No Entries Yet</h2>
              <p class="text-lg font-medium">Tap 'Add Note' to start</p>
            </div>
          </div>
        `;
        persistNotes();
        return;
      }
      
      notes.forEach((note, idx) => {
        const safeTitle = escapeHtml(note.title);
        const safeContent = escapeHtml(note.content);
        const noteCard = document.createElement("div");
        noteCard.className = "bg-white border-4 border-black p-5 shadow-[8px_8px_0px_black] note-card flex flex-col h-full";
        noteCard.innerHTML = `
          <div class="flex items-start justify-between gap-2 mb-2">
            <h2 class="text-xl sm:text-2xl uppercase font-black break-words flex-1">${safeTitle}</h2>
            <i class="ph ph-note text-2xl flex-shrink-0 text-gray-700"></i>
          </div>
          <p class="mb-5 break-words text-gray-800 font-medium flex-1 line-clamp-4">${safeContent}</p>
          <div class="flex gap-3 flex-wrap mt-2">
            <button class="edit-note-btn flex items-center justify-center gap-2 flex-1 bg-yellow-300 border-4 border-black p-2 font-bold hover:-translate-y-1 transition-all duration-150 shadow-[2px_2px_0px_black] active:translate-y-0" data-index="${idx}">
              <i class="ph ph-pencil-simple text-lg"></i>
              Edit
            </button>
            <button class="delete-note-btn flex items-center justify-center gap-2 flex-1 bg-pink-300 border-4 border-black p-2 font-bold hover:-translate-y-1 transition-all duration-150" data-index="${idx}">
              <i class="ph ph-trash-simple text-lg"></i>
              Delete
            </button>
          </div>
        `;
        notesContainer.appendChild(noteCard);
      });
      
      document.querySelectorAll(".edit-note-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(btn.getAttribute("data-index"));
          editNote(index);
        });
      });
      
      document.querySelectorAll(".delete-note-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const index = parseInt(btn.getAttribute("data-index"));
          deleteNotePrompt(index);
        });
      });
      
      persistNotes();
    }
    
    function editNote(index) {
      if (!notes[index]) return;
      editIndex = index;
      noteTitleInput.value = notes[index].title;
      noteContentInput.value = notes[index].content;
      // update counters after filling values
      updateTitleCounter();
      updateContentCounter();
      const modalTitleElem = document.querySelector("#modal h2");
      if (modalTitleElem) modalTitleElem.innerText = "Edit Note";
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    }
    
    function deleteNotePrompt(index) {
      deleteIndex = index;
      deleteModal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    }
    
    function closeAddModal() {
      modal.classList.add("hidden");
      noteTitleInput.value = "";
      noteContentInput.value = "";
      editIndex = null;
      updateTitleCounter();
      updateContentCounter();
      const modalTitleElem = document.querySelector("#modal h2");
      if (modalTitleElem) modalTitleElem.innerText = "Add Note";
      document.body.classList.remove("modal-open");
    }
    
    function handleSaveNote() {
      let title = noteTitleInput.value.trim();
      let content = noteContentInput.value.trim();
      
      if (title.length > TITLE_MAX) title = title.slice(0, TITLE_MAX);
      if (content.length > CONTENT_MAX) content = content.slice(0, CONTENT_MAX);
      
      if (!title || !content) {
        showAlert("Title & content required", "delete");
        return;
      }
      
      if (editIndex === null) {
        notes.push({ title, content });
        const shortTitle = title.length > 30 ? title.substring(0, 27) + "..." : title;
        showAlert(`"${shortTitle}" added`, "success");
      } else {
        const oldTitle = notes[editIndex].title;
        const shortOld = oldTitle.length > 28 ? oldTitle.substring(0, 25) + "..." : oldTitle;
        notes[editIndex] = { title, content };
        showAlert(`"${shortOld}" updated`, "success");
      }
      renderNotes();
      closeAddModal();
    }
    
    function confirmDeleteNote() {
      if (deleteIndex !== null && notes[deleteIndex]) {
        const deletedNoteTitle = notes[deleteIndex].title;
        notes.splice(deleteIndex, 1);
        renderNotes();
        const shortDeleted = deletedNoteTitle.length > 30 ? deletedNoteTitle.substring(0, 27) + "..." : deletedNoteTitle;
        showAlert(`"${shortDeleted}" deleted`, "delete");
      }
      deleteModal.classList.add("hidden");
      deleteIndex = null;
      document.body.classList.remove("modal-open");
    }
    
    function cancelDeleteModal() {
      deleteModal.classList.add("hidden");
      deleteIndex = null;
      document.body.classList.remove("modal-open");
    }
    
    // ---------- Event Listeners ----------
    openModalBtn.addEventListener("click", () => {
      editIndex = null;
      noteTitleInput.value = "";
      noteContentInput.value = "";
      updateTitleCounter();
      updateContentCounter();
      const modalTitleElem = document.querySelector("#modal h2");
      if (modalTitleElem) modalTitleElem.innerText = "Add Note";
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    });
    
    closeModalBtn.addEventListener("click", closeAddModal);
    saveNoteBtn.addEventListener("click", handleSaveNote);
    confirmDeleteBtn.addEventListener("click", confirmDeleteNote);
    cancelDeleteBtn.addEventListener("click", cancelDeleteModal);
    
    // realtime character counter updates
    noteTitleInput.addEventListener("input", updateTitleCounter);
    noteContentInput.addEventListener("input", updateContentCounter);
    
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeAddModal();
    });
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) cancelDeleteModal();
    });
    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!modal.classList.contains("hidden")) closeAddModal();
        if (!deleteModal.classList.contains("hidden")) cancelDeleteModal();
      }
    });
    
    // ---------- Load / Seed Data with new limits ----------
    const stored = localStorage.getItem("neoNotesPersist");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) notes = parsed;
        else notes = [];
      } catch(e) { notes = []; }
    }
    
    if (!notes.length) {
      notes = [
        {
          title: "Practice",
          content: "I created this as practice for Tailwind CSS. This will appear everytime you refresh the page with no entries."
        },
        {
          title: "CRUD System",
          content: "Full CRUD: Create, Read, Update, Delete entries."
        },
        {
          title: "Neobrutalism UI",
          content: "High contrast, thick borders, offset shadows, playful."
        }
      ];
    }
    
    // enforce new length limits on existing data
    let needsReRender = false;
    for (let i = 0; i < notes.length; i++) {
      let changed = false;
      if (notes[i].title && notes[i].title.length > TITLE_MAX) {
        notes[i].title = notes[i].title.slice(0, TITLE_MAX);
        changed = true;
      }
      if (notes[i].content && notes[i].content.length > CONTENT_MAX) {
        notes[i].content = notes[i].content.slice(0, CONTENT_MAX);
        changed = true;
      }
      if (changed) needsReRender = true;
    }
    if (needsReRender) persistNotes();
    
    renderNotes();
    
    // initialize counters
    updateTitleCounter();
    updateContentCounter();
    
    // ensure phosphor icons load for any dynamic content
    if (window.Phosphor) {
      window.Phosphor?.load?.();
    }