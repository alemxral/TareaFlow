# Task Manager & Multi-Year Holiday Calendar

## Overview

This project is a **Task Manager** combined with a **Multi-Year Holiday Calendar (2024 - 2027)**. It allows users to manage tasks, assign them to users, and book holidays for specific users. The holidays are visually represented on a calendar with assigned colors per user.

![TareaFlow Screenshot](https://raw.githubusercontent.com/alemxral/TareaFlow/main/Internal/image-1.png)


## Features

### ✅ Task Management

- Create, edit, and delete tasks
- Assign tasks to users
- Filter tasks by categories
- View task deadlines and progress status

### 📅 Multi-Year Holiday Calendar

- **Interactive Calendar:** Users can select individual or multiple days to book holidays.
- **Holiday Management:** Add, edit, and remove holidays for users.
- **User-Based Color Coding:** Each user has a unique color to represent their holidays.
- **Multi-Year Navigation:** View and manage holidays from **2024 to 2027**.
- **Right-Side Panel:** Displays a list of holidays with user details and date range.

### 🛠 Robust Data Management

- Data is **stored in JSON** (`users.json` & `holidays.json`).
- Holidays are **persisted** and reloaded upon reopening the application.
- **Error Handling:** Prevents crashes when data is missing or incorrectly formatted.
- **Preloader:** Improves user experience by showing a loading animation while data is retrieved.

## Installation & Setup

### 1️⃣ Clone the Repository

```sh
 git clone https://github.com/alemxral/TareaFlow.git
 cd task-manager
```



### 2️⃣ Run the Project throught TareaFlow.exe/TareaFlow-Init.vbs or alternatively:

```sh
.\server.ps1
```

Then, open `http://localhost:8080` in your browser.


## File Structure

```
├── Internal/
│   ├── data/
│   │   ├── categories.json
│   │   ├── holidays.json
│   │   ├── notes.json
│   │   ├── tasks.json
│   │   ├── users.json
│   ├── holidays.css
│   ├── holidays.html
│   ├── holidays.js
│   ├── icon.ico
│   ├── index.html
│   ├── RunSilent.vbs
│   ├── script.js
│   ├── Server.ps1
│   ├── style.css
│   ├── TareaFlow.vbs
├── readme.md
├── TareaFlow-Init.vbs
├── TareaFlow.exe
```

## Usage Guide

### 🎯 Task Manager

1. **Add a Task**: Click **+ Add Task**, fill in details, and save.
2. **Edit a Task**: Click on a task to modify it.
3. **Delete a Task**: Use the delete button.
4. **Filter Tasks**: Click on a category tab to filter tasks.

### 📆 Booking Holidays

1. **Select Dates**: Click on one or multiple days in the calendar.
2. **Open Holiday Modal**: Click **Add Holiday**.
3. **Assign to User**: Choose a user from the dropdown.
4. **Save Holiday**: Click "Save" to book the holiday.
5. **Edit or Remove**: Click an existing holiday in the right panel.

## Known Issues & Fixes

### ❌ Issue: "Holiday not found for editing"

**Fix:** If no holiday exists, the modal switches to **creation mode** instead of throwing an error.

### ❌ Issue: Calendar Crashes When Loading Multiple Holidays

**Fix:** Ensure `dates` are correctly stored as a **Set** in `holidays.json` before loading.

## Future Improvements

- **Task Progress Tracking**
- **Notifications for Upcoming Deadlines**
- **Dark Mode UI Theme**

## Contributors

- **ALEJANRO MORAL ARANDA** - Developer & Maintainer

## License

This project is open-source and available under the **MIT License**.

