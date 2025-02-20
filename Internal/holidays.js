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
    // Generate a unique id based on the current timestamp
    const newId = `user-${Date.now()}`;
    const newUser = new User(newId, name, color);
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
  allUsers = await User.loadAll(); // Ensure the latest users are loaded
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
    await User.edit(existingId, userName, userColor);
  } else {
    await User.add(userName, userColor);
  }
  allUsers = await User.loadAll();
  await populateUserSelect();
  await displayUsers();
  await updateUserCount();
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
  holidayUserSelect.innerHTML = "";
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
 * 6) HOLIDAY CLASS (robust load) WITH DAY PART
 ***************************************************************/
class Holiday {
  constructor(id, holidayName, userId, dates = [], dayPart = "full") {
    this.id = id || `holiday-${Date.now()}`;
    this.holidayName = holidayName;
    this.userId = userId;
    this.dates = Array.isArray(dates) ? new Set(dates) : new Set();
    this.dayPart = dayPart;
  }

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
    return holidayData.map(h => new Holiday(
      h.id,
      h.holidayName,
      h.userId,
      Array.isArray(h.dates) ? h.dates : [],
      h.dayPart || "full"
    ));
  }

  static async saveAll(holidayArray) {
    const cleanedData = holidayArray.map(h => ({
      id: h.id,
      holidayName: h.holidayName,
      userId: h.userId,
      dates: Array.from(h.dates),
      dayPart: h.dayPart
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

  static async add(holidayName, userId, dateSet, dayPart) {
    const newHol = new Holiday(null, holidayName, userId, dateSet, dayPart);
    let allHols = await Holiday.loadAll();
    allHols.push(newHol);
    await Holiday.saveAll(allHols);
    return newHol;
  }

  static async edit(holidayId, newName, newUserId, newDates, dayPart) {
    let allHols = await Holiday.loadAll();
    allHols = allHols.map(h => {
      if (h.id === holidayId) {
        return new Holiday(h.id, newName, newUserId, newDates, dayPart);
      }
      return h;
    });
    await Holiday.saveAll(allHols);
  }

  static async remove(holidayId) {
    let allHols = await Holiday.loadAll();
    allHols = allHols.filter(h => h.id !== holidayId);
    await Holiday.saveAll(allHols);
  }
}

/***************************************************************
 * 7) WFH CLASS (robust load) WITH DAY PART
 * This mirrors the Holiday class but works with "wfh" data.
 ***************************************************************/
class WFH {
  constructor(id, wfhName, userId, dates = [], dayPart = "full") {
    this.id = id || `wfh-${Date.now()}`;
    this.wfhName = wfhName;
    this.userId = userId;
    this.dates = Array.isArray(dates) ? new Set(dates) : new Set();
    this.dayPart = dayPart;
  }

  static async loadAll() {
    let wfhData = [];
    try {
      const res = await fetch("http://localhost:8080/api/load/wfh");
      if (!res.ok) {
        console.warn(`WFH file not found or load error: ${res.status}`);
        return [];
      }
      const textData = await res.text();
      let jsonData;
      try {
        jsonData = JSON.parse(textData);
      } catch (parseErr) {
        console.error("Error parsing WFH JSON:", parseErr);
        return [];
      }
      if (Array.isArray(jsonData)) {
        wfhData = jsonData;
      } else if (jsonData && Array.isArray(jsonData.data)) {
        wfhData = jsonData.data;
      } else {
        console.warn("Unexpected shape of WFH JSON, using empty array.");
        return [];
      }
    } catch (error) {
      console.error("Error loading WFH:", error);
      return [];
    }
    return wfhData.map(w => new WFH(
      w.id,
      w.wfhName,
      w.userId,
      Array.isArray(w.dates) ? w.dates : [],
      w.dayPart || "full"
    ));
  }

  static async saveAll(wfhArray) {
    const cleanedData = wfhArray.map(w => ({
      id: w.id,
      wfhName: w.wfhName,
      userId: w.userId,
      dates: Array.from(w.dates),
      dayPart: w.dayPart
    }));
    const payload = { filename: "wfh", data: cleanedData };
    try {
      const res = await fetch("http://localhost:8080/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      console.log("Save WFH response:", await res.text());
    } catch (err) {
      console.error("Error saving WFH:", err);
    }
  }

  static async add(wfhName, userId, dateSet, dayPart) {
    const newWFH = new WFH(null, wfhName, userId, dateSet, dayPart);
    let allWFHEvents = await WFH.loadAll();
    allWFHEvents.push(newWFH);
    await WFH.saveAll(allWFHEvents);
    return newWFH;
  }

  static async edit(wfhId, newName, newUserId, newDates, dayPart) {
    let allWFHEvents = await WFH.loadAll();
    allWFHEvents = allWFHEvents.map(w => {
      if (w.id === wfhId) {
        return new WFH(w.id, newName, newUserId, newDates, dayPart);
      }
      return w;
    });
    await WFH.saveAll(allWFHEvents);
  }

  static async remove(wfhId) {
    let allWFHEvents = await WFH.loadAll();
    allWFHEvents = allWFHEvents.filter(w => w.id !== wfhId);
    await WFH.saveAll(allWFHEvents);
  }
}

/***************************************************************
 * 8) CALENDAR & LOGIC (2024-2027), robust
 ***************************************************************/
// Global UI elements
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
const wfhListEl = document.getElementById("wfhList");

// Navigation buttons
const prevYearBtn = document.getElementById("prevYearBtn");
const nextYearBtn = document.getElementById("nextYearBtn");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

// Global variables
let selectedWFHDates = new Set();    // for WFH events
let allUsers = [];
let allHolidays = []; // array of Holiday objects
let allWFH = [];      // array of WFH objects
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
    document.getElementById("preloader").style.display = "flex";
    // Load users, holidays, and WFH events
    const [users, holidays, wfhEvents] = await Promise.all([
      User.loadAll(),
      Holiday.loadAll(),
      WFH.loadAll()
    ]);
    allUsers = users;
    allHolidays = holidays.map(h => ({
      ...h,
      dates: new Set(h.dates || [])
    }));
    allWFH = wfhEvents.map(w => ({
      ...w,
      dates: new Set(w.dates || [])
    }));
    populateUserSelect();
    buildCalendar(currentYear, currentMonth);
    updateHolidayList();
    updateWFHList();
  } catch (err) {
    console.error("Init error:", err);
  } finally {
    document.getElementById("preloader").style.display = "none";
  }
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
  while (calendarGrid.children.length > 7) {
    calendarGrid.removeChild(calendarGrid.lastChild);
  }
  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  monthYearLabel.textContent = `${monthNames[month]} ${year}`;
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const totalDays = new Date(year, month+1, 0).getDate();
  for (let i = 0; i < startDay; i++){
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("day-cell");
    calendarGrid.appendChild(emptyCell);
  }
  for (let d = 1; d <= totalDays; d++){
    const cell = document.createElement("div");
    cell.classList.add("day-cell");
    const checkToday = new Date();
    if (year === checkToday.getFullYear() && month === checkToday.getMonth() && d === checkToday.getDate()){
      cell.classList.add("today");
    }
    const dayNumEl = document.createElement("div");
    dayNumEl.classList.add("day-number");
    dayNumEl.textContent = d;
    cell.appendChild(dayNumEl);
    const circleCont = document.createElement("div");
    circleCont.classList.add("day-holiday-users");
    cell.appendChild(circleCont);
    const iso = toISODate(year, month, d);
    cell.dataset.date = iso;
    
    // Reapply visual selection based on event type:
    const eventTypeElement = document.getElementById("eventType");
    if (eventTypeElement) {
      const eventType = eventTypeElement.value;
      if (eventType === "wfh") {
        if (selectedWFHDates.has(iso)) {
          cell.classList.add("selected");
        }
      } else {
        if (selectedDates.has(iso)) {
          cell.classList.add("selected");
        }
      }
    }
    
    highlightDayIfHoliday(iso, circleCont);
    highlightDayIfWFH(iso, circleCont);
    cell.addEventListener("click", () => toggleDateSelection(iso, cell));
    calendarGrid.appendChild(cell);
  }
}

// Highlight holidays using a FontAwesome plane icon, for example.
function highlightDayIfHoliday(dateStr, container){
  allHolidays.forEach(h => {
    if (h.dates.has(dateStr)) {
      const userObj = allUsers.find(u => u.id === h.userId);
      const color = userObj ? userObj.color : "#ccc";
      const icon = document.createElement("i");
      icon.classList.add("fa", "fa-plane", "holiday-icon");
      icon.style.color = color;
      container.appendChild(icon);
    }
  });
}

// Highlight WFH events using a FontAwesome home icon.
function highlightDayIfWFH(dateStr, container) {
  allWFH.forEach(w => {
    if (w.dates.has(dateStr)) {
      const userObj = allUsers.find(u => u.id === w.userId);
      const color = userObj ? userObj.color : "#ccc";
      const icon = document.createElement("i");
      icon.classList.add("fa", "fa-home", "wfh-icon");
      icon.style.color = color;
      container.appendChild(icon);
    }
  });
}

function toISODate(year, month, day){
  const mm = String(month+1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/************************
 * Toggle Date Selection
 ************************/
function toggleDateSelection(dateStr, cell) {
  const eventTypeElement = document.getElementById("eventType");
  if (!eventTypeElement) {
    console.error("Event type element not found");
    return;
  }
  const eventType = eventTypeElement.value;
  console.debug("Toggle date selection for:", dateStr, "Event type:", eventType);
  if (eventType === "wfh") {
    if (selectedWFHDates.has(dateStr)) {
      selectedWFHDates.delete(dateStr);
      cell.classList.remove("selected");
      console.debug("Removed from selectedWFHDates:", dateStr);
    } else {
      selectedWFHDates.add(dateStr);
      cell.classList.add("selected");
      console.debug("Added to selectedWFHDates:", dateStr);
    }
  } else {
    if (selectedDates.has(dateStr)) {
      selectedDates.delete(dateStr);
      cell.classList.remove("selected");
      console.debug("Removed from selectedDates:", dateStr);
    } else {
      selectedDates.add(dateStr);
      cell.classList.add("selected");
      console.debug("Added to selectedDates:", dateStr);
    }
  }
}

/************************
 * Modal Functions
 ************************/
async function openHolidayModal(holidayId = null) {
  await populateUserSelect();
  // Set default event type to Holiday
  document.getElementById("eventType").value = "holiday";
  // Set default Day Part to Full Day
  document.getElementById("dayPart").value = "full";
  
  if (!holidayId) {
    // Open modal in creation mode (do not force a date selection)
    editingHolidayId = null;
    holidayModalTitle.textContent = "Add Event for Selected Dates";
    saveHolidayBtn.textContent = "Save";
    deleteHolidayBtn.style.display = "none";
    holidayUserSelect.selectedIndex = 0;
    holidayNameInput.value = "";
  } else {
    editingHolidayId = holidayId;
    holidayModalTitle.textContent = "Edit or Remove Event";
    saveHolidayBtn.textContent = "Update";
    deleteHolidayBtn.style.display = "inline-block";
    // Try finding in holidays; if not, look in WFH events.
    const hol = allHolidays.find(h => h.id === holidayId) || allWFH.find(w => w.id === holidayId);
    if (!hol) {
      console.warn("Event not found for editing:", holidayId);
      openHolidayModal();
      return;
    }
    holidayUserSelect.value = hol.userId;
    // For display, use holidayName if available; otherwise use wfhName.
    holidayNameInput.value = hol.holidayName || hol.wfhName;
    document.getElementById("eventType").value = hol.holidayName ? "holiday" : "wfh";
    document.getElementById("dayPart").value = hol.dayPart || "full";
  }
  holidayModal.classList.add("active");
}

function closeHolidayModal(){
  holidayModal.classList.remove("active");
  // Optionally, clear selections here if you want:
  // selectedDates.clear();
  // selectedWFHDates.clear();
  rebuildCalendarView();
}

async function saveHoliday(){
  const userId = holidayUserSelect.value;
  const nameVal = holidayNameInput.value.trim();
  const eventType = document.getElementById("eventType").value;
  const dayPart = document.getElementById("dayPart").value;
  console.debug("Saving event. Type:", eventType, 
                "Selected holiday dates:", [...selectedDates], 
                "Selected WFH dates:", [...selectedWFHDates],
                "Day Part:", dayPart);
  if (!userId || !nameVal){
    alert("User & event name are required!");
    return;
  }
  if (eventType === "wfh") {
    try {
      const newWFH = await WFH.add(nameVal, userId, [...selectedWFHDates], dayPart);
      allWFH.push({
        id: newWFH.id,
        wfhName: newWFH.wfhName,
        userId: newWFH.userId,
        dates: new Set(newWFH.dates),
        dayPart: newWFH.dayPart
      });
      console.debug("WFH event saved:", newWFH);
    } catch(e) {
      console.error("Add WFH error:", e);
    }
  } else {
    try {
      if (editingHolidayId) {
        const existing = allHolidays.find(h => h.id === editingHolidayId);
        if (!existing) {
          alert("Event not found, cannot update!");
          return;
        }
        existing.holidayName = nameVal;
        existing.userId = userId;
        await Holiday.edit(editingHolidayId, nameVal, userId, [...existing.dates], dayPart);
        console.debug("Holiday event updated:", editingHolidayId);
      } else {
        const newHol = await Holiday.add(nameVal, userId, [...selectedDates], dayPart);
        allHolidays.push({
          id: newHol.id,
          holidayName: newHol.holidayName,
          userId: newHol.userId,
          dates: new Set(newHol.dates),
          dayPart: newHol.dayPart
        });
        console.debug("Holiday event saved:", newHol);
      }
    } catch(e) {
      console.error("Add/Edit event error:", e);
    }
  }
  closeHolidayModal();
  rebuildCalendarView();
}

async function removeHoliday(){
  if (!editingHolidayId) return;
  if (!confirm("Are you sure to delete this event?")) return;
  try {
    // Try deleting as a holiday first; if not found, try WFH.
    const holidayFound = allHolidays.find(h => h.id === editingHolidayId);
    if (holidayFound) {
      await Holiday.remove(editingHolidayId);
      allHolidays = allHolidays.filter(h => h.id !== editingHolidayId);
    } else {
      await WFH.remove(editingHolidayId);
      allWFH = allWFH.filter(w => w.id !== editingHolidayId);
    }
  } catch(e) {
    console.error("Remove event error:", e);
  }
  closeHolidayModal();
  rebuildCalendarView();
}

/************************
 * Right Panel List Updates
 ************************/
// Update the holiday list to apply the filter.

function filterEvents(events, filterValue) {
  // Define start and end of the current month.
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0); // last day of current month

  // Filter events based on the filter criteria.
  const filtered = events.filter(e => {
    const datesArray = Array.from(e.dates);
    if (datesArray.length === 0) return false; // skip events without dates
    // Sort dates (ISO strings sort naturally)
    datesArray.sort();
    const firstDate = new Date(datesArray[0]);
    const lastDate = new Date(datesArray[datesArray.length - 1]);

    if (filterValue === "all") {
      return true;
    } else if (filterValue === "old") {
      // Old: events that ended before this month started.
      return lastDate < monthStart;
    } else if (filterValue === "thisMonth") {
      // This Month: event overlaps the current month.
      return (
        (firstDate >= monthStart && firstDate <= monthEnd) ||
        (lastDate >= monthStart && lastDate <= monthEnd) ||
        (firstDate < monthStart && lastDate > monthEnd)
      );
    }
    return true;
  });

  // Sort events by their earliest date.
  return filtered.sort((a, b) => {
    const aDates = Array.from(a.dates).sort();
    const bDates = Array.from(b.dates).sort();
    return new Date(aDates[0]) - new Date(bDates[0]);
  });
}

document.getElementById("filterSelect").addEventListener("change", function() {
  updateHolidayList();
  updateWFHList();
});


function updateWFHList() {
  const filterVal = document.getElementById("filterSelect").value;
  // Filter WFH events using the helper function
  const filteredWFH = filterEvents(allWFH, filterVal);
  wfhListEl.innerHTML = "";
  if (filteredWFH.length === 0) {
    wfhListEl.innerHTML = "<p>No WFH events found.</p>";
    return;
  }
  // Sort events by their earliest date (the helper already sorts them)
  filteredWFH.forEach(w => {
    const item = document.createElement("div");
    item.classList.add("wfh-item");
    const userObj = allUsers.find(u => u.id === w.userId);
    const color = userObj ? userObj.color : "#444";
    const wfhDates = [...w.dates].sort();
    const dateRange = wfhDates.length > 0
      ? `${wfhDates[0]} → ${wfhDates[wfhDates.length - 1]}`
      : "No dates selected";
    // Set a custom CSS property for background color
    item.style.setProperty("--wfh-bg", color);
    item.innerHTML = `
      <div class="wfh-item-title">${w.wfhName}</div>
      <div class="wfh-item-user">${userObj ? userObj.name : "Unknown"} (${w.dates.size} days)</div>
      <div class="wfh-item-date">${dateRange}</div>
      <div class="wfh-item-daypart">Day: ${w.dayPart}</div>
    `;
    // Reuse the same modal for editing
    item.addEventListener("click", () => openHolidayModal(w.id));
    wfhListEl.appendChild(item);
  });
}







function updateHolidayList() {
  const filterVal = document.getElementById("filterSelect").value;
  const filteredHolidays = filterEvents(allHolidays, filterVal);
  holidayListEl.innerHTML = "";
  if (filteredHolidays.length === 0) {
    holidayListEl.innerHTML = "<p>No holiday events found.</p>";
    return;
  }
  filteredHolidays.forEach(h => {
    const item = document.createElement("div");
    item.classList.add("holiday-item");
    const userObj = allUsers.find(u => u.id === h.userId);
    const color = userObj ? userObj.color : "#444";
    const holidayDates = [...h.dates].sort();
    const dateRange = holidayDates.length > 0
      ? `${holidayDates[0]} → ${holidayDates[holidayDates.length - 1]}`
      : "No dates selected";
    item.style.setProperty("--holiday-bg", color);
    item.innerHTML = `
      <div class="holiday-item-title">${h.holidayName}</div>
      <div class="holiday-item-user">${userObj ? userObj.name : "Unknown"} (${h.dates.size} days)</div>
      <div class="holiday-item-date">${dateRange}</div>
      <div class="holiday-item-daypart">Day: ${h.dayPart}</div>
    `;
    item.addEventListener("click", () => openHolidayModal(h.id));
    holidayListEl.appendChild(item);
  });
}

// Update the WFH list to apply the filter.
function updateWFHList() {
  const filterVal = document.getElementById("filterSelect").value;
  const filteredWFH = filterEvents(allWFH, filterVal);
  wfhListEl.innerHTML = "";
  if (filteredWFH.length === 0) {
    wfhListEl.innerHTML = "<p>No WFH events found.</p>";
    return;
  }
  filteredWFH.forEach(w => {
    const item = document.createElement("div");
    item.classList.add("wfh-item");
    const userObj = allUsers.find(u => u.id === w.userId);
    const color = userObj ? userObj.color : "#444";
    const wfhDates = [...w.dates].sort();
    const dateRange = wfhDates.length > 0
      ? `${wfhDates[0]} → ${wfhDates[wfhDates.length - 1]}`
      : "No dates selected";
    item.style.setProperty("--wfh-bg", color);
    item.innerHTML = `
      <div class="wfh-item-title">${w.wfhName}</div>
      <div class="wfh-item-user">${userObj ? userObj.name : "Unknown"} (${w.dates.size} days)</div>
      <div class="wfh-item-date">${dateRange}</div>
      <div class="wfh-item-daypart">Day: ${w.dayPart}</div>
    `;
    item.addEventListener("click", () => openHolidayModal(w.id));
    wfhListEl.appendChild(item);
  });
}

// Add an event listener to the filter select to update lists when the filter changes.
document.getElementById("filterSelect").addEventListener("change", function() {
  updateHolidayList();
  updateWFHList();
});


function updateWFHList() {
  wfhListEl.innerHTML = "";
  if (allWFH.length === 0) {
    wfhListEl.innerHTML = "<p>No WFH events found.</p>";
    return;
  }
  allWFH.forEach(w => {
    const item = document.createElement("div");
    item.classList.add("wfh-item");
    const userObj = allUsers.find(u => u.id === w.userId);
    const color = userObj ? userObj.color : "#444";
    const wfhDates = [...w.dates].sort();
    const dateRange = wfhDates.length > 0
      ? `${wfhDates[0]} → ${wfhDates[wfhDates.length - 1]}`
      : "No dates selected";
    item.style.setProperty("--wfh-bg", color);
    item.innerHTML = `
      <div class="wfh-item-title">${w.wfhName}</div>
      <div class="wfh-item-user">${userObj ? userObj.name : "Unknown"} (${w.dates.size} days)</div>
      <div class="wfh-item-date">${dateRange}</div>
      <div class="wfh-item-daypart">Day: ${w.dayPart}</div>
    `;
    // For editing, we reuse the same modal
    item.addEventListener("click", () => openHolidayModal(w.id));
    wfhListEl.appendChild(item);
  });
}

/************************
 * Navigation Functions
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
  updateWFHList();
  // Do not clear selections here so they persist in the calendar view.
}

/************************
 * Transfer Selection on Event Type Change
 ************************/
document.getElementById("eventType").addEventListener("change", function(){
  const newType = this.value;
  console.debug("Event type changed to:", newType);
  if (newType === "wfh") {
    if (selectedDates.size > 0) {
      console.debug("Transferring dates from holiday set to WFH set");
      selectedWFHDates = new Set([...selectedDates]);
      selectedDates.clear();
    }
  } else {
    if (selectedWFHDates.size > 0) {
      console.debug("Transferring dates from WFH set to holiday set");
      selectedDates = new Set([...selectedWFHDates]);
      selectedWFHDates.clear();
    }
  }
  rebuildCalendarView();
});
