
/* ====================== SAFELY EXECUTE ====================== */
function safelyExecute(callback, fallback = () => {}) {
    try {
        callback();
    } catch (error) {
        console.error("An error occurred:", error);
        fallback();
    }
}

/* ====================== MODAL FUNCTIONS ====================== */
function openTaskModal()  { safelyExecute(() => { document.getElementById("taskModal").style.display = "flex"; }); }
function closeTaskModal() { safelyExecute(() => { document.getElementById("taskModal").style.display = "none"; }); }

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
    const todayWrapper    = document.getElementById("todayTasks");
    const upcomingWrapper = document.getElementById("upcomingTasks");
    const doneWrapper     = document.getElementById("doneTasks");

    // Create task element
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    taskElement.innerHTML = `
        <input class="task-item" name="task" type="checkbox" id="${task.id}" ${task.done ? 'checked' : ''}>
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

    // Decide which wrapper to prepend
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

