/***************************************************************
 * 1) USER CLASS (with robust load)
 ***************************************************************/
class User {
    constructor(id, name, color) {
      this.id = id;       // e.g. "user-1739619246923"
      this.name = name;   // e.g. "jesus"
      this.color = color; // e.g. "#ff0000"
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
  
    static async findById(userId) {
      const allUsers = await User.loadAll();
      return allUsers.find(u => u.id === userId);
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
    allUsers = await User.loadAll(); // ✅ Ensure the latest users are loaded
    const user = allUsers.find(u => u.id === userId);

    if (!user) {
        console.error("⚠️ User not found =>", userId);
        alert("User not found. Try refreshing.");
        return;
    }

    document.getElementById("user-name").value = user.name;
    document.getElementById("user-color").value = user.color;
    document.getElementById("edit-user-id").value = user.id;
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
      // Editing an existing user
      await User.edit(existingId, userName, userColor);
  } else {
      // Creating a new user
      await User.add(userName, userColor);
  }

  // ✅ Reload users everywhere to ensure changes are reflected
  allUsers = await User.loadAll(); // Reload global users list
  await populateUserSelect(); // Reload the dropdown in holiday modal
  await displayUsers(); // Reload user list in user modal
  await updateUserCount(); // Update user count in UI

  // Reset form
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
async function populateUserSelect() {
  holidayUserSelect.innerHTML = ""; // Clear old options

  // ✅ Always reload users before updating dropdown
  allUsers = await User.loadAll(); 

  if (allUsers.length === 0) {
      console.warn("No users loaded; user dropdown is empty.");
      return;
  }

  allUsers.forEach(u => {
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

  
  /***************************************************************
   * 2) HOLIDAY CLASS (robust load)
   ***************************************************************/
  class Holiday {
    constructor(id, holidayName, userId, dates = []) {
      this.id = id || `holiday-${Date.now()}`;
      this.holidayName = holidayName;
      this.userId = userId;
      this.dates = Array.isArray(dates) ? new Set(dates) : new Set(); // Ensure Set
    }
  
    // Load holidays robustly
    static async loadAll() {
      let holidayData = [];
      try {
        const res = await fetch("http://localhost:8080/api/load/holidays");
        if (!res.ok) {
          console.warn(`Holidays file not found or load error: ${res.status}`);
          return [];
        }
        const textData = await res.text();
        console.log("Raw holidays response text:", textData);
  
        let jsonData;
        try {
          jsonData = JSON.parse(textData);
        } catch (parseErr) {
          console.error("Error parsing holiday JSON:", parseErr);
          return [];
        }
        console.log("Parsed holiday JSON:", jsonData);
  
        if (Array.isArray(jsonData)) {
          holidayData = jsonData;
        } else if (jsonData && Array.isArray(jsonData.data)) {
          holidayData = jsonData.data;
        } else {
          console.warn("Unexpected shape of holidays JSON, using empty array.");
          return [];
        }
      } catch (error) {
        console.error("Error loading holidays:", error);
        return [];
      }
  
      // Convert raw holiday data to Holiday instances, ensuring correct format.
      return holidayData.map(h => {
        return new Holiday(
          h.id,
          h.holidayName,
          h.userId,
          Array.isArray(h.dates) ? h.dates : [] // Fix malformed data
        );
      });
    }
  
    // Save all holidays correctly
    static async saveAll(holidayArray) {
      const cleanedData = holidayArray.map(h => ({
        id: h.id,
        holidayName: h.holidayName,
        userId: h.userId,
        dates: Array.from(h.dates) // Ensure Set is converted to Array
      }));
  
      const payload = { filename: "holidays", data: cleanedData };
      try {
        const res = await fetch("http://localhost:8080/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        console.log("Save holiday response:", await res.text());
      } catch (err) {
        console.error("Error saving holidays:", err);
      }
    }
  
    // Add a new holiday
    static async add(holidayName, userId, dateSet) {
      const newHol = new Holiday(null, holidayName, userId, dateSet);
      let allHols = await Holiday.loadAll();
      allHols.push(newHol);
      await Holiday.saveAll(allHols);
      return newHol;
    }
  
    // Edit an existing holiday
    static async edit(holidayId, newName, newUserId, newDates) {
      let allHols = await Holiday.loadAll();
      allHols = allHols.map(h => {
        if (h.id === holidayId) {
          return new Holiday(h.id, newName, newUserId, newDates);
        }
        return h;
      });
      await Holiday.saveAll(allHols);
    }
  
    // Remove a holiday
    static async remove(holidayId) {
      let allHols = await Holiday.loadAll();
      allHols = allHols.filter(h => h.id !== holidayId);
      await Holiday.saveAll(allHols);
    }
  }
  
  
  /***************************************************************
   * 3) CALENDAR & LOGIC (2024-2027), robust
   ***************************************************************/
  const monthYearLabel = document.getElementById("monthYearLabel");
  const calendarGrid = document.getElementById("holidaysGrid");
  
  const openHolidayModalBtn = document.getElementById("openHolidayModalBtn");
  const holidayModal = document.getElementById("holidayModal");
  const holidayModalTitle = document.getElementById("holidayModalTitle");
  
  const holidayUserSelect = document.getElementById("holidayUserSelect");
  const holidayNameInput = document.getElementById("holidayName");
  
  const cancelHolidayBtn = document.getElementById("cancelHolidayBtn");
  const saveHolidayBtn = document.getElementById("saveHolidayBtn");
  const deleteHolidayBtn = document.getElementById("deleteHolidayBtn");
  
  const holidayListEl = document.getElementById("holidayList");
  
  // nav
  const prevYearBtn = document.getElementById("prevYearBtn");
  const nextYearBtn = document.getElementById("nextYearBtn");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  
  let allUsers = [];
  let allHolidays = []; // array of raw holiday objects
  let selectedDates = new Set();
  let editingHolidayId = null;
  
  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth();
  
  /************************
   * INIT
   ************************/
  async function initMultiYearCalendar() {
    try {
        // ✅ Show preloader before fetching data
        document.getElementById("preloader").style.display = "flex";

        // ✅ Load users and holidays from storage
        const [users, holidays] = await Promise.all([
            User.loadAll(),
            Holiday.loadAll()
        ]);

        // ✅ Store users and holidays globally
        allUsers = users;
        allHolidays = holidays.map(h => ({
            ...h,
            dates: new Set(h.dates || []) // Ensure valid date structure
        }));

        // ✅ Build UI elements
        populateUserSelect();
        buildCalendar(currentYear, currentMonth);
        updateHolidayList();

    } catch (err) {
        console.error("Init error:", err);
    } finally {
        // ✅ Hide preloader after everything is loaded
        document.getElementById("preloader").style.display = "none";
    }

    // ✅ Set up event listeners for UI interactions
    openHolidayModalBtn.addEventListener("click", openHolidayModal);
    cancelHolidayBtn.addEventListener("click", closeHolidayModal);
    saveHolidayBtn.addEventListener("click", saveHoliday);
    deleteHolidayBtn.addEventListener("click", removeHoliday);

    prevMonthBtn.addEventListener("click", prevMonth);
    nextMonthBtn.addEventListener("click", nextMonth);
    prevYearBtn.addEventListener("click", prevYear);
    nextYearBtn.addEventListener("click", nextYear);
}







  
  document.addEventListener("DOMContentLoaded", initMultiYearCalendar);
  
  /************************
   * Populate user dropdown
   ************************/
  function populateUserSelect(){
    holidayUserSelect.innerHTML = "";
    if (allUsers.length === 0) {
      console.warn("No users loaded; user dropdown is empty.");
      return;
    }
    allUsers.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = u.name;
      holidayUserSelect.appendChild(opt);
    });
  }
  
  /************************
   * Build the Calendar
   ************************/
  function buildCalendar(year, month){
    // Clear day cells but keep day-name row
    while (calendarGrid.children.length > 7) {
      calendarGrid.removeChild(calendarGrid.lastChild);
    }
  
    const monthNames = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;
  
    // first day-of-week
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0=Sun..6=Sat
    const totalDays = new Date(year, month+1, 0).getDate();
  
    // blank
    for (let i=0; i<startDay; i++){
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("day-cell");
      calendarGrid.appendChild(emptyCell);
    }
  
    for (let d=1; d<=totalDays; d++){
      const cell = document.createElement("div");
      cell.classList.add("day-cell");
  
      const checkToday = new Date();
      if (year === checkToday.getFullYear() && month === checkToday.getMonth() && d === checkToday.getDate()){
        cell.classList.add("today");
      }
  
      // day number
      const dayNumEl = document.createElement("div");
      dayNumEl.classList.add("day-number");
      dayNumEl.textContent = d;
      cell.appendChild(dayNumEl);
  
      // container for user circles
      const circleCont = document.createElement("div");
      circleCont.classList.add("day-holiday-users");
      cell.appendChild(circleCont);
  
      const iso = toISODate(year, month, d);
      cell.dataset.date = iso;
  
      highlightDayIfHoliday(iso, circleCont);
      cell.addEventListener("click", () => toggleDateSelection(iso, cell));
  
      calendarGrid.appendChild(cell);
    }
  }
  
  // highlight day if it belongs to any holiday
  function highlightDayIfHoliday(dateStr, container){
    allHolidays.forEach(h => {
      if (h.dates.has(dateStr)) {
        const userObj = allUsers.find(u => u.id === h.userId);
        const color = userObj ? userObj.color : "#ccc";
        const circ = document.createElement("div");
        circ.classList.add("user-circle");
        circ.style.backgroundColor = color;
        container.appendChild(circ);
      }
    });
  }
  
  function toggleDateSelection(dateStr, cell){
    if (selectedDates.has(dateStr)) {
      selectedDates.delete(dateStr);
      cell.classList.remove("selected");
    } else {
      selectedDates.add(dateStr);
      cell.classList.add("selected");
    }
  }
  
  function toISODate(year, month, day){
    const mm = String(month+1).padStart(2,'0');
    const dd = String(day).padStart(2,'0');
    return `${year}-${mm}-${dd}`;
  }
  
/************************
 * Holiday Modal
 ************************/
async function openHolidayModal(holidayId = null) {
  await populateUserSelect(); // ✅ Load the latest users before opening the modal

  if (!holidayId) {
    // No ID provided → Create new holiday
    if (selectedDates.size === 0) {
      alert("Select at least one date first!");
      return;
    }
    
    // Open modal in creation mode
    editingHolidayId = null;
    holidayModalTitle.textContent = "Add Holiday for Selected Dates";
    saveHolidayBtn.textContent = "Save";
    deleteHolidayBtn.style.display = "none";
    holidayUserSelect.selectedIndex = 0;
    holidayNameInput.value = "";
  } else {
    // ID provided → Try to edit existing holiday
    editingHolidayId = holidayId;
    holidayModalTitle.textContent = "Edit or Remove Holiday";
    saveHolidayBtn.textContent = "Update";
    deleteHolidayBtn.style.display = "inline-block";

    const hol = allHolidays.find(h => h.id === holidayId);

    if (!hol) {
      console.warn("Holiday not found for editing:", holidayId);
      
      // If no holiday found, open the modal in creation mode instead
      openHolidayModal(); 
      return;
    }

    // Load existing holiday data
    holidayUserSelect.value = hol.userId;
    holidayNameInput.value = hol.holidayName;
  }
  
  // Open the modal
  holidayModal.classList.add("active");
}


  
  function closeHolidayModal(){
    holidayModal.classList.remove("active");
    selectedDates.clear();
    rebuildCalendarView();
  }
  
  // Save new or update
  async function saveHoliday(){
    const userId = holidayUserSelect.value;
    const nameVal = holidayNameInput.value.trim();
    if (!userId || !nameVal){
      alert("User & holiday name are required!");
      return;
    }
  
    if (editingHolidayId) {
      // update existing
      const existing = allHolidays.find(h => h.id === editingHolidayId);
      if (!existing) {
        alert("Holiday not found, cannot update!");
        return;
      }
      existing.holidayName = nameVal;
      existing.userId = userId;
      // keep same dates or advanced approach if you want
      try {
        await Holiday.edit(editingHolidayId, nameVal, userId, [...existing.dates]);
      } catch(e) {
        console.error("Edit holiday error:", e);
      }
    } else {
      // create new
      if (selectedDates.size === 0) {
        alert("No dates selected!");
        return;
      }
      try {
        const newHol = await Holiday.add(nameVal, userId, [...selectedDates]);
        // push local
        allHolidays.push({
          id: newHol.id,
          holidayName: newHol.holidayName,
          userId: newHol.userId,
          dates: new Set(newHol.dates)
        });
      } catch(e) {
        console.error("Add holiday error:", e);
      }
    }
  
    closeHolidayModal();
    rebuildCalendarView();
  }
  
  // Remove existing holiday
  async function removeHoliday(){
    if (!editingHolidayId) return;
    if (!confirm("Are you sure to delete this holiday?")) return;
  
    try {
      await Holiday.remove(editingHolidayId);
      allHolidays = allHolidays.filter(h => h.id !== editingHolidayId);
    } catch(e) {
      console.error("Remove holiday error:", e);
    }
    closeHolidayModal();
    rebuildCalendarView();
  }
  
  /************************
   * Holiday List in Right Panel
   ************************/
  function updateHolidayList() {
    holidayListEl.innerHTML = "";
  
    if (allHolidays.length === 0) {
      holidayListEl.innerHTML = "<p>No holidays found.</p>";
      return;
    }
  
    allHolidays.forEach(h => {
      const item = document.createElement("div");
      item.classList.add("holiday-item");
  
      // Find user info
      const userObj = allUsers.find(u => u.id === h.userId);
      const color = userObj ? userObj.color : "#444";
  
      // Extract date range (if available)
      const holidayDates = [...h.dates].sort();
      const dateRange =
        holidayDates.length > 0
          ? `${holidayDates[0]} → ${holidayDates[holidayDates.length - 1]}`
          : "No dates selected";
  
      // Apply background color dynamically
      item.style.setProperty("--holiday-bg", color);
  
      // Build HTML structure
      item.innerHTML = `
        <div class="holiday-item-title">${h.holidayName}</div>
        <div class="holiday-item-user">${userObj ? userObj.name : "Unknown"} (${h.dates.size} days)</div>
        <div class="holiday-item-date">${dateRange}</div>
      `;
  
      // Click to edit/delete
      item.addEventListener("click", () => openHolidayModal(h.id));
  
      holidayListEl.appendChild(item);
    });
  }
  
  
  
  /************************
   * Navigation (2024-2027)
   ************************/
  function prevMonth(){
    currentMonth--;
    if(currentMonth < 0){
      currentMonth = 11;
      currentYear--;
      if(currentYear < 2024){
        currentYear = 2024;
        currentMonth = 0;
        alert("No more months before 2024!");
      }
    }
    rebuildCalendarView();
  }
  function nextMonth(){
    currentMonth++;
    if(currentMonth > 11){
      currentMonth = 0;
      currentYear++;
      if(currentYear > 2027){
        currentYear = 2027;
        currentMonth = 11;
        alert("No more months after 2027!");
      }
    }
    rebuildCalendarView();
  }
  function prevYear(){
    currentYear--;
    if(currentYear < 2024){
      currentYear = 2024;
      alert("Earliest year is 2024!");
    }
    rebuildCalendarView();
  }
  function nextYear(){
    currentYear++;
    if(currentYear > 2027){
      currentYear = 2027;
      alert("Latest year is 2027!");
    }
    rebuildCalendarView();
  }
  
  function rebuildCalendarView(){
    buildCalendar(currentYear, currentMonth);
    updateHolidayList();
    selectedDates.clear();
  }
  

  /***************************************************************
 * ✅ 1) Work From Home Class (Handles Storage & CRUD)
 ***************************************************************/
class WorkingFromHome {
    constructor(id, wfhName, userId, dates = []) {
        this.id = id || `wfh-${Date.now()}`;
        this.wfhName = wfhName;
        this.userId = userId;
        this.dates = new Set(dates);
    }

    // Load all WFH records
    static async loadAll() {
        try {
            const res = await fetch("http://localhost:8080/api/load/wfh");
            if (!res.ok) {
                console.warn(`⚠️ WFH file not found or load error: ${res.status}`);
                return [];
            }
            const jsonData = await res.json();
            return jsonData.data.map(wfh => new WorkingFromHome(wfh.id, wfh.wfhName, wfh.userId, wfh.dates));
        } catch (error) {
            console.error("❌ Error loading WFH:", error);
            return [];
        }
    }

    // Save all WFH records
    static async saveAll(wfhArray) {
        const payload = {
            filename: "wfh",
            data: wfhArray.map(wfh => ({
                id: wfh.id,
                wfhName: wfh.wfhName,
                userId: wfh.userId,
                dates: Array.from(wfh.dates)
            }))
        };

        try {
            const res = await fetch("http://localhost:8080/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            console.log("✅ Save WFH response:", await res.text());
        } catch (err) {
            console.error("❌ Error saving WFH:", err);
        }
    }

    // Add new WFH entry
    static async add(wfhName, userId, dateSet) {
        const newWFH = new WorkingFromHome(null, wfhName, userId, dateSet);
        let allWFH = await WorkingFromHome.loadAll();
        allWFH.push(newWFH);
        await WorkingFromHome.saveAll(allWFH);
        return newWFH;
    }

    // Remove a WFH entry
    static async remove(wfhId) {
        let allWFH = await WorkingFromHome.loadAll();
        allWFH = allWFH.filter(wfh => wfh.id !== wfhId);
        await WorkingFromHome.saveAll(allWFH);
    }
}

/***************************************************************
 * ✅ 2) WFH Modal - Open, Close & Manage Entries
 ***************************************************************/
const wfhModal = document.getElementById("wfhModal");
const openWFHBtn = document.getElementById("openWFHModalBtn");
const closeWFHBtn = document.getElementById("cancelWFHBtn");
const saveWFHBtn = document.getElementById("saveWFHBtn");
const deleteWFHBtn = document.getElementById("deleteWFHBtn");
const wfhUserSelect = document.getElementById("wfhUserSelect");
const wfhNameInput = document.getElementById("wfhName");
const wfhSelectedDates = document.getElementById("wfhSelectedDates");

let allWFH = [];
let selectedWFHDates = new Set();
let editingWFHId = null;

// ✅ Open Modal with Dynamic Data
openWFHBtn.addEventListener("click", () => openWFHModal());

// ✅ Save WFH Entry
saveWFHBtn.addEventListener("click", saveWFH);
async function saveWFH() {
    const userId = wfhUserSelect.value;
    const reason = wfhNameInput.value.trim();

    if (!userId) {
        alert("⚠️ Please select a user!");
        return;
    }
    if (selectedDates.size === 0) {  
        alert("⚠️ Please select at least one date!");
        return;
    }

    if (editingWFHId) {
        console.log("✏ Updating WFH entry...");
        const existing = allWFH.find(w => w.id === editingWFHId);
        if (!existing) {
            console.error("❌ Error: WFH entry not found!");
            alert("⚠️ WFH entry not found. Try again.");
            return;
        }

        // ✅ Update existing entry
        existing.userId = userId;
        existing.wfhName = reason;
        existing.dates = new Set([...selectedDates]); // ✅ Store dates properly

        try {
            await WorkingFromHome.saveAll(allWFH);
        } catch (e) {
            console.error("❌ Error saving updated WFH:", e);
        }
    } else {
        console.log("➕ Adding new WFH entry...");
        try {
            const newWFH = await WorkingFromHome.add(reason, userId, [...selectedDates]);
            allWFH.push({
                id: newWFH.id,
                wfhName: newWFH.wfhName,
                userId: newWFH.userId,
                dates: new Set(newWFH.dates),
            });
        } catch (e) {
            console.error("❌ Error adding WFH entry:", e);
        }
    }

    closeWFHModal();
    rebuildCalendarView();
}


// ✅ Open WFH Modal - Now Populates Selected Dates Correctly
async function openWFHModal(wfhId = null) {
  console.log("🔹 Opening WFH Modal...");
  await loadUsersIntoWFHDropdown();

  if (wfhId) {
      console.log("✏ Editing WFH:", wfhId);
      editingWFHId = wfhId;
      const wfhEntry = allWFH.find(w => w.id === wfhId);

      if (!wfhEntry) {
          console.warn("⚠️ WFH entry not found. Switching to create mode.");
          openWFHModal();
          return;
      }

      // ✅ Load existing WFH data into modal
      wfhUserSelect.value = wfhEntry.userId;
      wfhNameInput.value = wfhEntry.wfhName;
      selectedDates = new Set(wfhEntry.dates); // ✅ Ensures selected dates are retained

      deleteWFHBtn.style.display = "block"; 
  } else {
      console.log("➕ Creating new WFH entry");
      editingWFHId = null;
      wfhUserSelect.selectedIndex = 0;
      wfhNameInput.value = "";
      selectedDates.clear();
      deleteWFHBtn.style.display = "none";
  }

  updateWFHSelectedDatesDisplay(); // ✅ Ensure selected dates are displayed in modal

  wfhModal.style.display = "flex";
  wfhModal.classList.add("active");
}

// ✅ Update Selected Dates Display in WFH Modal
function updateWFHSelectedDatesDisplay() {
  wfhSelectedDates.innerHTML = [...selectedDates].join(", ") || "No dates selected";
}



// ✅ Close Modal
closeWFHBtn.addEventListener("click", closeWFHModal);
function closeWFHModal() {
    console.log("❌ Closing WFH Modal...");
    wfhModal.style.display = "none";
    wfhModal.classList.remove("active");
    selectedWFHDates.clear();
}

/***************************************************************
 * ✅ 3) WFH Actions - Save, Delete & Load Users
 ***************************************************************/

// ✅ Load Users into Dropdown
async function loadUsersIntoWFHDropdown() {
    wfhUserSelect.innerHTML = `<option value="">-- Select User --</option>`;
    const users = await User.loadAll();

    if (!users.length) {
        console.warn("⚠️ No users found!");
        return;
    }

    users.forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.name;
        wfhUserSelect.appendChild(option);
    });

    console.log("✅ WFH User dropdown loaded successfully.");
}

// ✅ Save WFH Entry
saveWFHBtn.addEventListener("click", saveWFH);
async function saveWFH() {
    const userId = wfhUserSelect.value;
    const reason = wfhNameInput.value.trim();

    if (!userId) {
        alert("⚠️ Please select a user!");
        return;
    }
    if (selectedWFHDates.size === 0) {
        alert("⚠️ Please select at least one date!");
        return;
    }

    if (editingWFHId) {
        console.log("✏ Updating WFH entry...");
        const existing = allWFH.find(w => w.id === editingWFHId);
        if (!existing) return console.error("❌ Error: WFH entry not found!");

        existing.userId = userId;
        existing.wfhName = reason;
        existing.dates = [...selectedWFHDates];
        await WorkingFromHome.saveAll(allWFH);
    } else {
        console.log("➕ Adding new WFH entry...");
        const newWFH = await WorkingFromHome.add(reason, userId, [...selectedWFHDates]);
        allWFH.push(newWFH);
    }

    closeWFHModal();
    rebuildCalendarView();
}

// ✅ Delete WFH Entry
deleteWFHBtn.addEventListener("click", deleteWFH);
async function deleteWFH() {
    if (!editingWFHId) return;
    if (!confirm("🛑 Are you sure you want to delete this WFH entry?")) return;

    allWFH = allWFH.filter(w => w.id !== editingWFHId);
    await WorkingFromHome.saveAll(allWFH);
    closeWFHModal();
    rebuildCalendarView();
}

// ✅ Update Selected Dates Display
function updateWFHSelectedDatesDisplay() {
    wfhSelectedDates.innerHTML = [...selectedWFHDates].join(", ") || "No dates selected";
}

/***************************************************************
 * ✅ 4) Highlight WFH Days in Calendar
 ***************************************************************/

function highlightDayIfHoliday(dateStr, container) {
    allHolidays.forEach(h => {
        if (h.dates.has(dateStr)) {
            const userObj = allUsers.find(u => u.id === h.userId);
            const color = userObj ? userObj.color : "#ccc";
            const circ = document.createElement("div");
            circ.classList.add("user-circle");
            circ.style.backgroundColor = color;
            container.appendChild(circ);
        }
    });

    allWFH.forEach(wfh => {
        if (wfh.dates.has(dateStr)) {
            const userObj = allUsers.find(u => u.id === wfh.userId);
            const color = userObj ? userObj.color : "#888";
            const square = document.createElement("div");
            square.classList.add("wfh-square");
            square.style.backgroundColor = color;
            container.appendChild(square);
        }
    });
}



// ✅ Save new or update WFH Entry
async function saveWFH() {
  const userId = wfhUserSelect.value;
  const nameVal = wfhNameInput.value.trim();

  if (!userId || !nameVal) {
      alert("⚠️ User & reason for WFH are required!");
      return;
  }

  if (editingEventId && eventType === "wfh") {
      // ✅ Update existing WFH
      const existing = allWFH.find(w => w.id === editingEventId);
      if (!existing) {
          alert("⚠️ WFH entry not found, cannot update!");
          return;
      }
      existing.wfhName = nameVal;
      existing.userId = userId;
      existing.dates = new Set([...selectedDates]);

      try {
          await WorkingFromHome.saveAll(allWFH);
      } catch (e) {
          console.error("❌ Edit WFH error:", e);
      }
  } else {
      // ✅ Create new WFH entry
      if (selectedDates.size === 0) {
          alert("⚠️ No dates selected!");
          return;
      }
      try {
          const newWFH = await WorkingFromHome.add(nameVal, userId, [...selectedDates]);
          allWFH.push({
              id: newWFH.id,
              wfhName: newWFH.wfhName,
              userId: newWFH.userId,
              dates: new Set(newWFH.dates)
          });
      } catch (e) {
          console.error("❌ Add WFH error:", e);
      }
  }

  closeEventModal("wfh");
  rebuildCalendarView();
}
