
/* ====================== SAFELY EXECUTE ====================== */
function safelyExecute(callback, fallback = () => {}) {
    try {
        callback();
    } catch (error) {
        console.error("An error occurred:", error);
        fallback();
    }
}

function safelyExecuteAsync(asyncCallback, fallback = () => {}) {
    asyncCallback().catch(error => {
        console.error("An error occurred (async):", error);
        fallback();
    });
}






/* ====================== MODAL FUNCTIONS ====================== */
function openTaskModal() {
    safelyExecuteAsync(async () => {
        // First, populate the category dropdown
        await populateCategoryDropdown();
        
        // Then show the task modal
        document.getElementById("taskModal").style.display = "flex";
    });
}


function closeTaskModal() { safelyExecute(() => { document.getElementById("taskModal").style.display = "none"; }); }

function openNoteModal() { safelyExecute(() => { document.getElementById("noteModal").style.display = "flex"; }); }
function closeNoteModal() { safelyExecute(() => { document.getElementById("noteModal").style.display = "none"; }); }

function openCategoryModal()  { safelyExecute(() => { document.getElementById("categoryModal").style.display = "flex"; }); }
function closeCategoryModal() { safelyExecute(() => { document.getElementById("categoryModal").style.display = "none"; }); }

/* ====================== STORAGE MANAGER ====================== */
class StorageManager {
    static async saveData(filename, data) {
        // Wrap data in { filename, data } so the server can save it to <filename>.json
        const jsonData = JSON.stringify({ filename, data });
        try {
            const response = await fetch("http://localhost:8080/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: jsonData
            });
            console.log("Save response:", await response.text());
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }

    static async loadData(filename) {
        try {
            // GET request to load <filename>.json from the server
            const response = await fetch(`http://localhost:8080/api/load/${filename}`);
            if (!response.ok) {
                console.error("Error: Fetch request failed with status", response.status);
                return [];
            }
            // The server typically returns either an array [ ... ] or { filename: "tasks", data: [...] }
            const jsonData = await response.json();
            
            // If jsonData is an array => return it.
            if (Array.isArray(jsonData)) {
                return jsonData;
            }
            // If it's an object with a .data array => return that
            if (jsonData && typeof jsonData === "object" && Array.isArray(jsonData.data)) {
                return jsonData.data;
            }
            // If there's a .data property but not an array => wrap in array
            if (jsonData && jsonData.data) {
                console.warn("Warning: 'data' is not an array. Converting to array.");
                return [jsonData.data];
            }
            // Otherwise, error
            console.error("Error: Loaded data is not in expected format", jsonData);
            return [];
        } catch (error) {
            console.error("Error loading data:", error);
            return [];
        }
    }
}

/* ====================== TASK CLASS ====================== */
class Task {
    constructor(title, category, assigned, dueDate, status, priority = "Normal", done = false) {
        this.id = `task-${Date.now()}`;
        this.title = title;
        this.category = category;
        this.assigned = assigned;
        this.dueDate = dueDate;
        this.status = status;
        this.priority = priority;
        this.done = done;
    }

    // Add a new task to tasks.json
    static async add(title, category, assigned, dueDate, status, priority) {
        const task = new Task(title, category, assigned, dueDate, status, priority);
        const tasks = await StorageManager.loadData("tasks");
        if (!Array.isArray(tasks)) {
            console.error("Error: tasks data is not an array, forcing to array =>", tasks);
            // Force it to become an array
            tasks = tasks ? [tasks] : [];
        }
        tasks.push(task);
        await StorageManager.saveData("tasks", tasks);
        return task;
    }

    // Load all tasks as an array
    static async loadAll() {
        const tasks = await StorageManager.loadData("tasks");
        return Array.isArray(tasks) ? tasks : [];
    }

    // Edit a task in tasks.json
    static async edit(id, updatedTitle, updatedCategory, updatedAssigned, updatedDueDate, updatedStatus, updatedPriority, updatedDone) {
        let tasks = await StorageManager.loadData("tasks");
        tasks = tasks.map(task =>
            task.id === id
                ? { ...task, title: updatedTitle, category: updatedCategory, assigned: updatedAssigned, dueDate: updatedDueDate, status: updatedStatus, priority: updatedPriority, done: updatedDone }
                : task
        );
        await StorageManager.saveData("tasks", tasks);
    }
}

/* ====================== TASK INITIALIZATION ====================== */
async function initializeApp() {
    // Load tasks array
    const tasks = await Task.loadAll();
    if (!Array.isArray(tasks)) {
        console.error("Error: Tasks data is not an array =>", tasks);
        return;
    }
    // Classify each task (Today, Upcoming, Done)
    tasks.forEach(task => classifyTask(task));
}

// On DOM load, run initializeApp
document.addEventListener("DOMContentLoaded", initializeApp);

/* ====================== CLASSIFY TASKS ====================== */
function classifyTask(task) {
    const todayWrapper = document.getElementById("todayTasks");
    const upcomingWrapper = document.getElementById("upcomingTasks");
    const doneWrapper = document.getElementById("doneTasks");
  
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    // Store the category as a data attribute
    taskElement.setAttribute("data-category", task.category.toLowerCase());
    
    taskElement.innerHTML = `
      <input class="task-item" name="task" type="checkbox" id="${task.id}" ${task.done ? "checked" : ""}>
      <label for="${task.id}">
        <span class="label-text">${task.title}</span>
      </label>
      <div class="tag progress-wrapper">
        <div class="tag progress">${task.category}</div>
        <div class="tag progress">${task.assigned}</div>
        <div class="tag progress">${task.dueDate || "No due date"}</div>
        <div class="tag progress">${task.status}</div>
      </div>
    `;
  
    if (task.done) {
      doneWrapper.prepend(taskElement);
    } else if (!task.dueDate || new Date(task.dueDate).toDateString() === new Date().toDateString()) {
      todayWrapper.prepend(taskElement);
    } else {
      upcomingWrapper.prepend(taskElement);
    }
  }
  

/* ====================== ADD TASK ====================== */
async function addTask() {
    const taskCategory = document.getElementById("task-category").value || "No Category";
    const taskTitle = document.getElementById("task-title").value.trim();
    const taskAssigned = document.getElementById("task-assigned").value.trim() || "Unassigned";
    const taskDueDate = document.getElementById("task-due-date").value;
    const taskStatus = document.getElementById("task-status").value || "In Progress";
    const taskPriority = "Normal";
    
    if (!taskTitle) {
        alert("Task title is required!");
        return;
    }
    
    const newTask = await Task.add(taskTitle, taskCategory, taskAssigned, taskDueDate, taskStatus, taskPriority);
    classifyTask(newTask); // Immediately show in UI
    closeTaskModal();
}

/* ====================== EDIT TASK ====================== */
async function editTask(id) {
    const updatedTitle = prompt("Edit task title:");
    if (!updatedTitle) return;
    
    let tasks = await Task.loadAll();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    await Task.edit(
        id,
        updatedTitle,
        task.category,
        task.assigned,
        task.dueDate,
        task.status,
        task.priority,
        task.done
    );
    
    // Refresh UI
    document.getElementById("todayTasks").innerHTML = "";
    document.getElementById("upcomingTasks").innerHTML = "";
    document.getElementById("doneTasks").innerHTML = "";
    initializeApp();
}

// Filter tasks based on category
function filterTasks(categoryName) {
    // Convert to lowercase for consistent matching
    const targetCat = categoryName.toLowerCase();
  
    document.querySelectorAll(".task").forEach(taskEl => {
      const taskCat = taskEl.getAttribute("data-category") || "no category";
  
      if (targetCat === "all" || taskCat === targetCat) {
        // Show matching tasks
        taskEl.style.display = "flex"; 
      } else {
        // Hide non-matching tasks
        taskEl.style.display = "none";
      }
    });
  }
  



/* ====================== CATEGORY CLASS ====================== */
class Category {
    constructor(name) {
        this.id = `category-${Date.now()}`;
        this.name = name;
    }

    static async add(name) {
        const category = new Category(name);
        let categories = await StorageManager.loadData("categories");
        if (!Array.isArray(categories)) {
            console.error("Error: Categories data is not an array =>", categories);
            categories = categories ? [categories] : [];
        }
        categories.push(category);
        await StorageManager.saveData("categories", categories);
        return category;
    }

    static async loadAll() {
        let categories = await StorageManager.loadData("categories");
        return Array.isArray(categories) ? categories : [];
    }
}

/* ====================== CATEGORY INITIALIZATION ====================== */
document.addEventListener("DOMContentLoaded", initializeCategories);

async function initializeCategories() {
    const categories = await Category.loadAll();
    if (!Array.isArray(categories)) {
        console.error("Error: Loaded categories data is not an array =>", categories);
        return;
    }
    categories.forEach(category => addCategoryToUI(category));
}

/* ====================== ADD CATEGORY ====================== */
async function addCategory() {
    const categoryName = document.getElementById("category-name").value.trim();
    if (!categoryName) {
        alert("Please enter a category name!");
        return;
    }
    const newCategory = await Category.add(categoryName);
    addCategoryToUI(newCategory);
    document.getElementById("category-name").value = "";
    closeCategoryModal();
}

/* ====================== CATEGORY UI ====================== */
function addCategoryToUI(category) {
    const categoryList = document.getElementById("categoryList");
    const newCategory = document.createElement("li");
    newCategory.textContent = category.name;
    newCategory.setAttribute("data-category", category.name.toLowerCase());
    categoryList.appendChild(newCategory);
}




/* ====================== CATEGORY Navigation Effects====== */
document.addEventListener("DOMContentLoaded", function () {
    const categoryList = document.getElementById("categoryList");

    if (!categoryList) {
        console.error("Error: categoryList element not found");
        return;
    }

    console.log("Category list and tabs initialized successfully");

    function updateActiveTab(selectedTab) {
        console.log("Tab clicked:", selectedTab.textContent);
    
        // Remove 'active' class from all tabs
        document.querySelectorAll("#categoryList li").forEach(tab => tab.classList.remove("active"));
    
        // Add 'active' class to selected tab
        selectedTab.classList.add("active");
    
        // Filter tasks based on the clicked category
        const clickedCategory = selectedTab.getAttribute("data-category"); // e.g., "important", "notes", "all", etc.
        filterTasks(clickedCategory);
    
        console.log("Active tab updated to:", selectedTab.textContent);
    }
    

    // Use event delegation to handle clicks on dynamically added tabs
    categoryList.addEventListener("click", function (event) {
        if (event.target.tagName === "LI") {
            updateActiveTab(event.target);
        }
    });
});


// Populate the category dropdown for tasks
async function populateCategoryDropdown() {
    const categorySelect = document.getElementById("task-category");
    if (!categorySelect) return; // Safety check
  
    // Clear existing options (keep the default placeholder)
    categorySelect.innerHTML = `<option value="">Select Category</option>`;
  
    // Load all categories from your storage
    const categories = await Category.loadAll();
    if (!Array.isArray(categories)) {
      console.error("Error: categories data is not an array =>", categories);
      return;
    }
  
    // For each category, create an <option>
    categories.forEach(cat => {
      const option = document.createElement("option");
      // The <option> value is the category name
      option.value = cat.name;
      option.textContent = cat.name; 
      categorySelect.appendChild(option);
    });
  }
  


/* ======================Notes====================== */

// Function to Add Note
async function addNote() {
    const noteTitle = document.getElementById("note-title").value.trim();
    const noteDescription = document.getElementById("note-description").value.trim();

    if (!noteTitle) {
        alert("Please enter a note title!");
        return;
    }

    // Add a new note to notes.json via the Note class
    const newNote = await Note.add(noteTitle, noteDescription);

    // Immediately show the new note in the UI
    const notesContainer = document.getElementById("notes-container");

    const noteBox = document.createElement("div");
    noteBox.classList.add("task-box", "blue");
    noteBox.setAttribute("data-description", newNote.description); // Store description for later retrieval

    noteBox.innerHTML = `
        <div class="description-task">
            <div class="time">${new Date().toLocaleTimeString()}</div>
            <div class="task-name">${newNote.title}</div>
        </div>
    `;

    // Append the note to the container
    notesContainer.prepend(noteBox);

    // Clear input fields & close the modal
    document.getElementById("note-title").value = "";
    document.getElementById("note-description").value = "";
    closeNoteModal();
}






// ========== 2) Note Class ==========
class Note {
    constructor(title, description) {
        this.id = `note-${Date.now()}`;
        this.title = title;
        this.description = description;
        this.timestamp = new Date().toLocaleString();
    }

    // Add a new note to notes.json
    static async add(title, description) {
        const note = new Note(title, description);

        let notes = await StorageManager.loadData("notes");
        if (!Array.isArray(notes)) {
            console.error("Error: notes is not an array =>", notes);
            notes = notes ? [notes] : [];
        }
        notes.push(note);
        await StorageManager.saveData("notes", notes);
        return note;
    }

    // Load all notes
    static async loadAll() {
        let notes = await StorageManager.loadData("notes");
        return Array.isArray(notes) ? notes : [];
    }

    // Edit an existing note in notes.json
    static async edit(id, newTitle, newDesc) {
        let notes = await StorageManager.loadData("notes");
        notes = notes.map(n => n.id === id ? { ...n, title: newTitle, description: newDesc } : n);
        await StorageManager.saveData("notes", notes);
    }

    // Delete a note by id
    static async delete(id) {
        let notes = await StorageManager.loadData("notes");
        notes = notes.filter(n => n.id !== id);
        await StorageManager.saveData("notes", notes);
    }
}

// ========== 3) Initialize / Load / Display Notes ==========
async function initializeNotes() {
    const notes = await Note.loadAll();
    if (!Array.isArray(notes)) {
        console.error("Error: loaded notes is not an array =>", notes);
        return;
    }
    document.getElementById("notes-container").innerHTML = ""; // Clear the container
    notes.forEach(addNoteToUI);
}

// On page load, initialize
document.addEventListener("DOMContentLoaded", initializeNotes);

// ========== 4) Add Note UI/Logic ==========
async function addNote() {
    const noteTitle = document.getElementById("note-title").value.trim();
    const noteDesc = document.getElementById("note-description").value.trim();

    if (!noteTitle) {
        alert("Please enter a note title!");
        return;
    }

    const newNote = await Note.add(noteTitle, noteDesc);
    addNoteToUI(newNote);

    // Reset fields & close modal
    document.getElementById("note-title").value = "";
    document.getElementById("note-description").value = "";
    closeNoteModal();
}

// ========== 5) Note Box UI ==========
// (No style class changes, simply add data-id and data-description for easier access.)
function addNoteToUI(note) {
    const notesContainer = document.getElementById("notes-container");
    const noteBox = document.createElement("div");
    noteBox.classList.add("note-box");  // Keep your existing class

    // Store note info in data attributes
    noteBox.setAttribute("data-id", note.id);
    noteBox.setAttribute("data-description", note.description);

    noteBox.innerHTML = `
        <div class="note-title">${note.title}</div>
        <div class="note-description">${note.description}</div>
        <div class="note-time">${note.timestamp}</div>
    `;

    notesContainer.prepend(noteBox);
}

// ========== 6) View/Edit Modal Logic ==========
let currentNoteId = null;

function openViewNoteModal(noteId, title, description) {
    currentNoteId = noteId;
    // Fill your bigger modal fields
    document.getElementById("edit-note-title").value = title;
    document.getElementById("edit-note-description").value = description;

    // Show the modal
    document.getElementById("viewNoteModal").style.display = "flex";
}


function closeViewNoteModal() {
    document.getElementById("viewNoteModal").style.display = "none";
    currentNoteId = null;
}

// Save changes in the view/edit modal
async function saveNoteChanges() {
    if (!currentNoteId) return;

    const updatedTitle = document.getElementById("edit-note-title").value.trim();
    const updatedDesc  = document.getElementById("edit-note-description").value.trim();
    if (!updatedTitle) {
        alert("Note title is required!");
        return;
    }

    await Note.edit(currentNoteId, updatedTitle, updatedDesc);
    closeViewNoteModal();
    initializeNotes(); // Refresh UI
}

// Delete the note from the view/edit modal
async function deleteNote() {
    if (!currentNoteId) return;

    await Note.delete(currentNoteId);
    closeViewNoteModal();
    initializeNotes(); // Refresh UI
}

// ========== 7) Click Handler to Open the View/Edit Modal ==========
// This ensures that when the user clicks anywhere inside a .note-box, 
// we retrieve the note’s ID, title, and description to populate the larger modal.

document.getElementById("notes-container").addEventListener("click", function (event) {
    // Find the closest .note-box ancestor from the click target
    const noteBox = event.target.closest(".note-box");
    if (!noteBox) return; // If click was not on a note

    // Extract data from attributes/child elements
    const noteId = noteBox.getAttribute("data-id");
    const noteTitle = noteBox.querySelector(".note-title").textContent;
    const noteDescription = noteBox.getAttribute("data-description");

    // Now open the bigger edit modal
    openViewNoteModal(noteId, noteTitle, noteDescription);
});

// ========== 8) Modal Handling ==========
function openNoteModal() {
    document.getElementById("noteModal").style.display = "flex";
}
function closeNoteModal() {
    document.getElementById("noteModal").style.display = "none";
}

// =========Collapsables================

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