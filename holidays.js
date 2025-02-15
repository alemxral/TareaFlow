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
          // e.g. 404 => file not found
          console.warn(`Users file not found or load error: ${res.status}`);
          return [];
        }
        const textData = await res.text();
        console.log("Raw users response text:", textData);
  
        let jsonData;
        try {
          jsonData = JSON.parse(textData);
        } catch (parseErr) {
          console.error("Error parsing users JSON:", parseErr);
          return [];
        }
        console.log("Parsed users JSON:", jsonData);
  
        // If directly an array
        if (Array.isArray(jsonData)) {
          userData = jsonData;
        }
        // If { filename: "users", data: [...] }
        else if (jsonData && Array.isArray(jsonData.data)) {
          userData = jsonData.data;
        } else {
          console.warn("Unexpected shape of users JSON, using empty array.");
        }
      } catch (error) {
        console.error("Error loading users:", error);
        return [];
      }
  
      // convert userData => array of User objects
      return userData.map(u => new User(u.id, u.name, u.color));
    }
  
    static async findById(userId) {
      const allUsers = await User.loadAll();
      return allUsers.find(u => u.id === userId);
    }
  }
  
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
        // Load users and holidays
        const [users, holidays] = await Promise.all([
          User.loadAll(),
          Holiday.loadAll()
        ]);
    
        allUsers = users;
        allHolidays = holidays.map(h => ({
          ...h,
          dates: new Set(h.dates) // Ensure Set
        }));
    
        // Build UI
        populateUserSelect();
        buildCalendar(currentYear, currentMonth);
        updateHolidayList();
      } catch (err) {
        console.error("Init error:", err);
      }
  
    // set up events
    openHolidayModalBtn.addEventListener("click", () => openHolidayModal());
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
  function openHolidayModal(holidayId=null){
    if (!holidayId) {
      // Add new holiday
      if (selectedDates.size === 0) {
        alert("Select at least one date first!");
        return;
      }
      editingHolidayId = null;
      holidayModalTitle.textContent = "Add Holiday for Selected Dates";
      saveHolidayBtn.textContent = "Save";
      deleteHolidayBtn.style.display = "none";
      holidayUserSelect.selectedIndex = 0;
      holidayNameInput.value = "";
    } else {
      // Edit an existing holiday
      editingHolidayId = holidayId;
      holidayModalTitle.textContent = "Edit or Remove Holiday";
      saveHolidayBtn.textContent = "Update";
      deleteHolidayBtn.style.display = "inline-block";
  
      const hol = allHolidays.find(h => h.id === holidayId);
      if (!hol) {
        console.warn("Holiday not found for editing:", holidayId);
        return;
      }
      holidayUserSelect.value = hol.userId;
      holidayNameInput.value = hol.holidayName;
    }
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
  