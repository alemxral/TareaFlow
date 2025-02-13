document.addEventListener("DOMContentLoaded", () => {
    try {
        console.log("DOM content loaded – initializing collapsibles...");

        const collapsibleHeaders = document.querySelectorAll(".collapsible-header");
        console.log(`Found ${collapsibleHeaders.length} collapsible headers.`);

        collapsibleHeaders.forEach((header, index) => {
            console.log(`Attaching click listener to header #${index + 1}`);
            
            header.addEventListener("click", () => {
                try {
                    console.log(`Header #${index + 1} clicked.`);
                    header.classList.toggle("collapsed");
                    console.log(`Header #${index + 1} class list:`, header.classList);

                    const targetId = header.getAttribute("data-target");
                    console.log(`Header #${index + 1} target id: ${targetId}`);

                    if (targetId) {
                        const content = document.querySelector(targetId);
                        if (content) {
                            content.classList.toggle("collapsed");
                            console.log(`Toggled collapsed on content for ${targetId}`);
                        } else {
                            console.warn(`No element found with ID: ${targetId}`);
                        }
                    }
                } catch (error) {
                    console.error("Error handling collapsible header click:", error);
                }
            });
        });
    } catch (error) {
        console.error("Error initializing collapsibles:", error);
    }
});

function safelyExecute(callback, fallback = () => {}) {
    try {
        callback();
    } catch (error) {
        console.error("An error occurred:", error);
        fallback();
    }
}


document.addEventListener("DOMContentLoaded", function () {
    const notesContainer = document.getElementById("notes-container");

    // Attach click event to dynamically open notes
    notesContainer.addEventListener("click", function (event) {
        const noteBox = event.target.closest(".task-box");
        if (noteBox) {
            const noteTitle = noteBox.querySelector(".task-name").textContent;
            const noteDescription = noteBox.getAttribute("data-description"); // Get stored description
            openViewNoteModal(noteTitle, noteDescription);
        }
    });
});

// Modal Functions
function openNoteModal() { safelyExecute(() => { document.getElementById("noteModal").style.display = "flex"; }); }
function closeNoteModal() { safelyExecute(() => { document.getElementById("noteModal").style.display = "none"; }); }
function openTaskModal() { safelyExecute(() => { document.getElementById("taskModal").style.display = "flex"; }); }
function closeTaskModal() { safelyExecute(() => { document.getElementById("taskModal").style.display = "none"; }); }
function openCategoryModal() { safelyExecute(() => { document.getElementById("categoryModal").style.display = "flex"; }); }
function closeCategoryModal() { safelyExecute(() => { document.getElementById("categoryModal").style.display = "none"; }); }

// Function to Add Note
function addNote() {
    safelyExecute(() => {
        const noteTitle = document.getElementById("note-title").value.trim();
        const noteDescription = document.getElementById("note-description").value.trim();
        const notesContainer = document.getElementById("notes-container");

        if (!noteTitle || !noteDescription) {
            alert("Please enter both a title and a description!");
            return;
        }

        const noteBox = document.createElement("div");
        noteBox.classList.add("task-box", "blue");
        noteBox.setAttribute("data-description", noteDescription); // Store description for later retrieval
        noteBox.innerHTML = `
            <div class="description-task">
                <div class="time">${new Date().toLocaleTimeString()}</div>
                <div class="task-name">${noteTitle}</div>
            </div>
           
        `;

        // Append to the Notes Container
        notesContainer.prepend(noteBox);

        // Clear Inputs
        document.getElementById("note-title").value = "";
        document.getElementById("note-description").value = "";

        // Close Modal
        closeNoteModal();
    });
}

// Function to Open the Note View Modal with Content
function openViewNoteModal(title, description) {
    if (!description) description = "No details available."; // Fallback if missing
    document.getElementById("view-note-title").textContent = title;
    document.getElementById("view-note-description").textContent = description;
    document.getElementById("viewNoteModal").style.display = "flex";
}

// Function to Close Note View Modal
function closeViewNoteModal() {
    document.getElementById("viewNoteModal").style.display = "none";
}

// Function to Delete a Note
function deleteNote(button) {
    button.parentElement.remove();
}








window.onclick = function(event) {
    safelyExecute(() => {
        const noteModal = document.getElementById("noteModal");
        const taskModal = document.getElementById("taskModal");
        if (event.target === noteModal) noteModal.style.display = "none";
        if (event.target === taskModal) taskModal.style.display = "none";
    });
};

function calculateDaysLeft(dueDate) {
    return safelyExecute(() => {
        if (!dueDate) return "No due date";
        const due = new Date(dueDate);
        const today = new Date();
        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 ? `${diffDays} days` : "Overdue";
    }, () => "Invalid date");
}

// Function to Add Task
function addTask() {
    safelyExecute(() => {
        const taskCategory = document.getElementById("task-category").value || "No Category";
        const taskTitle = document.getElementById("task-title").value.trim();
        const taskDescription = document.getElementById("task-description").value.trim();
        const taskAssigned = document.getElementById("task-assigned").value.trim() || "Unassigned";
        const taskDueDate = document.getElementById("task-due-date").value;
        const taskStatus = document.getElementById("task-status").value || "In Progress";
        
        if (!taskTitle) {
            alert("Task title is required!");
            return;
        }

        const taskId = "TASK-" + Math.floor(1000 + Math.random() * 9000);
        const daysLeft = calculateDaysLeft(taskDueDate);
        const taskWrapper = document.getElementById("todayTasks"); 

        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        taskElement.innerHTML = `
            <input class="task-item" name="task" type="checkbox" id="${taskId}">
            <label for="${taskId}"><span class="label-text">${taskTitle}</span></label>
            <div class="tag progress-wrapper">
                <div class="tag progress">${taskCategory}</div>
                <div class="tag progress">${taskAssigned}</div>
                <div class="tag progress">${taskDueDate || "No due date"}</div>
                <div class="tag progress">${daysLeft}</div>
                <div class="tag progress">${taskStatus}</div>
            </div>
        `;

        taskWrapper.prepend(taskElement);
        closeTaskModal();
    });
}





document.addEventListener("DOMContentLoaded", function () {
    const categoryList = document.getElementById("categoryList");

    if (!categoryList) {
        console.error("Error: categoryList element not found");
        return;
    }

    console.log("Category list and tabs initialized successfully");

    function updateActiveTab(selectedTab) {
        console.log("Tab clicked:", selectedTab.textContent);

        // Remove active class from all tabs
        document.querySelectorAll("#categoryList li").forEach(tab => tab.classList.remove("active"));
        
        // Add active class to selected tab
        selectedTab.classList.add("active");

        console.log("Active tab updated to:", selectedTab.textContent);
    }

    // Use event delegation to handle clicks on dynamically added tabs
    categoryList.addEventListener("click", function (event) {
        if (event.target.tagName === "LI") {
            updateActiveTab(event.target);
        }
    });
});




function addCategory() {
    const categoryName = document.getElementById("category-name").value.trim();
    const categoryList = document.getElementById("categoryList");

    if (categoryName === "") {
        alert("Please enter a category name!");
        return;
    }

    // Create new category list item
    const newCategory = document.createElement("li");
    newCategory.textContent = categoryName;
    newCategory.setAttribute("data-category", categoryName.toLowerCase());
    
    // Append new category to list
    categoryList.appendChild(newCategory);

    // Clear input field
    document.getElementById("category-name").value = "";

    // Close modal
    closeCategoryModal();
}

// Function to open the category modal
function openCategoryModal() {
    document.getElementById("categoryModal").style.display = "flex";
}

function addCategory() {
    const categoryName = document.getElementById("category-name").value.trim();
    const categoryList = document.getElementById("categoryList");

    if (categoryName === "") {
        alert("Please enter a category name!");
        return;
    }

    // Create new category list item
    const newCategory = document.createElement("li");
    newCategory.textContent = categoryName;
    newCategory.setAttribute("data-category", categoryName.toLowerCase());
    
    // Append new category to list
    categoryList.appendChild(newCategory);

    // Clear input field
    document.getElementById("category-name").value = "";

    // Close modal
    closeCategoryModal();
}















