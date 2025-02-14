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










class StorageManager {
    static async saveData(filename, data) {
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
            const response = await fetch(`http://localhost:8080/api/load/${filename}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Error loading data:", error);
            return [];
        }
    }
}

class Note {
    constructor(title, description) {
        this.id = `note-${Date.now()}`;
        this.title = title;
        this.description = description;
        this.timestamp = new Date().toLocaleString();
    }

    static async add(title, description) {
        const note = new Note(title, description);
        const notes = await StorageManager.loadData("notes");
        notes.push(note);
        await StorageManager.saveData("notes", notes);
        return note;
    }

    static async loadAll() {
        return await StorageManager.loadData("notes");
    }

    static async edit(id, updatedTitle, updatedDescription) {
        let notes = await StorageManager.loadData("notes");
        notes = notes.map(note => note.id === id ? { ...note, title: updatedTitle, description: updatedDescription } : note);
        await StorageManager.saveData("notes", notes);
    }
}

class Task {
    constructor(title, category, assigned, dueDate, status, priority = "Normal") {
        this.id = `task-${Date.now()}`;
        this.title = title;
        this.category = category;
        this.assigned = assigned;
        this.dueDate = dueDate;
        this.status = status;
        this.priority = priority;
    }

    static async add(title, category, assigned, dueDate, status, priority) {
        const task = new Task(title, category, assigned, dueDate, status, priority);
        const tasks = await StorageManager.loadData("tasks");
        tasks.push(task);
        await StorageManager.saveData("tasks", tasks);
        return task;
    }

    static async loadAll() {
        return await StorageManager.loadData("tasks");
    }

    static async edit(id, updatedTitle, updatedCategory, updatedAssigned, updatedDueDate, updatedStatus, updatedPriority) {
        let tasks = await StorageManager.loadData("tasks");
        tasks = tasks.map(task => task.id === id ? { ...task, title: updatedTitle, category: updatedCategory, assigned: updatedAssigned, dueDate: updatedDueDate, status: updatedStatus, priority: updatedPriority } : task);
        await StorageManager.saveData("tasks", tasks);
    }
}

class Habit {
    constructor(title, frequency, streak = 0) {
        this.id = `habit-${Date.now()}`;
        this.title = title;
        this.frequency = frequency;
        this.streak = streak;
    }

    static async add(title, frequency, streak = 0) {
        const habit = new Habit(title, frequency, streak);
        const habits = await StorageManager.loadData("habits");
        habits.push(habit);
        await StorageManager.saveData("habits", habits);
        return habit;
    }

    static async loadAll() {
        return await StorageManager.loadData("habits");
    }

    static async edit(id, updatedTitle, updatedFrequency, updatedStreak) {
        let habits = await StorageManager.loadData("habits");
        habits = habits.map(habit => habit.id === id ? { ...habit, title: updatedTitle, frequency: updatedFrequency, streak: updatedStreak } : habit);
        await StorageManager.saveData("habits", habits);
    }
}

class Category {
    constructor(name) {
        this.id = `category-${Date.now()}`;
        this.name = name;
    }

    static async add(name) {
        const category = new Category(name);
        const categories = await StorageManager.loadData("categories");
        categories.push(category);
        await StorageManager.saveData("categories", categories);
        return category;
    }

    static async loadAll() {
        return await StorageManager.loadData("categories");
    }

    static async edit(id, updatedName) {
        let categories = await StorageManager.loadData("categories");
        categories = categories.map(category => category.id === id ? { ...category, name: updatedName } : category);
        await StorageManager.saveData("categories", categories);
    }
}







document.addEventListener("DOMContentLoaded", function () {
    loadNotes();
    loadTasks();
    loadHabits();
    loadCategories();
});

function loadNotes() {
    const notesContainer = document.getElementById("notes-container");
    const notes = StorageManager.loadData(notesFile);
    notes.forEach(note => addNoteToUI(note));
}

function loadTasks() {
    const taskContainer = document.getElementById("todayTasks");
    const tasks = StorageManager.loadData(tasksFile);
    tasks.forEach(task => addTaskToUI(task));
}

function loadHabits() {
    const habitContainer = document.getElementById("habit-container");
    const habits = StorageManager.loadData(habitsFile);
    habits.forEach(habit => addHabitToUI(habit));
}

function loadCategories() {
    const categoryList = document.getElementById("categoryList");
    const categories = StorageManager.loadData(categoriesFile);
    categories.forEach(category => addCategoryToUI(category));
}

function addHabit() {
    const habitTitle = document.getElementById("habit-title").value.trim();
    const habitFrequency = document.getElementById("habit-frequency").value.trim();
    
    if (!habitTitle || !habitFrequency) {
        alert("Please enter both a title and a frequency!");
        return;
    }

    const newHabit = new Habit(habitTitle, habitFrequency);
    const habits = StorageManager.loadData(habitsFile);
    habits.push(newHabit);
    StorageManager.saveData(habitsFile, habits);
    
    addHabitToUI(newHabit);
    closeHabitModal();
}

function addHabitToUI(habit) {
    const habitContainer = document.getElementById("habit-container");
    const habitBox = document.createElement("div");
    habitBox.classList.add("habit-box");
    habitBox.innerHTML = `
        <div class="habit-title">${habit.title}</div>
        <div class="habit-frequency">${habit.frequency}</div>
        <div class="habit-streak">Streak: ${habit.streak} days</div>
    `;
    habitContainer.prepend(habitBox);
}

function addTask() {
    const taskTitle = document.getElementById("task-title").value.trim();
    const taskCategory = document.getElementById("task-category").value;
    const taskAssigned = document.getElementById("task-assigned").value.trim();
    const taskDueDate = document.getElementById("task-due-date").value;
    const taskStatus = document.getElementById("task-status").value;
    const taskPriority = document.getElementById("task-priority").value;

    if (!taskTitle) {
        alert("Task title is required!");
        return;
    }

    const newTask = new Task(taskTitle, taskCategory, taskAssigned, taskDueDate, taskStatus, taskPriority);
    const tasks = StorageManager.loadData(tasksFile);
    tasks.push(newTask);
    StorageManager.saveData(tasksFile, tasks);
    
    addTaskToUI(newTask);
    closeTaskModal();
}

function addTaskToUI(task) {
    const taskContainer = document.getElementById("todayTasks");
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    taskElement.innerHTML = `
        <input class="task-item" type="checkbox" id="${task.id}">
        <label for="${task.id}">
            <span class="label-text">${task.title}</span>
        </label>
        <div class="task-priority">Priority: ${task.priority}</div>
    `;
    taskContainer.prepend(taskElement);
}

function addCategory() {
    const categoryName = document.getElementById("category-name").value.trim();
    if (!categoryName) {
        alert("Please enter a category name!");
        return;
    }
    const newCategory = new Category(categoryName);
    const categories = StorageManager.loadData(categoriesFile);
    categories.push(newCategory);
    StorageManager.saveData(categoriesFile, categories);
    
    addCategoryToUI(newCategory);
    closeCategoryModal();
}

function addCategoryToUI(category) {
    const categoryList = document.getElementById("categoryList");
    const newCategory = document.createElement("li");
    newCategory.textContent = category.name;
    newCategory.setAttribute("data-category", category.name.toLowerCase());
    categoryList.appendChild(newCategory);
}
