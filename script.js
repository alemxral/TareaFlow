/**************************************************************
 ********************** SAFELY EXECUTE ***********************
 *************************************************************/
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
  
  
  /**************************************************************
   *********************** MODAL FUNCTIONS **********************
   *************************************************************/
  // Task Modal
  function openTaskModal() {
    safelyExecuteAsync(async () => {
      await populateCategoryDropdown(); // Load categories for the Add Task modal
      document.getElementById("taskModal").style.display = "flex";
    });
  }
  function closeTaskModal() {
    safelyExecute(() => {
      document.getElementById("taskModal").style.display = "none";
    });
  }
  
  // Note Modal
  function openNoteModal() {
    safelyExecute(() => {
      document.getElementById("noteModal").style.display = "flex";
    });
  }
  function closeNoteModal() {
    safelyExecute(() => {
      document.getElementById("noteModal").style.display = "none";
    });
  }
  
  // Category Modal
  function openCategoryModal() {
    safelyExecute(() => {
      document.getElementById("categoryModal").style.display = "flex";
    });
  }
  function closeCategoryModal() {
    safelyExecute(() => {
      document.getElementById("categoryModal").style.display = "none";
    });
  }
  
  /**************************************************************
   ********************* STORAGE MANAGER ***********************
   *************************************************************/
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
        if (!response.ok) {
          console.error("Error: Fetch request failed with status", response.status);
          return [];
        }
        const jsonData = await response.json();
  
        // If it's directly an array
        if (Array.isArray(jsonData)) return jsonData;
  
        // If it's { filename: 'tasks', data: [...] }
        if (jsonData && typeof jsonData === "object" && Array.isArray(jsonData.data)) {
          return jsonData.data;
        }
  
        // If there's a data property but not an array => wrap in array
        if (jsonData && jsonData.data) {
          console.warn("Warning: 'data' is not an array. Converting to array.");
          return [jsonData.data];
        }
  
        console.error("Error: Loaded data is not in expected format", jsonData);
        return [];
      } catch (error) {
        console.error("Error loading data:", error);
        return [];
      }
    }
  }
  
  
  /**************************************************************
   *********************** TASK CLASS ***************************
   *************************************************************/
  class Task {
    constructor(title, category, assigned, dueDate, priority = "Normal", done = false) {
      this.id = `task-${Date.now()}`;
      this.title = title;
      this.category = category;
      this.assigned = assigned;
      this.dueDate = dueDate;
      this.priority = priority;
      this.done = done;
    }
  
    static async add(title, category, assigned, dueDate, priority) {
      const task = new Task(title, category, assigned, dueDate, priority, false);
      let tasks = await StorageManager.loadData("tasks");
      if (!Array.isArray(tasks)) {
        console.error("Error: tasks data is not an array =>", tasks);
        tasks = tasks ? [tasks] : [];
      }
      tasks.push(task);
      await StorageManager.saveData("tasks", tasks);
      return task;
    }
  
    static async loadAll() {
      const tasks = await StorageManager.loadData("tasks");
      return Array.isArray(tasks) ? tasks : [];
    }
  
    static async toggleDone(id, isDone) {
      let tasks = await StorageManager.loadData("tasks");
      tasks = tasks.map(t => t.id === id ? { ...t, done: isDone } : t);
      await StorageManager.saveData("tasks", tasks);
    }
  
    static async edit(taskId, updatedTitle, updatedCategory, updatedAssigned, updatedDueDate, updatedPriority, updatedDone) {
      let tasks = await StorageManager.loadData("tasks");
      tasks = tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              title: updatedTitle,
              category: updatedCategory,
              assigned: updatedAssigned,
              dueDate: updatedDueDate,
              priority: updatedPriority,
              done: updatedDone
            }
          : t
      );
      await StorageManager.saveData("tasks", tasks);
    }
  
    static async delete(taskId) {
      let tasks = await StorageManager.loadData("tasks");
      tasks = tasks.filter(t => t.id !== taskId);
      await StorageManager.saveData("tasks", tasks);
    }
  }
  
  /**************************************************************
   ******************* TASK UTILITY FUNCTIONS *******************
   *************************************************************/
  // For Add Task modal
  async function addTask() {
    const taskTitle = document.getElementById("task-title").value.trim();
    const taskCategory = document.getElementById("task-category").value;
    const taskAssigned = document.getElementById("task-assigned").value.trim() || "";
    const taskDueDate = document.getElementById("task-due-date").value;
    const taskPriority = "Normal"; // or from a dropdown
  
    if (!taskTitle) {
      alert("Task title is required!");
      return;
    }
  
    const newTask = await Task.add(taskTitle, taskCategory, taskAssigned, taskDueDate, taskPriority);
    classifyTask(newTask);
  
    closeTaskModal();
  }
  
  // Calculate days left
  function calculateDaysLeft(dueDate) {
    if (!dueDate) return "No due date";
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? `${diffDays} days left` : "Overdue";
  }
  
  // Classify tasks (Today, Upcoming, Done)
  function classifyTask(task) {
    const todayWrapper = document.getElementById("todayTasks");
    const upcomingWrapper = document.getElementById("upcomingTasks");
    const doneWrapper = document.getElementById("doneTasks");
  
    const taskElement = document.createElement("div");
    taskElement.classList.add("task");
    taskElement.setAttribute("data-category", (task.category || "").toLowerCase());
  
    const daysLeft = calculateDaysLeft(task.dueDate);
    const menuIcon = `
      <span class="task-menu-icon" onclick="openTaskOptions('${task.id}')">
        <i class="fa-solid fa-ellipsis-vertical"></i>
      </span>
    `;
  
    taskElement.innerHTML = `
      ${menuIcon}
      <input
        class="task-item"
        name="task"
        type="checkbox"
        id="${task.id}"
        ${task.done ? "checked" : ""}
      >
      <label for="${task.id}">
        <span class="label-text">${task.title}</span>
      </label>
      <div class="tag progress-wrapper">
        <div class="tag progress">${task.category || ""}</div>
        <div class="tag progress">${task.assigned || ""}</div>
        <div class="tag progress">${task.dueDate || "No due date"}</div>
        <div class="tag progress">${daysLeft}</div>
      </div>
    `;
  
    // Decide where to place it
    if (task.done) {
      doneWrapper.prepend(taskElement);
    } else {
      const due = task.dueDate ? new Date(task.dueDate) : null;
      const now = new Date();
      const sameDay = due && due.toDateString() === now.toDateString();
      const overdue = due && due < now;
      if (!task.dueDate || sameDay || overdue) {
        todayWrapper.prepend(taskElement);
      } else {
        upcomingWrapper.prepend(taskElement);
      }
    }
  
    // Checkbox toggles done
    const checkbox = taskElement.querySelector(".task-item");
    checkbox.addEventListener("change", async () => {
      const isChecked = checkbox.checked;
      await Task.edit(
        task.id,
        task.title,
        task.category,
        task.assigned,
        task.dueDate,
        task.priority,
        isChecked
      );
      taskElement.remove();
      task.done = isChecked;
      classifyTask(task);
    });
  }
  
  // Reload tasks from storage
  async function reloadTasks() {
    document.getElementById("todayTasks").innerHTML = "";
    document.getElementById("upcomingTasks").innerHTML = "";
    document.getElementById("doneTasks").innerHTML = "";
  
    const tasks = await Task.loadAll();
    tasks.forEach(task => classifyTask(task));
  }
  
  // For quick editing a task title
  async function editTask(id) {
    const updatedTitle = prompt("Edit task title:");
    if (!updatedTitle) return;
  
    const tasks = await Task.loadAll();
    const task = tasks.find(t => t.id === id);
    if (!task) return;
  
    await Task.edit(
      id,
      updatedTitle,
      task.category,
      task.assigned,
      task.dueDate,
      task.priority,
      task.done
    );
  
    reloadTasks();
  }
  
  
  /**************************************************************
   *************** TASK EDIT MODAL (3-DOT MENU) *****************
   *************************************************************/
  let currentTaskId = null;
  
  async function openTaskOptions(taskId) {
    currentTaskId = taskId;
  
    // Load tasks & find the selected one
    const tasks = await Task.loadAll();
    const t = tasks.find(task => task.id === taskId);
    if (!t) return console.error("Task not found in storage =>", taskId);
  
    // Populate fields
    document.getElementById("edit-task-title").value = t.title;
    document.getElementById("edit-task-category").value = t.category || "";
    document.getElementById("edit-task-assigned").value = t.assigned || "";
    document.getElementById("edit-task-date").value = t.dueDate || "";
  
    // Show the edit modal
    document.getElementById("taskOptionsModal").style.display = "flex";
  }
  
  function closeTaskOptionsModal() {
    document.getElementById("taskOptionsModal").style.display = "none";
    currentTaskId = null;
  }
  
  async function saveTaskEdits() {
    if (!currentTaskId) return;
  
    const updatedTitle = document.getElementById("edit-task-title").value.trim();
    const updatedCategory = document.getElementById("edit-task-category").value.trim();
    const updatedAssigned = document.getElementById("edit-task-assigned").value.trim();
    const updatedDate = document.getElementById("edit-task-date").value;
  
    if (!updatedTitle) {
      alert("Title is required!");
      return;
    }
  
    // Keep existing done & priority
    const tasks = await Task.loadAll();
    const existing = tasks.find(t => t.id === currentTaskId);
    if (!existing) return console.error("Task not found =>", currentTaskId);
  
    const done = existing.done;
    const priority = existing.priority;
  
    // Update in storage
    await Task.edit(currentTaskId, updatedTitle, updatedCategory, updatedAssigned, updatedDate, priority, done);
  
    closeTaskOptionsModal();
    reloadTasks();
  }
  
  async function deleteSelectedTask() {
    if (!currentTaskId) return;
  
    await Task.delete(currentTaskId);
    closeTaskOptionsModal();
    reloadTasks();
  }
  
  
  /**************************************************************
   ******************** CATEGORY CLASS **************************
   *************************************************************/
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
      const categories = await StorageManager.loadData("categories");
      return Array.isArray(categories) ? categories : [];
    }
  }
  
  /**************************************************************
   ************** CATEGORY INITIALIZATION & UI ******************
   *************************************************************/
  async function initializeCategories() {
    const categories = await Category.loadAll();
    if (!Array.isArray(categories)) {
      console.error("Error: Loaded categories data is not an array =>", categories);
      return;
    }
    categories.forEach(category => addCategoryToUI(category));
  }
  
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
  
  function addCategoryToUI(category) {
    const categoryList = document.getElementById("categoryList");
    const newCategory = document.createElement("li");
    newCategory.textContent = category.name;
    newCategory.setAttribute("data-category", category.name.toLowerCase());
    categoryList.appendChild(newCategory);
  }
  
  // Populate the category dropdown for Add Task
  async function populateCategoryDropdown() {
    const categorySelect = document.getElementById("task-category");
    if (!categorySelect) return;
    
    categorySelect.innerHTML = `<option value="">Select Category</option>`;
    const categories = await Category.loadAll();
    if (!Array.isArray(categories)) {
      console.error("Error: categories data is not an array =>", categories);
      return;
    }
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }
  
  
  /**************************************************************
   ******************* CATEGORY NAVIGATION **********************
   *************************************************************/
  document.addEventListener("DOMContentLoaded", function () {
    const categoryList = document.getElementById("categoryList");
    if (!categoryList) {
      console.error("Error: categoryList element not found");
      return;
    }
  
    console.log("Category list and tabs initialized successfully");
  
    function updateActiveTab(selectedTab) {
      console.log("Tab clicked:", selectedTab.textContent);
      document.querySelectorAll("#categoryList li").forEach(tab => tab.classList.remove("active"));
      selectedTab.classList.add("active");
  
      const clickedCategory = selectedTab.getAttribute("data-category");
      filterTasks(clickedCategory);
  
      console.log("Active tab updated to:", selectedTab.textContent);
    }
  
    categoryList.addEventListener("click", function (event) {
      if (event.target.tagName === "LI") {
        updateActiveTab(event.target);
      }
    });
  });
  
  
  /**************************************************************
   ************************ NOTES ******************************
   *************************************************************/
  // The Note Class is near the bottom for clarity
  class Note {
    constructor(title, description) {
      this.id = `note-${Date.now()}`;
      this.title = title;
      this.description = description;
      this.timestamp = new Date().toLocaleString();
    }
  
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
  
    static async loadAll() {
      const notes = await StorageManager.loadData("notes");
      return Array.isArray(notes) ? notes : [];
    }
  
    static async edit(id, newTitle, newDesc) {
      let notes = await StorageManager.loadData("notes");
      notes = notes.map(n => n.id === id ? { ...n, title: newTitle, description: newDesc } : n);
      await StorageManager.saveData("notes", notes);
    }
  
    static async delete(id) {
      let notes = await StorageManager.loadData("notes");
      notes = notes.filter(n => n.id !== id);
      await StorageManager.saveData("notes", notes);
    }
  }
  
  // Display notes in #notes-container
  function addNoteToUI(note) {
    const notesContainer = document.getElementById("notes-container");
    const noteBox = document.createElement("div");
    noteBox.classList.add("note-box");
    noteBox.setAttribute("data-id", note.id);
    noteBox.setAttribute("data-description", note.description);
  
    noteBox.innerHTML = `
      <div class="note-title">${note.title}</div>
      <div class="note-description">${note.description}</div>
      <div class="note-time">${note.timestamp}</div>
    `;
  
    notesContainer.prepend(noteBox);
  }
  
  // Add a new note from modal
  async function addNote() {
    const noteTitle = document.getElementById("note-title").value.trim();
    const noteDesc = document.getElementById("note-description").value.trim();
  
    if (!noteTitle) {
      alert("Please enter a note title!");
      return;
    }
  
    const newNote = await Note.add(noteTitle, noteDesc);
    addNoteToUI(newNote);
    document.getElementById("note-title").value = "";
    document.getElementById("note-description").value = "";
    closeNoteModal();
  }
  
  async function initializeNotes() {
    const notes = await Note.loadAll();
    if (!Array.isArray(notes)) {
      console.error("Error: loaded notes is not an array =>", notes);
      return;
    }
    document.getElementById("notes-container").innerHTML = "";
    notes.forEach(addNoteToUI);
  }
  
  
  /**************************************************************
   *********************** NOTES: EDIT/VIEW *********************
   *************************************************************/
  let currentNoteId = null;
  
  function openViewNoteModal(noteId, title, description) {
    currentNoteId = noteId;
    document.getElementById("edit-note-title").value = title;
    document.getElementById("edit-note-description").value = description;
    document.getElementById("viewNoteModal").style.display = "flex";
  }
  
  function closeViewNoteModal() {
    document.getElementById("viewNoteModal").style.display = "none";
    currentNoteId = null;
  }
  
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
  
  async function deleteNote() {
    if (!currentNoteId) return;
    await Note.delete(currentNoteId);
    closeViewNoteModal();
    initializeNotes(); // Refresh UI
  }
  
  // Clicking a note to open the bigger edit modal
  document.getElementById("notes-container").addEventListener("click", function (event) {
    const noteBox = event.target.closest(".note-box");
    if (!noteBox) return;
  
    const noteId = noteBox.getAttribute("data-id");
    const noteTitle = noteBox.querySelector(".note-title").textContent;
    const noteDescription = noteBox.getAttribute("data-description");
  
    openViewNoteModal(noteId, noteTitle, noteDescription);
  });
  
  
  /**************************************************************
   ***************** HABITS (If needed) ************************
   *************************************************************/
  // If you have a Habit class & load logic, place here
  // function loadHabits() { ... }
  
  
  /**************************************************************
   ************** INITIALIZE EVERYTHING ONCE ********************
   *************************************************************/
  async function initializeAll() {
    // 1) Tasks
    const tasks = await Task.loadAll();
    tasks.forEach(task => classifyTask(task));
  
    // 2) Notes
    await initializeNotes();
  
    // 3) Habits - if you have them
    // loadHabits();
  
    // 4) Categories
    await initializeCategories();
  
    // 5) User count
    await updateUserCount();
  }
  
  // Called once DOM is fully ready
  document.addEventListener("DOMContentLoaded", initializeAll);
  
  
  /**************************************************************
   ****************** COLLAPSIBLE HEADERS ***********************
   *************************************************************/
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
  
  
  /**************************************************************
   ************************ USER CLASS *************************
   *************************************************************/
  class User {
    constructor(name, color) {
      this.id = `user-${Date.now()}`;
      this.name = name;
      this.color = color;
    }
  
    static async loadAll() {
      const users = await StorageManager.loadData("users");
      return Array.isArray(users) ? users : [];
    }
  
    static async saveAll(users) {
      await StorageManager.saveData("users", users);
    }
  
    static async add(name, color) {
      const newUser = new User(name, color);
      const users = await User.loadAll();
      users.push(newUser);
      await User.saveAll(users);
      return newUser;
    }
  
    static async edit(userId, newName, newColor) {
      let users = await User.loadAll();
      users = users.map(u => u.id === userId ? { ...u, name: newName, color: newColor } : u);
      await User.saveAll(users);
    }
  
    static async delete(userId) {
      let users = await User.loadAll();
      users = users.filter(u => u.id !== userId);
      await User.saveAll(users);
    }
  }
  
  
  /**************************************************************
   *************** USER MANAGEMENT FUNCTIONS ********************
   *************************************************************/
  let editingUserId = null;
  
  async function openUserModal() {
    await displayUsers();
    document.getElementById("user-name").value = "";
    document.getElementById("user-color").value = "#ff0000";
    document.getElementById("edit-user-id").value = "";
    editingUserId = null;
  
    document.getElementById("userModal").style.display = "flex";
  }
  
  function closeUserModal() {
    document.getElementById("userModal").style.display = "none";
    editingUserId = null;
  }
  
  async function displayUsers() {
    const userListContainer = document.getElementById("userListContainer");
    userListContainer.innerHTML = "";
  
    const users = await User.loadAll();
    document.getElementById("userCount").textContent = users.length;
  
    if (users.length === 0) {
      userListContainer.innerHTML = "<p>No users found.</p>";
      return;
    }
  
    users.forEach(u => {
      const userCard = document.createElement("div");
      userCard.classList.add("user-card");
      userCard.innerHTML = `
        <div class="user-header">
          <div class="user-color-bullet" style="background-color: ${u.color};"></div>
          <div class="user-name">${u.name}</div>
        </div>
        <button class="edit-user-btn" onclick="startEditUser('${u.id}')">Edit</button>
      `;
      userListContainer.appendChild(userCard);
    });
  }
  
  async function startEditUser(userId) {
    editingUserId = userId;
    const users = await User.loadAll();
    const user = users.find(u => u.id === userId);
    if (!user) return console.error("User not found =>", userId);
  
    document.getElementById("user-name").value = user.name;
    document.getElementById("user-color").value = user.color;
    document.getElementById("edit-user-id").value = userId;
  }
  
  async function saveUser() {
    const userName = document.getElementById("user-name").value.trim();
    const userColor = document.getElementById("user-color").value.trim();
    const existingId = document.getElementById("edit-user-id").value;
  
    if (!userName) {
      alert("User name is required!");
      return;
    }
  
    if (existingId) {
      // Editing
      await User.edit(existingId, userName, userColor);
    } else {
      // Creating
      await User.add(userName, userColor);
    }
  
    await displayUsers();
  
    document.getElementById("user-name").value = "";
    document.getElementById("user-color").value = "#ff0000";
    document.getElementById("edit-user-id").value = "";
    editingUserId = null;
  }
  
  async function deleteUser() {
    const existingId = document.getElementById("edit-user-id").value;
    if (!existingId) {
      alert("No user selected to delete!");
      return;
    }
  
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }
  
    await User.delete(existingId);
    await displayUsers();
  
    document.getElementById("user-name").value = "";
    document.getElementById("user-color").value = "#ff0000";
    document.getElementById("edit-user-id").value = "";
    editingUserId = null;
  }
  
  async function updateUserCount() {
    const users = await User.loadAll();
    document.getElementById("userCount").textContent = users.length;
  }
  