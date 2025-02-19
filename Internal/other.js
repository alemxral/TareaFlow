/***************************************************************
 * 1) USER CLASS (with robust load & CRUD functions)
 ***************************************************************/
 class User {
    constructor(id, name, color) {
      this.id = id || `user-${Date.now()}`;  // Unique ID
      this.name = name;  
      this.color = color;  
    }

    static async loadAll() {
      let userData = [];
      try {
        const res = await fetch("http://localhost:8080/api/load/users");
        if (!res.ok) {
          console.warn(`Users file not found or load error: ${res.status}`);
          return [];
        }
        const textData = await res.text();
        let jsonData;
        try {
          jsonData = JSON.parse(textData);
        } catch (parseErr) {
          console.error("Error parsing users JSON:", parseErr);
          return [];
        }
        if (Array.isArray(jsonData)) {
          userData = jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
          userData = jsonData.data;
        } else {
          console.warn("Unexpected shape of users JSON, using empty array.");
        }
      } catch (error) {
        console.error("Error loading users:", error);
        return [];
      }
      return userData.map(u => new User(u.id, u.name, u.color));
    }

    static async saveAll(users) {
      const payload = { filename: "users", data: users };
      try {
        await fetch("http://localhost:8080/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Error saving users:", err);
      }
    }

    static async add(name, color) {
      const newUser = new User(null, name, color);
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

/***************************************************************
 * 2) USER MODAL FUNCTIONALITIES
 ***************************************************************/
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
        await User.edit(existingId, userName, userColor);
    } else {
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

/***************************************************************
 * 3) UPDATE HOLIDAY USER DROPDOWN AFTER CHANGES
 ***************************************************************/
async function populateUserSelect(){
    holidayUserSelect.innerHTML = "";
    const users = await User.loadAll();
    if (users.length === 0) {
      console.warn("No users loaded; user dropdown is empty.");
      return;
    }
    users.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name;
      holidayUserSelect.appendChild(opt);
    });
}

/***************************************************************
 * 4) UPDATE USER COUNT
 ***************************************************************/
async function updateUserCount() {
    const users = await User.loadAll();
    document.getElementById("userCount").textContent = users.length;
}

/***************************************************************
 * 5) INITIALIZATION AFTER DOM LOAD
 ***************************************************************/
document.addEventListener("DOMContentLoaded", async function () {
    await displayUsers();
    await updateUserCount();
    await populateUserSelect();
});
